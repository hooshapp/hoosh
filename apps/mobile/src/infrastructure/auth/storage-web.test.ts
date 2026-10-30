import { afterEach, expect, it, vi } from 'vitest';
import { createAuthStorage } from './storage.web';

afterEach(() => vi.unstubAllGlobals());
it('never touches browser storage during SSR construction and fails closed on access', async () => {
  const { storage, storageKey } = createAuthStorage('project');
  await expect(storage.getItem(storageKey)).rejects.toMatchObject({ reason: 'storage' });
});
it('preserves same-tab sessions across SDK instances with distinct broadcast channels', async () => {
  const data = new Map<string, string>();
  vi.stubGlobal('window', { sessionStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => data.delete(key),
  } });
  const a = createAuthStorage('project-a'); const reload = createAuthStorage('project-a'); const b = createAuthStorage('project-b');
  expect(a.storageKey).not.toBe(reload.storageKey);
  await a.storage.setItem(a.storageKey, 'synthetic-session');
  await a.storage.setItem(a.storageKey + '-code-verifier', 'synthetic-verifier');
  expect(await reload.storage.getItem(reload.storageKey)).toBe('synthetic-session');
  expect(await reload.storage.getItem(reload.storageKey + '-code-verifier')).toBe('synthetic-verifier');
  expect(await b.storage.getItem(b.storageKey)).toBeNull();
  await reload.storage.removeItem(reload.storageKey);
  expect(await a.storage.getItem(a.storageKey)).toBeNull();
});
it('propagates disabled storage instead of using a memory/plaintext fallback', async () => {
  vi.stubGlobal('window', { get sessionStorage() { throw new Error('blocked'); } });
  const { storage, storageKey } = createAuthStorage('project');
  await expect(storage.setItem(storageKey, 'synthetic-session')).rejects.toMatchObject({ reason: 'storage' });
});
