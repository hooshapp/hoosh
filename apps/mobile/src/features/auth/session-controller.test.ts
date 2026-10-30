import { describe, expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AuthRuntime } from '@/infrastructure/auth/supabase';
import { AuthUnavailableError } from '../../infrastructure/auth/errors';
import { SessionController } from './session-controller';

function session(user = 'a', sid = 'session-a', access = 'access'): Session {
  return { access_token: `${access}.${btoa(JSON.stringify({ session_id: sid }))}.signature`,
    refresh_token: 'synthetic-refresh', expires_at: Date.now() / 1000 + 3600, expires_in: 3600, token_type: 'bearer',
    user: { id: user, email: `${user}@example.test` } } as Session;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function fixture(initial: Session | null = null) {
  let current = initial;
  let listener: ((event: AuthChangeEvent, value: Session | null) => void) | null = null;
  const unsubscribe = vi.fn(() => { listener = null; });
  const emit = (event: AuthChangeEvent, value: Session | null) => { current = value; listener?.(event, value); };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: current }, error: null as unknown })),
    onAuthStateChange: vi.fn((fn: typeof listener) => { listener = fn; return { data: { subscription: { unsubscribe } } }; }),
    startAutoRefresh: vi.fn(async () => undefined), stopAutoRefresh: vi.fn(async () => undefined),
    signInWithPassword: vi.fn(async (_credentials: { email: string; password: string }) => {
      const value = session(); emit('SIGNED_IN', value); return { data: { session: value }, error: null as unknown };
    }),
    refreshSession: vi.fn(async (): Promise<{ data: { session: Session | null }; error: unknown }> => {
      const value = session('a', 'session-a', 'refreshed'); emit('TOKEN_REFRESHED', value);
      return { data: { session: value }, error: null as unknown };
    }),
    signOut: vi.fn(async () => { emit('SIGNED_OUT', null); return { error: null as unknown }; }),
  };
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn(async (key: string) => key === 'test-key' ? (current ? 'synthetic-session' : null) : data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => { data.set(key, value); }),
    removeItem: vi.fn(async (key: string) => { data.delete(key); }),
  };
  const runtime = { client: { auth }, storage, config: { storageKey: 'test-key' } } as unknown as AuthRuntime;
  const controller = new SessionController(() => runtime);
  return { controller, auth, storage, emit, unsubscribe };
}
describe('canonical session lifecycle', () => {
  it('restores a session without exposing credentials in snapshots', async () => {
    const { controller } = fixture(session()); await controller.start();
    expect(controller.getSnapshot()).toMatchObject({ status: 'signed_in', sessionGeneration: 1, user: { user_id: 'a' }, credentialStatus: 'ready' });
    expect(JSON.stringify(controller.getSnapshot())).not.toContain('synthetic-refresh');
    expect(await controller.getAccessToken()).toContain('access.');
    controller.stop();
  });
  it('returns null only for a known signed-out session', async () => {
    const { controller } = fixture();
    await expect(controller.getAccessToken()).rejects.toMatchObject({ reason: 'configuration' });
    await controller.start(); expect(await controller.getAccessToken()).toBeNull(); controller.stop();
  });
  it('cannot overwrite a newer sign-in with an older startup result', async () => {
    const f = fixture(); const startup = deferred<{ data: { session: Session | null }; error: null }>();
    f.auth.getSession.mockImplementationOnce(() => startup.promise);
    const start = f.controller.start(); f.emit('SIGNED_IN', session('b', 'b-session'));
    startup.resolve({ data: { session: null }, error: null }); await start;
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signed_in', user: { user_id: 'b' } }); f.controller.stop();
  });
  it('does not advance generation or notify for duplicate sessions and preserves generation on refresh', async () => {
    const f = fixture(session()); await f.controller.start(); const listener = vi.fn(); f.controller.subscribe(listener);
    const before = f.controller.getSnapshot(); f.emit('SIGNED_IN', session());
    expect(f.controller.getSnapshot()).toBe(before); expect(listener).not.toHaveBeenCalled();
    await f.controller.revalidateSession(); expect(f.controller.getSnapshot().sessionGeneration).toBe(1); f.controller.stop();
  });
  it('advances generation when the same user gets a different auth session', async () => {
    const f = fixture(session()); await f.controller.start(); f.emit('SIGNED_IN', session('a', 'replacement'));
    expect(f.controller.getSnapshot().sessionGeneration).toBe(2); f.controller.stop();
  });
  it('coalesces refresh and retains identity when a transient refresh fails', async () => {
    const f = fixture(session()); await f.controller.start();
    const refresh = deferred<{ data: { session: Session | null }; error: unknown }>();
    f.auth.refreshSession.mockImplementationOnce(() => refresh.promise);
    const a = f.controller.revalidateSession(); const b = f.controller.revalidateSession(); expect(a).toBe(b);
    refresh.resolve({ data: { session: null }, error: { code: 'network' } });
    await expect(a).rejects.toMatchObject({ reason: 'refresh' });
    expect(f.auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signed_in', credentialStatus: 'unavailable', sessionGeneration: 1 });
    await expect(f.controller.getAccessToken()).rejects.toMatchObject({ reason: 'refresh' }); f.controller.stop();
  });
  it('adopts SDK invalid-session removal and invalidates old refresh results', async () => {
    const f = fixture(session()); await f.controller.start();
    const pending = deferred<{ data: { session: Session | null }; error: unknown }>();
    f.auth.refreshSession.mockImplementationOnce(() => pending.promise);
    const refresh = f.controller.revalidateSession(); f.emit('SIGNED_OUT', null);
    pending.resolve({ data: { session: session() }, error: null });
    await expect(refresh).rejects.toMatchObject({ reason: 'not_ready' });
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signed_out', sessionGeneration: 2 }); f.controller.stop();
  });
  it('trims email but preserves the password and prevents concurrent attempts', async () => {
    const f = fixture(); await f.controller.start(); const pending = deferred<{ data: { session: Session }; error: null }>();
    f.auth.signInWithPassword.mockImplementationOnce(() => pending.promise);
    const a = f.controller.signIn(' a@example.test ', ' password ');
    await expect(f.controller.signIn('b@example.test', 'password')).rejects.toMatchObject({ reason: 'not_ready' });
    pending.resolve({ data: { session: session() }, error: null }); await a;
    expect(f.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@example.test', password: ' password ' }); f.controller.stop();
  });
  it('locks access at sign-out intent, coalesces taps and verifies erasure', async () => {
    const f = fixture(session()); await f.controller.start();
    const a = f.controller.signOut(); const b = f.controller.signOut(); expect(a).toBe(b);
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'signing_out', sessionGeneration: 2 });
    await expect(f.controller.getAccessToken()).rejects.toMatchObject({ reason: 'not_ready' });
    await expect(a).resolves.toMatchObject({ localSessionCleared: true, remoteRevocation: 'confirmed' });
    expect(f.auth.signOut).toHaveBeenCalledWith({ scope: 'local' }); f.controller.stop();
  });
  it('reports remote uncertainty separately when local credentials are erased', async () => {
    const f = fixture(session()); await f.controller.start();
    f.auth.signOut.mockImplementationOnce(async () => { f.emit('SIGNED_OUT', null); return { error: { code: 'network' } }; });
    await expect(f.controller.signOut()).resolves.toMatchObject({ localSessionCleared: true, remoteRevocation: 'unconfirmed' }); f.controller.stop();
  });
  it('keeps access locked if session deletion is not confirmed and permits a cleanup retry', async () => {
    const f = fixture(session()); await f.controller.start();
    f.storage.getItem.mockRejectedValueOnce(new Error('disk unavailable'));
    await expect(f.controller.signOut()).rejects.toMatchObject({ reason: 'storage' });
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'storage' });
    f.emit('TOKEN_REFRESHED', session()); expect(f.controller.getSnapshot().status).toBe('unavailable');
    await f.controller.start(); expect(f.controller.getSnapshot().status).toBe('signed_out'); f.controller.stop();
  });
  it('cleans up listeners and ignores startup after disposal', async () => {
    const f = fixture(); const pending = deferred<{ data: { session: Session | null }; error: null }>();
    f.auth.getSession.mockImplementationOnce(() => pending.promise);
    const start = f.controller.start(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); f.controller.stop(); pending.resolve({ data: { session: session() }, error: null }); await start;
    expect(f.unsubscribe).toHaveBeenCalledTimes(1); expect(f.controller.getSnapshot().status).toBe('bootstrapping');
  });
  it('represents missing configuration honestly without manufacturing a client', async () => {
    const controller = new SessionController(() => { throw new AuthUnavailableError('configuration', false); });
    await controller.start(); expect(controller.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'configuration', retryable: false });
    await expect(controller.signIn('a@example.test', 'password')).rejects.toMatchObject({ reason: 'configuration' }); controller.stop();
  });
});

