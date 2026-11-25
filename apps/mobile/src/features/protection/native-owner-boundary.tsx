import type { IOSSelectionDevice } from '@/infrastructure/native/ios-selection-device';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAccountData, useAccountQuery } from '@/infrastructure/query/account-data-provider';
import { readProfile } from '@/features/account/api';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { productNativePort, type ProductNativePort } from '@/infrastructure/native/product-ports';
import { useIdentityQuery } from '@/features/account/identity-query';
import { useAppRuntime } from '@/features/account/app-runtime-context';
import { nativeOwnerSession, type InstallationReview } from '@/infrastructure/native/native-owner-session';

export type NativeOwner = Readonly<{ owner: string; generation: number; port: ProductNativePort }>;
type InstallationSession = {
  read(): Promise<InstallationReview>;
  claim(revision: string): Promise<void>;
};
export const IOSSelectionContext = createContext<IOSSelectionDevice | null>(null);
export const useIOSSelectionDevice = () => useContext(IOSSelectionContext);
export const NativeInstallationContext = createContext<InstallationSession | null>(null);
export const useNativeInstallation = () => useContext(NativeInstallationContext);
export const NativeOwnerContext = createContext<NativeOwner | null>(null);
export const useNativeOwner = () => useContext(NativeOwnerContext);
/** SDK subject alone does not bind native writes: verify same-account /v1/me first. */
export function NativeOwnerBoundary({ children }: { children: ReactNode }) {
  const runtime = useAppRuntime();
  return runtime?.nativeNamespace && (productNativePort || nativeOwnerSession) ? (
    <VerifiedNativeOwner namespace={runtime.nativeNamespace} port={productNativePort}>{children}</VerifiedNativeOwner>
  ) : children;
}
function VerifiedNativeOwner({ namespace, port, children }: { namespace: string; port: ProductNativePort | null; children: ReactNode }) {
  const { scope } = useAccountData();
  const identity = useIdentityQuery();
  const owner = scope && identity.data?.user_id === scope.account.user_id ? `${namespace}:${scope.account.user_id}` : null;
  const scopeID = scope?.id;
  const verifiedUserID = owner ? scope?.account.user_id : undefined;
  const [session, setSession] = useState<{ scopeID: number; userID: string; token: string }>();
  useEffect(() => {
    if (!verifiedUserID || !nativeOwnerSession) return;
    const lifecycle = nativeOwnerSession;
    let disposed = false;
    let token: string | undefined;
    void lifecycle.begin(namespace, verifiedUserID).then(value => {
      if (disposed) void lifecycle.end(value).catch(() => undefined);
      else {
        token = value;
        setSession({ scopeID: scopeID!, userID: verifiedUserID, token: value });
      }
    }).catch(() => undefined); // No lease means future native writes fail closed.
    return () => {
      disposed = true;
      if (token) void lifecycle.end(token).catch(() => undefined);
    };
  }, [verifiedUserID, namespace, scopeID]);
  useEffect(() => {
    if (!owner || !port) return;
    return () => {
      // Invalidate old handles/drafts, retaining this device's installed restrictions/history.
      void Promise.allSettled([port.interventionEndOwner(owner, false), port.selectionEndOwner(owner, false)]);
    };
  }, [owner, port, scope?.id]);
  const installation = useMemo(() => {
    const lifecycle = nativeOwnerSession;
    if (!lifecycle || !session || session.scopeID !== scopeID || session.userID !== verifiedUserID) return null;
    return {
      read: () => lifecycle.read(namespace, session.userID, session.token),
      claim: (revision: string) => lifecycle.claim(namespace, session.userID, session.token, revision),
    };
  }, [session, scopeID, verifiedUserID, namespace]);
  const iosDevice = useMemo(() => {
    if (!session || !nativeOwnerSession?.device || session.scopeID !== scopeID || session.userID !== verifiedUserID) return null;
    return nativeOwnerSession.device(namespace, session.userID, session.token, scopeID!);
  }, [session, scopeID, verifiedUserID, namespace]);
  useEffect(() => {
    const scoped = iosDevice?.productPort;
    if (!scoped || !iosDevice) return;
    return () => {
      void Promise.allSettled([scoped.interventionEndOwner(iosDevice.owner, false), scoped.selectionEndOwner(iosDevice.owner, false)]);
    };
  }, [iosDevice]);
  const scopedPort = port ?? iosDevice?.productPort ?? null;
  const binding = useMemo(() => owner && scope && scopedPort ? { owner, generation: scope.account.sessionGeneration, port: scopedPort } : null, [owner, scopedPort, scope]);
  return <NativeOwnerContext.Provider value={binding}>
    <IOSSelectionContext.Provider value={iosDevice}>
      {iosDevice?.setShieldContext || binding?.port.setAndroidShieldContext ? (
        <ShieldContextSync device={iosDevice} native={binding} />
      ) : null}
    <NativeInstallationContext.Provider value={installation}>{children}</NativeInstallationContext.Provider>
    </IOSSelectionContext.Provider>
  </NativeOwnerContext.Provider>;
}

function ShieldContextSync({ device, native }: { device: IOSSelectionDevice | null; native: NativeOwner | null }) {
  const profile = useAccountQuery(['profile'], readProfile);
  const settings = useSettingsQuery();
  const name = profile.data?.profile?.display_name ?? '';
  const activity = settings.data?.settings?.activities.selected_activity_ids[0] ?? '';
  const ready = !!profile.data && !!settings.data && !profile.isError && !settings.isError;
  useEffect(() => {
    if (!ready) return;
    const write = device?.setShieldContext
      ? device.setShieldContext(name, activity)
      : native?.port.setAndroidShieldContext?.(native.owner, name, activity);
    void write?.catch(() => undefined);
  }, [activity, device, name, native, ready]);
  return null;
}
