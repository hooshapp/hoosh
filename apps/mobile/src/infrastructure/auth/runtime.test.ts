import { createClient } from '@supabase/supabase-js';
import { afterEach, expect, it, vi } from 'vitest';

import { createAppRuntime, type AppAuthProducer } from './runtime';
import { createAuthSession } from './session';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('./auth-storage', () => ({
  createAuthStorage: (storageKey: string) => ({
    storageKey,
    storage: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
  }),
}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it('uses the supplied session and lifecycle without constructing a default SDK', () => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  const producer = {
    auth: createAuthSession(null),
    setForeground: vi.fn(),
    canClearSession: false,
    nativeNamespace: 'fixture',
  } satisfies AppAuthProducer;

  const runtime = createAppRuntime(producer);
  expect(createClient).not.toHaveBeenCalled();
  expect(runtime.auth).toBe(producer.auth);
  expect(runtime.setForeground).toBe(producer.setForeground);
  expect(runtime.nativeNamespace).toBe('fixture');
});

it('creates one SDK on startup and retires its listener before remounting', async () => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  const unsubscribe = vi.fn();
  const sdk = {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      startAutoRefresh: vi.fn(async () => undefined),
      stopAutoRefresh: vi.fn(async () => undefined),
    },
  };
  vi.mocked(createClient).mockImplementation(() => sdk as unknown as ReturnType<typeof createClient>);
  const runtime = createAppRuntime();
  expect(createClient).not.toHaveBeenCalled();
  expect(runtime.nativeNamespace).toBe('fixture');
  await runtime.auth.start();
  expect(runtime.auth.getSnapshot().status).toBe('signed_out');
  runtime.setForeground(true);
  expect(sdk.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
  runtime.auth.dispose();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  await runtime.auth.start();
  expect(createClient).toHaveBeenCalledTimes(1);
  expect(sdk.auth.onAuthStateChange).toHaveBeenCalledTimes(2);
  runtime.auth.dispose();
  expect(unsubscribe).toHaveBeenCalledTimes(2);
});

it('reports missing configuration without creating an SDK', async () => {
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  const runtime = createAppRuntime();
  await runtime.auth.start();
  expect(runtime.auth.getSnapshot()).toMatchObject({ status: 'unavailable', reason: 'configuration' });
  expect(runtime.canClearSession).toBe(false);
  expect(createClient).not.toHaveBeenCalled();
  runtime.auth.dispose();
});
