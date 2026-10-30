import { AuthUnavailableError } from './errors';

export interface AuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** One queue for session/verifier operations; failures don't poison later cleanup. */
export function serializeStorage(storage: AuthStorage): AuthStorage {
  let tail: Promise<unknown> = Promise.resolve();
  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const next = tail.then(work).catch(() => { throw new AuthUnavailableError('storage'); });
    tail = next.catch(() => undefined);
    return next;
  }
  return {
    getItem: key => enqueue(() => storage.getItem(key)),
    setItem: (key, value) => enqueue(() => storage.setItem(key, value)),
    removeItem: key => enqueue(() => storage.removeItem(key)),
  };
}
