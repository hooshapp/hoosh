import { expect, it, jest } from '@jest/globals';
import * as Crypto from 'expo-crypto';
import { ensureAuthCrypto } from './crypto';
jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomValues: jest.fn(), randomUUID: jest.fn(),
  digest: jest.fn(async () => new Uint8Array(32).buffer),
}));
it('uses Expo native randomness and SHA-256 for the SDK standard PKCE operations', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  try {
    ensureAuthCrypto();
    expect(globalThis.crypto.getRandomValues).toBe(Crypto.getRandomValues);
    const bytes = new Uint8Array([0, 1, 2, 3]).subarray(1, 3);
    await globalThis.crypto.subtle.digest('SHA-256', bytes);
    expect(Crypto.digest).toHaveBeenCalledWith(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array([1, 2]));
    await expect(globalThis.crypto.subtle.digest('MD5', bytes)).rejects.toThrow('Unsupported');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'crypto', previous);
    else Reflect.deleteProperty(globalThis, 'crypto');
  }
});
