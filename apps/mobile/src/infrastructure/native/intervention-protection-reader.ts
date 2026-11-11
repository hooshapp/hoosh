import type { AuthorizationState, NativeProtectionStatus, ProtectionCapabilities } from '@disconnect/contracts';
import type { ProtectionRead } from '../../features/protection/status-model';

/** Explicit-owner read surface only. LocalRuleSpec writes require a separate policy compiler. */
export interface InterventionProtectionReadPort {
  interventionProtectionRead(owner: string): Promise<unknown>;
}
export class InterventionReadError extends Error {
  constructor(public readonly code: 'invalid_response' | 'unavailable' | 'scope_closed') {
    super('Native intervention status could not be confirmed.');
    this.name = 'InterventionReadError';
  }
}
const invalid = (): never => { throw new InterventionReadError('invalid_response'); };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Strict shared-contract projection. Never retains app inventory or native exception details. */
export function decodeInterventionProtectionRead(value: unknown): Extract<ProtectionRead, { phase: 'ready' }> {
  if (!record(value) || !record(value.capabilities) || !record(value.status)) return invalid();
  const c = value.capabilities, s = value.status;
  const features = { supportsUsageThreshold: false, supportsScheduledRestriction: true,
    supportsTemporaryAllowance: true, supportsAdvanceWarning: false, supportsUsageSummary: false } as const;
  if (c.platform !== 'android' || c.mode !== 'overlay' || c.selectionUI !== 'unavailable' ||
      Object.entries(features).some(([key, expected]) => c[key] !== expected) ||
      !['authorized', 'denied', 'not_requested'].includes(value.authorization as string) ||
      s.authorization !== value.authorization || !['active', 'inactive', 'needs_permission', 'failed'].includes(s.state as string) ||
      !(s.installedRevision === null || (Number.isSafeInteger(s.installedRevision) && (s.installedRevision as number) > 0 && (s.installedRevision as number) <= 2147483647)) ||
      !Array.isArray(s.installedReasonIds) || s.installedReasonIds.length > 32 ||
      !s.installedReasonIds.every((id: unknown) => typeof id === 'string' && /^[a-z0-9_-]{1,64}$/.test(id)) ||
      new Set(s.installedReasonIds).size !== s.installedReasonIds.length ||
      (s.installedRevision === null && s.installedReasonIds.length !== 0) ||
      (s.state === 'active' && (value.authorization !== 'authorized' || s.installedRevision === null || s.installedReasonIds.length === 0)) ||
      (value.authorization !== 'authorized' && s.state !== 'needs_permission' && s.state !== 'failed') ||
      (value.authorization === 'authorized' && s.state === 'needs_permission')) return invalid();
  const capabilities: ProtectionCapabilities = { platform: 'android', mode: 'overlay', selectionUI: 'unavailable', ...features,
    notes: ['Debug native interventions. Read-only status adapter; account binding and generic rule writes remain separate.'] };
  const status = { authorization: value.authorization as AuthorizationState, state: s.state,
    installedRevision: s.installedRevision, installedReasonIds: [...s.installedReasonIds] } as NativeProtectionStatus;
  return { phase: 'ready', capabilities, authorization: status.authorization, status };
}

/** Caller supplies a verified owner, disposes on scope loss and discards old UI; no default identity. */
export function createInterventionProtectionReader(owner: string, port: InterventionProtectionReadPort) {
  if (!/^[a-z0-9_-]{1,64}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(owner) ||
      typeof port?.interventionProtectionRead !== 'function') throw new InterventionReadError('unavailable');
  let closed = false;
  return {
    async read() {
      if (closed) throw new InterventionReadError('scope_closed');
      try {
        const value = await port.interventionProtectionRead(owner);
        if (closed) throw new InterventionReadError('scope_closed');
        return decodeInterventionProtectionRead(value);
      } catch (error) {
        if (closed) throw new InterventionReadError('scope_closed');
        throw error instanceof InterventionReadError ? error : new InterventionReadError('unavailable');
      }
    },
    dispose() { closed = true; }, // Read scope disposal must never cancel installed native rules.
  };
}
