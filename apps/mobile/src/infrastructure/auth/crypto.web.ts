import { AuthUnavailableError } from './errors';
export function ensureAuthCrypto() {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) throw new AuthUnavailableError('configuration', false);
}
