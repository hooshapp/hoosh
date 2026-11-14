import type { HistoryView, HistoryWindow } from '@disconnect/contracts';
import type { HistoryModel, HistoryMetric } from './history-model';
import { unavailableHistory } from './history-model';
import type { HistoryDetail, HistoryPeriods } from './history-details-model';
import type { HomeModel } from '../home/home-model';
const hours = (ms: number) => ms / 3600000;
const displayHours = (ms: number) =>
  hours(ms).toLocaleString(undefined, { maximumFractionDigits: 2 });
const range = (start: string, end: string) =>
  `${start} to ${new Date(Date.parse(end) - 86400000).toISOString().slice(0, 10)}`;
const source =
  'Android selected-app foreground estimate · normalized to 24-hour days';
function metric(
  value: number,
  display: string,
  period: string,
  coverage: string,
): HistoryMetric {
  return { value, display, period, source, coverage };
}
export function historyProjection(
  view: HistoryView | undefined,
  usageAvailable: boolean,
): {
  summary: HistoryModel;
  monthlySummary: HistoryModel;
  periods: HistoryPeriods;
  weekly: HomeModel['weekly'];
} {
  const periods: HistoryPeriods = {
    week: { state: 'unavailable' },
    month: { state: 'unavailable' },
  };
  if (!view)
    return {
      summary: unavailableHistory,
      monthlySummary: unavailableHistory,
      periods,
      weekly: { state: 'unavailable' },
    };
  const detail = (w: HistoryWindow): HistoryDetail | null => {
    if (
      !usageAvailable ||
      !w.eligible ||
      w.baseline_ms === null ||
      w.usage_ms === null ||
      w.saved_ms === null
    )
      return null;
    const p = range(w.starts_on, w.ends_before),
      coverage = `${w.reported_days}/${w.expected_days} closed days reported · ${view.selected_count} saved apps · ${view.timezone_id}`;
    const baselineRange = range(
      view.baseline_starts_on!,
      view.baseline_ends_before!,
    );
    return {
      eligible: true,
      baseline: metric(
        hours(w.baseline_ms),
        displayHours(w.baseline_ms),
        `${baselineRange}${w.expected_days === 28 ? ' × four weeks' : ''}`,
        coverage,
      ),
      current: metric(hours(w.usage_ms), displayHours(w.usage_ms), p, coverage),
      savedHours: metric(
        hours(w.saved_ms),
        displayHours(w.saved_ms),
        p,
        coverage,
      ),
      reduction: metric(
        w.reduction_percent ?? 0,
        w.reduction_percent === null
          ? '—'
          : String(Math.abs(w.reduction_percent)),
        p,
        coverage,
      ),
      percentageAvailable: w.reduction_percent !== null,
      narrative: [
        `${displayHours(w.usage_ms)} hours for your saved apps during ${p}, compared with ${displayHours(w.baseline_ms)} hours at your fixed starting baseline.`,
        w.saved_ms >= 0
          ? `${displayHours(w.saved_ms)} fewer estimated hours. This is a usage comparison, not proof that Disconnect caused the change.`
          : `${displayHours(-w.saved_ms)} more estimated hours. Increased usage is shown honestly; it is not counted as time saved.`,
        'Android may omit or expire usage events. These figures use retained boundary witnesses; unmeasurable days are excluded from comparisons.',
      ],
    };
  };
  const week = detail(view.week),
    month = detail(view.month);
  const readyPeriods: HistoryPeriods = {
    week: week ? { state: 'ready', data: week } : { state: 'unavailable' },
    month: month ? { state: 'ready', data: month } : { state: 'unavailable' },
  };
  function summary(
    w: HistoryWindow,
    measured: HistoryDetail | null,
  ): HistoryModel {
    const counts = w.turn_offs,
      total = counts.initial + counts.expired + counts.mid_session;
    const turnOffs: HistoryMetric = {
      value: total,
      display: String(total),
      period: range(w.starts_on, w.ends_before),
      source: 'Synced explicit Return home receipts',
      coverage: `Opening ${counts.initial} · session-end ${counts.expired} · mid-session ${counts.mid_session}. Unsynced/device gaps are not included.`,
    };
    return {
      periodDays: w.expected_days as 7 | 28,
      periodLabel: range(w.starts_on, w.ends_before),
      turnOffs: { state: 'ready', data: turnOffs },
      screenTime: measured
        ? {
            state: 'ready',
            data: {
              eligible: true,
              before: measured.baseline,
              now: measured.current,
            },
          }
        : { state: 'unavailable' },
      savedHours: measured
        ? { state: 'ready', data: measured.savedHours }
        : { state: 'unavailable' },
    };
  }
  return {
    summary: summary(view.week, week),
    monthlySummary: summary(view.month, month),
    periods: readyPeriods,
    weekly: week
      ? {
          state: 'ready',
          value: {
            hours: week.savedHours.value,
            periodLabel: 'last 7 closed days',
            rangeLabel: week.current.period,
            sourceLabel: source,
            coverageLabel: week.current.coverage,
          },
        }
      : { state: 'unavailable' },
  };
}
