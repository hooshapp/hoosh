import type { InterventionStatus } from './intervention-coordinator';
/** iOS facts have no Android overlay/service/disclosure success fields. */
export function decodeIOSRuntimeStatus(raw: Record<string, unknown>): InterventionStatus {
  const int = (v: unknown, max = 2147483647): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= max;
  if (raw.schemaVersion !== 4 || raw.platform !== 'ios' || typeof raw.enabled !== 'boolean' || !['gated', 'pending', 'verified', 'degraded', 'unconfigured'].includes(raw.phase as string) ||
    !['authorized', 'denied'].includes(raw.authorization as string) || typeof raw.activationAvailable !== 'boolean' ||
    ![raw.installedRevision, raw.selectionRevision].every(v => v === null || (int(v) && v > 0)) ||
    ((raw.installedRevision === null) !== (raw.selectionRevision === null)) ||
    (raw.enabled && raw.installedRevision === null) || (raw.installedRevision === null && raw.reasonCount !== 0) ||
    !int(raw.selectedAppCount, 512) || !int(raw.reasonCount, 512) ||
    !(raw.pendingRequestID === null || typeof raw.pendingRequestID === 'string' && /^[0-9a-f-]{36}$/.test(raw.pendingRequestID)) ||
    (raw.phase === 'verified' && (!raw.activationAvailable || raw.authorization !== 'authorized' || raw.installedRevision === null)) ||
    (raw.phase === 'gated' && raw.activationAvailable)) throw new Error('Invalid iOS runtime status');
  return { platform: 'ios', activationAvailable: raw.activationAvailable, pendingRequestID: raw.pendingRequestID as string | null,
    state: raw.authorization !== 'authorized' ? 'needs_permission' : ['pending', 'degraded'].includes(raw.phase as string) ? 'failed' : raw.phase === 'verified' && raw.enabled ? 'armed' : 'inactive',
    installedRevision: raw.installedRevision as number | null, selectionRevision: raw.selectionRevision as number | null,
    selectedAppCount: raw.selectedAppCount, reasonCount: raw.reasonCount,
    // Unsupported Android capabilities are false, never invented service access.
    pendingEventCount: 0, overlayVisible: false, disclosureAccepted: false, serviceConnected: false };
}
