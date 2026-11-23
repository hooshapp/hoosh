import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import { SessionController } from '../../features/auth/session-controller';
import { serializeStorage } from './serialized-storage';

it('uses the real pinned SDK for password login, rotation, storage and offline local sign-out', async () => {
  const memory = new Map<string, string>();
  const requests: string[] = [];
  let revoked = false, rotation = 0;
  const id = '00000000-0000-4000-8000-000000000001';
  const token = () => `${btoa('{}')}.${btoa(JSON.stringify({ sub: id, exp: Math.floor(Date.now() / 1000) + 3600, session_id: id }))}.fixture`;
  const storage = serializeStorage({
    getItem: async (key) => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value); },
    removeItem: async (key) => { memory.delete(key); },
  });
  const sdk = createClient('https://fixture.supabase.test', 'fixture-public-key', {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, storageKey: 'fixture-session', storage, flowType: 'pkce' },
    global: { fetch: async (input) => {
      const url = String(input); requests.push(url);
      if (url.includes('/logout')) { revoked = true; return new Response(JSON.stringify({ message: 'fixture outage' }), { status: 503, headers: { 'Content-Type': 'application/json' } }); }
      rotation++;
      return new Response(JSON.stringify({ access_token: token(), refresh_token: `fixture-refresh-${rotation}`, token_type: 'bearer', expires_in: 3600, user: { id, email: 'fixture@example.test', aud: 'authenticated', created_at: '2026-11-11T00:00:00Z' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } },
  });
  const auth = new SessionController(() => ({
    client: sdk,
    storage,
    config: { storageKey: 'fixture-session', url: 'https://fixture.supabase.test', key: 'fixture-public-key' },
  }));
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
  } finally { auth.dispose(); sdk.auth.dispose(); }
});

it('keeps logout authoritative through an in-flight real SDK refresh and a new-client restore', async () => {
  const memory = new Map<string, string>();
  const storage = serializeStorage({
    getItem: async key => memory.get(key) ?? null,
    setItem: async (key, value) => { memory.set(key, value); },
    removeItem: async key => { memory.delete(key); },
  });
  const id = '00000000-0000-4000-8000-000000000001';
  const payload = {
    access_token: `${btoa('{}')}.${btoa(JSON.stringify({ sub: id, session_id: id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.fixture`,
    refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 3600,
    user: { id, email: 'fixture@example.test', aud: 'authenticated', created_at: '2026-11-11T00:00:00Z' },
  };
  let releaseRefresh!: () => void;
  let notifyRefreshStarted!: () => void;
  const refreshStarted = new Promise<void>(resolve => { notifyRefreshStarted = resolve; });
  const refreshResponse = new Promise<void>(resolve => { releaseRefresh = resolve; });
  const makeSdk = () => createClient('https://fixture.supabase.test', 'fixture-public-key', {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: true,
      storageKey: 'fixture-race-session', storage, flowType: 'pkce' },
    global: { fetch: async input => {
      const url = String(input);
      if (url.includes('grant_type=refresh_token')) {
        notifyRefreshStarted();
        await refreshResponse;
      }
      const logout = url.includes('/logout');
      return new Response(JSON.stringify(logout ? { message: 'fixture outage' } : payload), {
        status: logout ? 503 : 200, headers: { 'Content-Type': 'application/json' },
      });
    } },
  });
  const makeController = (client: ReturnType<typeof makeSdk>) => new SessionController(() => ({
    client, storage, config: { storageKey: 'fixture-race-session',
      url: 'https://fixture.supabase.test', key: 'fixture-public-key' },
  }));
  const sdk = makeSdk();
  const auth = makeController(sdk);
  let reopenedSdk: ReturnType<typeof makeSdk> | undefined;
  let reopened: SessionController | undefined;
  try {
    await auth.start();
    await auth.signIn('fixture@example.test', 'fixture-password');
    const refresh = auth.revalidateSession();
    // Attach the rejection assertion before releasing either asynchronous task.
    const rejectedRefresh = expect(refresh).rejects.toMatchObject({ reason: 'not_ready' });
    await refreshStarted;
    const seen: string[] = [];
    auth.subscribe(() => { seen.push(auth.getSnapshot().status); });
    const logout = auth.signOut();
    expect(auth.getSnapshot().status).toBe('signing_out');
    await expect(auth.getAccessToken()).rejects.toMatchObject({ reason: 'not_ready' });
    releaseRefresh();
    await rejectedRefresh;
    await expect(logout).resolves.toEqual({ localSessionCleared: true, remoteRevocation: 'unconfirmed' });
    expect(seen).not.toContain('signed_in');
    expect(auth.getSnapshot().status).toBe('signed_out');
    expect(memory.has('fixture-race-session')).toBe(false);
    auth.dispose(); sdk.auth.dispose();

    // New SDK and controller, same persistent adapter: not merely cached logout UI.
    reopenedSdk = makeSdk();
    reopened = makeController(reopenedSdk);
    await reopened.start();
    expect(reopened.getSnapshot().status).toBe('signed_out');
    expect(await reopened.getAccessToken()).toBeNull();
    // A deliberate later login must still work after the retired refresh settles.
    await reopened.signIn('fixture@example.test', 'fixture-password');
    expect(reopened.getSnapshot()).toMatchObject({ status: 'signed_in', user: { user_id: id } });
  } finally {
    releaseRefresh();
    auth.dispose(); sdk.auth.dispose();
    reopened?.dispose(); reopenedSdk?.auth.dispose();
  }
});