it('bounds stalled native-storage bootstrap and discards its late result', async () => {
  vi.useFakeTimers();
  const f = fixture();
  const pending = deferred<string | null>();
  f.storage.getItem.mockImplementationOnce(() => pending.promise);
  try {
    const start = f.controller.start();
    await vi.advanceTimersByTimeAsync(20001);
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'storage' });
    f.emit('SIGNED_IN', session());
    pending.resolve(null); await start;
    expect(f.controller.getSnapshot().status).toBe('unavailable');
    expect(f.auth.getSession).not.toHaveBeenCalled();
  } finally { f.controller.stop(); vi.useRealTimers(); }
});

it('cannot adopt an older refresh after a newer bootstrap times out', async () => {
  vi.useFakeTimers();
  const f = fixture(session());
  const storage = deferred<string | null>();
  const refreshed = deferred<{ data: { session: Session | null }; error: null }>();
  try {
    await f.controller.start();
    f.auth.refreshSession.mockImplementationOnce(() => refreshed.promise);
    const refresh = f.controller.revalidateSession();
    f.storage.getItem.mockImplementationOnce(() => storage.promise);
    const restart = f.controller.start();
    await vi.advanceTimersByTimeAsync(20001);
    refreshed.resolve({ data: { session: session() }, error: null });
    await expect(refresh).rejects.toMatchObject({ reason: 'not_ready' });
    storage.resolve(null); await restart;
    expect(f.controller.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'storage' });
  } finally { f.controller.stop(); vi.useRealTimers(); }
});
