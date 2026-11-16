import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { createAuthStorage } from './auth-storage';
import { readAuthConfig } from './config';
import { ensureAuthCrypto } from './crypto';

/** Called by controller startup. Merely constructing the app runtime is safe during export. */
export function createAuthRuntime(config: ReturnType<typeof readAuthConfig>, onStorageFailure: () => void): AuthRuntime {
  ensureAuthCrypto();
  const adapter = createAuthStorage(config.storageKey, key => {
    if (!key.includes('.signup-name.')) onStorageFailure();
  });
  const { storage, storageKey } = adapter;
  const client = createClient(config.url, config.key, {
    auth: {
      storage,
      storageKey,
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      async fetch(input, init) {
        const timeout = new AbortController();
        const abort = () => timeout.abort();
        const timer = setTimeout(abort, 15000);
        if (init?.signal?.aborted) abort();
        init?.signal?.addEventListener('abort', abort, { once: true });
        try {
          return await fetch(input, { ...init, signal: timeout.signal });
        } finally {
          clearTimeout(timer);
          init?.signal?.removeEventListener('abort', abort);
        }
      },
    },
  });
  return { ...adapter, client, config: { ...config, storageKey } };
}
export type AuthRuntime = {
  client: Pick<SupabaseClient, 'auth'>;
  storage: ReturnType<typeof createAuthStorage>['storage'];
  config: ReturnType<typeof readAuthConfig>;
  clearLegacySession?: () => Promise<void>;
};
