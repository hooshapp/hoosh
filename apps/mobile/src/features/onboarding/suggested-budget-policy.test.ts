import { describe, expect, it } from 'vitest';
import { canApplySuggestedBudget, suggestSharedBudget, SUGGESTED_BUDGET_ROWS, type SelectedAppBaseline } from './suggested-budget-policy';
const expected = { owner: 'owner-a', selectionRevision: 3, selectedAppCount: 2, endsBefore: '2026-11-24' };
function baseline(hours: number): SelectedAppBaseline {
  return { ...expected, days: Array.from({ length: 7 }, (_, i) => ({ date: `2026-11-${17 + i}`, usageMs: hours * 3600000, coverage: 'reported' as const })) };
}
describe('Figma 10769:238 shared starting-budget policy', () => {
  it.each(SUGGESTED_BUDGET_ROWS)('matches the $baselineHours-hour row exactly', row => {
    expect(suggestSharedBudget(baseline(row.baselineHours), expected)).toMatchObject({ state: 'ready', budget: {
      scope: 'all_selected_apps', matchedBaselineHours: row.baselineHours, sessionsPerDay: row.sessionsPerDay,
      minutesPerSession: row.minutesPerSession, dailyMinutes: row.sessionsPerDay * row.minutesPerSession,
    } });
  });
  it.each([[2.5, 3], [4, 5], [7.5, 10], [11, 12], [13.5, 15], [16.5, 18], [19, 20]])('rounds exact midpoint %s upward to %s', (hours, match) => {
    expect(suggestSharedBudget(baseline(hours), expected)).toMatchObject({ state: 'ready', budget: { matchedBaselineHours: match } });
  });
  it('uses the seven-day selected-app total rather than the newest day or per-app average', () => {
    const value = baseline(0);
    expect(suggestSharedBudget({ ...value, days: value.days.map((d, i) => ({ ...d, usageMs: (i === 0 ? 14 : 0) * 3600000 })) }, expected)).toMatchObject({ state: 'ready', budget: { baselineAverageMinutes: 120, sessionsPerDay: 5, dailyMinutes: 25 } });
  });
  it('never multiplies the shared allowance by selected-app count', () => {
    const result = suggestSharedBudget(baseline(5), expected);
    expect(result).toMatchObject({ state: 'ready', budget: { dailyMinutes: 120 } });
    if (result.state === 'ready') expect(canApplySuggestedBudget(result.budget, { scope: 'per_app', policy: 'legacy' })).toBe(false);
  });
  it('does not fabricate a baseline from authorization or missing history', () => {
    expect(suggestSharedBudget(null, expected)).toEqual({ state: 'unavailable', reason: 'missing_baseline' });
    const value = baseline(5);
    expect(suggestSharedBudget({ ...value, days: value.days.slice(1) }, expected).state).toBe('unavailable');
    expect(suggestSharedBudget({ ...value, days: value.days.map((d, i) => i === 0 ? { ...d, usageMs: null, coverage: 'missing' } : d) }, expected).state).toBe('unavailable');
  });
  it('rejects other owners, changed selections, stale ranges, duplicates and invalid durations', () => {
    const value = baseline(5);
    for (const changed of [{ ...value, owner: 'owner-b' }, { ...value, selectionRevision: 4 }, { ...value, endsBefore: '2026-11-23' }, { ...value, days: Array(7).fill(value.days[0]) }, { ...value, days: value.days.map(d => ({ ...d, usageMs: -1 })) }])
      expect(suggestSharedBudget(changed, expected).state).toBe('unavailable');
  });
  it('flags the chart minimum increasing a very low baseline rather than hiding the edge case', () => {
    expect(suggestSharedBudget(baseline(0), expected)).toMatchObject({ state: 'ready', budget: { dailyMinutes: 25, exceedsBaseline: true } });
  });
});

import { suggestFromNative } from './suggested-budget-policy';
describe('native usage input', () => {
  const raw = { ...baseline(5), state: 'ready', source: 'android_usage_events_v1' };
  it('uses seven complete days when available', () => {
    expect(suggestFromNative(raw, expected)).toMatchObject({ state: 'ready', budget: { windowDays: 7, dailyMinutes: 120 } });
  });
  it('falls back to actual yesterday without zero filling older missing days', () => {
    expect(suggestFromNative({ ...raw, days: raw.days.map((d, i) => i === 0 ? { ...d, coverage: 'missing', usageMs: null } : d) }, expected)).toMatchObject({ state: 'ready', budget: { windowDays: 1, dailyMinutes: 120 } });
  });
  it('does not fall back to an incomplete yesterday', () => {
    expect(suggestFromNative({ ...raw, days: raw.days.map(d => ({ ...d, coverage: 'missing' })) }, expected).state).toBe('unavailable');
  });
  it('divides a user-confirmed seven-day total rather than treating it as daily usage', () => {
    expect(suggestFromNative({ ...expected, state: 'confirmed', source: 'user_confirmed_report', windowDays: 7, totalMinutes: 2100 }, expected)).toMatchObject({ state: 'ready', budget: { source: 'user_confirmed_report', baselineAverageMinutes: 300, dailyMinutes: 120 } });
  });
  it('rejects stale selections and malformed totals', () => {
    expect(suggestFromNative({ ...raw, selectionRevision: 999 }, expected).state).toBe('unavailable');
    expect(suggestFromNative({ ...expected, state: 'confirmed', source: 'user_confirmed_report', windowDays: 1, totalMinutes: -1 }, expected).state).toBe('unavailable');
  });
});
