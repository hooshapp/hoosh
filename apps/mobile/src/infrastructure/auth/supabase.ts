import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { callbackBase, readAuthConfig } from './config';
import { ensureAuthCrypto } from './crypto';
import { createAuthStorage } from './storage';

export function createAuthRuntime() {
  const config = readAuthConfig(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  callbackBase(Platform.OS === 'web' ? (typeof window === 'undefined' ? '' : window.location.origin) : undefined);
  ensureAuthCrypto();
  const { storage, storageKey } = createAuthStorage(config.storageKey);
  config.storageKey = storageKey;
  const client = createClient(config.url, config.key, {
    auth: {
      storage, storageKey: config.storageKey, flowType: 'pkce',
      persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      // Pinned 2.118 uses its own refresh single-flight and session commit guard.
      // No legacy custom processLock. AppState owns start/stopAutoRefresh.
      debug: false,
    },
    global: {
      fetch: async (input, init) => {
        const timeout = new AbortController();
        const timer = setTimeout(() => timeout.abort(), 15000);
        const abort = () => timeout.abort();
        if (init?.signal?.aborted) timeout.abort();
        init?.signal?.addEventListener('abort', abort, { once: true });
        try { return await fetch(input, { ...init, signal: timeout.signal }); }
        finally { clearTimeout(timer); init?.signal?.removeEventListener('abort', abort); }
      },
    },
  });
  return { client, storage, config };
}
export type AuthRuntime = ReturnType<typeof createAuthRuntime>;
