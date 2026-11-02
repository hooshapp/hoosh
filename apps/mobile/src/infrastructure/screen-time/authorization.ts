import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { AuthorizationState } from '@disconnect/contracts';

interface AuthorizationModule {
  getAuthorization(): Promise<string>;
  requestAuthorization(): Promise<string>;
}
const states = new Set<AuthorizationState>(['not_requested', 'authorized', 'denied', 'revoked', 'unavailable', 'error']);
function normalize(value: string): AuthorizationState {
  return states.has(value as AuthorizationState) ? value as AuthorizationState : 'error';
}
function nativeModule(): AuthorizationModule | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  return requireOptionalNativeModule<AuthorizationModule>('HooshScreenTime');
}
export async function getScreenTimeAuthorization(): Promise<AuthorizationState> {
  const module = nativeModule();
  return module ? normalize(await module.getAuthorization()) : 'unavailable';
}
export async function requestScreenTimeAuthorization(): Promise<AuthorizationState> {
  const module = nativeModule();
  return module ? normalize(await module.requestAuthorization()) : 'unavailable';
}
