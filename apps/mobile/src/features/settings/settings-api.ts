import type {
  ActivityPreferences,
  PlanDraft,
  SettingsPatch,
  SettingsResponse,
  SettingsSavedResponse,
  SettingsView,
} from '@disconnect/contracts';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import { ApiError, isRecord, safeRequestId } from '../../infrastructure/api/errors';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';
import { isActivityId } from '../preferences/activity-model';

const invalid = (): never => {
  throw new ApiError('invalid_response');
};
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const nullableInteger = (v: unknown, max: number): v is number | null =>
  v === null || integer(v, 1, max);
// Validate canonical response edges using the adopted Python 3.12 whitespace set,
// never JS trim. Raw request drafts bypass this response-only validator unchanged.
const edgeSpace =
  /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]$/u;
function activities(value: unknown): ActivityPreferences {
  if (
    !isRecord(value) ||
    !Array.isArray(value.selected_activity_ids) ||
    value.selected_activity_ids.length > 6 ||
    !value.selected_activity_ids.every(isActivityId) ||
    new Set(value.selected_activity_ids).size !== value.selected_activity_ids.length
  )
    return invalid();
  const custom = value.custom_text;
  if (
    !(
      custom === null ||
      (typeof custom === 'string' &&
        Array.from(custom).length >= 1 &&
        Array.from(custom).length <= 200 &&
        !/[\u0000\uD800-\uDFFF]/u.test(custom) &&
        !edgeSpace.test(custom))
    )
  )
    return invalid();
  return {
    selected_activity_ids: [...value.selected_activity_ids],
    custom_text: custom as string | null,
  };
}
const time = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' && /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value));
function plan(value: unknown): PlanDraft | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    !Array.isArray(value.weekdays) ||
    value.weekdays.length > 7 ||
    !value.weekdays.every((d, i, days) => integer(d, 0, 6) && (!i || d > days[i - 1])) ||
    !nullableInteger(value.session_count, 1000) ||
    !nullableInteger(value.session_minutes, 1440)
  )
    return invalid();
  const zone = value.timezone_id;
  // Catalog membership belongs to the backend; client OS timezone databases vary.
  if (
    !(
      zone === null ||
      (typeof zone === 'string' &&
        /^[A-Za-z0-9_+/-]{1,128}$/.test(zone) &&
        !['localtime', 'posixrules'].includes(zone) &&
        !/^(?:posix|right)\//.test(zone))
    )
  )
    return invalid();
  let hours: PlanDraft['hours'] = null;
  if (value.hours !== null) {
    const h = value.hours;
    if (
      !isRecord(h) ||
      !time(h.start_local) ||
      !time(h.end_local) ||
      typeof h.next_day !== 'boolean'
    )
      return invalid();
    if (
      h.start_local !== null &&
      h.end_local !== null &&
      !(h.next_day ? h.end_local < h.start_local : h.end_local > h.start_local)
    )
      return invalid();
    hours = { start_local: h.start_local, end_local: h.end_local, next_day: h.next_day };
  }
  return {
    weekdays: [...value.weekdays],
    hours,
    timezone_id: zone as string | null,
    session_count: value.session_count,
    session_minutes: value.session_minutes,
  };
}
export function decodeSettingsResponse(
  value: unknown,
  { account }: ResponseContext,
): SettingsResponse {
  if (!isRecord(value) || !Object.hasOwn(value, 'settings')) return invalid();
  if (value.settings === null) return { settings: null };
  const row = value.settings;
  if (
    !isRecord(row) ||
    !safeRequestId(row.user_id) ||
    row.user_id !== account?.user_id ||
    !integer(row.revision, 1, 2147483647) ||
    !utcTimestamp(row.created_at) ||
    !utcTimestamp(row.updated_at) ||
    Date.parse(row.updated_at) < Date.parse(row.created_at)
  )
    return invalid();
  return {
    settings: {
      user_id: row.user_id as string,
      revision: row.revision,
      created_at: row.created_at,
      updated_at: row.updated_at,
      activities: activities(row.activities),
      plan_draft: plan(row.plan_draft),
    },
  };
}
export function decodeSettingsSavedResponse(
  value: unknown,
  context: ResponseContext,
): SettingsSavedResponse {
  const response = decodeSettingsResponse(value, context);
  if (!response.settings) return invalid();
  return { settings: response.settings };
}
export function readSettings({ api, signal }: AccountOperation) {
  return api.request('/v1/settings', { signal, decode: decodeSettingsResponse });
}
export function saveSettings(patch: SettingsPatch, { api, signal }: AccountOperation) {
  return api.request('/v1/settings', {
    method: 'PATCH',
    json: patch,
    signal,
    decode: (value, context) => {
      const response = decodeSettingsSavedResponse(value, context);
      if (response.settings.revision !== patch.expected_revision + 1) return invalid();
      return response;
    },
  });
}
export type SettingsSnapshot = SettingsView | null;
