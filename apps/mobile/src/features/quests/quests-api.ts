import type {
  QuestDefinition,
  QuestPage,
  QuestPut,
  QuestResponse,
  QuestSavedResponse,
  QuestView,
} from '@disconnect/contracts';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import { ApiError, isRecord, safeRequestId } from '../../infrastructure/api/errors';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';
const invalid = (): never => {
  throw new ApiError('invalid_response');
};
const integer = (n: unknown, min: number, max: number): n is number =>
  Number.isSafeInteger(n) && (n as number) >= min && (n as number) <= max;
const whitespace =
  /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000]+$/gu;
function text(value: unknown, max: number, canonical: boolean): string {
  if (typeof value !== 'string' || /[\u0000\uD800-\uDFFF]/u.test(value)) return invalid();
  const stripped = value.replace(whitespace, '');
  if (!stripped || Array.from(stripped).length > max || (canonical && stripped !== value))
    return invalid();
  return stripped;
}
export function questDefinition(value: unknown, canonical = true): QuestDefinition {
  if (
    !isRecord(value) ||
    Object.keys(value).sort().join(',') !==
      'activity,end_local,next_day,repeat,start_local,timezone_id,title,weekdays'
  )
    return invalid();
  const time = (v: unknown): v is string =>
    typeof v === 'string' && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
  if (
    !time(value.start_local) ||
    !time(value.end_local) ||
    typeof value.next_day !== 'boolean' ||
    !(value.next_day ? value.end_local < value.start_local : value.end_local > value.start_local) ||
    !['none', 'daily', 'weekly'].includes(value.repeat as string) ||
    !Array.isArray(value.weekdays) ||
    value.weekdays.length > 7 ||
    !value.weekdays.every((d) => integer(d, 0, 6)) ||
    new Set(value.weekdays).size !== value.weekdays.length ||
    (canonical && value.weekdays.some((d, i, ds) => i > 0 && d <= ds[i - 1])) ||
    (value.repeat === 'weekly') !== value.weekdays.length > 0 ||
    typeof value.timezone_id !== 'string' ||
    !/^[A-Za-z0-9_+/-]{1,128}$/.test(value.timezone_id) ||
    ['localtime', 'posixrules'].includes(value.timezone_id)
  )
    return invalid();
  return {
    title: text(value.title, 120, canonical),
    activity: text(value.activity, 200, canonical),
    start_local: value.start_local,
    end_local: value.end_local,
    next_day: value.next_day,
    repeat: value.repeat as QuestDefinition['repeat'],
    weekdays: [...value.weekdays].sort((a, b) => a - b),
    timezone_id: value.timezone_id,
  };
}
function row(value: unknown, context: ResponseContext): QuestView {
  if (
    !isRecord(value) ||
    !safeRequestId(value.user_id) ||
    !safeRequestId(value.quest_id) ||
    value.quest_id !== safeRequestId(value.quest_id) ||
    value.user_id !== context.account?.user_id ||
    !integer(value.revision, 1, 2147483647) ||
    !utcTimestamp(value.created_at) ||
    !utcTimestamp(value.updated_at) ||
    Date.parse(value.updated_at) < Date.parse(value.created_at)
  )
    return invalid();
  return {
    user_id: value.user_id as string,
    quest_id: value.quest_id as string,
    revision: value.revision,
    definition: questDefinition(value.definition),
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}
export function decodeQuestResponse(
  value: unknown,
  context: ResponseContext,
  id: string,
): QuestResponse {
  if (
    !context.account ||
    !isRecord(value) ||
    !integer(value.revision, 0, 2147483647) ||
    !Object.hasOwn(value, 'quest')
  )
    return invalid();
  if (value.quest === null) return { quest: null, revision: value.revision };
  const quest = row(value.quest, context);
  if (quest.quest_id !== id || quest.revision !== value.revision) return invalid();
  return { quest, revision: value.revision };
}
export function decodeQuestPage(
  value: unknown,
  context: ResponseContext,
  cursor: string | null,
): QuestPage {
  if (
    !isRecord(value) ||
    !context.account ||
    !Array.isArray(value.quests) ||
    value.quests.length > 50 ||
    !(value.next_cursor === null || safeRequestId(value.next_cursor))
  )
    return invalid();
  const quests = value.quests.map((q) => row(q, context));
  if (
    quests.some((q, i) => q.quest_id <= (i ? quests[i - 1].quest_id : (cursor ?? ''))) ||
    (value.next_cursor !== null &&
      (!quests.length || value.next_cursor !== quests.at(-1)?.quest_id))
  )
    return invalid();
  return { quests, next_cursor: value.next_cursor as string | null };
}
function path(id: string) {
  if (safeRequestId(id) !== id) throw new ApiError('validation');
  return `/v1/quests/${id}`;
}
export function readQuest(id: string, { api, signal }: AccountOperation) {
  return api.request(path(id), { signal, decode: (v, c) => decodeQuestResponse(v, c, id) });
}
export function readQuests(cursor: string | null, { api, signal }: AccountOperation) {
  if (cursor) path(cursor);
  return api.request(`/v1/quests?limit=50${cursor ? `&cursor=${cursor}` : ''}`, {
    signal,
    decode: (v, c) => decodeQuestPage(v, c, cursor),
  });
}
export function saveQuest(id: string, body: QuestPut, { api, signal }: AccountOperation) {
  return api.request(path(id), {
    method: 'PUT',
    json: body,
    signal,
    decode: (v, c): QuestSavedResponse => {
      if (!isRecord(v) || !isRecord(v.quest)) return invalid();
      const response = decodeQuestResponse({ quest: v.quest, revision: v.quest.revision }, c, id);
      if (
        !response.quest ||
        response.quest.revision !== body.expected_revision + 1 ||
        JSON.stringify(response.quest.definition) !==
          JSON.stringify(questDefinition(body.definition, false))
      )
        return invalid();
      return { quest: response.quest };
    },
  });
}
export function deleteQuest(id: string, revision: number, { api, signal }: AccountOperation) {
  return api.request(path(id), {
    method: 'DELETE',
    json: { expected_revision: revision },
    signal,
    decode: (v) => {
      if (
        !isRecord(v) ||
        v.quest_id !== id ||
        !integer(v.revision, 0, 2147483647) ||
        (v.revision !== 0 && v.revision <= revision)
      )
        return invalid();
      return { quest_id: id, revision: v.revision };
    },
  });
}
