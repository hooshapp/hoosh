import * as SecureStore from 'expo-secure-store';
import { serializeStorage } from './serialized-storage';

// Credentials never share the Screen Time App Group or plaintext AsyncStorage.
// This device-only accessibility policy must be validated in signed builds.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  requireAuthentication: false,
};
export function createAuthStorage(storageKey: string) {
  const storage = serializeStorage({
    getItem: key => SecureStore.getItemAsync(key, options),
    setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
    removeItem: key => SecureStore.deleteItemAsync(key, options),
  });
  return { storage, storageKey };
}
