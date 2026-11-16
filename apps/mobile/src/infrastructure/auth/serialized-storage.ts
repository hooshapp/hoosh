import { AuthUnavailableError } from './errors';

export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** One queue for session/verifier operations; failures don't poison later cleanup. */
export function serializeStorage(storage: AuthStorage, onFailure?: (key: string) => void): AuthStorage {
  let tail: Promise<unknown> = Promise.resolve();
  function enqueue<T>(key: string, work: () => Promise<T>): Promise<T> {
    const next = tail.then(work).catch(() => {
      onFailure?.(key);
      throw new AuthUnavailableError('storage');
    });
    tail = next.catch(() => undefined);
    return next;
  }
  return {
    getItem: key => enqueue(key, () => storage.getItem(key)),
    setItem: (key, value) => enqueue(key, () => storage.setItem(key, value)),
    removeItem: key => enqueue(key, () => storage.removeItem(key)),
  };
}
