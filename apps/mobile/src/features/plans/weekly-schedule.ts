import type { PlanDraft } from '@disconnect/contracts';
import { parseTime } from '../editors/draft-utils';
import { decodeInterventionStatus, type InterventionCoordinatorPort, type InterventionStatus, type InterventionWindow } from '../../infrastructure/native/intervention-coordinator';
import { decodeSelectionDraft, type SelectionEditorPort } from '../../infrastructure/native/selection-editor';

export interface WeeklySchedulePort extends Pick<InterventionCoordinatorPort, 'interventionOpen' | 'interventionRelease' | 'interventionCancel'>,
  Pick<SelectionEditorPort, 'selectionBegin' | 'selectionRelease'> {
  scheduleRead(owner: string): Promise<unknown>;
  schedulePreview(spec: PlanDraft): Promise<unknown>;
  scheduleApply(owner: string, token: string, expected: number, revision: number, selectionRevision: number, spec: PlanDraft): Promise<unknown>;
}
export type ScheduleInstallation = Readonly<{ observedAt: number; native: InterventionStatus; spec: PlanDraft | null; enabled: boolean;
  otherInstallation: boolean; windows: readonly InterventionWindow[] }>;
export class ScheduleError extends Error {
  constructor(public readonly code: 'invalid' | 'unconfirmed' | 'closed' | 'busy') {
    super('The schedule could not be confirmed.'); this.name = 'ScheduleError';
  }
}
const invalid = (): never => { throw new ScheduleError('invalid'); };
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Incomplete storage drafts are valid to save; only complete, explicit values are installable. Zone membership is checked natively. */
export function completeSchedule(value: unknown): PlanDraft {
  if (!object(value) || !Array.isArray(value.weekdays) || !value.weekdays.length || value.weekdays.length > 7 ||
    new Set(value.weekdays).size !== value.weekdays.length || !value.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) ||
    !object(value.hours) || typeof value.hours.start_local !== 'string' || typeof value.hours.end_local !== 'string' || typeof value.hours.next_day !== 'boolean' ||
    typeof value.timezone_id !== 'string' || !/^[A-Za-z0-9_+/-]{1,128}$/.test(value.timezone_id) ||
    !Number.isInteger(value.session_count) || (value.session_count as number) < 1 || (value.session_count as number) > 1000 ||
    !Number.isInteger(value.session_minutes) || (value.session_minutes as number) < 1 || (value.session_minutes as number) > 1440) return invalid();
  const start = parseTime(value.hours.start_local), end = parseTime(value.hours.end_local);
  if (start === null || end === null || !(value.hours.next_day ? end < start : end > start)) return invalid();
  return { weekdays: [...value.weekdays].sort((a, b) => a - b), hours: { start_local: value.hours.start_local,
    end_local: value.hours.end_local, next_day: value.hours.next_day }, timezone_id: value.timezone_id,
    session_count: value.session_count as number, session_minutes: value.session_minutes as number };
}
export const sameSchedule = (a: PlanDraft | null, b: PlanDraft | null) =>
  a === null || b === null ? a === b : JSON.stringify(completeSchedule(a)) === JSON.stringify(completeSchedule(b));
export function decodeScheduleWindows(value: unknown): readonly InterventionWindow[] {
  if (!Array.isArray(value) || value.length > 9) return invalid();
  const windows = value.map((v: unknown) => {
    if (!object(v) || typeof v.reasonId !== 'string' || !/^weekly_\d{4}-\d{2}-\d{2}$/.test(v.reasonId) ||
      !Number.isSafeInteger(v.startsAt) || !Number.isSafeInteger(v.endsAt) || (v.startsAt as number) < 0 ||
      (v.endsAt as number) <= (v.startsAt as number) || (v.endsAt as number) - (v.startsAt as number) > 2 * 86400000) return invalid();
    return { reasonId: v.reasonId, startsAt: v.startsAt as number, endsAt: v.endsAt as number };
  });
  if (new Set(windows.map((w) => w.reasonId)).size !== windows.length || windows.some((w, i) => i > 0 && w.startsAt < windows[i - 1].endsAt)) return invalid();
  return windows;
}
export function decodeScheduleInstallation(value: unknown): ScheduleInstallation {
  if (!object(value) || !Number.isSafeInteger(value.observedAt) || (value.observedAt as number) < 0 || (value.observedAt as number) > 8640000000000000 || typeof value.enabled !== 'boolean' || typeof value.otherInstallation !== 'boolean') return invalid();
  const native = decodeInterventionStatus(value.native), spec = value.spec === null ? null : completeSchedule(value.spec);
  // Finite diagnostic windows are not weekly preview windows; never present them as an installed weekly plan.
  const windows = value.otherInstallation ? [] : decodeScheduleWindows(value.windows);
  if ((value.enabled && (!spec || native.installedRevision === null)) || (spec && value.otherInstallation) ||
    (!value.enabled && !value.otherInstallation && windows.length > 0) || (spec && native.installedRevision === null) || (!value.otherInstallation && native.reasonCount !== windows.length)) return invalid();
  return { observedAt: value.observedAt as number, native, spec, enabled: value.enabled, otherInstallation: value.otherInstallation, windows };
}

