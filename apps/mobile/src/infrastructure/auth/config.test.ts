import { expect, it } from 'vitest';
import { readAuthConfig } from './config';

it('rejects missing, private, malformed and embedded-credential settings without leaking them', () => {
  for (const [url, key] of [[undefined, undefined], ['https://example.supabase.co', 'sb_secret_private'], ['https://example.supabase.co', 'eyJlegacy'], ['http://remote.example', 'sb_publishable_test'], ['https://person:password@example.test', 'sb_publishable_test']]) {
    expect(() => readAuthConfig(url, key)).toThrow('Authentication is unavailable (configuration).');
  }
});
it('namespaces credentials by project host and supports explicit local development', () => {
  const a = readAuthConfig('https://one.supabase.co', 'sb_publishable_test');
  const b = readAuthConfig('https://two.supabase.co', 'sb_publishable_test');
  expect(a.storageKey).not.toBe(b.storageKey);
  expect(readAuthConfig('http://127.0.0.1:54321', 'sb_publishable_test').url).toBe('http://127.0.0.1:54321');
});
