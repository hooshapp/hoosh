/** Figma App-UI 10769:238. A chart budget is NOT a per-app PlanDraft. */
export const SUGGESTED_BUDGET_POLICY = 'selected_apps_shared_v1' as const;
export const SUGGESTED_BUDGET_ROWS = [
  { baselineHours: 2, sessionsPerDay: 5, minutesPerSession: 5 },
  { baselineHours: 3, sessionsPerDay: 6, minutesPerSession: 10 },
  { baselineHours: 5, sessionsPerDay: 8, minutesPerSession: 15 },
  { baselineHours: 10, sessionsPerDay: 10, minutesPerSession: 20 },
  { baselineHours: 12, sessionsPerDay: 12, minutesPerSession: 20 },
  { baselineHours: 15, sessionsPerDay: 14, minutesPerSession: 25 },
  { baselineHours: 18, sessionsPerDay: 15, minutesPerSession: 30 },
  { baselineHours: 20, sessionsPerDay: 16, minutesPerSession: 30 },
] as const;
export type SelectedAppBaseline = Readonly<{
  owner: string;
  selectionRevision: number;
  selectedAppCount: number;
  /** Seven completed consecutive local dates immediately before endsBefore. */
  endsBefore: string;
  days: readonly { date: string; usageMs: number | null; coverage: 'reported' | 'missing' | 'partial' }[];
}>;
export type SuggestedBudget = Readonly<{
  policy: typeof SUGGESTED_BUDGET_POLICY;
  scope: 'all_selected_apps';
  owner: string;
  selectionRevision: number;
  selectedAppCount: number;
  source: 'android_usage_events_v1' | 'user_confirmed_report';
  windowDays: 1 | 7;
  baselineEndsBefore: string;
  baselineAverageMinutes: number;
  matchedBaselineHours: number;
  sessionsPerDay: number;
  minutesPerSession: number;
  dailyMinutes: number;
  /** Important for sub-two-hour baselines: nearest-row policy can increase access. */
  exceedsBaseline: boolean;
}>;
export type BudgetDecision =
  | { state: 'ready'; budget: SuggestedBudget }
  | { state: 'unavailable'; reason: 'missing_baseline' | 'selection_changed' | 'incomplete_baseline' | 'invalid_baseline' };
