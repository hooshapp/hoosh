import { isUsableMetric, type HistoryMetric, type HistoryReading } from './history-model';
export type HistoryPeriod = 'week' | 'month';
/** Producer-supplied comparison, evidence and narrative; no calculations of savings. */
export type HistoryDetail = Readonly<{
  eligible: boolean;
  baseline: HistoryMetric;
  current: HistoryMetric;
  savedHours: HistoryMetric;
  reduction: HistoryMetric;
  narrative: readonly string[];
}>;
export type HistoryPeriods = Readonly<Record<HistoryPeriod, HistoryReading<HistoryDetail>>>;
export const unavailableHistoryPeriods: HistoryPeriods = {
  week: { state: 'unavailable' },
  month: { state: 'unavailable' },
};
export function usableHistoryDetail(detail: HistoryDetail): boolean {
  return (
    detail.eligible &&
    detail.baseline.value > 0 &&
    detail.current.value <= detail.baseline.value &&
    [detail.baseline, detail.current, detail.savedHours, detail.reduction].every(isUsableMetric) &&
    detail.reduction.value <= 100 &&
    detail.narrative.every((paragraph) => paragraph.trim().length > 0)
  );
}
