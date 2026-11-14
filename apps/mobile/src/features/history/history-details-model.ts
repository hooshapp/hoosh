import {
  isUsableMetric,
  type HistoryMetric,
  type HistoryReading,
} from './history-model';
export type HistoryPeriod = 'week' | 'month';
/** Producer-supplied comparison, evidence and narrative; no calculations of savings. */
export type HistoryDetail = Readonly<{
  eligible: boolean;
  percentageAvailable?: boolean;
  baseline: HistoryMetric;
  current: HistoryMetric;
  savedHours: HistoryMetric;
  reduction: HistoryMetric;
  narrative: readonly string[];
}>;
export type HistoryPeriods = Readonly<
  Record<HistoryPeriod, HistoryReading<HistoryDetail>>
>;
export const unavailableHistoryPeriods: HistoryPeriods = {
  week: { state: 'unavailable' },
  month: { state: 'unavailable' },
};
export function usableHistoryDetail(detail: HistoryDetail): boolean {
  return (
    detail.eligible &&
    (detail.baseline.value > 0 || detail.percentageAvailable === false) &&
    [detail.baseline, detail.current].every((m) => isUsableMetric(m)) &&
    [detail.savedHours, detail.reduction].every((m) =>
      isUsableMetric(m, true),
    ) &&
    detail.reduction.value <= 100 &&
    Math.abs(
      detail.savedHours.value - (detail.baseline.value - detail.current.value),
    ) < 0.02 &&
    (detail.percentageAvailable === false ||
      Math.abs(
        detail.reduction.value -
          (detail.baseline.value > 0
            ? (100 * detail.savedHours.value) / detail.baseline.value
            : 0),
      ) < 0.1) &&
    detail.narrative.every((paragraph) => paragraph.trim().length > 0)
  );
}
