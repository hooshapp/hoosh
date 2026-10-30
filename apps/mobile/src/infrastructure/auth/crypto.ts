import * as Crypto from 'expo-crypto';
import { AuthUnavailableError } from './errors';

/** Supply the standard operations required by Supabase PKCE using Expo's native
 * cryptography. No plaintext PKCE fallback or application encryption scheme. */
export function ensureAuthCrypto() {
  if (typeof TextEncoder !== 'function') throw new AuthUnavailableError('configuration', false);
  const current = globalThis.crypto ?? {};
  if (!('getRandomValues' in current)) Object.defineProperty(current, 'getRandomValues', { value: Crypto.getRandomValues });
  if (!('randomUUID' in current)) Object.defineProperty(current, 'randomUUID', { value: Crypto.randomUUID });
  if (!('subtle' in current)) Object.defineProperty(current, 'subtle', { value: {
    digest: async (algorithm: string | { name: string }, data: BufferSource) => {
      if ((typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase() !== 'SHA-256') throw new Error('Unsupported authentication digest.');
      const bytes = ArrayBuffer.isView(data) ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength) : new Uint8Array(data);
      return Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
    },
  } });
  if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: current, configurable: true });
}