/** No Auth/default owner, retry, implicit install, or JS recurrence timer. Call dispose on scope loss. */
export function createWeeklyScheduleClient(owner: string, port: WeeklySchedulePort) {
  if (!/^[a-z0-9_-]{1,64}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(owner)) return invalid();
  let closed = false, writing = false;
  const live = () => { if (closed) throw new ScheduleError('closed'); };
  const invoke = async <T>(call: () => Promise<unknown>, decode: (v: unknown) => T) => {
    live(); try { const v = await call(); live(); return decode(v); }
    catch (e) { live(); throw e instanceof ScheduleError ? e : new ScheduleError('unconfirmed'); }
  };
  const withWrite = async (action: (token: string) => Promise<ScheduleInstallation>) => {
    live(); if (writing) throw new ScheduleError('busy'); writing = true;
    let token: string | null = null;
    try {
      const raw = await port.interventionOpen(owner);
      if (typeof raw !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(raw)) return invalid();
      token = raw; live(); return await action(raw);
    } catch (e) { live(); throw e instanceof ScheduleError ? e : new ScheduleError('unconfirmed'); }
    finally {
      try { if (token) await port.interventionRelease(owner, token); }
      catch { throw new ScheduleError(closed ? 'closed' : 'unconfirmed'); }
      finally { writing = false; }
    }
  };
  const read = () => invoke(() => port.scheduleRead(owner), decodeScheduleInstallation);
  return {
    read,
    preview: async (draft: PlanDraft) => {
      const spec = completeSchedule(draft);
      return invoke(() => port.schedulePreview(spec), (v) => object(v) ? decodeScheduleWindows(v.windows) : invalid());
    },
    apply: (draft: PlanDraft, expected: number) => {
      const spec = completeSchedule(draft);
      if (!Number.isInteger(expected) || expected < 0 || expected >= 2147483647) return Promise.reject(new ScheduleError('invalid'));
      return withWrite(async (token) => {
        const selection = decodeSelectionDraft(await port.selectionBegin(owner));
        try {
          live(); if (selection.baseRevision < 1 || selection.savedAppCount < 1) return invalid();
          const next = decodeScheduleInstallation(await port.scheduleApply(owner, token, expected, expected + 1, selection.baseRevision, spec)); live();
          const confirmed = await read();
          if (!next.enabled || !confirmed.enabled || next.native.installedRevision !== expected + 1 || confirmed.native.installedRevision !== expected + 1 ||
            confirmed.native.selectionRevision !== selection.baseRevision || !sameSchedule(confirmed.spec, spec)) throw new ScheduleError('unconfirmed');
          return confirmed;
        } finally { await port.selectionRelease(owner, selection.draftId); }
      });
    },
    stop: (expected: number) => {
      if (!Number.isInteger(expected) || expected < 1 || expected >= 2147483647) return Promise.reject(new ScheduleError('invalid'));
      return withWrite(async (token) => {
        // Do not stop an unrelated finite installation; require the caller's reviewed weekly revision.
        const before = await read(); if (!before.spec || before.otherInstallation || before.native.installedRevision !== expected) throw new ScheduleError('unconfirmed');
        live(); await port.interventionCancel(owner, token, expected, null); live();
        const confirmed = await read();
        if (confirmed.enabled || confirmed.native.installedRevision !== expected + 1 || !sameSchedule(confirmed.spec, before.spec)) throw new ScheduleError('unconfirmed');
        return confirmed;
      });
    },
    dispose() { closed = true; },
  };
}
