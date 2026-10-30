import { expect, it, vi } from 'vitest';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AuthRuntime } from '../../infrastructure/auth/supabase';
import { createClient } from '@supabase/supabase-js';
import { SessionController } from './session-controller';
import type { PendingLink } from './link-flow';

function fixture() {
  const store = new Map<string, string>();
  let current: Session | null = null;
  let listener: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
  const session = { access_token: `header.${btoa(JSON.stringify({ session_id: 'recovery-session' }))}.signature`, refresh_token: 'synthetic-refresh', expires_at: Date.now() / 1000 + 3600, user: { id: 'a', email: 'a@example.test' } } as Session;
  const emit = (event: AuthChangeEvent, value: Session | null) => { current = value; listener?.(event, value); };
  const auth = {
    onAuthStateChange: vi.fn((fn: typeof listener) => { listener = fn; return { data: { subscription: { unsubscribe: () => { listener = null; } } } }; }),
    getSession: vi.fn(async () => ({ data: { session: current }, error: null })),
    signUp: vi.fn(async (_args: unknown) => ({ data: { session: null, user: { id: 'a' } }, error: null as unknown })),
    resetPasswordForEmail: vi.fn(async (_email: string, _options: unknown) => ({ error: null as unknown })),
    resend: vi.fn(async (_args: unknown) => ({ error: null as unknown })),
    updateUser: vi.fn(async (_args: unknown) => ({ error: null as unknown })),
    exchangeCodeForSession: vi.fn(async (_code: string) => {
      const pending = JSON.parse(store.get('test.pending')!) as PendingLink;
      emit(pending.kind === 'recovery' ? 'PASSWORD_RECOVERY' : 'SIGNED_IN', session);
      return { data: { session, user: session.user }, error: null as unknown };
    }),
    signInWithIdToken: vi.fn(async (_args: unknown) => { emit('SIGNED_IN', session); return { data: { session }, error: null as unknown }; }),
    signInWithOAuth: vi.fn(async (args: { provider: string; options: { redirectTo: string; skipBrowserRedirect: boolean } }) => {
      const url = new URL('https://synthetic.supabase.co/auth/v1/authorize');
      url.search = new URLSearchParams({ provider: args.provider, redirect_to: args.options.redirectTo, code_challenge_method: 's256', code_challenge: 'synthetic-challenge' }).toString();
      return { data: { url: url.toString() }, error: null as unknown };
    }),
    signOut: vi.fn(async () => { emit('SIGNED_OUT', null); return { error: null }; }),
    startAutoRefresh: vi.fn(async () => undefined), stopAutoRefresh: vi.fn(async () => undefined),
  };
  const storage = { getItem: async (key: string) => key === 'test' ? (current ? JSON.stringify(current) : null) : store.get(key) ?? null,
    setItem: async (key: string, value: string) => { store.set(key, value); }, removeItem: async (key: string) => { store.delete(key); } };
  const runtime = { client: { auth }, storage, config: { storageKey: 'test', url: 'https://synthetic.supabase.co' } } as unknown as AuthRuntime;
  const controller = new SessionController(() => runtime);
  return { controller, auth, store, session, emit };
}
it('awaits signup confirmation without persisting password or putting name in Auth metadata', async () => {
  const f = fixture(); await f.controller.start();
  await f.controller.signUp(' a@example.test ', ' synthetic password ', 'Alex', 'http://localhost:8090');
  expect(f.controller.getSnapshot().status).toBe('signed_out');
  expect(f.controller.getLinkSnapshot().pending).toMatchObject({ kind: 'signup', phase: 'requested', displayName: 'Alex' });
  expect([...f.store.values()].join()).not.toContain('synthetic password');
  expect(f.auth.signUp).toHaveBeenCalledWith({ email: 'a@example.test', password: ' synthetic password ', options: { emailRedirectTo: expect.stringContaining('/auth/callback?flow=') } });
  const url = f.controller.getLinkSnapshot().pending!.redirectUrl + '&code=synthetic-code';
  const a = f.controller.handleCallback(url); const b = f.controller.handleCallback(url); expect(a).toBe(b);
  expect(await a).toBe('/(tabs)'); expect(f.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  expect(f.controller.getLinkSnapshot()).toMatchObject({ pending: null, draftName: 'Alex' });
  expect(JSON.parse(f.store.get('test.signup-name')!)).toEqual({ userId: 'a', name: 'Alex' }); f.controller.stop();
});
it('cannot authorize a reset from a query parameter or without an SDK recovery event', async () => {
  const f = fixture(); await f.controller.start();
  await expect(f.controller.updatePassword('new-password')).rejects.toMatchObject({ reason: 'not_ready' });
  await expect(f.controller.handleCallback('http://localhost:8090/auth/callback?type=recovery&code=fake')).rejects.toThrow();
  expect(f.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  await f.controller.requestRecovery('a@example.test', 'http://localhost:8090');
  const url = f.controller.getLinkSnapshot().pending!.redirectUrl + '&code=synthetic-code';
  f.auth.exchangeCodeForSession.mockImplementationOnce(async () => {
    f.emit('SIGNED_IN', f.session); return { data: { session: f.session, user: f.session.user }, error: null };
  });
  await expect(f.controller.handleCallback(url)).rejects.toThrow('does not match');
  expect(f.controller.canResetPassword()).toBe(false);
  expect(f.controller.getLinkSnapshot().pending?.phase).toBe('consuming'); f.controller.stop();
});
it('requires matched recovery context, restores it, updates exact password bytes and clears it at logout', async () => {
  const f = fixture(); await f.controller.start(); await f.controller.requestRecovery(' a@example.test ', 'http://localhost:8090');
  expect(f.controller.canResetPassword()).toBe(false);
  const url = f.controller.getLinkSnapshot().pending!.redirectUrl + '&code=synthetic-code';
  expect(await f.controller.handleCallback(url)).toBe('/(auth)/reset-password');
  expect(f.controller.canResetPassword()).toBe(true);
  await f.controller.start(); expect(f.controller.canResetPassword()).toBe(true);
  await f.controller.updatePassword(' new password ');
  expect(f.auth.updateUser).toHaveBeenCalledWith({ password: ' new password ' });
  await f.controller.signOut(); expect(f.controller.canResetPassword()).toBe(false);
  expect(f.store.has('test.pending')).toBe(false); expect(f.store.has('test.logout')).toBe(false); f.controller.stop();
});
it('rejects callbacks after cancellation and never overwrites a later account', async () => {
  const f = fixture(); await f.controller.start(); await f.controller.requestRecovery('a@example.test', 'http://localhost:8090');
  const url = f.controller.getLinkSnapshot().pending!.redirectUrl + '&code=synthetic-code';
  await f.controller.cancelLink(); f.emit('SIGNED_IN', { ...f.session, user: { ...f.session.user, id: 'b' } });
  await expect(f.controller.handleCallback(url)).rejects.toThrow(); expect(f.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  expect(f.controller.getSnapshot()).toMatchObject({ status: 'signed_in', user: { user_id: 'b' } }); f.controller.stop();
});
it('does not retry a consumed code after persistence/exchange failure', async () => {
  const f = fixture(); await f.controller.start(); await f.controller.requestRecovery('a@example.test', 'http://localhost:8090');
  f.auth.exchangeCodeForSession.mockResolvedValueOnce({ data: { session: f.session, user: f.session.user }, error: { code: 'expired' } });
  const url = f.controller.getLinkSnapshot().pending!.redirectUrl + '&code=synthetic-code';
  await expect(f.controller.handleCallback(url)).rejects.toThrow(); await expect(f.controller.handleCallback(url)).rejects.toThrow();
  expect(f.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  await f.controller.start(); expect(f.controller.getLinkSnapshot().pending?.phase).toBe('consuming'); f.controller.stop();
});
it('enforces a resend cooldown and does not claim email delivery', async () => {
  const f = fixture(); await f.controller.start(); await f.controller.signUp('a@example.test', 'password', 'Alex', 'http://localhost:8090');
  await expect(f.controller.resendConfirmation()).rejects.toMatchObject({ code: 'over_email_send_rate_limit' });
  expect(f.auth.resend).not.toHaveBeenCalled(); f.controller.stop();
});

it.each(['apple', 'google'] as const)('exchanges %s once across reordered Router/system-browser callbacks', async provider => {
  const f = fixture(); await f.controller.start();
  const flow = await f.controller.beginOAuth(provider, 'http://localhost:8090');
  expect(f.controller.getSnapshot().status).toBe('signed_out');
  expect(f.controller.getLinkSnapshot().pending).toMatchObject({ kind: 'oauth', provider, email: '' });
  const callback = flow.redirectUrl + '&code=synthetic-oauth-code';
  const reordered = new URL(callback); reordered.search = `code=synthetic-oauth-code&flow=${flow.flowId}`;
  const a = f.controller.handleCallback(callback); const b = f.controller.handleCallback(reordered.toString());
  expect(a).toBe(b); expect(await a).toBe('/(tabs)');
  expect(f.auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  expect(f.controller.getLinkSnapshot().pending).toBeNull(); f.controller.stop();
});
it('cancels OAuth and rejects a callback from the previous attempt', async () => {
  const f = fixture(); await f.controller.start(); const flow = await f.controller.beginOAuth('google');
  await expect(f.controller.beginOAuth('apple')).rejects.toMatchObject({ reason: 'not_ready' });
  await f.controller.cancelLink(); await f.controller.beginOAuth('apple');
  await expect(f.controller.handleCallback(flow.redirectUrl + '&code=old')).rejects.toThrow();
  expect(f.auth.exchangeCodeForSession).not.toHaveBeenCalled(); f.controller.stop();
});
it('rejects arbitrary authorization destinations and provider-denied callbacks', async () => {
  const f = fixture(); await f.controller.start();
  f.auth.signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://untrusted.example/auth/v1/authorize' }, error: null });
  await expect(f.controller.beginOAuth('google')).rejects.toMatchObject({ reason: 'configuration' });
  await f.controller.cancelLink(); const flow = await f.controller.beginOAuth('google');
  await expect(f.controller.handleCallback(flow.redirectUrl + '&error=access_denied')).rejects.toThrow();
  expect(f.auth.exchangeCodeForSession).not.toHaveBeenCalled(); f.controller.stop();
});
it('restores OAuth intent after reload before exchanging a callback', async () => {
  const f = fixture(); await f.controller.start(); const flow = await f.controller.beginOAuth('apple', 'http://localhost:8090');
  await f.controller.start(); expect(f.controller.getLinkSnapshot().pending?.id).toBe(flow.flowId);
  expect(f.controller.getSnapshot().status).toBe('signed_out');
  expect(await f.controller.handleCallback(flow.redirectUrl + '&code=synthetic-code')).toBe('/(tabs)'); f.controller.stop();
});
it('uses the SDK for Apple identity and binds the first-grant name to its returned user', async () => {
  const f = fixture(); await f.controller.start();
  await f.controller.signInWithApple(async () => ({ token: 'synthetic-id-token', nonce: 'synthetic-raw-nonce', displayName: 'Alex' }));
  expect(f.auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'synthetic-id-token', nonce: 'synthetic-raw-nonce' });
  expect(JSON.parse(f.store.get('test.signup-name')!)).toEqual({ userId: 'a', name: 'Alex' });
  expect([...f.store.values()].join()).not.toContain('synthetic-id-token'); f.controller.stop();
});
it('does not send a canceled or stale native credential to Supabase', async () => {
  const f = fixture(); await f.controller.start();
  await expect(f.controller.signInWithApple(async () => { throw new Error('canceled'); })).rejects.toThrow();
  let resolve!: (value: { token: string; nonce: string }) => void;
  const signIn = f.controller.signInWithApple(() => new Promise(r => { resolve = r; }));
  const logout = f.controller.signOut(); resolve({ token: 'synthetic-late-token', nonce: 'synthetic-nonce' });
  await expect(signIn).rejects.toMatchObject({ reason: 'not_ready' }); await logout;
  expect(f.auth.signInWithIdToken).not.toHaveBeenCalled(); f.controller.stop();
});
it('accepts the pinned SDK PKCE URL and removes its actual verifier on cancel', async () => {
  const store = new Map<string, string>();
  const storage = { getItem: async (k: string) => store.get(k) ?? null, setItem: async (k: string, v: string) => { store.set(k, v); }, removeItem: async (k: string) => { store.delete(k); } };
  const client = createClient('https://synthetic.supabase.co', 'sb_publishable_synthetic', {
    auth: { storage, storageKey: 'sdk-oauth', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
    global: { fetch: async () => { throw new Error('No external requests permitted.'); } },
  });
  const controller = new SessionController(() => ({ client, storage, config: { url: 'https://synthetic.supabase.co', key: 'sb_publishable_synthetic', storageKey: 'sdk-oauth' } }));
  try {
    await controller.start(); const flow = await controller.beginOAuth('google', 'http://localhost:8090');
    expect(new URL(flow.url).searchParams.get('code_challenge_method')).toBe('s256');
    expect(store.has('sdk-oauth-code-verifier')).toBe(true); await controller.cancelLink();
    expect(store.has('sdk-oauth-code-verifier')).toBe(false);
  } finally { controller.stop(); client.auth.dispose(); }
});
