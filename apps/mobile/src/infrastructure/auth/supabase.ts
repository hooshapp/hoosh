import { createClient } from '@supabase/supabase-js';

import { createAuthStorage } from './auth-storage';
import { readAuthConfig } from './config';
import { ensureAuthCrypto } from './crypto';

/** Called by controller startup. Merely constructing the app runtime is safe during export. */
export function createAuthRuntime(config: ReturnType<typeof readAuthConfig>, onStorageFailure: () => void) {
  ensureAuthCrypto();
  const { storage, storageKey } = createAuthStorage(config.storageKey, onStorageFailure);
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
  return { client, storage, config: { ...config, storageKey } };
}
export type AuthRuntime = ReturnType<typeof createAuthRuntime>;
