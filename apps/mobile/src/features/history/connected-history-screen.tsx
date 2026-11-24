import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DetailsPanel } from '@/components/ui/details-panel';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { colors, fonts } from '@/design/tokens';
import { HistoryExperience } from './history-experience';
import { historyProjection } from './history-projection';
import { useHistory } from './use-history';
export function ConnectedHistoryScreen() {
  const history = useHistory(),
    snapshot = history.snapshot;
  const projection = historyProjection(
    snapshot?.view,
    snapshot?.matching ?? false,
  );
  const native = snapshot?.native;
  const reason = snapshot?.view.week.reason;
  const status = !history.online
    ? 'Connect to verify account History.'
    : !snapshot
      ? 'History is temporarily unavailable.'
      : native === 'unsupported'
        ? Platform.OS === 'ios'
          ? 'iPhone usage measurement is unavailable. Android account summaries are not this iPhone’s Screen Time. Synced account turn-off receipts remain available.'
          : 'Usage measurement is unavailable on this build. Synced turn-off receipts remain available.'
        : native === 'error'
          ? 'Device History could not be verified. Check latest History before changing collection.'
          : native === 'needs_permission'
            ? 'Allow Android usage access to measure your saved apps. Existing summaries remain stored.'
            : native === 'selection_changed'
              ? 'Your saved apps changed. Start a new History baseline to compare the same selection.'
              : native === 'timezone_changed'
                ? 'Your time zone changed. Start a new baseline before comparing these periods.'
                : native === 'locked'
                  ? 'Unlock this device to read Android usage.'
                  : !snapshot.matching
                    ? 'Start History for this device and its saved apps. Existing account history is not automatically replaced.'
                    : reason === 'collecting_baseline'
                      ? `Building a fixed baseline: ${snapshot.view.baseline_reported_days}/7 reported days. Missing days are not zero.`
                      : reason === 'baseline_overlap'
                        ? 'Your baseline is ready. A later complete seven-day period is needed before comparing.'
                        : reason === 'incomplete'
                          ? `${snapshot.view.week.reported_days}/7 days reported. Comparison waits for complete data.`
                          : 'Your fixed baseline and this period are comparable.';
  return (
    <HistoryExperience
      summary={projection.summary}
      monthlySummary={projection.monthlySummary}
      periods={projection.periods}
      onRetry={history.refresh}
      controls={
        <View style={styles.controls}>
          <InlineStatus
            state={history.loading ? 'loading' : 'unavailable'}
            message={history.loading ? 'Loading account History…' : status}
          />
          <DetailsPanel title="History settings" description="Sources, selected apps and collection">
          {snapshot && Platform.OS !== 'ios' ? (
            <Text style={styles.text}>
              Source: Android selected-app usage estimate. Last checked{' '}
              {new Date(snapshot.view.observed_at).toLocaleString()}. Month
              means 28 closed days (four weeks). Baseline and comparison use the
              same saved apps; missing data stays unavailable.
            </Text>
          ) : null}
          {snapshot?.notice ? (
            <InlineStatus state="unavailable" message={snapshot.notice} />
          ) : null}
          {history.message ? (
            <Text style={styles.text}>{history.message}</Text>
          ) : null}
          <Button
            label="Check latest History"
            busy={history.refreshing}
            onPress={history.refresh}
          />
          <Button
            label="Review selected apps"
            variant="secondary"
            onPress={() => router.push('/settings/apps')}
          />
          {history.canReview ? (
            <Button
              label="Review History usage access"
              variant="secondary"
              onPress={() => {
                void history.reviewUsage();
              }}
            />
          ) : null}
          {history.canStop ? (
            <Button
              label="Stop History collection"
              variant="secondary"
              busy={history.busy}
              onPress={history.stop}
            />
          ) : null}
          {history.canStart ? (
            <Button
              label={
                snapshot?.view.series_id
                  ? 'Restart History baseline'
                  : 'Start History'
              }
              busy={history.busy}
              onPress={history.start}
            />
          ) : null}
          </DetailsPanel>
        </View>
      }
    />
  );
}
const styles = StyleSheet.create({
  controls: { gap: 12, marginTop: 20 },
  text: {
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
