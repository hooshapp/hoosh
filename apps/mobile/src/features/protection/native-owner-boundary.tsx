import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { productNativePort, type ProductNativePort } from '@/infrastructure/native/product-ports';
import { useIdentityQuery } from '@/features/account/identity-query';
import { useAppRuntime } from '@/features/account/app-runtime-context';

export type NativeOwner = Readonly<{ owner: string; generation: number; port: ProductNativePort }>;
export const NativeOwnerContext = createContext<NativeOwner | null>(null);
export const useNativeOwner = () => useContext(NativeOwnerContext);
/** SDK subject alone does not bind native writes: verify same-account /v1/me first. */
export function NativeOwnerBoundary({ children }: { children: ReactNode }) {
  const runtime = useAppRuntime();
  return runtime?.nativeNamespace && productNativePort ? (
    <VerifiedNativeOwner namespace={runtime.nativeNamespace} port={productNativePort}>{children}</VerifiedNativeOwner>
  ) : children;
}
function VerifiedNativeOwner({ namespace, port, children }: { namespace: string; port: ProductNativePort; children: ReactNode }) {
  const { scope } = useAccountData();
  const identity = useIdentityQuery();
  const owner = scope && identity.data?.user_id === scope.account.user_id ? `${namespace}:${scope.account.user_id}` : null;
  useEffect(() => {
    if (!owner) return;
    return () => {
      // Invalidate old handles/drafts, retaining this device's installed restrictions/history.
      void Promise.allSettled([port.interventionEndOwner(owner, false), port.selectionEndOwner(owner, false)]);
    };
  }, [owner, port, scope?.id]);
  const binding = useMemo(() => owner && scope ? { owner, generation: scope.account.sessionGeneration, port } : null, [owner, port, scope]);
  return <NativeOwnerContext.Provider value={binding}>{children}</NativeOwnerContext.Provider>;
}
