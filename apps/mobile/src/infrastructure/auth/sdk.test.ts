import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { createAuthSession } from './session';

it('uses the real pinned SDK for password login, rotation, storage and offline local sign-out', async () => {
  const memory = new Map<string, string>();
  const requests: string[] = [];
  let revoked = false, rotation = 0;
  const id = '00000000-0000-4000-8000-000000000001';
  const token = () => `${btoa('{}')}.${btoa(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, session_id: id }))}.fixture`;
  const sdk = createClient('https://fixture.supabase.test', 'fixture-public-key', {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, storageKey: 'fixture-session', storage: {
      getItem: async (key) => memory.get(key) ?? null,
      setItem: async (key, value) => { memory.set(key, value); },
      removeItem: async (key) => { memory.delete(key); },
    } },
    global: { fetch: async (input) => {
      const url = String(input); requests.push(url);
      if (url.includes('/logout')) { revoked = true; return new Response(JSON.stringify({ message: 'fixture outage' }), { status: 503, headers: { 'Content-Type': 'application/json' } }); }
      rotation++;
      return new Response(JSON.stringify({ access_token: token(), refresh_token: `fixture-refresh-${rotation}`, token_type: 'bearer', expires_in: 3600, user: { id, email: 'fixture@example.test', aud: 'authenticated', created_at: '2026-11-11T00:00:00Z' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  const auth = createAuthSession(sdk.auth);
  try {
    await auth.start(); expect(auth.getSnapshot().status).toBe('signed_out');
    await auth.signIn('fixture@example.test', 'fixture-password');
    expect(auth.getSnapshot()).toMatchObject({ status: 'signed_in', user: { user_id: id } });
    expect(memory.size).toBeGreaterThan(0);
    const generation = auth.getSnapshot().sessionGeneration;
    await auth.revalidateSession();
    expect(auth.getSnapshot().sessionGeneration).toBe(generation);
    expect(requests.some((path) => path.includes('grant_type=refresh_token'))).toBe(true);
    const result = await auth.signOut();
    expect(result).toEqual({ localSessionCleared: true, remoteRevocation: 'unconfirmed' });
    expect(revoked).toBe(true); expect(memory.has('fixture-session')).toBe(false);
    expect(await auth.getAccessToken()).toBeNull();
  } finally { auth.dispose(); sdk.auth.stopAutoRefresh(); }
});
