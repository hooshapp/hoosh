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

/** The currently implemented public liveness response. */
export interface HealthResponse {
  status: 'ok';
  service: 'disconnect-api';
}
