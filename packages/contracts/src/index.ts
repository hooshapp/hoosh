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
export type ApiErrorEnvelope = components['schemas']['ErrorEnvelope'];
export type ApiErrorCode = ApiErrorEnvelope['error']['code'];
