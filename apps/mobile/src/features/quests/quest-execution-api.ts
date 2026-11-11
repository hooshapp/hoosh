import { isQuestId, isQuestDate } from '../../domain/quest-values';
import type { QuestExecutionView, QuestOutcomePut, QuestOutcomeView, QuestSchedulePut, QuestScheduleVersionView } from '@disconnect/contracts';
import { ApiError, isRecord } from '../../infrastructure/api/errors';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';
import { questDefinition } from './quests-api';
export { isQuestId, isQuestDate } from '../../domain/quest-values';

const invalid = (): never => { throw new ApiError('invalid_response'); };
const integer = (v: unknown, min = 0, max = 2147483647): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
function path(id: string) { if (!isQuestId(id)) throw new ApiError('validation'); return `/v1/quests/${id}`; }
function own(value: unknown, context: ResponseContext, id: string): asserts value is Record<string, unknown> {
  if (!isRecord(value) || !context.account || value.user_id !== context.account.user_id || value.quest_id !== id) invalid();
}
function version(value: unknown): QuestScheduleVersionView {
  if (!isRecord(value) || !integer(value.revision, 1) || !integer(value.quest_revision, 1) || !isQuestDate(value.first_date) ||
      !utcTimestamp(value.effective_from) || !(value.effective_until === null || utcTimestamp(value.effective_until)) || value.enabled !== true ||
      (value.effective_until !== null && Date.parse(value.effective_until as string) < Date.parse(value.effective_from))) return invalid();
  return { revision: value.revision, quest_revision: value.quest_revision, first_date: value.first_date,
    definition: questDefinition(value.definition), effective_from: value.effective_from, effective_until: value.effective_until as string | null, enabled: true };
}
export function decodeQuestExecution(value: unknown, context: ResponseContext, id: string): QuestExecutionView {
  own(value, context, id);
  if (!utcTimestamp(value.observed_at) || !integer(value.revision) || typeof value.enabled !== 'boolean' ||
      !Array.isArray(value.versions) || value.versions.length > 128 || !Array.isArray(value.occurrences) || value.occurrences.length > 128 * 31 ||
      !integer(value.credits, 0, Number.MAX_SAFE_INTEGER) || !integer(value.completed_count, 0, Number.MAX_SAFE_INTEGER) || value.credits !== value.completed_count * 50) return invalid();
  const versions = value.versions.map(version);
  if (versions.some((v, i) => v.revision > (value.revision as number) || (i > 0 && v.revision >= versions[i - 1].revision)) ||
      (value.enabled && !versions.some((v) => v.revision === value.revision && v.effective_until === null))) return invalid();
  const observed = Date.parse(value.observed_at), seen = new Set<string>();
  const occurrences = value.occurrences.map((v): QuestExecutionView['occurrences'][number] => {
    if (!isRecord(v) || !integer(v.schedule_revision, 1) || !isQuestDate(v.local_date) || !utcTimestamp(v.starts_at) || !utcTimestamp(v.ends_at) ||
        !['upcoming', 'active', 'ended', 'missed', 'completed', 'cancelled'].includes(v.state as string) || typeof v.can_confirm !== 'boolean') return invalid();
    const definition = versions.find((version) => version.revision === v.schedule_revision)?.definition;
    const key = `${v.schedule_revision}:${v.local_date}`, start = Date.parse(v.starts_at), end = Date.parse(v.ends_at);
    if (!definition || v.title !== definition.title || seen.has(key) || start >= end || end - start > 2 * 86400000 ||
        (v.state === 'upcoming' && observed >= start) || (v.state === 'active' && (observed < start || observed >= end)) ||
        (['ended', 'missed', 'completed'].includes(v.state as string) && observed < end) ||
        v.credits !== (v.state === 'completed' ? 50 : 0) ||
        (v.can_confirm && (v.state !== 'ended' || observed < end))) return invalid();
    seen.add(key);
    return { schedule_revision: v.schedule_revision, local_date: v.local_date, starts_at: v.starts_at, ends_at: v.ends_at,
      title: v.title as string, state: v.state as QuestExecutionView['occurrences'][number]['state'], can_confirm: v.can_confirm, credits: v.credits as number };
  });
  if (occurrences.some((v, i) => i > 0 && (v.starts_at < occurrences[i - 1].starts_at || (v.starts_at === occurrences[i - 1].starts_at && v.schedule_revision < occurrences[i - 1].schedule_revision)))) return invalid();
  return { user_id: value.user_id as string, quest_id: id, observed_at: value.observed_at, revision: value.revision, enabled: value.enabled,
    versions, occurrences, credits: value.credits, completed_count: value.completed_count };
}
export function readQuestExecution(id: string, { api, signal }: AccountOperation) {
  return api.request(`${path(id)}/execution`, { signal, decode: (v, c) => decodeQuestExecution(v, c, id) });
}
export function scheduleQuest(id: string, body: QuestSchedulePut, { api, signal }: AccountOperation) {
  return api.request(`${path(id)}/schedule`, { method: 'PUT', json: body, signal, decode: (v, c) => {
    const view = decodeQuestExecution(v, c, id);
    const current = view.versions.find((v) => v.revision === view.revision);
    if (view.revision !== body.expected_revision + 1 || view.enabled !== body.enabled ||
        (body.enabled && (!current || current.quest_revision !== body.quest_revision || current.first_date !== body.first_date))) return invalid();
    return view;
  } });
}
export function recordQuestOutcome(id: string, revision: number, day: string, state: QuestOutcomePut['state'], { api, signal }: AccountOperation) {
  if (!integer(revision, 1) || !isQuestDate(day)) throw new ApiError('validation');
  return api.request(`${path(id)}/occurrences/${revision}/${day}`, { method: 'PUT', json: { state }, signal, decode: (v, c): QuestOutcomeView => {
    own(v, c, id);
    if (v.schedule_revision !== revision || v.local_date !== day || v.state !== state || v.credits !== (state === 'completed' ? 50 : 0)) return invalid();
    return { user_id: v.user_id as string, quest_id: id, schedule_revision: revision, local_date: day, state, credits: v.credits as number };
  } });
}
