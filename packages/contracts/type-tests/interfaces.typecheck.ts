/** Compile-only consumer scenarios. Never import this file from the application. */
import type {
  AuthAccountActions,
  AuthIdentity,
  AuthSessionPort,
  AuthSnapshot,
  AuthUnavailableError,
  NativeProtectionStatus,
  ProtectionIntegration,
  ProtectionService,
} from '@disconnect/contracts';

function unreachable(value: never): never {
  throw new Error(`Unhandled contract state: ${String(value)}`);
}

/** A screen must handle every bootstrap/account state before reading identity. */
export function accountLabel(snapshot: AuthSnapshot): string {
  switch (snapshot.status) {
    case 'bootstrapping':
      return 'Loading account';
    case 'signed_out':
      // @ts-expect-error Signed-out state cannot expose a previous account.
      snapshot.user;
      return 'Sign in';
    case 'signed_in':
      // @ts-expect-error Credentials never belong in an observable snapshot.
      snapshot.accessToken;
      return snapshot.user.email ?? 'Your account';
    case 'signing_out':
      return 'Signing out';
    case 'unavailable':
      return snapshot.retryable ? 'Retry account setup' : 'Account unavailable';
    default:
      return unreachable(snapshot);
  }
}

/** An in-flight consumer captures identity AND generation, then checks both. */
export function stillCurrent(
  auth: AuthSessionPort,
  captured: Extract<AuthSnapshot, { status: 'signed_in' }>,
): boolean {
  const latest = auth.getSnapshot();
  return (
    latest.status === 'signed_in' &&
    latest.sessionGeneration === captured.sessionGeneration &&
    latest.user.user_id === captured.user.user_id
  );
}

export function subscribeToAccount(auth: AuthSessionPort, notify: () => void): () => void {
  const unsubscribe: () => void = auth.subscribe(notify);
  const token: Promise<string | null> = auth.getAccessToken();
  const revalidation: Promise<void> = auth.revalidateSession();
  void token;
  void revalidation;
  return unsubscribe;
}

export function cannotEditIdentity(user: AuthIdentity, snapshot: AuthSnapshot): void {
  // @ts-expect-error RN observes Auth's generation; it cannot increment it.
  snapshot.sessionGeneration += 1;
  // @ts-expect-error Email updates belong to Auth, not a local UI mutation.
  user.email = 'another@example.invalid';
}

export async function accountActions(actions: AuthAccountActions): Promise<string> {
  const result = await actions.signOut();
  const erased: true = result.localSessionCleared;
  return `${erased}:${result.remoteRevocation}`;
}

export function unavailableLabel(error: AuthUnavailableError): string {
  const name: 'AuthUnavailableError' = error.name;
  return `${name}:${error.reason}:${error.retryable}`;
}

/** A bridge can be connected while permission is denied; only the adapter knows. */
export async function protectionLabel(integration: ProtectionIntegration): Promise<string> {
  switch (integration.availability) {
    case 'not_connected':
    case 'unsupported':
      // @ts-expect-error Unavailable integrations cannot supply a successful service.
      integration.service;
      return integration.reason;
    case 'connected': {
      const status = await integration.service.getStatus();
      if (status.state === 'active') {
        const authorized: 'authorized' = status.authorization;
        const installed: number = status.installedRevision;
        return `${authorized}:${installed}`;
      }
      return status.state;
    }
    default:
      return unreachable(integration);
  }
}

// @ts-expect-error Denied permission cannot be represented as installed active protection.
export const impossibleStatus: NativeProtectionStatus = { state: 'active', authorization: 'denied', installedRevision: 1, installedReasonIds: [] };

declare const nativeService: ProtectionService;

// @ts-expect-error A browser preview cannot claim an iOS/Android bridge connection.
export const impossibleWebBridge: ProtectionIntegration = { availability: 'connected', platform: 'web', service: nativeService };
