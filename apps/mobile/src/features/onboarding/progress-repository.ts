import type { PlanDraft, SettingsPatch } from '@disconnect/contracts';

import type { AccountScope } from '@/infrastructure/query/account-scope';

/** Setup progress is local to this installation and verified account. It does
 * not confer native permission or represent an installed plan. */
export type OnboardingProgress = Readonly<{
  version: 1;
  step: 'preferences' | 'plan' | 'permission' | 'review' | 'complete';
  activities?: SettingsPatch['activities'];
  planDraft?: PlanDraft | null;
  profileRevision?: number;
  settingsRevision?: number;
  permissionDeferred?: boolean;
}>;

export type OnboardingProgressRead =
  | { status: 'not_started' | 'read_failed' | 'incompatible' }
  | { status: 'found'; progress: OnboardingProgress };

/** A producer takes the current account scope so it can fence reads and writes
 * when the account or session changes. Plan 02 supplies storage and conversion. */
export interface OnboardingProgressRepository {
  read(scope: AccountScope): Promise<OnboardingProgressRead>;
  save(scope: AccountScope, progress: OnboardingProgress): Promise<void>;
  discard(scope: AccountScope): Promise<void>;
}
