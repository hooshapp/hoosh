import type {
  HistoryPut,
  HistoryView,
  HistoryWindow,
} from '@disconnect/contracts';
import { isQuestDate, isQuestId } from '../../domain/quest-values';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import { ApiError, isRecord } from '../../infrastructure/api/errors';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';
const invalid = (): never => {
  throw new ApiError('invalid_response');
};
const integer = (
  v: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): v is number =>
  Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const nullable = (v: unknown, min = 0) => v === null || integer(v, min);
function window(v: unknown, count: number): HistoryWindow {
  if (
    !isRecord(v) ||
    !isQuestDate(v.starts_on) ||
    !isQuestDate(v.ends_before) ||
    Date.parse(v.ends_before) - Date.parse(v.starts_on) !== count * 86400000 ||
    v.expected_days !== count ||
    !integer(v.reported_days, 0, count) ||
    !nullable(v.usage_ms) ||
    !nullable(v.baseline_ms) ||
    !nullable(v.saved_ms, -Number.MAX_SAFE_INTEGER) ||
    typeof v.eligible !== 'boolean' ||
    ![
      'ready',
      'collecting_baseline',
      'baseline_overlap',
      'incomplete',
    ].includes(v.reason as string) ||
    !(
      v.reduction_percent === null ||
      (typeof v.reduction_percent === 'number' &&
        Number.isFinite(v.reduction_percent) &&
        v.reduction_percent <= 100)
    ) ||
    !isRecord(v.turn_offs) ||
    !['initial', 'expired', 'mid_session'].every((key) =>
      integer((v.turn_offs as Record<string, unknown>)[key]),
    )
  )
    return invalid();
  if (
    (v.usage_ms !== null) !== (v.reported_days === count) ||
    v.eligible !== (v.reason === 'ready') ||
    (v.eligible &&
      (v.baseline_ms === null ||
        v.usage_ms === null ||
        v.saved_ms !== (v.baseline_ms as number) - (v.usage_ms as number))) ||
    (!v.eligible &&
      (v.baseline_ms !== null ||
        v.saved_ms !== null ||
        v.reduction_percent !== null))
  )
    return invalid();
  if (v.eligible) {
    const expected = v.baseline_ms
      ? Math.round(
          (((v.saved_ms as number) * 100) / (v.baseline_ms as number)) * 100,
        ) / 100
      : null;
    if (
      expected === null
        ? v.reduction_percent !== null
        : typeof v.reduction_percent !== 'number' ||
          Math.abs(v.reduction_percent - expected) > 0.011
    )
      return invalid();
  }
  return {
    starts_on: v.starts_on,
    ends_before: v.ends_before,
    expected_days: count,
    reported_days: v.reported_days,
    usage_ms: v.usage_ms as number | null,
    baseline_ms: v.baseline_ms as number | null,
    saved_ms: v.saved_ms as number | null,
    reduction_percent: v.reduction_percent as number | null,
    eligible: v.eligible,
    reason: v.reason as HistoryWindow['reason'],
    turn_offs: {
      initial: v.turn_offs.initial as number,
      expired: v.turn_offs.expired as number,
      mid_session: v.turn_offs.mid_session as number,
    },
  };
}
export function decodeHistory(v: unknown, c: ResponseContext): HistoryView {
  if (
    !isRecord(v) ||
    !c.account ||
    v.user_id !== c.account.user_id ||
    !integer(v.revision, 0, 2147483647) ||
    v.source !== 'android_usage_events_v1' ||
    v.policy_version !== 1 ||
    !utcTimestamp(v.observed_at) ||
    !(v.series_id === null || isQuestId(v.series_id)) ||
    !(v.timezone_id === null || typeof v.timezone_id === 'string') ||
    !(v.selected_count === null || integer(v.selected_count, 1, 512)) ||
    !(v.started_on === null || isQuestDate(v.started_on)) ||
    !(v.baseline_starts_on === null || isQuestDate(v.baseline_starts_on)) ||
    !(v.baseline_ends_before === null || isQuestDate(v.baseline_ends_before)) ||
    !integer(v.baseline_reported_days, 0, 7)
  )
    return invalid();
  const present = v.series_id !== null;
  if (
    [v.timezone_id, v.selected_count, v.started_on].some(
      (x) => (x !== null) !== present,
    ) ||
    present !== v.revision > 0 ||
    (v.baseline_starts_on === null) !== (v.baseline_ends_before === null) ||
    (v.baseline_starts_on !== null) !== (v.baseline_reported_days === 7)
  )
    return invalid();
  if (v.timezone_id) {
    try {
      new Intl.DateTimeFormat('en', { timeZone: v.timezone_id as string });
    } catch {
      return invalid();
    }
  }
  if (
    v.baseline_starts_on &&
    (v.baseline_reported_days !== 7 ||
      Date.parse(v.baseline_ends_before as string) -
        Date.parse(v.baseline_starts_on as string) !==
        7 * 86400000)
  )
    return invalid();
  const week = window(v.week, 7),
    month = window(v.month, 28);
  if (
    week.ends_before !== month.ends_before ||
    [week, month].some(
      (w) =>
        w.eligible &&
        (!v.baseline_ends_before ||
          w.starts_on < (v.baseline_ends_before as string)),
    )
  )
    return invalid();
  return {
    user_id: v.user_id as string,
    revision: v.revision,
    series_id: v.series_id as string | null,
    timezone_id: v.timezone_id as string | null,
    selected_count: v.selected_count as number | null,
    started_on: v.started_on as string | null,
    source: 'android_usage_events_v1',
    policy_version: 1,
    observed_at: v.observed_at,
    baseline_starts_on: v.baseline_starts_on as string | null,
    baseline_ends_before: v.baseline_ends_before as string | null,
    baseline_reported_days: v.baseline_reported_days,
    week,
    month,
    ...(Array.isArray(v.recent_interventions) && v.recent_interventions.length === 2 &&
      v.recent_interventions.every(day => isRecord(day) && isQuestDate(day.day) &&
        integer(day.sessions_started) && integer(day.turn_offs))
      ? { recent_interventions: v.recent_interventions as NonNullable<HistoryView['recent_interventions']> }
      : {}),
  };
}
export function readHistory({ api, signal }: AccountOperation) {
  return api.request('/v1/history', { signal, decode: decodeHistory });
}
export function saveHistory(
  body: HistoryPut,
  { api, signal }: AccountOperation,
) {
  return api.request('/v1/history/series', {
    method: 'PUT',
    signal,
    json: body,
    decode: (v, c) => {
      const result = decodeHistory(v, c);
      if (
        result.series_id !== body.series_id ||
        result.timezone_id !== body.timezone_id ||
        result.selected_count !== body.selected_count ||
        result.started_on !== body.started_on
      )
        return invalid();
      return result;
    },
  });
}
export type NativeHistory =
  | { state: 'ready'; series: Omit<HistoryPut, 'expected_revision'> }
  | {
      state:
        | 'not_started'
        | 'locked'
        | 'needs_permission'
        | 'selection_changed'
        | 'timezone_changed';
      series: null;
    };
