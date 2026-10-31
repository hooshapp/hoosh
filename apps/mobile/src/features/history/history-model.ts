/** Presentation only. The future insights producer owns measurement and eligibility. */
export type HistoryMetric = Readonly<{
  value: number;
  display: string;
  period: string;
  source: string;
  coverage: string;
}>;
export type HistoryReading<T> =
  | Readonly<{ state: 'ready'; data: T }>
  | Readonly<{ state: 'loading' | 'error' | 'unavailable' }>;
export type HistoryComparison = Readonly<{
  eligible: boolean;
  before: HistoryMetric;
  now: HistoryMetric;
}>;
export type HistoryModel = Readonly<{
  periodLabel: string | null;
  turnOffs: HistoryReading<HistoryMetric>;
  screenTime: HistoryReading<HistoryComparison>;
  savedHours: HistoryReading<HistoryMetric>;
}>;
export const unavailableHistory: HistoryModel = {
  periodLabel: null,
  turnOffs: { state: 'unavailable' },
  screenTime: { state: 'unavailable' },
  savedHours: { state: 'unavailable' },
};
/** Zero is valid. Missing provenance, NaN and negative readings are not measurements. */
export function isUsableMetric(metric: HistoryMetric): boolean {
  return (
    Number.isFinite(metric.value) &&
    metric.value >= 0 &&
    [metric.display, metric.period, metric.source, metric.coverage].every(
      (text) => text.trim().length > 0,
    )
  );
}
export function isUsableComparison(comparison: HistoryComparison): boolean {
  return (
    comparison.eligible &&
    isUsableMetric(comparison.before) &&
    isUsableMetric(comparison.now)
  );
}
