import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { historyAssets } from '@/design/history-assets';
import {
  isUsableMetric,
  isUsableComparison,
  type HistoryMetric,
  type HistoryReading,
  type HistoryModel,
} from './history-model';

export type HistoryScreenProps = {
  model: HistoryModel;
  onRetry?: () => void;
  /** Only supply when the host has a real next page. No invented detail route. */
  onNext?: () => void;
};
export function HistoryScreen({ model, onRetry, onNext }: HistoryScreenProps) {
  const [width, setWidth] = useState<number>();
  const { fontScale } = useWindowDimensions();
  const compact = (width !== undefined && width < 320) || fontScale > 1.3;
  const comparison =
    model.screenTime.state === 'ready' &&
    isUsableComparison(model.screenTime.data)
      ? model.screenTime.data
      : null;
  return (
    <Screen
      title="Your stats"
      header={null}
      contentStyle={styles.screen}
      testID="history-scroll"
    >
      <View
        onLayout={({ nativeEvent }) =>
          setWidth(Math.ceil(nativeEvent.layout.width))
        }
      >
        <Text style={styles.eyebrow}>
          {model.periodLabel ?? 'Your progress'}
        </Text>
        <Text accessibilityRole="header" style={styles.title}>
          Your stats
        </Text>
        <View style={styles.first}>
          <Metric
            reading={model.turnOffs}
            label="turn-offs"
            caption="from nudges"
            compact={compact}
            onRetry={onRetry}
          />
        </View>
        <View style={styles.divider} />
        <Text accessibilityRole="header" style={styles.eyebrow}>
          Weekly screen time
        </Text>
        <View style={styles.comparison}>
          {comparison ? (
            <>
              <View style={[styles.comparisonRow, compact && styles.stacked]}>
                <ComparisonValue label="Before" metric={comparison.before} />
                <View style={styles.arrow}>
                  <DesignArtwork
                    asset={historyAssets.comparison}
                    testID="history-comparison"
                  />
                </View>
                <ComparisonValue label="Now" metric={comparison.now} green />
              </View>
              <Evidence label="Before" metric={comparison.before} />
              <Evidence label="Now" metric={comparison.now} />
            </>
          ) : (
            <ReadingStatus
              state={
                model.screenTime.state === 'ready'
                  ? 'unavailable'
                  : model.screenTime.state
              }
              label="Screen time comparison"
              onRetry={onRetry}
            />
          )}
        </View>
        <View style={styles.divider} />
        <Metric
          reading={model.savedHours}
          label="hours"
          caption="saved"
          compact={compact}
          onRetry={onRetry}
        />
        {onNext ? (
          <View style={styles.footer}>
            <DesignArtwork
              asset={historyAssets.pagination}
              testID="history-pagination"
            />
            <Button
              label=""
              accessibilityLabel="Next history page"
              onPress={onNext}
              leadingVisual={
                <DesignArtwork
                  asset={historyAssets.next}
                  testID="history-next"
                />
              }
              style={styles.next}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
function Metric({
  reading,
  label,
  caption,
  compact,
  onRetry,
}: {
  reading: HistoryReading<HistoryMetric>;
  label: string;
  caption: string;
  compact: boolean;
  onRetry?: () => void;
}) {
  if (reading.state !== 'ready' || !isUsableMetric(reading.data))
    return (
      <ReadingStatus
        state={reading.state === 'ready' ? 'unavailable' : reading.state}
        label={label === 'hours' ? 'Saved time' : 'Turn-offs'}
        onRetry={onRetry}
      />
    );
  return (
    <View>
      <View style={[styles.metric, compact && styles.stacked]}>
        <Text style={styles.number}>{reading.data.display}</Text>
        <View style={[styles.metricCaption, compact && styles.compactCaption]}>
          <Text style={styles.unit}>{label}</Text>
          <Text style={styles.caption}>
            {caption} {reading.data.period}
          </Text>
        </View>
      </View>
      <Evidence label={label} metric={reading.data} />
    </View>
  );
}
function ComparisonValue({
  label,
  metric,
  green = false,
}: {
  label: string;
  metric: HistoryMetric;
  green?: boolean;
}) {
  return (
    <View style={styles.comparisonValue}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={[styles.time, green && styles.green]}>{metric.display}</Text>
      <Text style={styles.small}>{metric.period}</Text>
    </View>
  );
}
function Evidence({ label, metric }: { label: string; metric: HistoryMetric }) {
  return (
    <Text
      style={styles.evidence}
      accessibilityLabel={`${label}: ${metric.source}. Coverage: ${metric.coverage}. Period: ${metric.period}.`}
    >
      {metric.source} · {metric.coverage}
    </Text>
  );
}
function ReadingStatus({
  state,
  label,
  onRetry,
}: {
  state: 'loading' | 'error' | 'unavailable';
  label: string;
  onRetry?: () => void;
}) {
  if (state === 'loading')
    return (
      <InlineStatus
        state="loading"
        message={`Loading ${label.toLowerCase()}…`}
      />
    );
  return (
    <InlineStatus
      state={state}
      message={
        state === 'error'
          ? `${label} couldn’t be loaded.`
          : `${label} isn’t available yet.`
      }
      onRetry={state === 'error' ? onRetry : undefined}
    />
  );
}
const styles = StyleSheet.create({
  screen: { paddingHorizontal: 28, paddingTop: 28, gap: 0 },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    color: '#6B6257',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 52,
    color: colors.warmForeground,
    marginTop: 6,
  },
  first: { marginTop: 28 },
  metric: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    flexWrap: 'wrap',
  },
  number: {
    fontFamily: fonts.bold,
    fontSize: 96,
    lineHeight: 120,
    color: colors.success,
    flexShrink: 1,
  },
  metricCaption: { flex: 1, minWidth: 100, paddingBottom: 25.256, gap: 2 },
  compactCaption: { paddingBottom: 0 },
  unit: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.darkNav,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: '#6B6257',
  },
  divider: {
    height: 1,
    backgroundColor: colors.warmForeground,
    opacity: 0.12,
    marginTop: 24,
    marginBottom: 22,
  },
  comparison: { marginTop: 12, gap: 4 },
  comparisonRow: { flexDirection: 'row', alignItems: 'center' },
  comparisonValue: { flex: 1, minWidth: 0, gap: 3 },
  arrow: {
    width: 41,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stacked: { flexDirection: 'column', alignItems: 'flex-start', gap: 8 },
  time: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 44,
    color: '#6B6257',
    flexShrink: 1,
  },
  green: { color: colors.readableSuccess },
  small: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6257',
  },
  evidence: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6257',
    marginTop: 4,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  next: {
    width: 48,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
    backgroundColor: colors.darkNav,
  },
});
