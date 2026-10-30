import { QueryObserver, focusManager, onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ACCOUNT_A,
  ACCOUNT_B,
  deferred,
  failure,
  json,
  makeAuth,
  microtasks,
  signedIn,
} from '../api/__tests__/support';
import { createApiClient } from '../api/client';
import { decodeIdentity } from '../api/decoders';
import { ApiError } from '../api/errors';
import { createAccountDataController } from './account-controller';
import type { AccountScope } from './account-scope';
import { readRetryDelay, retryRead } from './query-client';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  onlineManager.setOnline(true);
  vi.useRealTimers();
});
function setup() {
  const auth = makeAuth();
  const fetcher = vi.fn(async () => json());
  const api = createApiClient({ auth: auth.port, baseUrl: 'https://api.example', fetcher });
  const controller = createAccountDataController(auth.port, api);
  cleanups.push(controller.subscribe(() => {}));
  const scope = () => controller.getSnapshot().scope!;
  return { auth, api, fetcher, controller, scope };
}
function observe<T>(
  scope: AccountScope,
  read: (signal: AbortSignal) => Promise<T>,
  key = 'identity',
) {
  const observer = new QueryObserver(scope.client, {
    queryKey: scope.key(key),
    enabled: () => scope.canRun(),
    queryFn: ({ signal }) => scope.read(({ signal: owned }) => read(owned), signal),
  });
  cleanups.push(observer.subscribe(() => {}));
  return observer;
}

describe('account data ownership', () => {
  it('creates no scope before a settled identity and never acquires tokens itself', () => {
    const { auth, controller } = setup();
    for (const status of ['bootstrapping', 'signed_out', 'signing_out'] as const) {
      auth.set({ status, sessionGeneration: 2 });
      expect(controller.getSnapshot().scope).toBeNull();
    }
    auth.set(signedIn());
    expect(controller.getSnapshot().availability).toBe('ready');
    expect(auth.port.getAccessToken).not.toHaveBeenCalled();
    expect(auth.port.revalidateSession).not.toHaveBeenCalled();
  });
  it('uses UUID-only keys and preserves cache/scope on token rotation and email changes', () => {
    const { auth, scope } = setup();
    const first = scope();
    first.client.setQueryData(first.key('identity'), 'A');
    auth.set({
      ...(signedIn() as Extract<ReturnType<typeof signedIn>, { status: 'signed_in' }>),
      user: { user_id: ACCOUNT_A, email: 'changed@example.test' },
    });
    expect(scope()).toBe(first);
    expect(first.key('profile', 7)).toEqual(['account', ACCOUNT_A, 'profile', 7]);
    expect(first.client.getQueryData(first.key('identity'))).toBe('A');
  });
  it.each([signedIn(ACCOUNT_B), signedIn(ACCOUNT_A, 2)])(
    'replaces owner and clears old caches: %j',
    (next) => {
      const { auth, scope } = setup();
      const old = scope();
      old.client.setQueryData(old.key('identity'), 'A');
      auth.set(next);
      expect(scope()).not.toBe(old);
      expect(old.client.getQueryCache().getAll()).toHaveLength(0);
      expect(scope().client.getQueryData(scope().key('identity'))).toBeUndefined();
      const callback = vi.fn();
      old.commit(callback);
      expect(callback).not.toHaveBeenCalled();
    },
  );
  it('clears at sign-out intent even if sign-out fails and the same generation reappears', () => {
    const { auth, scope, controller } = setup();
    const old = scope();
    old.client.setQueryData(old.key('profile'), 'private');
    auth.set({ status: 'signing_out', sessionGeneration: 1 });
    expect(controller.getSnapshot().scope).toBeNull();
    auth.set({ status: 'unavailable', sessionGeneration: 1, reason: 'storage', retryable: true });
    expect(controller.getSnapshot().scope).toBeNull();
    auth.set(signedIn());
    expect(scope()).not.toBe(old);
    expect(old.client.getQueryCache().getAll()).toHaveLength(0);
  });
  it.each(['refreshing', 'unavailable'] as const)(
    'retains same-user data but blocks work during credential %s',
    async (credentials) => {
      const { auth, scope, controller } = setup();
      const old = scope();
      old.client.setQueryData(old.key('profile'), 'saved');
      auth.set(signedIn(ACCOUNT_A, 1, credentials));
      expect(scope()).toBe(old);
      expect(controller.getSnapshot().availability).toBe('auth_unavailable');
      expect(old.client.getQueryData(old.key('profile'))).toBe('saved');
      const work = vi.fn(async () => 'bad');
      await expect(old.read(work)).rejects.toMatchObject({ kind: 'unavailable' });
      expect(work).not.toHaveBeenCalled();
      auth.set(signedIn());
      expect(scope()).toBe(old);
      expect(old.canRun()).toBe(true);
    },
  );
  it('preserves only matching-generation top-level unavailability', () => {
    const { auth, scope, controller } = setup();
    const old = scope();
    auth.set({ status: 'unavailable', sessionGeneration: 1, reason: 'bootstrap', retryable: true });
    expect(scope()).toBe(old);
    expect(old.canRun()).toBe(false);
    auth.set({ status: 'unavailable', sessionGeneration: 2, reason: 'storage', retryable: true });
    expect(controller.getSnapshot().scope).toBeNull();
  });
  it('aborts a delayed query on A→B and ignores a producer that ignores cancellation', async () => {
    const { auth, scope } = setup();
    const old = scope();
    const gate = deferred<string>();
    let signal!: AbortSignal;
    const response = old.read((op) => {
      signal = op.signal;
      return gate.promise;
    });
    const rejection = expect(response).rejects.toMatchObject({ kind: 'cancelled' });
    await microtasks();
    auth.set(signedIn(ACCOUNT_B));
    expect(signal.aborted).toBe(true);
    await rejection;
    gate.resolve('A secret');
    await microtasks();
    expect(scope().client.getQueryCache().getAll()).toHaveLength(0);
  });
  it('rechecks ownership after response even without a notification', async () => {
    const { auth, scope } = setup();
    const gate = deferred<string>();
    const response = scope().read(() => gate.promise);
    const rejected = expect(response).rejects.toMatchObject({ kind: 'cancelled' });
    await microtasks();
    auth.set(signedIn(ACCOUNT_B), false);
    gate.resolve('A');
    await rejected;
  });
  it('forwards query cancellation to actual HTTP and cleans request subscriptions', async () => {
    const { auth, api, fetcher, scope } = setup();
    const gate = deferred<Response>();
    let signal!: AbortSignal;
    fetcher.mockImplementation(async (_url?: unknown, init?: RequestInit) => {
      signal = init!.signal!;
      return gate.promise;
    });
    const current = scope();
    observe(current, (requestSignal) =>
      api.request('/v1/me', { signal: requestSignal, decode: decodeIdentity }),
    );
    await microtasks();
    expect(signal.aborted).toBe(false);
    auth.set(signedIn(ACCOUNT_B));
    await microtasks();
    expect(signal.aborted).toBe(true);
    expect(auth.listenerCount).toBe(1);
    gate.resolve(json());
  });
  it('removes one public Auth subscription on final cleanup and safely reconnects', () => {
    const { auth, controller, scope } = setup();
    const old = scope();
    const stop2 = controller.subscribe(() => {});
    expect(auth.listenerCount).toBe(1);
    stop2();
    stop2();
    expect(auth.listenerCount).toBe(1);
    cleanups.pop()!();
    expect(auth.listenerCount).toBe(0);
    expect(old.client.getQueryCache().getAll()).toHaveLength(0);
    const stop3 = controller.subscribe(() => {});
    cleanups.push(stop3);
    expect(auth.listenerCount).toBe(1);
    expect(scope()).not.toBe(old);
  });
});

