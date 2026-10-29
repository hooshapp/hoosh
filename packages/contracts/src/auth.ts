/** Supabase is the only credential/session owner. UUIDs, never email, identify accounts. */
export interface AuthIdentity {
  readonly user_id: string;
  readonly email: string | null;
}

export type AuthCredentialStatus = 'ready' | 'refreshing' | 'unavailable';
export type AuthBootstrapUnavailableReason = 'configuration' | 'storage' | 'bootstrap';

/**
 * Safe UI state: no access/refresh tokens. Auth alone advances sessionGeneration
 * on account/session replacement or sign-out intent, never on routine refresh.
 * Treat snapshots as immutable; getSnapshot returns the same object until a change.
 */
export type AuthSnapshot =
  | { readonly status: 'bootstrapping'; readonly sessionGeneration: number }
  | { readonly status: 'signed_out'; readonly sessionGeneration: number }
  | {
      readonly status: 'signed_in';
      readonly sessionGeneration: number;
      readonly user: AuthIdentity;
      readonly credentialStatus: AuthCredentialStatus;
    }
  | { readonly status: 'signing_out'; readonly sessionGeneration: number }
  | {
      readonly status: 'unavailable';
      readonly sessionGeneration: number;
      readonly reason: AuthBootstrapUnavailableReason;
      readonly retryable: boolean;
    };

/**
 * null means known signed-out state only. Other failures reject with a typed
 * AuthUnavailableError. Consumers check account/generation before AND after token
 * acquisition and before adopting a response; the provider does not own UI caches.
 */
export type AccessTokenProvider = () => Promise<string | null>;

/** Structural error contract; the auth implementation supplies its runtime class. */
export interface AuthUnavailableError extends Error {
  readonly name: 'AuthUnavailableError';
  readonly reason: 'not_ready' | 'configuration' | 'storage' | 'refresh';
  readonly retryable: boolean;
}

/**
 * Framework-independent external store, implemented by Anisha in AUTH-02.
 * Functions are stable/bound; subscribe returns an idempotent unsubscribe.
 * Notifications follow a snapshot change; callbacks never contain raw sessions.
 */
export interface AuthSessionPort {
  readonly getSnapshot: () => AuthSnapshot;
  readonly subscribe: (onStoreChange: () => void) => () => void;
  readonly getAccessToken: AccessTokenProvider;
  /** Single-flight; re-read the snapshot on completion. Rejects if unavailable. */
  readonly revalidateSession: () => Promise<void>;
}

/** A resolved sign-out guarantees local credential erasure, not universal JWT revocation. */
export interface SignOutResult {
  readonly localSessionCleared: true;
  readonly remoteRevocation: 'confirmed' | 'unconfirmed' | 'not_needed';
}

/** AUTH-07 supplies account actions separately from AUTH-02's session producer. */
export interface AuthAccountActions {
  /**
   * Current device/session only. Invalidate private work at intent, before I/O.
   * Local storage failure rejects with AuthUnavailableError(reason: 'storage');
   * keep private UI locked until recovery. Never clear native restrictions here.
   */
  readonly signOut: () => Promise<SignOutResult>;
}
