import { useState, type ReactNode } from 'react';
import { HistoryScreen } from './history-screen';
import { HistoryDetails } from './history-details';
import type { HistoryModel } from './history-model';
import type { HistoryPeriod, HistoryPeriods } from './history-details-model';
/** Local page/period navigation only. The owner supplies independent, scoped readings. */
export function HistoryExperience({
  summary,
  monthlySummary,
  periods,
  onRetry,
  controls,
}: {
  summary: HistoryModel;
  monthlySummary?: HistoryModel;
  periods: HistoryPeriods;
  onRetry?: () => void;
  controls?: ReactNode;
}) {
  const [page, setPage] = useState<'summary' | 'progress' | 'reclaimed'>(
    'summary',
  );
  const [period, setPeriod] = useState<HistoryPeriod>('week');
  if (page === 'summary')
    return (
      <HistoryScreen
        model={period === 'month' && monthlySummary ? monthlySummary : summary}
        onNext={() => setPage('progress')}
        onRetry={onRetry}
        controls={controls}
      />
    );
  return (
    <HistoryDetails
      reading={periods[period]}
      period={period}
      onPeriodChange={setPeriod}
      reclaimed={page === 'reclaimed'}
      onBack={() => setPage(page === 'reclaimed' ? 'progress' : 'summary')}
      onNext={() => setPage('reclaimed')}
      onRetry={onRetry}
      controls={controls}
    />
  );
}
