import type { AuthSessionPort, AuthSnapshot, AuthAccountActions } from '@disconnect/contracts';
import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';

export class AuthUnavailableError extends Error {
  readonly name = 'AuthUnavailableError';
  constructor(readonly reason: 'not_ready' | 'configuration' | 'storage' | 'refresh', readonly retryable = true) {
    super('Account access is unavailable.');
  }
}
type Sdk = Pick<SupabaseClient['auth'], 'getSession' | 'onAuthStateChange' | 'refreshSession' | 'signInWithPassword' | 'signOut'>;

/** SDK owns all credentials/refresh. This store publishes only immutable safe identity. */
export function createAuthSession(sdk: Sdk | null) {
  let snapshot: AuthSnapshot = sdk
    ? { status: 'bootstrapping', sessionGeneration: 0 }
    : { status: 'unavailable', reason: 'configuration', retryable: false, sessionGeneration: 0 };
  const listeners = new Set<() => void>();
  let epoch = 0, refresh: Promise<void> | null = null, started = false;
  let sessionId: string | null = null;
  let unsubscribe: (() => void) | undefined;
  function publish(value: AuthSnapshot) {
    snapshot = Object.freeze(value);
    listeners.forEach((fn) => fn());
  }
  function accept(session: Session | null) {
    if (snapshot.status === 'signing_out' || (snapshot.status === 'unavailable' && snapshot.reason === 'storage')) return;
    const nextId = sdkSessionId(session);
    const same = snapshot.status === 'signed_in' && snapshot.user.user_id === session?.user.id &&
      (sessionId === null || nextId === null || sessionId === nextId);
    sessionId = nextId;
    const generation = snapshot.sessionGeneration + (same ? 0 : 1);
    publish(session ? {
      status: 'signed_in', sessionGeneration: generation, credentialStatus: 'ready',
      user: Object.freeze({ user_id: session.user.id, email: session.user.email ?? null }),
    } : { status: 'signed_out', sessionGeneration: generation });
  }
  function storageFailed() {
    epoch++;
    publish({ status: 'unavailable', reason: 'storage', retryable: true, sessionGeneration: snapshot.sessionGeneration + 1 });
  }
  const port: AuthSessionPort & AuthAccountActions = {
    getSnapshot: () => snapshot,
    subscribe(fn) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    async getAccessToken() {
      if (snapshot.status === 'signed_out') return null;
      if (!sdk || snapshot.status !== 'signed_in' || snapshot.credentialStatus !== 'ready') throw new AuthUnavailableError('not_ready');
      const owner = snapshot;
      const { data, error } = await sdk.getSession();
      if (error) throw new AuthUnavailableError('refresh');
      if (snapshot.status !== 'signed_in' || snapshot.sessionGeneration !== owner.sessionGeneration || data.session?.user.id !== owner.user.user_id) throw new AuthUnavailableError('not_ready');
      if (sessionId !== null && sdkSessionId(data.session) !== sessionId) throw new AuthUnavailableError('not_ready');
      if (!data.session.access_token) throw new AuthUnavailableError('refresh');
      return data.session.access_token;
    },
    revalidateSession() {
      if (refresh) return refresh;
      if (!sdk || snapshot.status !== 'signed_in') return Promise.reject(new AuthUnavailableError('not_ready'));
      const owner = snapshot, current = epoch;
      publish({ ...owner, credentialStatus: 'refreshing' });
      refresh = (async () => {
        try {
          const { data, error } = await sdk.refreshSession();
          if (epoch !== current || snapshot.sessionGeneration !== owner.sessionGeneration || snapshot.status !== 'signed_in') throw new AuthUnavailableError('not_ready');
          if (error || !data.session || data.session.user.id !== owner.user.user_id) {
            publish({ ...owner, credentialStatus: 'unavailable' });
            throw new AuthUnavailableError('refresh');
          }
          accept(data.session);
        } catch (error) {
          if (epoch === current && snapshot.status === 'signed_in' && snapshot.sessionGeneration === owner.sessionGeneration)
            publish({ ...owner, credentialStatus: 'unavailable' });
          throw error instanceof AuthUnavailableError ? error : new AuthUnavailableError('refresh');
        } finally { refresh = null; }
      })();
      return refresh;
    },
    async signOut() {
      if (!sdk) throw new AuthUnavailableError('configuration', false);
      epoch++;
      publish({ status: 'signing_out', sessionGeneration: snapshot.sessionGeneration + 1 });
      try {
        const { error } = await sdk.signOut({ scope: 'local' });
        // Local signOut in the pinned SDK erases storage before remote revocation.
        if (snapshot.status === 'unavailable') throw new AuthUnavailableError('storage');
        const check = await sdk.getSession();
        if (check.data.session) throw new AuthUnavailableError('storage');
        publish({ status: 'signed_out', sessionGeneration: snapshot.sessionGeneration });
        return { localSessionCleared: true, remoteRevocation: error ? 'unconfirmed' : 'confirmed' };
      } catch {
        storageFailed();
        throw new AuthUnavailableError('storage');
      }
    },
  };
  async function bootstrap() {
    if (started || !sdk) return;
    started = true;
    const current = epoch;
    let received = false;
    const registration = sdk.onAuthStateChange((_event: AuthChangeEvent, session) => {
      // INITIAL_SESSION null may accompany a retryable bootstrap/refresh error.
      // Only the checked getSession result below can establish initial signed-out state.
      if (_event === 'INITIAL_SESSION') return;
      received = true;
      // No awaited SDK calls in its callback: that callback may hold its lock.
      accept(session);
    });
    unsubscribe = () => registration.data.subscription.unsubscribe();
    try {
      const { data, error } = await sdk.getSession();
      if (current !== epoch || received) return;
      if (error) throw error;
      accept(data.session);
    } catch {
      if (current === epoch && !received) publish({ status: 'unavailable', reason: 'bootstrap', retryable: true, sessionGeneration: snapshot.sessionGeneration + 1 });
    }
  }
  return {
    ...port,
    storageFailed,
    async signIn(email: string, password: string) {
      if (!sdk || snapshot.status === 'signing_out' || snapshot.status === 'signed_in' || (snapshot.status === 'unavailable' && snapshot.reason === 'storage')) throw new AuthUnavailableError('not_ready');
      const current = ++epoch;
      const { data, error } = await sdk.signInWithPassword({ email: email.trim(), password });
      if (epoch !== current || error || !data.session) throw new AuthUnavailableError('not_ready');
      accept(data.session);
    },
    start: bootstrap,
    dispose() { unsubscribe?.(); unsubscribe = undefined; started = false; epoch++; },
    async retryBootstrap() {
      if (!sdk || snapshot.status !== 'unavailable' || snapshot.reason !== 'bootstrap') return;
      unsubscribe?.(); unsubscribe = undefined; started = false; epoch++;
      publish({ status: 'bootstrapping', sessionGeneration: snapshot.sessionGeneration + 1 });
      await bootstrap();
    },
  };
}
/** Correlation only, not JWT verification: SDK owns the token; FastAPI verifies it.
 * The stable Supabase session_id distinguishes same-subject replacement from rotation. */
function sdkSessionId(session: Session | null): string | null {
  if (!session) return null;
  try {
    const value = JSON.parse(atob(session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).session_id;
    return typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value) ? value : null;
  } catch { return null; }
}
export type AppAuthSession = ReturnType<typeof createAuthSession>;