/** Reject any raw identities or unexpected native properties before aggregate upload. */
export function decodeNativeHistory(v: unknown): NativeHistory {
  const exact = (v: Record<string, unknown>, keys: string[]) =>
    Object.keys(v).sort().join() === keys.sort().join();
  if (!isRecord(v) || !exact(v, ['state', 'series'])) return invalid();
  if (v.state !== 'ready') {
    if (
      ![
        'not_started',
        'locked',
        'needs_permission',
        'selection_changed',
        'timezone_changed',
      ].includes(v.state as string) ||
      v.series !== null
    )
      return invalid();
    return {
      state: v.state as Exclude<NativeHistory['state'], 'ready'>,
      series: null,
    };
  }
  const s = v.series;
  if (
    !isRecord(s) ||
    !exact(s, [
      'series_id',
      'timezone_id',
      'selected_count',
      'started_on',
      'source',
      'days',
    ]) ||
    !isQuestId(s.series_id) ||
    typeof s.timezone_id !== 'string' ||
    !integer(s.selected_count, 1, 512) ||
    !isQuestDate(s.started_on) ||
    s.source !== 'android_usage_events_v1' ||
    !Array.isArray(s.days) ||
    s.days.length > 56
  )
    return invalid();
  try {
    new Intl.DateTimeFormat('en', { timeZone: s.timezone_id });
  } catch {
    return invalid();
  }
  let previous = '';
  const days = s.days.map((d): HistoryPut['days'][number] => {
    if (
      !isRecord(d) ||
      !exact(d, ['day', 'usage_ms', 'coverage']) ||
      !isQuestDate(d.day) ||
      d.day <= previous ||
      d.day < s.started_on! ||
      !['reported', 'missing', 'capped', 'interrupted'].includes(
        d.coverage as string,
      ) ||
      !(d.coverage === 'reported'
        ? integer(d.usage_ms, 0, 90000000)
        : d.usage_ms === null)
    )
      return invalid();
    previous = d.day;
    return {
      day: d.day,
      usage_ms: d.usage_ms as number | null,
      coverage: d.coverage as HistoryPut['days'][number]['coverage'],
    };
  });
  return {
    state: 'ready',
    series: {
      series_id: s.series_id,
      timezone_id: s.timezone_id,
      selected_count: s.selected_count,
      started_on: s.started_on,
      source: 'android_usage_events_v1',
      days,
    },
  };
}
