import type { ProfilePatch } from '@disconnect/contracts';

import type { AccountScope } from '@/infrastructure/query/account-scope';

export type SignupNameDraft = Readonly<{
  id: string;
  displayName: NonNullable<ProfilePatch['display_name']>;
}>;

/** Auth supplies a draft only after matching the verified account. The profile
 * editor owns review, expected_revision and the existing profile API mutation. */
export interface SignupNameHandoff {
  read(scope: AccountScope): Promise<SignupNameDraft | null>;
  clear(scope: AccountScope, draftId: string): Promise<void>;
}
