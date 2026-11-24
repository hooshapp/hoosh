import type { QuestScheduleVersionView } from '@disconnect/contracts';
import { isQuestDate, isQuestId } from '../../domain/quest-values';
import { utcTimestamp } from '../api/decoders';
import { decodeInterventionStatus, type InterventionPolicy, type InterventionStatus, type InterventionWindow } from './intervention-coordinator';
export interface QuestDevicePort {
  questRead(owner: string, questId: string): Promise<unknown>;
  questApply(owner: string, token: string, expected: number, spec: QuestDeviceSpec & { questId: string }): Promise<unknown>;
  questCancel(owner: string, token: string, expected: number, questId: string, reason: string): Promise<unknown>;
  interventionOpen(owner: string): Promise<unknown>;
  interventionRelease(owner: string, token: string): Promise<unknown>;
  interventionReviewAccess(): Promise<unknown>;
}
export type DeviceQuestVersion = Readonly<{
  revision: number; firstDate: string; repeat: 'none' | 'daily' | 'weekly'; weekdays: readonly number[];
  start: string; end: string; nextDay: boolean; timezone: string;
  effectiveFrom: number; effectiveUntil: number | null;
}>;
export type QuestDeviceSpec = Readonly<{
  remoteRevision: number; requestId: string; enabled: boolean; selectionRevision: number;
  versions: readonly DeviceQuestVersion[]; cancelled: readonly string[]; policy: InterventionPolicy | null;
}>;
export type DeviceQuestRead = Readonly<{
  owner: string; questId: string; observedAt: number; remoteRevision: number; requestId: string | null;
  enabled: boolean; native: InterventionStatus; policy: InterventionPolicy | null; versions: readonly DeviceQuestVersion[];
  windows: readonly InterventionWindow[]; cancelled: readonly string[];
}>;
export class DeviceQuestError extends Error {
  constructor(readonly reason: 'invalid_response' | 'unavailable' | 'unconfirmed' | 'closed' | 'busy') {
    super('Device quest state could not be confirmed.'); this.name = 'DeviceQuestError';
  }
}
const invalid = (): never => { throw new DeviceQuestError('invalid_response'); };
const record = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === 'object' && !Array.isArray(v));
const integer = (v: unknown, max = 2147483647): v is number => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= max;
function nativeVersion(v: unknown): DeviceQuestVersion {
  if (!record(v) || !integer(v.revision) || v.revision < 1 || !isQuestDate(v.firstDate) ||
      !['none', 'daily', 'weekly'].includes(v.repeat as string) || !Array.isArray(v.weekdays) || v.weekdays.length > 7 ||
      !v.weekdays.every((d) => integer(d, 6)) || new Set(v.weekdays).size !== v.weekdays.length ||
      (v.repeat === 'weekly') !== (v.weekdays.length > 0) || v.weekdays.some((d, i, ds) => i > 0 && d <= ds[i - 1]) ||
      ![v.start, v.end].every((t) => typeof t === 'string' && t.length === 5 && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(t)) ||
      typeof v.nextDay !== 'boolean' || !(v.nextDay ? (v.end as string) < (v.start as string) : (v.end as string) > (v.start as string)) ||
      typeof v.timezone !== 'string' || !/^[A-Za-z0-9_+/-]{1,128}$/.test(v.timezone) ||
      !integer(v.effectiveFrom, 8640000000000000) || !(v.effectiveUntil === null || integer(v.effectiveUntil, 8640000000000000)) ||
      (v.effectiveUntil !== null && (v.effectiveUntil as number) < v.effectiveFrom)) return invalid();
  return { revision: v.revision, firstDate: v.firstDate, repeat: v.repeat as DeviceQuestVersion['repeat'], weekdays: [...v.weekdays],
    start: v.start as string, end: v.end as string, nextDay: v.nextDay, timezone: v.timezone,
    effectiveFrom: v.effectiveFrom, effectiveUntil: v.effectiveUntil as number | null };
}
/** Ceil sub-millisecond bounds: starts >= from and starts < until match server microseconds. */
export function nativeQuestVersion(v: QuestScheduleVersionView): DeviceQuestVersion {
  const instant = (value: string) => {
    if (!utcTimestamp(value)) return invalid();
    const fraction = /\.([0-9]+)Z$/.exec(value)?.[1] ?? '';
    return Date.parse(value) + (/[1-9]/.test(fraction.slice(3)) ? 1 : 0);
  };
  return nativeVersion({ revision: v.revision, firstDate: v.first_date, repeat: v.definition.repeat, weekdays: v.definition.weekdays,
    start: v.definition.start_local, end: v.definition.end_local, nextDay: v.definition.next_day, timezone: v.definition.timezone_id,
    effectiveFrom: instant(v.effective_from), effectiveUntil: v.effective_until === null ? null : instant(v.effective_until) });
}
export function questReason(id: string, revision: number, day: string) {
  if (!isQuestId(id) || !integer(revision) || revision < 1 || !isQuestDate(day)) return invalid();
  return `q_${id.replaceAll('-', '')}_v${revision}_d${day.replaceAll('-', '')}`;
}
export function decodeDeviceQuest(value: unknown, owner: string, questId: string): DeviceQuestRead {
  if (!record(value) || value.owner !== owner || value.questId !== questId || !integer(value.observedAt, 8640000000000000) ||
      !integer(value.remoteRevision) || typeof value.enabled !== 'boolean' || !(value.requestId === null || isQuestId(value.requestId)) ||
      (value.enabled && (value.remoteRevision < 1 || value.requestId === null)) ||
      !Array.isArray(value.versions) || value.versions.length > 32 || !Array.isArray(value.windows) || value.windows.length > 512 ||
      !Array.isArray(value.cancelled) || value.cancelled.length > 256) return invalid();
  const native = decodeInterventionStatus(value.native);
  let policy: InterventionPolicy | null = null;
  if (value.policy !== null) {
    const p = value.policy;
    if (!record(p) || (p.budgetScope !== undefined && p.budgetScope !== 'all_selected_apps') || typeof p.timezoneId !== 'string' || !/^[A-Za-z0-9_+/-]{1,128}$/.test(p.timezoneId) ||
        !integer(p.sessionsPerDay, 1000) || p.sessionsPerDay < 1 || !integer(p.sessionSeconds, 86400) || p.sessionSeconds < 1) return invalid();
    policy = { ...(p.budgetScope === 'all_selected_apps' ? { budgetScope: p.budgetScope } : {}), timezoneId: p.timezoneId, sessionsPerDay: p.sessionsPerDay, sessionSeconds: p.sessionSeconds };
  }
  if (native.installedRevision !== null && !policy) return invalid();
  const versions = value.versions.map(nativeVersion);
  if (versions.some((v) => v.revision > (value.remoteRevision as number)) || new Set(versions.map((v) => v.revision)).size !== versions.length ||
      (!value.enabled && versions.length !== 0) || (value.enabled && native.installedRevision === null)) return invalid();
  const prefix = `q_${questId.replaceAll('-', '')}_`;
  const reason = (v: unknown): v is string => typeof v === 'string' && v.startsWith(prefix) && /^q_[0-9a-f]{32}_v[1-9][0-9]{0,9}_d[0-9]{8}$/.test(v);
  if (!value.cancelled.every(reason) || new Set(value.cancelled).size !== value.cancelled.length) return invalid();
  const windows = value.windows.map((v): InterventionWindow => {
    if (!record(v) || !reason(v.reasonId) || !integer(v.startsAt, 8640000000000000) || !integer(v.endsAt, 8640000000000000) ||
        v.endsAt <= v.startsAt || v.endsAt - v.startsAt > 2 * 86400000) return invalid();
    return { reasonId: v.reasonId, startsAt: v.startsAt, endsAt: v.endsAt };
  });
  if (new Set(windows.map((w) => w.reasonId)).size !== windows.length || (!value.enabled && windows.length > 0)) return invalid();
  return { owner, questId, observedAt: value.observedAt, remoteRevision: value.remoteRevision, requestId: value.requestId as string | null,
    enabled: value.enabled, native, policy, versions, windows, cancelled: [...value.cancelled] as string[] };
}
/** No implicit owner/default, write retry or JS recurrence timer. Dispose on account loss. */
export function createQuestDeviceClient(owner: string, questId: string, port: QuestDevicePort) {
  if (!/^[a-z0-9_-]{1,64}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(owner) || !isQuestId(questId)) return invalid();
  let closed = false, writing = false;
  const live = () => { if (closed) throw new DeviceQuestError('closed'); };
  const decode = (v: unknown) => { live(); return decodeDeviceQuest(v, owner, questId); };
  async function write(action: (token: string) => Promise<DeviceQuestRead>) {
    live(); if (writing) throw new DeviceQuestError('busy'); writing = true;
    let token: string | null = null;
    try {
      const value = await port.interventionOpen(owner);
      if (!isQuestId(value)) return invalid(); token = value; live();
      return await action(value);
    } catch { live(); throw new DeviceQuestError('unconfirmed'); }
    finally {
      try { if (token) await port.interventionRelease(owner, token); }
      catch { throw new DeviceQuestError(closed ? 'closed' : 'unconfirmed'); }
      finally { writing = false; }
      live();
    }
  }
  return {
    async read() { live(); try { return decode(await port.questRead(owner, questId)); } catch { live(); throw new DeviceQuestError('unavailable'); } },
    apply(expected: number, spec: QuestDeviceSpec) {
      if (!integer(expected) || !isQuestId(spec.requestId)) return Promise.reject(new DeviceQuestError('invalid_response'));
      return write(async (token) => {
        live(); const result = decode(await port.questApply(owner, token, expected, { ...spec, questId }));
        if (!spec.enabled && expected === 0 && result.native.installedRevision === null && !result.enabled) return result;
        if (result.native.installedRevision !== expected + 1 || result.requestId !== spec.requestId || result.enabled !== spec.enabled ||
            (spec.enabled && result.remoteRevision !== spec.remoteRevision)) return invalid();
        return result;
      });
    },
    cancel(expected: number, revision: number, day: string) {
      if (!integer(expected)) return Promise.reject(new DeviceQuestError('invalid_response'));
      const reason = questReason(questId, revision, day);
      return write(async (token) => {
        live(); const result = decode(await port.questCancel(owner, token, expected, questId, reason));
        if (![expected, expected + 1].includes(result.native.installedRevision ?? -1) || !result.cancelled.includes(reason)) return invalid();
        return result;
      });
    },
    dispose() { closed = true; },
  };
}
