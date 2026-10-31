import { useState } from 'react';
import { HistoryScreen } from './history-screen';
import { HistoryDetails } from './history-details';
import type { HistoryModel } from './history-model';
import type { HistoryPeriod, HistoryPeriods } from './history-details-model';
/** Local page/period navigation only. The owner supplies independent, scoped readings. */
export function HistoryExperience({
  summary,
  periods,
  onRetry,
}: {
  summary: HistoryModel;
  periods: HistoryPeriods;
  onRetry?: () => void;
}) {
  const [page, setPage] = useState<'summary' | 'progress' | 'reclaimed'>('summary');
  const [period, setPeriod] = useState<HistoryPeriod>('week');
  if (page === 'summary')
    return <HistoryScreen model={summary} onNext={() => setPage('progress')} onRetry={onRetry} />;
  return (
    <HistoryDetails
      reading={periods[period]}
      period={period}
      onPeriodChange={setPeriod}
      reclaimed={page === 'reclaimed'}
      onBack={() => setPage(page === 'reclaimed' ? 'progress' : 'summary')}
      onNext={() => setPage('reclaimed')}
      onRetry={onRetry}
    />
  );
}
