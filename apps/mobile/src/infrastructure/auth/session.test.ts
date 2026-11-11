import { describe, expect, it, vi } from 'vitest';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { createAuthSession } from './session';
import { guardedAuthStorage } from './storage';

const A = '00000000-0000-4000-8000-000000000001';
const B = '00000000-0000-4000-8000-000000000002';
const session = (id = A, access_token = 'private-fixture') => ({ access_token, user: { id, email: 'fixture@example.test' } }) as Session;
function setup(initial: Session | null = session()) {
  let stored = initial;
  let listener: ((event: string, value: Session | null) => void) | undefined;
  const sdk = {
    getSession: vi.fn(async () => ({ data: { session: stored }, error: null })),
    onAuthStateChange: vi.fn((fn) => { listener = fn; return { data: { subscription: { unsubscribe: () => { listener = undefined; } } } }; }),
    refreshSession: vi.fn(async () => ({ data: { session: stored }, error: null })),
    signInWithPassword: vi.fn(async () => { stored = session(); listener?.('SIGNED_IN', stored); return { data: { session: stored }, error: null }; }),
    signOut: vi.fn(async () => { stored = null; listener?.('SIGNED_OUT', null); return { error: null }; }),
  };
  const auth = createAuthSession(sdk as unknown as SupabaseClient['auth']);
  return { sdk, auth, emit: (value: Session | null, event = 'SIGNED_IN') => { stored = value; listener?.(event, value); } };
}
describe('SDK session projection', () => {
  it('fails closed without configuration', async () => {
    const auth = createAuthSession(null);
    await auth.start();
    expect(auth.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'configuration' });
    await expect(auth.getAccessToken()).rejects.toMatchObject({ name: 'AuthUnavailableError' });
  });
  it('bootstraps only safe immutable identity, never tokens', async () => {
    const { auth } = setup();
    await auth.start();
    expect(auth.getSnapshot()).toMatchObject({ status: 'signed_in', user: { user_id: A } });
    expect(JSON.stringify(auth.getSnapshot())).not.toContain('private-fixture');
    expect(Object.isFrozen(auth.getSnapshot())).toBe(true);
    expect(await auth.getAccessToken()).toBe('private-fixture');
  });
  it('returns null only for known signed-out state', async () => {
    const { auth } = setup(null);
    await expect(auth.getAccessToken()).rejects.toMatchObject({ reason: 'not_ready' });
    await auth.start();
    expect(await auth.getAccessToken()).toBeNull();
  });
  it('does not advance generation on refresh or duplicate signed-in events', async () => {
    const { auth, emit } = setup(); await auth.start();
    const generation = auth.getSnapshot().sessionGeneration;
    emit(session(A, 'rotated'), 'TOKEN_REFRESHED'); emit(session(A, 'rotated'));
    expect(auth.getSnapshot().sessionGeneration).toBe(generation);
    expect(await auth.getAccessToken()).toBe('rotated');
  });
  it('advances generation when switching accounts', async () => {
    const { auth, emit } = setup(); await auth.start();
    const generation = auth.getSnapshot().sessionGeneration;
    emit(session(B));
    expect(auth.getSnapshot()).toMatchObject({ user: { user_id: B }, sessionGeneration: generation + 1 });
  });
  it('suppresses tokens acquired across an account switch', async () => {
    const { auth, sdk, emit } = setup(); await auth.start();
    let release!: (value: Awaited<ReturnType<typeof sdk.getSession>>) => void;
    sdk.getSession.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const token = auth.getAccessToken();
    emit(session(B)); release({ data: { session: session() }, error: null });
    await expect(token).rejects.toMatchObject({ reason: 'not_ready' });
  });
  it('single-flights refresh without changing generation', async () => {
    const { auth, sdk } = setup(); await auth.start();
    const first = auth.revalidateSession(), second = auth.revalidateSession();
    expect(first).toBe(second); await first;
    expect(sdk.refreshSession).toHaveBeenCalledTimes(1);
    expect(auth.getSnapshot()).toMatchObject({ credentialStatus: 'ready', sessionGeneration: 1 });
  });
  it('masks access on refresh failure and permits deliberate retry', async () => {
    const { auth, sdk } = setup(); await auth.start();
    sdk.refreshSession.mockRejectedValueOnce(new Error('private network details'));
    await expect(auth.revalidateSession()).rejects.toMatchObject({ reason: 'refresh' });
    expect(auth.getSnapshot()).toMatchObject({ credentialStatus: 'unavailable' });
    await auth.revalidateSession();
    expect(auth.getSnapshot()).toMatchObject({ credentialStatus: 'ready' });
  });
  it('invalidates at sign-out intent before SDK I/O', async () => {
    const { auth, sdk } = setup(); await auth.start();
    let finish!: () => void;
    sdk.signOut.mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve({ error: null }); }));
    const result = auth.signOut();
    expect(auth.getSnapshot()).toMatchObject({ status: 'signing_out', sessionGeneration: 2 });
    await expect(auth.getAccessToken()).rejects.toMatchObject({ reason: 'not_ready' });
    sdk.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    finish(); await result;
    expect(auth.getSnapshot().status).toBe('signed_out');
  });
  it('locks rather than report sign-out success if erasure failed', async () => {
    const { auth, sdk } = setup(); await auth.start();
    sdk.signOut.mockRejectedValueOnce(new Error('secure storage'));
    await expect(auth.signOut()).rejects.toMatchObject({ reason: 'storage' });
    expect(auth.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'storage' });
  });
  it('does not let SDK events unlock a storage failure', async () => {
    const { auth, emit } = setup(); await auth.start();
    auth.storageFailed(); emit(session());
    expect(auth.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'storage' });
    await auth.signOut();
    expect(auth.getSnapshot().status).toBe('signed_out');
  });
  it('uses SDK password sign-in and clears safe signed-out state', async () => {
    const { auth, sdk } = setup(null); await auth.start();
    await auth.signIn(' fixture@example.test ', 'do-not-log');
    expect(sdk.signInWithPassword).toHaveBeenCalledWith({ email: 'fixture@example.test', password: 'do-not-log' });
    expect(auth.getSnapshot().status).toBe('signed_in');
  });
  it('unsubscribes idempotently and can restart after React effect cleanup', async () => {
    const { auth, sdk } = setup(); await auth.start(); auth.dispose(); auth.dispose(); await auth.start();
    expect(sdk.onAuthStateChange).toHaveBeenCalledTimes(2);
    expect(auth.getSnapshot().status).toBe('signed_in');
  });
  it.each(['getItem', 'setItem', 'removeItem'] as const)('locks on %s storage failure without leaking details', async (method) => {
    const failed = vi.fn();
    const storage = guardedAuthStorage({ getItem: async () => { throw new Error('secret'); }, setItem: async () => { throw new Error('secret'); }, removeItem: async () => { throw new Error('secret'); } }, failed);
    await expect(storage[method]('key', 'value')).rejects.toThrow('Secure session storage is unavailable.');
    expect(failed).toHaveBeenCalledTimes(1);
  });
});
