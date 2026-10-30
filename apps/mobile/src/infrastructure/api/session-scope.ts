import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { ApiError, authUnavailable } from './errors';
import type { RequestOperation } from './operation';
import type { RequestAccount } from './types';

function sameAccount(a: RequestAccount | undefined, b: RequestAccount) {
  return a?.user_id === b.user_id && a.sessionGeneration === b.sessionGeneration;
}
/** API gate only: never tokens, Auth state mutation or independent SDK subscriptions. */
export function createSessionScope(auth: AuthSessionPort | undefined) {
  let owner: RequestAccount | undefined;
  let paused = false;
  let verifying: symbol | undefined;
  let epoch = 0;
  function snapshot(): AuthSnapshot {
    if (!auth) throw new ApiError('configuration');
    try {
      return auth.getSnapshot();
    } catch (error) {
      throw authUnavailable(error);
    }
  }
  function sync(current: AuthSnapshot) {
    if (
      owner &&
      (current.sessionGeneration !== owner.sessionGeneration ||
        (current.status === 'signed_in' && current.user.user_id !== owner.user_id) ||
        current.status === 'signed_out' ||
        current.status === 'signing_out')
    ) {
      owner = undefined;
      paused = false;
      verifying = undefined;
      epoch++;
    }
    if (current.status === 'signed_in' && !owner)
      owner = { user_id: current.user.user_id, sessionGeneration: current.sessionGeneration };
  }
  function open(operation: RequestOperation, explicit: boolean) {
    const initial = snapshot();
    sync(initial);
    if (initial.status === 'signed_out') throw new ApiError('no_session');
    if (initial.status !== 'signed_in') throw new ApiError('unavailable');
    const account: RequestAccount = {
      user_id: initial.user.user_id,
      sessionGeneration: initial.sessionGeneration,
    };
    if (verifying) throw new ApiError('unavailable', { retryable: false });
    if (paused && !explicit)
      throw new ApiError('unauthorized', { status: 401, recoveryPaused: true });
    if (!explicit && initial.credentialStatus === 'unavailable') throw new ApiError('unavailable');
    let lease: symbol | undefined;
    if (explicit) {
      lease = Symbol();
      verifying = lease;
      epoch++;
    }
    const ticket = epoch;
    const assertCurrent = () => {
      operation.check();
      const current = snapshot();
      sync(current);
      if (
        current.status !== 'signed_in' ||
        !sameAccount(account, {
          user_id: current.user.user_id,
          sessionGeneration: current.sessionGeneration,
        })
      ) {
        operation.stop(new ApiError('cancelled'));
        operation.check();
      }
    };
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = auth!.subscribe(() => {
        try {
          assertCurrent();
        } catch (error) {
          operation.stop(error instanceof ApiError ? error : authUnavailable(error));
        }
      });
      assertCurrent();
    } catch (error) {
      unsubscribe?.();
      if (verifying === lease) verifying = undefined;
      throw error instanceof ApiError ? error : authUnavailable(error);
    }
    return {
      account,
      assertCurrent,
      isPaused: () => paused,
      async token() {
        assertCurrent();
        const current = snapshot();
        if (current.status === 'signed_in' && current.credentialStatus === 'unavailable')
          throw new ApiError('unavailable');
        let token: string | null;
        try {
          token = await operation.run(() => auth!.getAccessToken());
        } catch (error) {
          operation.check();
          throw authUnavailable(error);
        }
        assertCurrent();
        if (!token) throw new ApiError('no_session');
        if (typeof token !== 'string' || /[\s\u0000-\u001f\u007f]/.test(token))
          throw new ApiError('unavailable');
        return token;
      },
      async revalidate() {
        assertCurrent();
        try {
          await operation.run(() => auth!.revalidateSession());
        } catch (error) {
          operation.check();
          throw authUnavailable(error);
        }
        assertCurrent();
      },
      assertRecoveryAllowed() {
        assertCurrent();
        if (ticket !== epoch) throw new ApiError('cancelled');
        if (paused && !explicit)
          throw new ApiError('unauthorized', { status: 401, recoveryPaused: true });
      },
      pause() {
        assertCurrent();
        if (ticket !== epoch) throw new ApiError('cancelled');
        paused = true;
      },
      recovered() {
        assertCurrent();
        if (verifying === lease && explicit) paused = false;
      },
      dispose() {
        if (lease && verifying === lease) verifying = undefined;
        try {
          unsubscribe?.();
        } catch {
          /* Auth owns unsubscribe correctness. */
        }
      },
    };
  }
  return {
    open,
    getRecoveryState(): 'ready' | 'paused' | 'recovering' | 'unavailable' {
      try {
        sync(snapshot());
      } catch {
        return 'unavailable';
      }
      return verifying ? 'recovering' : paused ? 'paused' : 'ready';
    },
  };
}
