import type { PlanDraft, SettingsPatch, SettingsView } from '@disconnect/contracts';
import { ApiError, type ValidationIssue } from '../../infrastructure/api/errors';
import { parseTime, weekdays } from '../editors/draft-utils';
import type { HoursDraft, SessionsDraft } from './plan-editors';

export type PlanField = 'days' | 'hours' | 'sessions';
export const isPlanField = (value: unknown): value is PlanField =>
  value === 'days' || value === 'hours' || value === 'sessions';
export type PlanDraftInput = {
  weekdays: readonly number[];
  hours: HoursDraft | null;
  timezone: string;
  sessions: SessionsDraft;
} | null; // null is explicit intent to clear the whole section on the next Save.
export const emptyPlanDraft = (): PlanDraft => ({
  weekdays: [],
  hours: null,
  timezone_id: null,
  session_count: null,
  session_minutes: null,
});
export function planDraftInput(plan: PlanDraft | null): Exclude<PlanDraftInput, null> {
  return {
    weekdays: plan?.weekdays ?? [],
    hours: plan?.hours
      ? {
          start: plan.hours.start_local ?? '',
          end: plan.hours.end_local ?? '',
          nextDay: plan.hours.next_day,
        }
      : null,
    timezone: plan?.timezone_id ?? '',
    sessions: { count: plan?.session_count ?? null, minutes: plan?.session_minutes ?? null },
  };
}
export function validDraftHours(hours: HoursDraft): boolean {
  const start = parseTime(hours.start),
    end = parseTime(hours.end);
  return (
    (hours.start === '' || start !== null) &&
    (hours.end === '' || end !== null) &&
    (start === null || end === null || (hours.nextDay ? end < start : end > start))
  );
}
const sortedDays = (days: readonly number[]) => [...days].sort((a, b) => a - b).join(',');
export function samePlanInput(field: PlanField, a: PlanDraftInput, b: PlanDraftInput): boolean {
  if (a === null || b === null) return a === b;
  if (field === 'days') return sortedDays(a.weekdays) === sortedDays(b.weekdays);
  if (field === 'sessions')
    return a.sessions.count === b.sessions.count && a.sessions.minutes === b.sessions.minutes;
  return (
    a.timezone === b.timezone &&
    (a.hours === null || b.hours === null
      ? a.hours === b.hours
      : a.hours.start === b.hours.start &&
        a.hours.end === b.hours.end &&
        a.hours.nextDay === b.hours.nextDay)
  );
}
function invalid(field: ValidationIssue['field'], code: ValidationIssue['code']): never {
  throw new ApiError('validation', { details: { fields: [{ field, code }] } });
}
/** Replace only the viewed fields in the base document. After explicit review, base is latest. */
export function planDraftPatch(
  field: PlanField,
  draft: PlanDraftInput,
  settings: SettingsView | null,
): SettingsPatch {
  return { expected_revision: settings?.revision ?? 0, plan_draft: planDraftSection(field, draft, settings?.plan_draft ?? null) };
}
/** The same section validation/merge for local staging; no invented HTTP revision or account. */
export function planDraftSection(field: PlanField, draft: PlanDraftInput, base: PlanDraft | null): PlanDraft | null {
  if (draft === null) return null;
  const plan = { ...(base ?? emptyPlanDraft()) };
  if (field === 'days') {
    if (
      draft.weekdays.length > 7 ||
      new Set(draft.weekdays).size !== draft.weekdays.length ||
      !draft.weekdays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    )
      invalid('plan_draft.weekdays', 'out_of_range');
    plan.weekdays = [...draft.weekdays].sort((a, b) => a - b);
  } else if (field === 'hours') {
    if (draft.hours && !validDraftHours(draft.hours)) invalid('plan_draft.hours', 'invalid_range');
    plan.hours = draft.hours
      ? {
          start_local: draft.hours.start || null,
          end_local: draft.hours.end || null,
          next_day: draft.hours.nextDay,
        }
      : null;
    // Blank is explicit unset. Do not trim, guess the device timezone or validate OS catalog membership.
    plan.timezone_id = draft.timezone === '' ? null : draft.timezone;
  } else {
    const { count, minutes } = draft.sessions;
    if (count !== null && (!Number.isSafeInteger(count) || count < 1 || count > 1000))
      invalid('plan_draft.session_count', 'out_of_range');
    if (minutes !== null && (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 1440))
      invalid('plan_draft.session_minutes', 'out_of_range');
    plan.session_count = count;
    plan.session_minutes = minutes;
  }
  return plan;
}
export function planSummary(field: PlanField, plan: PlanDraft | null): string {
  if (!plan) return 'No saved draft';
  if (field === 'days')
    return `Draft: ${plan.weekdays.length ? plan.weekdays.map((day) => weekdays[day]).join(', ') : 'no days chosen'}`;
  if (field === 'sessions')
    return `Draft: count ${plan.session_count ?? 'not set'}; minutes ${plan.session_minutes ?? 'not set'}`;
  const hours = plan.hours;
  return `Draft: ${hours ? `${hours.start_local ?? 'start not set'}–${hours.end_local ?? 'end not set'}${hours.next_day ? ' (next day)' : ''}` : 'no hours chosen'}; ${plan.timezone_id ?? 'timezone not set'}`;
}
export function planReviewSummary(plan: PlanDraft | null): string {
  return plan
    ? [planSummary('days', plan), planSummary('hours', plan), planSummary('sessions', plan)].join(
        ' | ',
      )
    : 'No saved draft';
}
