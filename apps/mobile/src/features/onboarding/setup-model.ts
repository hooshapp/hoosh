import type { ActivityPreferences, PlanDraft, SettingsView } from '@disconnect/contracts';
import { planDraftInput, planDraftSection, type PlanDraftInput } from '../plans/plan-draft-model';
import { minutesTime } from '../editors/draft-utils';
import { activityDraft, activityPayload } from '../preferences/activity-model';
import type { ActivityDraft } from '../preferences/preference-editors';

type EditablePlan = Exclude<PlanDraftInput, null>;
const edgeWhitespace = /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/gu;
type Result<T> = { value: T; error?: never } | { value?: never; error: string };

export function setupActivities(selected: readonly string[], custom: readonly string[]): Result<ActivityPreferences> {
  if (custom.length > 1) return { error: 'Choose one custom activity to keep.' };
  const raw = custom[0];
  if (raw !== undefined) {
    const stripped = raw.replace(edgeWhitespace, '');
    if (!stripped || /[\u0000\uD800-\uDFFF]/u.test(raw)) return { error: 'Enter a valid custom activity or clear it.' };
    if (Array.from(stripped).length > 200) return { error: 'Custom activities can have up to 200 characters.' };
  }
  try {
    return { value: activityPayload({ selected, customSelected: raw !== undefined, custom: raw ?? '' }) };
  } catch {
    return { error: 'Review the activities you selected.' };
  }
}

function recognizedZone(zone: string): boolean {
  if (!/^[A-Za-z][A-Za-z0-9_+/-]{0,127}$/.test(zone) || /^(localtime$|posixrules$|(?:posix|right)\/)/.test(zone)) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function setupPlan(input: PlanDraftInput): Result<PlanDraft | null> {
  if (input === null) return { value: null };
  if (input.timezone !== '' && !recognizedZone(input.timezone)) {
    return { error: 'Use a recognized timezone such as America/New_York.' };
  }
  try {
    const days = planDraftSection('days', input, null);
    const hours = planDraftSection('hours', input, days);
    return { value: planDraftSection('sessions', input, hours) };
  } catch {
    return { error: 'Check your days, start and end times, and session values.' };
  }
}

export function setupTime(minutes: number): Result<string> {
  return Number.isInteger(minutes) && minutes >= 0 && minutes <= 1439
    ? { value: minutesTime(minutes) }
    : { error: 'Choose a time from 00:00 to 23:59.' };
}

export function starterPlan(timezone: string): EditablePlan {
  return {
    weekdays: [0, 1, 2, 3, 4],
    hours: { start: minutesTime(540), end: minutesTime(1320), nextDay: false },
    timezone,
    sessions: { count: 2, minutes: 15 },
  };
}

export function reviewSavedSettings(settings: SettingsView): { activities: ActivityDraft; plan: PlanDraftInput } {
  return {
    activities: activityDraft(settings.activities),
    plan: settings.plan_draft === null ? null : planDraftInput(settings.plan_draft),
  };
}
