import { requireOptionalNativeModule } from 'expo-modules-core';
import type { NativeOwnerSessionPort } from './native-owner-session';

type OwnerModule = {
  beginOwnerSession(namespace: string, userID: string): Promise<string>;
  endOwnerSession(token: string): Promise<void>;
};
const module = requireOptionalNativeModule<OwnerModule>('HooshScreenTime');
// Serialize lifecycle requests even across account boundary remounts. Cleanup is
// token-specific, so a late old cleanup cannot revoke a newer account's lease.
let pending: Promise<unknown> = Promise.resolve();
function ordered<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation, operation);
  pending = result.catch(() => undefined);
  return result;
}
export const nativeOwnerSession: NativeOwnerSessionPort | null =
  module?.beginOwnerSession && module?.endOwnerSession ? {
    begin: (namespace, userID) => ordered(() => module.beginOwnerSession(namespace, userID)),
    end: token => ordered(() => module.endOwnerSession(token)),
  } : null;