describe('query retries and recovery', () => {
  it('deduplicates two consumers and retains data on a failed refresh without signing out', async () => {
    vi.useFakeTimers();
    const { auth, scope } = setup();
    const current = scope();
    const work = vi.fn(async () => 'saved');
    observe(current, work);
    observe(current, work);
    await microtasks();
    expect(work).toHaveBeenCalledTimes(1);
    work.mockRejectedValue(new ApiError('unavailable', { status: 503 }));
    const refresh = current.client.refetchQueries();
    await microtasks();
    await vi.advanceTimersByTimeAsync(1000);
    await refresh;
    expect(work).toHaveBeenCalledTimes(3);
    expect(current.client.getQueryData(current.key('identity'))).toBe('saved');
    expect(current.client.getQueryState(current.key('identity'))?.status).toBe('error');
    expect(auth.port.revalidateSession).not.toHaveBeenCalled();
    expect(auth.port.getSnapshot().status).toBe('signed_in');
  });
  it.each(['network', 'timeout'] as const)('retries %s only once with fake time', async (kind) => {
    vi.useFakeTimers();
    const { scope } = setup();
    const work = vi.fn(async () => {
      throw new ApiError(kind);
    });
    const result = scope().client.fetchQuery({
      queryKey: scope().key(kind),
      queryFn: () => scope().read(work),
    });
    const rejected = expect(result).rejects.toMatchObject({ kind });
    await microtasks();
    expect(work).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(work).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(work).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403, 409, 422, 500, 502, 504])('never adds retries for HTTP %s', (status) => {
    expect(retryRead(0, new ApiError('unavailable', { status }), () => true)).toBe(false);
  });
  it('does not retry a network interruption while reading an already forbidden response', () => {
    expect(retryRead(0, new ApiError('network', { status: 403 }), () => true)).toBe(false);
    expect(retryRead(0, new ApiError('network', { status: 200 }), () => true)).toBe(true);
    expect(retryRead(1, new ApiError('network'), () => true)).toBe(false);
    expect(retryRead(0, new ApiError('network'), () => false)).toBe(false);
    expect(retryRead(0, new Error('raw'), () => true)).toBe(false);
  });
  it('honors a bounded 429 hint without early retry and rejects absent/long hints', async () => {
    vi.useFakeTimers();
    const { scope } = setup();
    const error = new ApiError('rate_limited', { status: 429, retryAfterMs: 2000 });
    const work = vi.fn(async () => {
      throw error;
    });
    const result = scope().client.fetchQuery({
      queryKey: scope().key('limited'),
      queryFn: () => scope().read(work),
    });
    const rejected = expect(result).rejects.toBe(error);
    await microtasks();
    await vi.advanceTimersByTimeAsync(1999);
    expect(work).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await rejected;
    expect(work).toHaveBeenCalledTimes(2);
    expect(retryRead(0, new ApiError('rate_limited', { status: 429 }), () => true)).toBe(false);
    expect(
      retryRead(0, new ApiError('rate_limited', { status: 429, retryAfterMs: 61000 }), () => true),
    ).toBe(false);
    expect(readRetryDelay(0, error)).toBe(2000);
  });
  it('cancels a pending retry at sign-out and never resumes it for B', async () => {
    vi.useFakeTimers();
    const { auth, scope } = setup();
    const old = scope();
    const work = vi.fn(async () => {
      throw new ApiError('network');
    });
    const result = old.client.fetchQuery({
      queryKey: old.key('profile'),
      queryFn: () => old.read(work),
    });
    const rejection = expect(result).rejects.toBeDefined();
    await microtasks();
    auth.set(signedIn(ACCOUNT_B));
    await rejection;
    await vi.advanceTimersByTimeAsync(5000);
    expect(work).toHaveBeenCalledTimes(1);
  });
  it('blocks sustained-401 focus/refetch work through rotation until explicit recovery', async () => {
    const { auth, controller, fetcher, api, scope } = setup();
    fetcher.mockResolvedValue(failure());
    const current = scope();
    const observer = observe(current, (signal) =>
      api.request('/v1/me', { signal, decode: decodeIdentity }),
    );
    await vi.waitFor(() => expect(controller.getSnapshot().availability).toBe('api_paused'));
    expect(fetcher).toHaveBeenCalledTimes(2);
    current.client.mount();
    cleanups.push(() => current.client.unmount());
    auth.set(signedIn());
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    onlineManager.setOnline(false);
    onlineManager.setOnline(true);
    await current.client.refetchQueries();
    await microtasks();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(observer.getCurrentResult().data).toBeUndefined();
    fetcher.mockResolvedValue(json());
    await controller.recoverSession();
    await microtasks();
    expect(controller.getSnapshot().availability).toBe('ready');
    expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
  it('resumes a same-account read after temporary credential unavailability', async () => {
    const { auth, scope } = setup();
    const current = scope();
    const work = vi.fn(async () => 'same');
    observe(current, work);
    await microtasks();
    auth.set(signedIn(ACCOUNT_A, 1, 'unavailable'));
    await current.client.refetchQueries();
    expect(work).toHaveBeenCalledTimes(1);
    auth.set(signedIn());
    await microtasks();
    expect(work).toHaveBeenCalledTimes(2);
  });
  it('discards an offline paused read at logout instead of resuming for another account', async () => {
    onlineManager.setOnline(false);
    const { auth, scope } = setup();
    const old = scope();
    const work = vi.fn(async () => 'A');
    observe(old, work);
    await microtasks();
    expect(work).not.toHaveBeenCalled();
    auth.set(signedIn(ACCOUNT_B));
    onlineManager.setOnline(true);
    await microtasks();
    expect(work).not.toHaveBeenCalled();
  });
});

describe('writes and late UI effects', () => {
  it('never queues an offline write', async () => {
    const { scope } = setup();
    onlineManager.setOnline(false);
    const work = vi.fn(async () => 'saved');
    await expect(scope().write(work)).rejects.toMatchObject({ kind: 'network', retryable: false });
    onlineManager.setOnline(true);
    await microtasks();
    expect(work).not.toHaveBeenCalled();
  });
  it('aborts departing mutations and suppresses old success/toast/draft effects', async () => {
    const { auth, scope } = setup();
    const old = scope();
    const gate = deferred<string>();
    const success = vi.fn();
    let signal!: AbortSignal;
    const result = old
      .write((op) => {
        signal = op.signal;
        return gate.promise;
      })
      .then((value) => old.commit(() => success(value)));
    const rejected = expect(result).rejects.toMatchObject({
      kind: 'cancelled',
      requestMayHaveCommitted: true,
    });
    await microtasks();
    auth.set(signedIn(ACCOUNT_B));
    gate.resolve('saved A');
    await rejected;
    expect(signal.aborted).toBe(true);
    expect(success).not.toHaveBeenCalled();
  });
  it('guards delayed callbacks even when the server already returned successfully', async () => {
    const { auth, scope } = setup();
    const old = scope();
    const value = await old.write(async () => 'saved');
    const callback = vi.fn();
    auth.set(signedIn(ACCOUNT_A, 2));
    old.commit(() => callback(value));
    expect(callback).not.toHaveBeenCalled();
  });
});
