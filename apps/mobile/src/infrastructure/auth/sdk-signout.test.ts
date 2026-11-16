import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { serializeStorage } from './serialized-storage';

it('qualifies pinned SDK local removal during a failed revocation and a late refresh', async () => {
  const key = 'sdk-signout-qualification';
  const data = new Map<string, string>();
  const payload = { sub: 'user-a', session_id: 'session-a', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) };
  const access_token = `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(JSON.stringify(payload))}.c2lnbmF0dXJl`;
  const session = { access_token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, expires_at: payload.exp,
    user: { id: 'user-a', aud: 'authenticated', email: 'a@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
  data.set(key, JSON.stringify(session));
  data.set(key + '-code-verifier', JSON.stringify('synthetic-verifier'));
  let finishRefresh!: (response: Response) => void;
  let refreshStarted!: () => void;
  const started = new Promise<void>(resolve => { refreshStarted = resolve; });
  const client = createClient('https://synthetic.supabase.co', 'sb_publishable_synthetic', {
    auth: { storageKey: key, storage: serializeStorage({
      getItem: async k => data.get(k) ?? null, setItem: async (k, value) => { data.set(k, value); }, removeItem: async k => { data.delete(k); },
    }), persistSession: true, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async input => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith('/token')) { refreshStarted(); return new Promise<Response>(resolve => { finishRefresh = resolve; }); }
      if (path.endsWith('/logout')) return Response.json({ message: 'synthetic revocation outage' }, { status: 503 });
      throw new Error('Unexpected external request in deterministic SDK test.');
    } },
  });
  try {
    await client.auth.getSession();
    const refresh = client.auth.refreshSession(); await started;
    const logout = await client.auth.signOut({ scope: 'local' });
    expect(logout.error).not.toBeNull(); expect(data.has(key)).toBe(false);
    expect(data.has(key + '-code-verifier')).toBe(false);
    finishRefresh(Response.json({ ...session, access_token, refresh_token: 'synthetic-new-refresh' }));
    await refresh;
    expect(data.has(key)).toBe(false);
    expect((await client.auth.getSession()).data.session).toBeNull();
  } finally { client.auth.dispose(); }
});
