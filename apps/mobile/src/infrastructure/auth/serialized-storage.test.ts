import { expect, it } from 'vitest';
import { serializeStorage } from './serialized-storage';

it('orders a pending write before removal and does not resurrect it', async () => {
  const data = new Map<string, string>();
  let release!: () => void;
  const storage = serializeStorage({
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => { await new Promise<void>(resolve => { release = resolve; }); data.set(key, value); },
    removeItem: async key => { data.delete(key); },
  });
  const write = storage.setItem('session', 'synthetic-session');
  const remove = storage.removeItem('session');
  await Promise.resolve(); release();
  await Promise.all([write, remove]);
  expect(await storage.getItem('session')).toBeNull();
});
it('sanitizes storage failures and still allows a later removal', async () => {
  const storage = serializeStorage({
    getItem: async () => null,
    setItem: async () => { throw new Error('synthetic-sensitive-value'); },
    removeItem: async () => undefined,
  });
  await expect(storage.setItem('key', 'value')).rejects.toThrow('Authentication is unavailable (storage).');
  await expect(storage.removeItem('key')).resolves.toBeUndefined();
});
