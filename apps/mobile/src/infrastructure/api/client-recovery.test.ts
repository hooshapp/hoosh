import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Bounded Auth recovery and account-scoped pause', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it('revalidates through Auth and re-reads the token for exactly one successful GET replay', async () => {
    const { auth, me, fetcher } = setup();
    vi.mocked(auth.port.getAccessToken)
      .mockResolvedValueOnce('expired')
      .mockResolvedValueOnce('refreshed');
    fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(json());
    await expect(me()).resolves.toEqual(identity());
    expect(auth.port.revalidateSession).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe(
      'Bearer refreshed',
    );
  });
  it('pauses sustained 401 and ignores focus/reconnect calls and routine token rotation', async () => {
    const { api, me, auth, fetcher } = setup();
    fetcher.mockImplementation(async () => failure());
    await expect(me()).rejects.toMatchObject({ kind: 'unauthorized', recoveryPaused: true });
    expect(api.getRecoveryState()).toBe('paused');
    auth.set(signedIn(ACCOUNT_A, 1, 'refreshing'));
    auth.set(signedIn());
    for (let event = 0; event < 3; event++)
      await expect(me()).rejects.toMatchObject({ kind: 'unauthorized', recoveryPaused: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(auth.port.revalidateSession).toHaveBeenCalledTimes(1);
  });
  it('does not clear a pause through public health or temporary same-generation unavailability', async () => {
    const { api, me, auth, fetcher } = setup();
    fetcher.mockImplementation(async () => failure());
    await me().catch(() => {});
    auth.set({ status: 'unavailable', sessionGeneration: 1, reason: 'storage', retryable: true });
    expect(api.getRecoveryState()).toBe('paused');
    auth.set(signedIn());
    fetcher.mockResolvedValueOnce(json({ status: 'ok', service: 'disconnect-api' }));
    await api.health();
    expect(api.getRecoveryState()).toBe('paused');
    await expect(me()).rejects.toMatchObject({ recoveryPaused: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('explicitly revalidates and verifies one identity GET before allowing automatic work again', async () => {
    const { api, me, auth, fetcher } = setup();
    fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(failure());
    await me().catch(() => {});
    fetcher.mockResolvedValueOnce(json());
    await expect(api.recoverSession()).resolves.toEqual(identity());
    expect(api.getRecoveryState()).toBe('ready');
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(auth.port.revalidateSession).toHaveBeenCalledTimes(2);
    await me();
    expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it('an explicit 401 probe has no second replay and keeps automatic work paused', async () => {
    const { api, me, fetcher } = setup();
    fetcher.mockImplementation(async () => failure());
    await me().catch(() => {});
    await expect(api.recoverSession()).rejects.toMatchObject({
      kind: 'unauthorized',
      recoveryPaused: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(3);
    await expect(me()).rejects.toMatchObject({ recoveryPaused: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it.each([identity(ACCOUNT_B), {}, { user_id: ACCOUNT_A }])(
    'a wrong or invalid identity probe cannot clear the pause (%j)',
    async (body) => {
      const { api, me, fetcher } = setup();
      fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(failure());
      await me().catch(() => {});
      fetcher.mockResolvedValueOnce(json(body));
      await expect(api.recoverSession()).rejects.toMatchObject({ kind: 'invalid_response' });
      expect(api.getRecoveryState()).toBe('paused');
    },
  );
  it.each([ACCOUNT_A, ACCOUNT_B])(
    'a real generation/session replacement permits a new scope for %s',
    async (user) => {
      const { api, me, auth, fetcher } = setup();
      fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(failure());
      await me().catch(() => {});
      auth.set(signedIn(user, 2));
      expect(api.getRecoveryState()).toBe('ready');
      fetcher.mockResolvedValueOnce(json(identity(user)));
      await expect(me()).resolves.toEqual(identity(user));
    },
  );
  it('Auth network/storage failure preserves known identity and does not fabricate sign-out or a replay', async () => {
    const { me, auth, fetcher, api } = setup();
    fetcher.mockResolvedValueOnce(failure());
    vi.mocked(auth.port.revalidateSession).mockRejectedValue(
      Object.assign(new Error(SYNTHETIC_TOKEN), {
        name: 'AuthUnavailableError',
        reason: 'refresh',
        retryable: true,
      }),
    );
    const error = await me().catch((error) => error);
    expect(error).toMatchObject({ kind: 'unavailable', retryable: true });
    expect(String(error)).not.toContain(SYNTHETIC_TOKEN);
    expect(auth.port.getSnapshot().status).toBe('signed_in');
    expect(api.getRecoveryState()).toBe('ready');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('a failed explicit revalidation leaves a prior pause in place and releases its lease', async () => {
    const { api, me, auth, fetcher } = setup();
    fetcher.mockResolvedValueOnce(failure()).mockResolvedValueOnce(failure());
    await me().catch(() => {});
    vi.mocked(auth.port.revalidateSession).mockRejectedValueOnce(new Error('offline'));
    await expect(api.recoverSession()).rejects.toMatchObject({ kind: 'unavailable' });
    expect(api.getRecoveryState()).toBe('paused');
    expect(fetcher).toHaveBeenCalledTimes(2);
    await expect(api.recoverSession()).resolves.toEqual(identity());
  });
  it('never replays a PATCH for 401, including a still-valid SDK identity', async () => {
    const { api, auth, fetcher } = setup();
    fetcher.mockResolvedValueOnce(failure());
    await expect(
      api.request('/v1/profile', {
        method: 'PATCH',
        json: { expected_revision: 1, display_name: 'Jordan' },
        decode: (value) => value,
      }),
    ).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(auth.port.revalidateSession).not.toHaveBeenCalled();
  });
  it.each([
    [403, 'FORBIDDEN'],
    [409, 'PROFILE_CONFLICT'],
    [422, 'VALIDATION_ERROR'],
    [503, 'DEPENDENCY_UNAVAILABLE'],
  ] as const)('never refreshes Auth or retries HTTP %s', async (status, code) => {
    const { me, auth, fetcher } = setup();
    fetcher.mockResolvedValueOnce(
      failure(
        status,
        code,
        status === 409
          ? { current_revision: 2 }
          : status === 422
            ? { fields: [{ field: 'body', code: 'invalid_json' }] }
            : undefined,
      ),
    );
    await expect(me()).rejects.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(auth.port.revalidateSession).not.toHaveBeenCalled();
  });
  it('does not deliver or replay when revalidation replaces the account', async () => {
    const { me, auth, fetcher } = setup();
    fetcher.mockResolvedValueOnce(failure());
    vi.mocked(auth.port.revalidateSession).mockImplementationOnce(async () => {
      auth.set(signedIn(ACCOUNT_B, 2));
    });
    await expect(me()).rejects.toMatchObject({ kind: 'cancelled' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('prevents parallel explicit probes while Auth owns its single-flight recovery', async () => {
    const { api, auth, fetcher } = setup();
    const recovery = deferred<void>();
    vi.mocked(auth.port.revalidateSession).mockReturnValueOnce(recovery.promise);
    const first = api.recoverSession();
    await microtasks();
    expect(api.getRecoveryState()).toBe('recovering');
    await expect(api.recoverSession()).rejects.toMatchObject({
      kind: 'unavailable',
      retryable: false,
    });
    expect(auth.port.revalidateSession).toHaveBeenCalledTimes(1);
    recovery.resolve();
    await expect(first).resolves.toEqual(identity());
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not let a stale in-flight 401 re-pause a successfully verified scope', async () => {
    const { api, me, fetcher } = setup();
    const old = deferred<Response>();
    fetcher.mockReturnValueOnce(old.promise).mockResolvedValueOnce(json());
    const result = me().catch((error) => error);
    await microtasks();
    await api.recoverSession();
    old.resolve(failure());
    expect(await result).toMatchObject({ kind: 'cancelled' });
    expect(api.getRecoveryState()).toBe('ready');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('a second automatic request cannot dispatch a late token after another request pauses the scope', async () => {
    const { auth, me, fetcher } = setup();
    const late = deferred<string>();
    vi.mocked(auth.port.getAccessToken)
      .mockReturnValueOnce(late.promise)
      .mockResolvedValue(SYNTHETIC_TOKEN);
    fetcher.mockImplementation(async () => failure());
    const old = me().catch((error) => error);
    await microtasks();
    await me().catch(() => {});
    late.resolve(SYNTHETIC_TOKEN);
    expect(await old).toMatchObject({ kind: 'unauthorized', recoveryPaused: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

it('delegates concurrent 401 recovery to the same auth-owned flight', async () => {
  const { auth, me, fetcher } = setup();
  const flight = deferred<void>();
  vi.mocked(auth.port.revalidateSession).mockReturnValue(flight.promise);
  let initialResponses = 0;
  fetcher.mockImplementation(async () => (++initialResponses <= 2 ? failure() : json()));
  const first = me();
  const second = me();
  await microtasks();
  expect(auth.port.revalidateSession).toHaveBeenCalledTimes(2);
  flight.resolve();
  await expect(Promise.all([first, second])).resolves.toEqual([identity(), identity()]);
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(auth.listenerCount).toBe(0);
});
