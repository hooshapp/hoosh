/** Type-only public boundary; import every export with `import type`. */
export type {
  AccessTokenProvider,
  AuthAccountActions,
  AuthBootstrapUnavailableReason,
  AuthCredentialStatus,
  AuthIdentity,
  AuthSessionPort,
  AuthSnapshot,
  AuthUnavailableError,
  SignOutResult,
} from './auth';

export type {
  AppPlatform,
  AuthorizationState,
  LocalRuleSpec,
  NativeInterventionEvent,
  NativePlatform,
  NativeProtectionStatus,
  ProtectionCapabilities,
  ProtectionIntegration,
  ProtectionService,
  ProtectionState,
  SelectedAppsSummary,
} from './protection';

/** HTTP wire authority is generated from the implemented FastAPI schema. */
import type { components } from './http.generated';
export type { components, operations, paths } from './http.generated';
export type HealthResponse = components['schemas']['HealthResponse'];
export type MeResponse = components['schemas']['MeResponse'];
export type ProfileView = components['schemas']['ProfileView'];
export type ProfileResponse = components['schemas']['ProfileResponse'];
export type ProfilePatch = components['schemas']['ProfilePatch'];
export type ProfileSavedResponse = components['schemas']['ProfileSavedResponse'];
export type ActivityPreferences = components['schemas']['ActivityPreferences'];
export type PlanDraft = components['schemas']['PlanDraft'];
export type Personalization = components['schemas']['Personalization'];
export type SettingsView = components['schemas']['SettingsView'];
export type SettingsResponse = components['schemas']['SettingsResponse'];
export type SettingsPatch = components['schemas']['SettingsPatch'];
export type SettingsSavedResponse = components['schemas']['SettingsSavedResponse'];
export type ApiErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ApiErrorCode = ApiErrorEnvelope['error']['code'];

/** Saved definitions only; persistence never activates native quest restrictions. */
export type QuestDefinition = components['schemas']['QuestDefinition'];
export type QuestPut = components['schemas']['QuestPut'];
export type QuestDelete = components['schemas']['QuestDelete'];
export type QuestView = components['schemas']['QuestView'];
export type QuestResponse = components['schemas']['QuestResponse'];
export type QuestSavedResponse = components['schemas']['QuestSavedResponse'];
export type QuestPage = components['schemas']['QuestPage'];
export type QuestDeletedResponse = components['schemas']['QuestDeletedResponse'];

/** Explicit schedule versions and self-reported outcomes, separate from definition CRUD. */
export type QuestSchedulePut = components['schemas']['QuestSchedulePut'];
export type QuestScheduleVersionView = components['schemas']['QuestScheduleVersionView'];
export type QuestExecutionView = components['schemas']['QuestExecutionView'];
export type QuestOccurrenceView = components['schemas']['QuestOccurrenceView'];
export type QuestOutcomePut = components['schemas']['QuestOutcomePut'];
export type QuestOutcomeView = components['schemas']['QuestOutcomeView'];

/** Account-owned rewards; balances and prices come from the server. */
export type RewardView = components['schemas']['RewardView'];
export type RewardSignal = components['schemas']['RewardSignal'];
export type RewardBatch = components['schemas']['RewardBatch'];
export type RewardBatchResult = components['schemas']['RewardBatchResult'];
export type FeedPut = components['schemas']['FeedPut'];
export type FeedResult = components['schemas']['FeedResult'];
export type FeedReceipt = components['schemas']['FeedReceipt'];

/** Aggregate-only selected-app usage and coverage-qualified fixed baseline. */
export type HistoryDay = components['schemas']['HistoryDay'];
export type HistoryPut = components['schemas']['HistoryPut'];
export type HistoryWindow = components['schemas']['HistoryWindow'];
export type HistoryView = components['schemas']['HistoryView'];

export type RecommendationOffer = components['schemas']['RecommendationOffer'];
export type RecommendationView = components['schemas']['RecommendationView'];
export type RecommendationAction = components['schemas']['RecommendationAction'];
