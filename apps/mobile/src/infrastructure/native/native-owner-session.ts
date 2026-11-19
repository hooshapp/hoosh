export type InstallationReview = {
  status: 'unclaimed' | 'owned' | 'legacy_review' | 'other_owner' | 'claim_pending';
  revision: string;
};
/** Lifecycle support is separate from the full selection/protection product port. */
export type NativeOwnerSessionPort = {
  begin(namespace: string, userID: string): Promise<string>;
  end(token: string): Promise<void>;
  read(namespace: string, userID: string, token: string): Promise<InstallationReview>;
  claim(namespace: string, userID: string, token: string, revision: string): Promise<void>;
};
export const nativeOwnerSession: NativeOwnerSessionPort | null = null;
