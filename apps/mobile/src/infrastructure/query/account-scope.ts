import type { AuthSessionPort } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';

import type { createApiClient } from '../api/client';
import { ApiError } from '../api/errors';
import type { RequestAccount } from '../api/types';
import { createAccountQueryClient } from './query-client';

export type AccountApi = ReturnType<typeof createApiClient>;
export type AccountOperation = {
  readonly account: RequestAccount;
  readonly signal: AbortSignal;
  readonly api: AccountApi;
};
export type AccountWork<T> = (operation: AccountOperation) => Promise<T>;

/** Private disposable owner. All async work must return data; UI effects use commit(). */
export function createAccountScope(
  id: number,
  account: RequestAccount,
  auth: AuthSessionPort,
  api: AccountApi,
  isAttached: () => boolean,
) {
  let alive = true;
  const pending = new Set<AbortController>();
  function isCurrent() {
    const snapshot = auth.getSnapshot();
    return (
      alive &&
      isAttached() &&
      snapshot.status === 'signed_in' &&
      snapshot.sessionGeneration === account.sessionGeneration &&
      snapshot.user.user_id === account.user_id
    );
  }
  function canRun() {
    const snapshot = auth.getSnapshot();
    return (
      isCurrent() &&
      snapshot.status === 'signed_in' &&
      snapshot.credentialStatus === 'ready' &&
      api.configuration.status === 'ready' &&
      api.getRecoveryState() === 'ready'
    );
  }
  function assertCurrent() {
    if (!isCurrent()) throw new ApiError('cancelled');
  }
  function assertReady() {
    assertCurrent();
    if (!canRun()) throw new ApiError('unavailable', { retryable: false });
  }
  const client = createAccountQueryClient(canRun);
  async function run<T>(work: AccountWork<T>, signal?: AbortSignal, mutation = false): Promise<T> {
    assertReady();
    const controller = new AbortController();
    const abort = () => controller.abort();
    let detach = () => {};
    const stopped = new Promise<never>((_, reject) => {
      const onAbort = () => reject(new ApiError('cancelled'));
      controller.signal.addEventListener('abort', onAbort, { once: true });
      detach = () => controller.signal.removeEventListener('abort', onAbort);
    });
    pending.add(controller);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    let started = false;
    try {
      // Race also suppresses a producer that ignores its AbortSignal.
      const value = await Promise.race([
        stopped,
        Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new ApiError('cancelled');
          assertReady();
          started = true;
          return work({ account, api, signal: controller.signal });
        }),
      ]);
      assertReady();
      return value;
    } catch (error) {
      if (mutation && started && error instanceof ApiError && error.kind === 'cancelled')
        throw new ApiError('cancelled', { requestMayHaveCommitted: true });
      throw error;
    } finally {
      pending.delete(controller);
      signal?.removeEventListener('abort', abort);
      detach();
    }
  }
  function pause() {
    for (const controller of pending) controller.abort();
    void client.cancelQueries();
  }
  return {
    id,
    account,
    client,
    canRun,
    isCurrent,
    assertCurrent,
    key: (...parts: readonly unknown[]) => ['account', account.user_id, ...parts] as const,
    read: run,
    async write<T>(work: AccountWork<T>) {
      assertReady();
      if (!onlineManager.isOnline()) throw new ApiError('network', { retryable: false });
      return run(work, undefined, true);
    },
    /** Synchronous UI/cache effects only. Re-check after any caller-owned await. */
    commit(effect: () => void) {
      if (isCurrent()) effect();
    },
    pause,
    dispose() {
      if (!alive) return;
      alive = false;
      pause();
      client.clear();
    },
  };
}
export type AccountScope = ReturnType<typeof createAccountScope>;
