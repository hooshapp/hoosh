import type { HistoryView } from '@disconnect/contracts';
const A = '00000000-0000-4000-8000-000000000001',
  S = '00000000-0000-4000-8000-000000000002';
const window = (days: number) => ({
  starts_on: days === 7 ? '2026-11-06' : '2026-10-16',
  ends_before: '2026-11-13',
  expected_days: days,
  reported_days: days,
  usage_ms: 3600000 * days,
  baseline_ms: 7200000 * days,
  saved_ms: 3600000 * days,
  reduction_percent: 50,
  eligible: true,
  reason: 'ready' as const,
  turn_offs: { initial: 3, expired: 2, mid_session: 1 },
});
export const historyFixture: HistoryView = {
  user_id: A,
  revision: 2,
  series_id: S,
  timezone_id: 'UTC',
  selected_count: 2,
  started_on: '2026-10-01',
  source: 'android_usage_events_v1',
  policy_version: 1,
  observed_at: '2026-11-13T12:00:00Z',
  baseline_starts_on: '2026-10-01',
  baseline_ends_before: '2026-10-08',
  baseline_reported_days: 7,
  week: window(7),
  month: window(28),
};
