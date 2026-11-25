import { InlineStatus } from '@/components/ui/inline-status';
import { Text, View } from 'react-native';
import { colors, fonts } from '@/design/tokens';
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
      renderUsageComparison={renderUsage ? period => renderUsage(false, period === 'month' ? 28 : 7) : undefined}
      onRetry={history.refresh}
      controls={collectionReview ? <HistoryCollectionControls history={history} /> : history.loading ? <InlineStatus state="loading" message="Loading History…" /> : !snapshot || !history.online ? <InlineStatus state="error" message="History could not be loaded." onRetry={history.refresh} /> : snapshot.view.recent_interventions ? (
        <View style={{ gap: 6 }}>
          <Text accessibilityRole="header" style={{ color: colors.warmForeground, fontFamily: fonts.bold }}>Synced session activity</Text>
          {snapshot.view.recent_interventions.map(day => (
            <Text key={day.day} style={{ color: colors.warmForeground, fontFamily: fonts.regular }}>
              {day.day} · {day.sessions_started} started · {day.turn_offs} turn-offs
            </Text>
          ))}
        </View>
      ) : null}
    />
  );
}
