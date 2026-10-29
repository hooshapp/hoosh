/** Draft native policy port; no session, override, quest, or reward policy is approved. */
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
  platform: NativePlatform;
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

interface NativeProtectionStatusBase {
  installedReasonIds: string[];
  lastReconciledAt?: string;
  lastErrorCode?: string;
}

/** An active claim requires permission and an installed revision; adapters validate values. */
export type NativeProtectionStatus = NativeProtectionStatusBase &
  (
    | { authorization: 'authorized'; state: 'active'; installedRevision: number }
    | {
        authorization: AuthorizationState;
        state: Exclude<ProtectionState, 'active'>;
        installedRevision: number | null;
      }
  );

export type NativePlatform = 'ios' | 'android';
export type AppPlatform = NativePlatform | 'web' | 'other';

/** Bridge availability is independent of OS permission and rule installation. */
export type ProtectionIntegration =
  | {
      readonly availability: 'not_connected';
      readonly platform: NativePlatform;
      readonly reason: 'adapter_not_registered' | 'initialization_failed';
    }
  | {
      readonly availability: 'unsupported';
      readonly platform: AppPlatform;
      readonly reason: 'platform_not_supported' | 'build_not_supported';
    }
  | {
      readonly availability: 'connected';
      readonly platform: NativePlatform;
      readonly service: ProtectionService;
    };

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
