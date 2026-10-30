import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './client';
import {
  ACCOUNT_A,
  ACCOUNT_B,
  SYNTHETIC_TOKEN,
  deferred,
  failure,
  identity,
  json,
  microtasks,
  setup,
  signedIn,
} from './__tests__/support';

describe('Account ownership, cancellation and operation deadline', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each(['signed_out', 'bootstrapping', 'signing_out', 'unavailable'] as const)(
    'does not dispatch while Auth is %s',
    async (status) => {
      const { auth, me, fetcher } = setup();
      auth.set(
        status === 'unavailable'
          ? { status, sessionGeneration: 2, reason: 'storage', retryable: true }
          : { status, sessionGeneration: 2 },
      );
      await expect(me()).rejects.toMatchObject({
        kind: status === 'signed_out' ? 'no_session' : 'unavailable',
      });
      expect(fetcher).not.toHaveBeenCalled();
      expect(auth.listenerCount).toBe(0);
    },
  );
  it('never falls back to anonymous when the provider returns null', async () => {
    const { auth, me, fetcher } = setup();
    vi.mocked(auth.port.getAccessToken).mockResolvedValue(null);
    await expect(me()).rejects.toMatchObject({ kind: 'no_session' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    new Error('raw private JWT password'),
    Object.assign(new Error('SDK secret'), {
      name: 'AuthUnavailableError',
      reason: 'storage',
      retryable: false,
    }),
  ])('sanitizes token provider failures and preserves availability semantics', async (cause) => {
    const { auth, me, fetcher } = setup();
    vi.mocked(auth.port.getAccessToken).mockRejectedValue(cause);
    const error = await me().catch((error) => error);
    expect(error).toMatchObject({ kind: 'unavailable' });
    expect(String(error) + JSON.stringify(error)).not.toContain(cause.message);
    expect(fetcher).not.toHaveBeenCalled();
    expect(auth.listenerCount).toBe(0);
  });
  it('rejects a pre-aborted signal without token lookup and ignores its private reason', async () => {
    const { auth, me, fetcher } = setup();
    const controller = new AbortController();
    controller.abort(SYNTHETIC_TOKEN);
    const error = await me(controller.signal).catch((error) => error);
    expect(error).toMatchObject({ kind: 'cancelled', retryable: false });
    expect(JSON.stringify(error)).not.toContain(SYNTHETIC_TOKEN);
    expect(auth.port.getAccessToken).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('cancels a hanging token promptly and removes the caller listener and store subscription', async () => {
    const { auth, me, fetcher } = setup();
    const token = deferred<string>();
    vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    const result = me(controller.signal).catch((error) => error);
    await microtasks();
    controller.abort('private reason');
    expect(await result).toMatchObject({ kind: 'cancelled', retryable: false });
    token.resolve(SYNTHETIC_TOKEN);
    await microtasks();
    expect(fetcher).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(auth.listenerCount).toBe(0);
  });
  it('times out a hanging token and never dispatches its late result', async () => {
    const { auth, me, fetcher } = setup();
    const token = deferred<string>();
    vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
    const result = me().catch((error) => error);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await result).toMatchObject({ kind: 'timeout' });
    token.resolve(SYNTHETIC_TOKEN);
    await microtasks();
    expect(fetcher).not.toHaveBeenCalled();
    expect(auth.listenerCount).toBe(0);
  });
  it('checks elapsed time after suspended timers instead of dispatching an overdue token', async () => {
    let clock = 0;
    const { auth, me, fetcher } = setup({ now: () => clock });
    const token = deferred<string>();
    vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
    const result = me().catch((error) => error);
    await microtasks();
    clock = 16_000;
    token.resolve(SYNTHETIC_TOKEN);
    expect(await result).toMatchObject({ kind: 'timeout' });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([true, false])(
    'rejects a different account token even with notification=%s',
    async (notify) => {
      const { auth, me, fetcher } = setup();
      const token = deferred<string>();
      vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
      const result = me().catch((error) => error);
      await microtasks();
      auth.set(signedIn(ACCOUNT_B, 2), notify);
      token.resolve('token-for-B');
      expect(await result).toMatchObject({ kind: 'cancelled' });
      expect(fetcher).not.toHaveBeenCalled();
      expect(auth.listenerCount).toBe(0);
    },
  );
  it('rejects a departed generation even when the same user signs back in', async () => {
    const { auth, me } = setup();
    const token = deferred<string>();
    vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
    const result = me().catch((error) => error);
    await microtasks();
    auth.set(signedIn(ACCOUNT_A, 3));
    token.resolve(SYNTHETIC_TOKEN);
    expect(await result).toMatchObject({ kind: 'cancelled' });
  });
  it('does not cancel ordinary credential rotation for the same account and generation', async () => {
    const { auth, me } = setup();
    const token = deferred<string>();
    vi.mocked(auth.port.getAccessToken).mockReturnValue(token.promise);
    const result = me();
    await microtasks();
    auth.set(signedIn(ACCOUNT_A, 1, 'refreshing'));
    token.resolve('fresh-token');
    await expect(result).resolves.toEqual(identity());
  });
  it('aborts a fetch and discards a response arriving after cancellation', async () => {
    const { auth, me, fetcher } = setup();
    const transport = deferred<Response>();
    fetcher.mockReturnValue(transport.promise);
    const controller = new AbortController();
    const result = me(controller.signal).catch((error) => error);
    await microtasks();
    controller.abort();
    expect(await result).toMatchObject({ kind: 'cancelled' });
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    const late = json();
    const parse = vi.spyOn(late, 'json');
    const close = vi.spyOn(late.body!, 'cancel');
    transport.resolve(late);
    await microtasks();
    expect(parse).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
    expect(auth.listenerCount).toBe(0);
  });
  it('includes body reading in the deadline and ignores its late value', async () => {
    const { api, fetcher } = setup();
    const body = deferred<unknown>();
    const response = json();
    vi.spyOn(response, 'json').mockReturnValue(body.promise);
    fetcher.mockResolvedValueOnce(response);
    const decode = vi.fn((value: unknown) => value);
    const result = api.request('/resource', { decode }).catch((error) => error);
    await microtasks();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await result).toMatchObject({ kind: 'timeout' });
    body.resolve(identity());
    await microtasks();
    expect(decode).not.toHaveBeenCalled();
  });
  it('does not deliver a body or decoder result to a different account', async () => {
    const { api, auth, fetcher } = setup();
    const body = deferred<unknown>();
    const response = json();
    vi.spyOn(response, 'json').mockReturnValue(body.promise);
    fetcher.mockResolvedValueOnce(response);
    const decode = vi.fn((value: unknown) => value);
    const result = api.request('/resource', { decode }).catch((error) => error);
    await microtasks();
    auth.set(signedIn(ACCOUNT_B, 2));
    body.resolve(identity());
    expect(await result).toMatchObject({ kind: 'cancelled' });
    expect(decode).not.toHaveBeenCalled();
  });
  it('keeps one timeout budget across token acquisition, Auth recovery and a replay body', async () => {
    const { auth, me, fetcher } = setup();
    const token = deferred<string>();
    const recovery = deferred<void>();
    const body = deferred<unknown>();
    vi.mocked(auth.port.getAccessToken)
      .mockReturnValueOnce(token.promise)
      .mockResolvedValueOnce('revalidated');
    vi.mocked(auth.port.revalidateSession).mockReturnValue(recovery.promise);
    const replay = json();
    vi.spyOn(replay, 'json').mockReturnValue(body.promise);
    fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(replay);
    const result = me().catch((error) => error);
    await vi.advanceTimersByTimeAsync(8_000);
    token.resolve(SYNTHETIC_TOKEN);
    await microtasks();
    expect(auth.port.revalidateSession).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4_000);
    recovery.resolve();
    await microtasks();
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2_999);
    expect(auth.listenerCount).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toMatchObject({ kind: 'timeout' });
    body.resolve(identity());
    await microtasks();
  });
  it('does not dispatch a replay after a timed-out revalidation settles', async () => {
    const { auth, me, fetcher } = setup();
    const recovery = deferred<void>();
    fetcher.mockResolvedValueOnce(failure());
    vi.mocked(auth.port.revalidateSession).mockReturnValue(recovery.promise);
    const result = me().catch((error) => error);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(await result).toMatchObject({ kind: 'timeout' });
    recovery.resolve();
    await microtasks();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('sanitizes network exceptions and marks ambiguous writes without replay', async () => {
    const { api, fetcher } = setup();
    fetcher.mockRejectedValue(new Error(`network ${SYNTHETIC_TOKEN}`));
    const error = await api
      .request('/v1/profile', {
        method: 'PATCH',
        json: { expected_revision: 1, display_name: 'Jordan' },
        decode: (value) => value,
      })
      .catch((error) => error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network', requestMayHaveCommitted: true });
    expect(String(error)).not.toContain(SYNTHETIC_TOKEN);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('marks a cancelled dispatched write as uncertain while a pre-dispatch timeout is not', async () => {
    const { api, fetcher } = setup();
    fetcher.mockImplementation(() => new Promise(() => {}));
    const controller = new AbortController();
    const result = api
      .request('/v1/profile', {
        method: 'PATCH',
        body: '{}',
        response: 'empty',
        signal: controller.signal,
      })
      .catch((error) => error);
    await microtasks();
    controller.abort();
    expect(await result).toMatchObject({ kind: 'cancelled', requestMayHaveCommitted: true });
  });
  it('removes abort listeners after a completed operation', async () => {
    const { me, auth } = setup();
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    await me(controller.signal);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(auth.listenerCount).toBe(0);
    controller.abort();
  });
});

describe('Body and decoder transport failures', () => {
  it('distinguishes network loss after headers from malformed JSON and preserves uncertain write outcome', async () => {
    const { api, fetcher } = setup();
    const response = json();
    vi.spyOn(response, 'json').mockRejectedValue(new TypeError('private failed body JWT'));
    fetcher.mockResolvedValueOnce(response);
    const error = await api
      .request('/v1/profile', {
        method: 'PATCH',
        json: { expected_revision: 1, display_name: 'Jordan' },
        decode: (value) => value,
      })
      .catch((error) => error);
    expect(error).toMatchObject({ kind: 'network', status: 200, requestMayHaveCommitted: true });
    expect(String(error)).not.toContain('private');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('sanitizes a decoder exception without retaining its cause or raw data', async () => {
    const { api } = setup();
    const error = await api
      .request('/resource', {
        decode: () => {
          throw new Error(SYNTHETIC_TOKEN);
        },
      })
      .catch((error) => error);
    expect(error).toMatchObject({ kind: 'invalid_response', status: 200 });
    expect(String(error) + JSON.stringify(error)).not.toContain(SYNTHETIC_TOKEN);
  });
  it('rejects non-JSON media types even when the text happens to parse as JSON', async () => {
    const { me, fetcher } = setup();
    fetcher.mockResolvedValueOnce(
      new Response(JSON.stringify(identity()), { headers: { 'Content-Type': 'text/html' } }),
    );
    await expect(me()).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

it.each([true, false])(
  'rejects an account change during response decoding, including notification=%s',
  async (notify) => {
    const { api, auth } = setup();
    await expect(
      api.request('/resource', {
        decode: () => {
          auth.set(signedIn(ACCOUNT_B, 2), notify);
          return identity();
        },
      }),
    ).rejects.toMatchObject({ kind: 'cancelled' });
    expect(auth.listenerCount).toBe(0);
  },
);
