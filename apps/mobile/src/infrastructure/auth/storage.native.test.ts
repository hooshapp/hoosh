import { expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { createAuthStorage } from './auth-storage';
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 123,
  getItemAsync: jest.fn(async () => 'synthetic-session'),
  setItemAsync: jest.fn(async () => undefined), deleteItemAsync: jest.fn(async () => undefined),
}));
it('uses device-only SecureStore for credentials without an App Group/plaintext fallback', async () => {
  const { storage, storageKey } = createAuthStorage('project-session');
  await storage.setItem(storageKey, 'synthetic-session');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('project-session', 'synthetic-session', { keychainAccessible: 123, requireAuthentication: false });
  expect(await storage.getItem(storageKey)).toBe('synthetic-session');
  await storage.removeItem(storageKey);
  expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
});
it('fails visibly when SecureStore rejects realistic or large payloads', async () => {
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('platform rejected payload'));
  const { storage, storageKey } = createAuthStorage('project-session');
  await expect(storage.setItem(storageKey, 'x'.repeat(4096))).rejects.toMatchObject({ reason: 'storage' });
});


it('clears and checks only the old shared app credential keys during explicit sign-out', async () => {
  const get = jest.mocked(SecureStore.getItemAsync);
  get.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
  await createAuthStorage('project-session').clearLegacySession();
  const keys = ['disconnect.auth.v1', 'disconnect.auth.v1-code-verifier', 'disconnect.auth.v1-user'];
  expect(jest.mocked(SecureStore.deleteItemAsync).mock.calls.map(([key]) => key)).toEqual(keys);
  expect(get.mock.calls.map(([key]) => key)).toEqual(keys);
});
