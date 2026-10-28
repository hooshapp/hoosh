/** Draft integration contracts. No session, quest, or reward policy is approved here. */
export type AccessTokenProvider = () => Promise<string | null>;

export interface HealthResponse {
  status: 'ok';
  service: 'disconnect-api';
}

export type AuthorizationState =
  | 'not_requested'
  | 'authorized'
  | 'denied'
  | 'revoked'
  | 'unavailable'
  | 'error';

export type ProtectionState =
  | 'inactive'
  | 'pending_install'
  | 'active'
  | 'needs_permission'
  | 'degraded'
  | 'failed';

export interface ProtectionCapabilities {
  platform: 'ios' | 'android';
  selectionUI: 'native_picker' | 'package_list' | 'unavailable';
  mode: 'system_shield' | 'overlay' | 'notification_only' | 'unsupported';
  supportsUsageThreshold: boolean;
  supportsScheduledRestriction: boolean;
  supportsTemporaryAllowance: boolean;
  supportsAdvanceWarning: boolean;
  supportsUsageSummary: boolean;
  notes: string[];
}

/** Native selection tokens stay on the device; only a summary crosses the bridge. */
export interface SelectedAppsSummary {
  selectionRevision: number;
  selectedAppCount: number;
  selectedCategoryCount?: number;
  selectedWebDomainCount?: number;
  displayNames?: string[];
}

export interface LocalRuleSpec {
  reasonId: string;
  kind: 'intentional_pause' | 'usage_limit' | 'quest' | 'scheduled_block';
  priority: number;
  ruleRevision: number;
  schedule: {
    timezoneId: string;
    weekdays: number[];
    startLocal: string;
    endLocal: string;
  } | null;
  thresholdSeconds?: number;
  selectedAppsGroupId: string;
  expiresAt?: string;
}

export interface NativeProtectionStatus {
  authorization: AuthorizationState;
  state: ProtectionState;
  installedRevision: number | null;
  installedReasonIds: string[];
  lastReconciledAt?: string;
  lastErrorCode?: string;
}

export interface NativeInterventionEvent {
  eventId: string;
  occurredAt: string;
  kind:
    | 'threshold_reached'
    | 'shield_presented'
    | 'quit_selected'
    | 'override_selected'
    | 'rule_activated'
    | 'rule_deactivated'
    | 'native_error';
  reasonId?: string;
  configRevision: number;
  evidence: 'native_callback' | 'native_action' | 'app_ui' | 'self_report';
  metadata?: Record<string, string | number | boolean | null>;
}

/** Port from TSD §3. Native adapters must confirm operations; no success mocks. */
export interface ProtectionService {
  getCapabilities(): Promise<ProtectionCapabilities>;
  getAuthorization(): Promise<AuthorizationState>;
  requestAuthorization(): Promise<AuthorizationState>;
  pickApps(): Promise<SelectedAppsSummary>;
  getSelectedApps(): Promise<SelectedAppsSummary>;
  applyRules(rules: LocalRuleSpec[], revision: number): Promise<NativeProtectionStatus>;
  getStatus(): Promise<NativeProtectionStatus>;
  requestTemporaryAllowance(reasonId: string, seconds: number): Promise<{
    accepted: boolean;
    expiresAt?: string;
    failureReason?: string;
  }>;
  cancelReason(reasonId: string): Promise<NativeProtectionStatus>;
  drainEvents(limit: number): Promise<NativeInterventionEvent[]>;
  acknowledgeEvents(eventIds: string[]): Promise<void>;
}
