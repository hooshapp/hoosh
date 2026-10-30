import * as Apple from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { AuthCancelledError, AuthUnavailableError } from './errors';

export const appleAvailable = () => Apple.isAvailableAsync();
export async function requestAppleCredential(): Promise<{ token: string; nonce: string; displayName?: string }> {
  if (!await appleAvailable()) throw new AuthUnavailableError('configuration', false);
  const nonce = Crypto.randomUUID(); const state = Crypto.randomUUID();
  // Expo passes this value directly to Apple. Supabase receives the raw nonce
  // and verifies its SHA-256 hash against the signed identity-token claim.
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const result = await Apple.signInAsync({ nonce: hashedNonce, state,
      requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL] });
    if (!result.identityToken || result.state !== state) throw new AuthUnavailableError('not_ready');
    const displayName = [result.fullName?.givenName, result.fullName?.familyName].filter(Boolean).join(' ').trim().slice(0, 320);
    return { token: result.identityToken, nonce, ...(displayName ? { displayName } : {}) };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') throw new AuthCancelledError();
    throw error;
  }
}
