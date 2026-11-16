import { createClient } from '@supabase/supabase-js';
import { afterEach, expect, it, vi } from 'vitest';

import { createAppRuntime, type AppAuthProducer } from './runtime';
import { createAuthSession } from './session';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
afterEach(() => vi.unstubAllEnvs());

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
