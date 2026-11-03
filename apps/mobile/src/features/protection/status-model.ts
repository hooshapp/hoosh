import type {
  AuthorizationState,
  NativeProtectionStatus,
  ProtectionCapabilities,
  ProtectionIntegration,
} from '@disconnect/contracts';

type IntegrationAvailability =
  | Exclude<ProtectionIntegration, { availability: 'connected' }>
  | Pick<
      Extract<ProtectionIntegration, { availability: 'connected' }>,
      'availability' | 'platform'
    >;

export type ProtectionRead =
  | { phase: 'checking' | 'stale' | 'error' }
  | {
      phase: 'ready';
      capabilities: ProtectionCapabilities;
      authorization: AuthorizationState;
      status: NativeProtectionStatus;
    };
export type ProtectionStatusKind =
  | 'unavailable'
  | 'unsupported'
  | 'checking'
  | 'unknown'
  | 'permission'
  | 'inactive'
  | 'installing'
  | 'pending'
  | 'degraded'
  | 'failed'
  | 'active'
  | 'interventions'
  | 'reminders';
export type ProtectionStatusModel = Readonly<{
  kind: ProtectionStatusKind;
  title: string;
  message: string;
  tone: 'neutral' | 'positive' | 'attention';
  action?: 'retry' | 'permissions' | 'setup';
  /** Native read evidence, not a server-plan acknowledgment or account attribution. */
  installedRevision?: number;
  desiredRevision?: number;
}>;
const authorizations = ['not_requested', 'authorized', 'denied', 'revoked', 'unavailable', 'error'];
const states = ['inactive', 'pending_install', 'active', 'needs_permission', 'degraded', 'failed'];
export const validRevision = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
function validEvidence(read: Extract<ProtectionRead, { phase: 'ready' }>, platform: string) {
  const { capabilities: c, authorization, status: s } = read;
  return (
    c &&
    s &&
    c.platform === platform &&
    ['native_picker', 'package_list', 'unavailable'].includes(c.selectionUI) &&
    ['system_shield', 'overlay', 'notification_only', 'unsupported'].includes(c.mode) &&
    [
      'supportsUsageThreshold',
      'supportsScheduledRestriction',
      'supportsTemporaryAllowance',
      'supportsAdvanceWarning',
      'supportsUsageSummary',
    ].every((key) => typeof c[key as keyof ProtectionCapabilities] === 'boolean') &&
    Array.isArray(c.notes) &&
    c.notes.every((note) => typeof note === 'string') &&
    authorizations.includes(authorization) &&
    authorizations.includes(s.authorization) &&
    states.includes(s.state) &&
    (s.installedRevision === null || validRevision(s.installedRevision)) &&
    Array.isArray(s.installedReasonIds) &&
    s.installedReasonIds.every((id) => typeof id === 'string' && id.length > 0) &&
    (s.lastErrorCode === undefined || typeof s.lastErrorCode === 'string')
  );
}
const unknown = (): ProtectionStatusModel => ({
  kind: 'unknown',
  title: 'Protection status unknown',
  message:
    'We couldn’t confirm the current device state. Check again before relying on protection.',
  tone: 'attention',
  action: 'retry',
});

/** Pure presentation projection. No permission, installation, enforcement or account side effects. */
export function mapProtectionStatus(
  integration: IntegrationAvailability,
  desiredRevision: number | null,
  read: ProtectionRead,
): ProtectionStatusModel {
  if (integration.availability === 'not_connected')
    return {
      kind: 'unavailable',
      title: 'Protection status unavailable',
      message: 'We can’t confirm protection on this device right now.',
      tone: 'neutral',
      ...(integration.reason === 'initialization_failed' ? { action: 'retry' as const } : {}),
    };
  if (integration.availability === 'unsupported')
    return {
      kind: 'unsupported',
      title: 'Protection unavailable here',
      message: 'Device protection isn’t available in this version of the app.',
      tone: 'neutral',
    };
  if (read.phase === 'checking')
    return {
      kind: 'checking',
      title: 'Checking protection',
      message: 'Checking the current permissions and installed plan on this device…',
      tone: 'neutral',
    };
  if (
    read.phase !== 'ready' ||
    !validEvidence(read, integration.platform) ||
    (desiredRevision !== null && !validRevision(desiredRevision))
  )
    return unknown();
  const { capabilities, authorization, status } = read;
  const revisions = {
    ...(status.installedRevision === null ? {} : { installedRevision: status.installedRevision }),
    ...(desiredRevision === null ? {} : { desiredRevision }),
  };
  if (capabilities.mode === 'unsupported')
    return {
      kind: 'unsupported',
      title: 'Protection unavailable here',
      message: 'Protection is not implemented in this build. Usage access alone does not activate protection.',
      tone: 'neutral',
    };
  if (
    ['not_requested', 'denied', 'revoked'].includes(authorization) ||
    ['not_requested', 'denied', 'revoked'].includes(status.authorization) ||
    status.state === 'needs_permission'
  )
    return {
      kind: 'permission',
      title: 'Permission needed',
      message:
        'Review device permissions to continue setting up protection. Permission alone does not activate a plan.',
      tone: 'attention',
      action: 'permissions',
      ...revisions,
    };
  if (authorization !== 'authorized' || status.authorization !== 'authorized') return unknown();
  if (status.state === 'failed')
    return {
      kind: 'failed',
      title: 'Protection needs attention',
      message:
        'The device could not confirm the protection setup. Review your setup before relying on it.',
      tone: 'attention',
      action: 'setup',
      ...revisions,
    };
  if (status.state === 'degraded' || Boolean(status.lastErrorCode))
    return {
      kind: 'degraded',
      title: 'Protection needs attention',
      message:
        'The device reports a problem with protection. Check your setup before relying on it.',
      tone: 'attention',
      action: 'retry',
      ...revisions,
    };
  if (status.state === 'inactive')
    return {
      kind: 'inactive',
      title: 'Protection inactive',
      message: 'No active protection plan is confirmed. Choose your apps and finish setup.',
      tone: 'neutral',
      action: 'setup',
      ...revisions,
    };
  if (status.state === 'pending_install')
    return {
      kind: 'installing',
      title: 'Applying your plan',
      message:
        status.installedRevision === null
          ? 'The device has not confirmed the new protection plan yet.'
          : desiredRevision !== null && status.installedRevision < desiredRevision
            ? 'The device reports an earlier plan is installed. Your latest changes are not confirmed yet.'
            : 'The device reports an installed plan, but this update is not confirmed yet.',
      tone: 'neutral',
      ...revisions,
    };
  if (
    desiredRevision === null ||
    status.installedRevision === null ||
    status.installedReasonIds.length === 0
  )
    return unknown();
  if (status.installedRevision !== desiredRevision)
    return {
      kind: 'pending',
      title: 'Plan update not confirmed',
      message:
        'The installed plan does not match your current settings. Review setup to confirm your latest changes.',
      tone: 'attention',
      action: 'setup',
      ...revisions,
    };
  if (capabilities.mode === 'notification_only')
    return {
      kind: 'reminders',
      title: 'Reminders active',
      message: 'Reminders are active for this plan. App access is not blocked.',
      tone: 'positive',
      ...revisions,
    };
  if (capabilities.mode === 'overlay')
    return {
      kind: 'interventions',
      title: 'App interventions active',
      message: 'Device interventions are active for the selected apps in this plan.',
      tone: 'positive',
      ...revisions,
    };
  return {
    kind: 'active',
    title: 'Protection active',
    message: 'The device confirms restrictions for the selected apps in your current plan.',
    tone: 'positive',
    ...revisions,
  };
}
