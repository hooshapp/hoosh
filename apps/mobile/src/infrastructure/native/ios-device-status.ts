import type { ProtectionRead } from '@/features/protection/status-model';
/** Selection-only iOS projection. The Android decoder remains unchanged. */
export function decodeIOSDeviceStatus(raw: unknown, owner: string): Extract<ProtectionRead, { phase: 'ready' }> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid iOS status');
  const v = raw as Record<string, unknown>;
  const flags = { supportsScheduledRestriction: false, supportsTemporaryAllowance: false,
    supportsUsageThreshold: false, supportsAdvanceWarning: false, supportsUsageSummary: false } as const;
  if (v.schemaVersion !== 1 || v.owner !== owner || v.platform !== 'ios' || v.mode !== 'system_shield' ||
      v.selectionUI !== 'native_picker' || typeof v.authorization !== 'string' || !['authorized', 'denied', 'not_requested', 'unavailable'].includes(v.authorization) ||
      typeof v.state !== 'string' || !['inactive', 'needs_permission', 'degraded'].includes(v.state) || v.installedRevision !== null ||
      !Array.isArray(v.installedReasonIds) || v.installedReasonIds.length !== 0 ||
      Object.entries(flags).some(([key, expected]) => v[key] !== expected) ||
      (v.authorization === 'authorized' ? v.state === 'needs_permission' : v.state !== 'needs_permission')) {
    throw new Error('Invalid iOS status');
  }
  const authorization = v.authorization as 'authorized' | 'denied' | 'not_requested' | 'unavailable';
  return { phase: 'ready', authorization, capabilities: {
    platform: 'ios', mode: 'system_shield', selectionUI: 'native_picker', ...flags,
    notes: ['App selection and permission review are connected. Protection scheduling is not registered yet.'],
  }, status: { authorization, state: v.state as 'inactive' | 'needs_permission' | 'degraded',
    installedRevision: null, installedReasonIds: [] } };
}
