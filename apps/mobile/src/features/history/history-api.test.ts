import { describe, expect, it } from 'vitest';
import { decodeHistory, decodeNativeHistory } from './history-api';
import { historyProjection } from './history-projection';
import { historyFixture } from './__tests__/history-fixture';
const A = '00000000-0000-4000-8000-000000000001',
  S = '00000000-0000-4000-8000-000000000002';
const context = { account: { user_id: A, sessionGeneration: 1 } };
describe('History contract and honest projections', () => {
  it('accepts verified ranges and rejects foreign owner or incoherent arithmetic/coverage', () => {
    expect(decodeHistory(historyFixture, context)).toEqual(historyFixture);
    for (const patch of [
      { user_id: S },
      { source: 'fake' },
      { policy_version: 2 },
      { baseline_reported_days: 8 },
      { timezone_id: 'Bad/Zone' },
      { week: { ...historyFixture.week, reported_days: 6 } },
      { week: { ...historyFixture.week, saved_ms: 1 } },
      { week: { ...historyFixture.week, reduction_percent: 99 } },
      { week: { ...historyFixture.week, starts_on: '2026-11-05' } },
      { baseline_ends_before: '2026-11-12' },
    ])
      expect(() =>
        decodeHistory({ ...historyFixture, ...patch }, context),
      ).toThrow();
  });
  it('keeps increased usage negative, percentage absent at zero baseline, missing comparison unavailable', () => {
    const negative = {
      ...historyFixture,
      week: {
        ...historyFixture.week,
        usage_ms: 21 * 3600000,
        saved_ms: -7 * 3600000,
        reduction_percent: -50,
      },
    };
    const view = decodeHistory(negative, context);
    const p = historyProjection(view, true);
    expect(p.weekly).toMatchObject({ state: 'ready', value: { hours: -7 } });
    expect(p.periods.week).toMatchObject({
      state: 'ready',
      data: { reduction: { value: -50 }, savedHours: { value: -7 } },
    });
    const zero = decodeHistory(
      {
        ...historyFixture,
        week: {
          ...historyFixture.week,
          baseline_ms: 0,
          saved_ms: -7 * 3600000,
          reduction_percent: null,
        },
      },
      context,
    );
    expect(historyProjection(zero, true).periods.week).toMatchObject({
      state: 'ready',
      data: { percentageAvailable: false },
    });
    expect(historyProjection(view, false).summary.savedHours.state).toBe(
      'unavailable',
    );
    expect(historyProjection(undefined, true).summary.turnOffs.state).toBe(
      'unavailable',
    );
  });
  it('counts only supplied unique receipt types and carries source, date range and coverage', () => {
    const p = historyProjection(historyFixture, true);
    expect(p.summary.turnOffs).toMatchObject({
      state: 'ready',
      data: { value: 6, source: 'Synced explicit Return home receipts' },
    });
    expect(p.periods.month).toMatchObject({
      state: 'ready',
      data: { current: { period: '2026-10-16 to 2026-11-12' } },
    });
  });
  it('refuses raw native identities or malformed/unsorted aggregate evidence', () => {
    const series = {
      series_id: S,
      timezone_id: 'UTC',
      selected_count: 2,
      started_on: '2026-11-01',
      source: 'android_usage_events_v1',
      days: [{ day: '2026-11-02', usage_ms: 0, coverage: 'reported' }],
    };
    expect(decodeNativeHistory({ state: 'ready', series })).toEqual({
      state: 'ready',
      series,
    });
    for (const patch of [
      { apps: ['private.app'] },
      { selected_count: 0 },
      { days: [{ day: '2026-11-02', usage_ms: 0, coverage: 'missing' }] },
      { days: [series.days[0], series.days[0]] },
      { days: [{ ...series.days[0], package: 'private.app' }] },
    ])
      expect(() =>
        decodeNativeHistory({
          state: 'ready',
          series: { ...series, ...patch },
        }),
      ).toThrow();
    expect(
      decodeNativeHistory({ state: 'selection_changed', series: null }).state,
    ).toBe('selection_changed');
    expect(() =>
      decodeNativeHistory({ state: 'ready', series: null }),
    ).toThrow();
  });
});
