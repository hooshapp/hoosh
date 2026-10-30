import { AuthUnavailableError } from './errors';
import { serializeStorage } from './serialized-storage';

/** One SDK broadcast channel per page instance, backed by stable tab storage.
 * This prevents SDK cross-tab broadcasts from leaking sessions between tabs
 * while preserving verifier/session continuity after a same-tab callback reload. */
export function createAuthStorage(namespace: string) {
  const storageKey = `${namespace}.${globalThis.crypto.randomUUID()}`;
  function store() {
    if (typeof window === 'undefined') throw new AuthUnavailableError('storage');
    return window.sessionStorage;
  }
  function physicalKey(key: string) {
    if (!key.startsWith(storageKey)) throw new AuthUnavailableError('storage');
    return namespace + key.slice(storageKey.length);
  }
  const storage = serializeStorage({
    getItem: async key => store().getItem(physicalKey(key)),
    setItem: async (key, value) => { store().setItem(physicalKey(key), value); },
    removeItem: async key => { store().removeItem(physicalKey(key)); },
  });
  return { storage, storageKey };
}
