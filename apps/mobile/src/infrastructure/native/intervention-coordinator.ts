/** Debug coordinator: finite native windows, explicit session policy and native-only app identities. */
export type InterventionWindow = Readonly<{ reasonId: string; startsAt: number; endsAt: number }>;
export type InterventionPolicy = Readonly<{ timezoneId: string; sessionsPerDay: number; sessionSeconds: number }>;
export interface InterventionCoordinatorPort {
  interventionOpen(owner: string): Promise<unknown>;
  interventionRelease(owner: string, token: string): Promise<unknown>;
  interventionStatus(owner: string): Promise<unknown>;
  interventionReviewAccess(): Promise<unknown>;
  interventionInstall(owner: string, token: string, expected: number, revision: number, selectionRevision: number, windows: readonly InterventionWindow[], policy: InterventionPolicy): Promise<unknown>;
  interventionCancel(owner: string, token: string, expected: number, reason: string | null): Promise<unknown>;
  interventionDrain(owner: string, token: string, limit: number): Promise<unknown>;
  interventionAcknowledge(owner: string, token: string, ids: string[]): Promise<unknown>;
  interventionEndOwner(owner: string, erase: boolean): Promise<unknown>;
}
export type InterventionStatus = Readonly<{
  state: 'needs_permission' | 'inactive' | 'armed' | 'failed';
  installedRevision: number | null; selectionRevision: number | null;
  selectedAppCount: number; reasonCount: number; pendingEventCount: number;
  overlayVisible: boolean; disclosureAccepted: boolean; serviceConnected: boolean;
}>;
export function decodeInterventionStatus(value: unknown): InterventionStatus {
  if (!value || typeof value !== 'object') throw new Error('Invalid intervention status');
  const v = value as Record<string, unknown>;
  const integer = (n: unknown, max = 2147483647) => Number.isSafeInteger(n) && (n as number) >= 0 && (n as number) <= max;
  if (!['needs_permission', 'inactive', 'armed', 'failed'].includes(v.state as string) ||
    ![v.installedRevision, v.selectionRevision].every((n) => n === null || (integer(n) && (n as number) > 0)) ||
    !integer(v.selectedAppCount, 512) || !integer(v.reasonCount, 32) || !integer(v.pendingEventCount, 256) ||
    !['overlayVisible', 'disclosureAccepted', 'serviceConnected'].every((k) => typeof v[k] === 'boolean') ||
    ((v.installedRevision === null) !== (v.selectionRevision === null)) ||
    (v.state === 'armed' && (!v.disclosureAccepted || !v.serviceConnected || v.installedRevision === null || v.reasonCount === 0 || v.selectedAppCount === 0)))
    throw new Error('Invalid intervention status');
  return { state: v.state as InterventionStatus['state'], installedRevision: v.installedRevision as number | null,
    selectionRevision: v.selectionRevision as number | null, selectedAppCount: v.selectedAppCount as number,
    reasonCount: v.reasonCount as number, pendingEventCount: v.pendingEventCount as number,
    overlayVisible: v.overlayVisible as boolean, disclosureAccepted: v.disclosureAccepted as boolean, serviceConnected: v.serviceConnected as boolean };
}
/** Drain/ack is explicit and at-least-once; reading never acknowledges events. */
export function decodeInterventionEventIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 256) throw new Error('Invalid intervention events');
  const ids = value.map((v: unknown) => {
    if (!v || typeof v !== 'object' || !('eventId' in v) || typeof v.eventId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v.eventId)) throw new Error('Invalid intervention event');
    return v.eventId;
  });
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate intervention events');
  return ids;
}
