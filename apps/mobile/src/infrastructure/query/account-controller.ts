import type { AuthSessionPort } from '@disconnect/contracts';

import { ApiError } from '../api/errors';
import { createAccountScope, type AccountApi, type AccountScope } from './account-scope';

export type AccountAvailability =
  | 'bootstrapping'
  | 'signed_out'
  | 'signing_out'
  | 'auth_unavailable'
  | 'ready'
  | 'api_unavailable'
  | 'api_paused'
  | 'recovering';
export type AccountDataSnapshot = Readonly<{
  scope: AccountScope | null;
  availability: AccountAvailability;
}>;
const serverSnapshot: AccountDataSnapshot = Object.freeze({
  scope: null,
  availability: 'bootstrapping',
});

let nextScopeId = 0;

/** Projection of Auth's store, never another credential/session store or refresh owner. */
export function createAccountDataController(auth: AuthSessionPort, api: AccountApi) {
  let state = serverSnapshot;
  let scope: AccountScope | null = null;
  let unsubscribeAuth: (() => void) | undefined;
  let unsubscribeCache: (() => void) | undefined;
  const listeners = new Set<() => void>();
  function retire() {
    const old = scope;
    scope = null;
    unsubscribeCache?.();
    unsubscribeCache = undefined;
    old?.dispose();
  }
  function publish(availability: AccountAvailability) {
    if (state.scope === scope && state.availability === availability) return;
    state = Object.freeze({ scope, availability });
    for (const listener of [...listeners]) listener();
  }
  function refresh() {
    if (!listeners.size) return;
    const snapshot = auth.getSnapshot();
    const previous = scope;
    if (
      scope &&
      (snapshot.sessionGeneration !== scope.account.sessionGeneration ||
        snapshot.status === 'signed_out' ||
        snapshot.status === 'signing_out' ||
        snapshot.status === 'bootstrapping' ||
        (snapshot.status === 'signed_in' && snapshot.user.user_id !== scope.account.user_id))
    )
      retire();
    if (!scope && snapshot.status === 'signed_in') {
      const next = createAccountScope(
        ++nextScopeId,
        Object.freeze({
          user_id: snapshot.user.user_id,
          sessionGeneration: snapshot.sessionGeneration,
        }),
        auth,
        api,
        () => scope === next,
      );
      scope = next;
      // Cache events expose a newly paused HTTP gate without subscribing to the SDK.
      unsubscribeCache = next.client.getQueryCache().subscribe(() => refresh());
    }
    let availability: AccountAvailability;
    if (snapshot.status !== 'signed_in') {
      availability = snapshot.status === 'unavailable' ? 'auth_unavailable' : snapshot.status;
    } else if (snapshot.credentialStatus !== 'ready') availability = 'auth_unavailable';
    else if (api.configuration.status !== 'ready') availability = 'api_unavailable';
    else {
      availability = (
        {
          ready: 'ready',
          paused: 'api_paused',
          recovering: 'recovering',
          unavailable: 'auth_unavailable',
        } as const
      )[api.getRecoveryState()];
    }
    const wasReady = state.availability === 'ready';
    // Publish before cancellation generates synchronous cache notifications.
    publish(availability);
    if (scope && availability !== 'ready' && wasReady) scope.pause();
    if (scope && scope === previous && availability === 'ready' && !wasReady)
      void scope.client.invalidateQueries();
  }
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        unsubscribeAuth = auth.subscribe(refresh);
        refresh();
      }
      let active = true;
      return () => {
        if (!active) return;
        active = false;
        listeners.delete(listener);
        if (!listeners.size) {
          unsubscribeAuth?.();
          unsubscribeAuth = undefined;
          retire();
          state = serverSnapshot;
        }
      };
    },
    /** Bind only to a deliberate recovery action, never focus/reconnect or token rotation. */
    async recoverSession(signal?: AbortSignal) {
      const owner = scope;
      if (!owner) throw new ApiError('no_session');
      const result = api.recoverSession(signal);
      refresh();
      try {
        const identity = await result;
        owner.assertCurrent();
        return identity;
      } finally {
        refresh();
      }
    },
  };
}
export type AccountDataController = ReturnType<typeof createAccountDataController>;
