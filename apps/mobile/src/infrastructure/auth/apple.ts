import { AuthUnavailableError } from './errors';
export async function appleAvailable(): Promise<boolean> { return false; }
export async function requestAppleCredential(): Promise<{ token: string; nonce: string; displayName?: string }> {
  throw new AuthUnavailableError('configuration', false);
}
