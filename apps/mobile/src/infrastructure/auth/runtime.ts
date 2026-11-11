import { createClient } from '@supabase/supabase-js';
import { createApiClient } from '../api/client';
import { createAccountDataController } from '../query/account-controller';
import { nativeAuthStorage } from './platform-storage';
import { createAuthSession, type AppAuthSession } from './session';
import { guardedAuthStorage } from './storage';

function publicConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key || key.startsWith('sb_secret_')) return null;
  try {
    const u = new URL(url);
    if (url.trim() !== url || u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash || u.username || u.password) return null;
    // Legacy keys must explicitly be anon; never bundle service-role JWTs.
    if (!key.startsWith('sb_publishable_')) {
      const claims = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.role !== 'anon') return null;
    }
    return { url: u.origin, key };
  } catch { return null; }
}
/** One SDK, one session port and one account controller per running app. */
export function createAppRuntime() {
  const config = publicConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  let auth: AppAuthSession | undefined;
  const makeClient = () => config ? createClient(config.url, config.key, {
    auth: {
      storageKey: 'disconnect.auth.v1',
      storage: nativeAuthStorage ? guardedAuthStorage(nativeAuthStorage, () => auth?.storageFailed()) : undefined,
      persistSession: Boolean(nativeAuthStorage),
      autoRefreshToken: false, detectSessionInUrl: false,
    },
  }) : null;
  let sdk: ReturnType<typeof makeClient>;
  try { sdk = makeClient(); } catch { sdk = null; }
  auth = createAuthSession(sdk?.auth ?? null);
  const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL, auth });
  return { auth, sdk, api, controller: createAccountDataController(auth, api) };
}
export type AppRuntime = ReturnType<typeof createAppRuntime>;
