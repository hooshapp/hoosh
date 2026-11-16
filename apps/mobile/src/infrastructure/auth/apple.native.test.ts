import { beforeEach, expect, it, jest } from '@jest/globals';
import * as Apple from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { requestAppleCredential } from './apple.ios';
jest.mock('expo-apple-authentication', () => ({
  isAvailableAsync: jest.fn(), signInAsync: jest.fn(), AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(), digestStringAsync: jest.fn(), CryptoDigestAlgorithm: { SHA256: 'SHA-256' } }));
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(Apple.isAvailableAsync).mockResolvedValue(true);
  jest.mocked(Crypto.randomUUID).mockReturnValueOnce('synthetic-raw-nonce').mockReturnValueOnce('synthetic-state');
  jest.mocked(Crypto.digestStringAsync).mockResolvedValue('synthetic-hash');
});
it('hashes the nonce for Apple, checks state, and returns the raw nonce only for SDK validation', async () => {
  jest.mocked(Apple.signInAsync).mockResolvedValue({ identityToken: 'synthetic-token', state: 'synthetic-state', fullName: { givenName: 'Alex', familyName: 'Example' } } as Apple.AppleAuthenticationCredential);
  expect(await requestAppleCredential()).toEqual({ token: 'synthetic-token', nonce: 'synthetic-raw-nonce', displayName: 'Alex Example' });
  expect(Crypto.digestStringAsync).toHaveBeenCalledWith(Crypto.CryptoDigestAlgorithm.SHA256, 'synthetic-raw-nonce');
  expect(Apple.signInAsync).toHaveBeenCalledWith({ nonce: 'synthetic-hash', state: 'synthetic-state', requestedScopes: [0, 1] });
});
it('allows a repeat grant with no name or email', async () => {
  jest.mocked(Apple.signInAsync).mockResolvedValue({ identityToken: 'synthetic-token', state: 'synthetic-state', fullName: null, email: null } as Apple.AppleAuthenticationCredential);
  expect(await requestAppleCredential()).toEqual({ token: 'synthetic-token', nonce: 'synthetic-raw-nonce' });
});
it.each([
  { identityToken: null, state: 'synthetic-state' },
  { identityToken: 'synthetic-token', state: 'unexpected-state' },
])('rejects incomplete or mismatched native credentials', async result => {
  jest.mocked(Apple.signInAsync).mockResolvedValue(result as Apple.AppleAuthenticationCredential);
  await expect(requestAppleCredential()).rejects.toMatchObject({ reason: 'not_ready' });
});
it('treats system-sheet cancellation as a retryable neutral outcome', async () => {
  jest.mocked(Apple.signInAsync).mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
  await expect(requestAppleCredential()).rejects.toMatchObject({ name: 'AuthCancelledError' });
});
