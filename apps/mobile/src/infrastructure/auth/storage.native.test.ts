import { expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { createAuthStorage } from './storage';
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
