import { requireOptionalNativeModule } from 'expo-modules-core';
import type { InstallationReview, NativeOwnerSessionPort } from './native-owner-session';

type OwnerModule = {
  beginOwnerSession(namespace: string, userID: string): Promise<string>;
  endOwnerSession(token: string): Promise<void>;
  readInstallation(namespace: string, userID: string, token: string): Promise<unknown>;
  claimInstallation(namespace: string, userID: string, token: string, revision: string, confirmed: boolean): Promise<void>;
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
  typeof module?.beginOwnerSession === 'function' && typeof module?.endOwnerSession === 'function' &&
  typeof module?.readInstallation === 'function' && typeof module?.claimInstallation === 'function' ? {
    begin: (namespace, userID) => ordered(() => module.beginOwnerSession(namespace, userID)),
    end: token => ordered(() => module.endOwnerSession(token)),
    read: (namespace, userID, token) => ordered(async () => {
      const raw = await module.readInstallation(namespace, userID, token);
      if (!raw || typeof raw !== 'object') throw new Error('Invalid installation response');
      const value = raw as Record<string, unknown>;
      if (typeof value.status !== 'string' || !['unclaimed', 'owned', 'legacy_review', 'other_owner', 'claim_pending'].includes(value.status) ||
          typeof value.revision !== 'string' || !/^(missing|[0-9]{1,20})$/.test(value.revision)) {
        throw new Error('Invalid installation response');
      }
      return value as InstallationReview;
    }),
    claim: (namespace, userID, token, revision) => ordered(() =>
      module.claimInstallation(namespace, userID, token, revision, true)),
  } : null;
