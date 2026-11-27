import { InlineStatus } from '@/components/ui/inline-status';
import { HistoryCollectionControls } from './history-collection-settings';
import { HistoryExperience } from './history-experience';
import { historyProjection } from './history-projection';
import { useIOSUsageComparison } from './ios-usage-comparison';
import { useHistory } from './use-history';
export function ConnectedHistoryScreen({ collectionReview = false }: { collectionReview?: boolean }) {
  const history = useHistory(),
    snapshot = history.snapshot;
  const renderUsage = useIOSUsageComparison();
  const projection = historyProjection(
    snapshot?.view,
    snapshot?.matching ?? false,
  );
  return (
    <HistoryExperience
      summary={projection.summary}
      monthlySummary={projection.monthlySummary}
      periods={projection.periods}
      renderUsageComparison={renderUsage ? (period, page) => renderUsage(false, period === 'month' ? 28 : 7, page) : undefined}
      onRetry={history.refresh}
      controls={collectionReview ? <HistoryCollectionControls history={history} /> : history.loading ? <InlineStatus state="loading" message="Loading History…" /> : !snapshot || !history.online ? <InlineStatus state="error" message="History could not be loaded." onRetry={history.refresh} /> : null}
    />
  );
}