const DAY = 86400000, MINUTE = 60000;
function dateEpoch(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const epoch = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(epoch) && new Date(epoch).toISOString().slice(0, 10) === value ? epoch : null;
}
/** No network/AI guessing. Missing days are never zero-filled; ties select the higher row. */
export function suggestSharedBudget(baseline: SelectedAppBaseline | null, expected: {
  owner: string; selectionRevision: number; selectedAppCount: number; endsBefore: string;
}): BudgetDecision {
  if (!baseline) return { state: 'unavailable', reason: 'missing_baseline' };
  if (baseline.owner !== expected.owner || baseline.selectionRevision !== expected.selectionRevision || baseline.selectedAppCount !== expected.selectedAppCount)
    return { state: 'unavailable', reason: 'selection_changed' };
  const end = dateEpoch(expected.endsBefore);
  if (end === null || baseline.endsBefore !== expected.endsBefore || !Number.isSafeInteger(expected.selectionRevision) || expected.selectionRevision < 1 || !Number.isSafeInteger(expected.selectedAppCount) || expected.selectedAppCount < 1 || expected.selectedAppCount > 512)
    return { state: 'unavailable', reason: 'invalid_baseline' };
  if (baseline.days.length !== 7) return { state: 'unavailable', reason: 'incomplete_baseline' };
  const days = [...baseline.days].sort((a, b) => a.date.localeCompare(b.date));
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const day = days[i];
    if (dateEpoch(day.date) !== end - (7 - i) * DAY || day.coverage !== 'reported' || day.usageMs === null)
      return { state: 'unavailable', reason: 'incomplete_baseline' };
    // Allow a long DST day. Native collectors must additionally bound to actual day length.
    if (!Number.isSafeInteger(day.usageMs) || day.usageMs < 0 || day.usageMs > 26 * 60 * MINUTE)
      return { state: 'unavailable', reason: 'invalid_baseline' };
    total += day.usageMs;
  }
  return fromTotal(total, 7, expected, 'android_usage_events_v1');
}
type Expected = { owner: string; selectionRevision: number; selectedAppCount: number; endsBefore: string };
function fromTotal(total: number, windowDays: 1 | 7, expected: Expected, source: SuggestedBudget['source']): BudgetDecision {
  const row = SUGGESTED_BUDGET_ROWS.reduce<(typeof SUGGESTED_BUDGET_ROWS)[number]>((best, candidate) =>
    Math.abs(total - candidate.baselineHours * 60 * MINUTE * windowDays) <= Math.abs(total - best.baselineHours * 60 * MINUTE * windowDays) ? candidate : best,
  SUGGESTED_BUDGET_ROWS[0]);
  const dailyMinutes = row.sessionsPerDay * row.minutesPerSession;
  return { state: 'ready', budget: {
    policy: SUGGESTED_BUDGET_POLICY, scope: 'all_selected_apps', owner: expected.owner,
    selectionRevision: expected.selectionRevision, selectedAppCount: expected.selectedAppCount,
    source, windowDays, baselineEndsBefore: expected.endsBefore, baselineAverageMinutes: total / (windowDays * MINUTE),
    matchedBaselineHours: row.baselineHours, sessionsPerDay: row.sessionsPerDay,
    minutesPerSession: row.minutesPerSession, dailyMinutes, exceedsBaseline: dailyMinutes * MINUTE * windowDays > total,
  } };
}
/** Prevent silently expanding one shared budget into N independent per-app allowances. */
export function canApplySuggestedBudget(budget: SuggestedBudget, capability: { scope: 'per_app' | 'all_selected_apps'; policy: string }): boolean {
  return budget.scope === capability.scope && budget.policy === capability.policy;
}

/** Decode native aggregate input without retaining application identifiers or inventing missing days. */
export function suggestFromNative(value: unknown, expected: Expected): BudgetDecision {
  if (!value || typeof value !== 'object') return { state: 'unavailable', reason: 'missing_baseline' };
  const v = value as Record<string, unknown>;
  if (v.owner !== expected.owner || v.selectionRevision !== expected.selectionRevision || v.selectedAppCount !== expected.selectedAppCount)
    return { state: 'unavailable', reason: 'selection_changed' };
  if (dateEpoch(expected.endsBefore) === null || v.endsBefore !== expected.endsBefore || expected.selectionRevision < 1 || expected.selectedAppCount < 1)
    return { state: 'unavailable', reason: 'invalid_baseline' };
  if (v.source === 'user_confirmed_report' && v.state === 'confirmed' && v.windowDays === 1 &&
      Number.isSafeInteger(v.totalMinutes) && (v.totalMinutes as number) >= 0 && (v.totalMinutes as number) <= v.windowDays * 26 * 60)
    return fromTotal((v.totalMinutes as number) * MINUTE, v.windowDays, expected, 'user_confirmed_report');
  if (v.source !== 'android_usage_events_v1' || v.state !== 'ready' || !Array.isArray(v.days) || ![1, 7].includes(v.days.length) ||
      v.days.some(d => !d || typeof d !== 'object' || typeof d.date !== 'string'))
    return { state: 'unavailable', reason: 'missing_baseline' };
  const baseline = { ...expected, days: v.days } as SelectedAppBaseline;
  const yesterday = new Date(dateEpoch(expected.endsBefore)! - DAY).toISOString().slice(0, 10);
  const matches = baseline.days.filter(d => d.date === yesterday);
  const day = matches[0];
  if (matches.length !== 1 || day.coverage !== 'reported' || !Number.isSafeInteger(day.usageMs) || day.usageMs! < 0 || day.usageMs! > 26 * 60 * MINUTE)
    return { state: 'unavailable', reason: 'incomplete_baseline' };
  return fromTotal(day.usageMs!, 1, expected, 'android_usage_events_v1');
}
