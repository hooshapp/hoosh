import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { InlineStatus } from '@/components/ui/inline-status';
import { historydetailAssets as assets } from '@/design/historydetail-assets';
import { colors, fonts } from '@/design/tokens';
import {
  usableHistoryDetail,
  type HistoryDetail,
  type HistoryPeriod,
} from './history-details-model';
import type { HistoryReading } from './history-model';

type Props = {
  reading: HistoryReading<HistoryDetail>;
  period: HistoryPeriod;
  onPeriodChange: (period: HistoryPeriod) => void;
  onBack: () => void;
  onNext?: () => void;
  onRetry?: () => void;
  reclaimed?: boolean;
  controls?: ReactNode;
  usageComparison?: ReactNode;
};
export function HistoryDetails({
  reading,
  period,
  onPeriodChange,
  onBack,
  onNext,
  onRetry,
  reclaimed = false,
  controls,
  usageComparison,
}: Props) {
  const detail =
    reading.state === 'ready' && usableHistoryDetail(reading.data)
      ? reading.data
      : null;
  const state = reading.state === 'ready' ? 'unavailable' : reading.state;
  return (
    <Screen
      title={reclaimed ? 'Time reclaimed' : 'Your progress'}
      header={null}
      contentStyle={styles.screen}
    >
      <View style={styles.nav}>
        <Button
          label="Back"
          variant="secondary"
          onPress={onBack}
          leadingVisual={<DesignArtwork asset={assets.back} />}
          style={styles.back}
          labelStyle={styles.backText}
        />
        <DesignArtwork
          asset={reclaimed ? assets.reclaimedDots : assets.progressDots}
        />
      </View>
      <Text
        accessibilityRole={reclaimed ? 'header' : undefined}
        style={styles.eyebrow}
      >
        {reclaimed ? 'Screen time reduction' : 'Your progress'}
      </Text>
      {!reclaimed ? (
        <>
          <Text accessibilityRole="header" style={styles.title}>
            How you’re doing
          </Text>
          <View style={styles.segments}>
            {(['week', 'month'] as const).map((value) => (
              <Button
                key={value}
                label={value === 'month' ? 'This month' : 'This week'}
                selected={period === value}
                accessibilityLabel={`This ${value}`}
                onPress={() => onPeriodChange(value)}
                variant="secondary"
                style={[styles.segment, period === value && styles.active]}
                labelStyle={[
                  styles.segmentText,
                  period === value && { color: colors.warmCanvas },
                ]}
              />
            ))}
          </View>
        </>
      ) : usageComparison ? null : (
        <Text style={styles.caption}>
          Each circle = 10% of your previous usage
        </Text>
      )}
      {usageComparison ?? (detail ? (
        reclaimed ? (
          <>
            {detail.percentageAvailable !== false &&
            detail.reduction.value >= 0 ? (
              <ReductionCircles percentage={detail.reduction.value} />
            ) : (
              <Text style={styles.paragraph}>
                {detail.percentageAvailable === false
                  ? 'Percentage is unavailable because baseline usage was zero.'
                  : 'Usage increased; no time-freed circles are shown.'}
              </Text>
            )}
            {detail.percentageAvailable !== false &&
            detail.reduction.value >= 0 ? (
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <DesignArtwork asset={assets.freedLegend} />
                  <Text style={styles.legendText}>
                    {detail.reduction.value % 10 === 0
                      ? `${detail.reduction.value / 10} of 10`
                      : `${detail.reduction.display}%`}{' '}
                    — time freed
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <DesignArtwork asset={assets.remainingLegend} />
                  <Text style={styles.legendText}>
                    {detail.reduction.value % 10 === 0
                      ? `${10 - detail.reduction.value / 10} of 10`
                      : `${100 - detail.reduction.value}%`}{' '}
                    — remaining
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={styles.divider} />
            <Text accessibilityRole="header" style={styles.eyebrow}>
              {detail.savedHours.value < 0
                ? 'Additional usage'
                : 'Estimated time reclaimed'}{' '}
              · {detail.savedHours.period}
            </Text>
            <View style={styles.statRow}>
              <Text style={styles.saved}>{detail.savedHours.display}</Text>
              <Text style={styles.hours}>hours</Text>
            </View>
            <Text style={styles.paragraph}>
              {detail.savedHours.value < 0
                ? 'This period used more time than the fixed baseline. No savings are claimed.'
                : 'A comparison with your fixed starting baseline; this is not a causal estimate.'}
            </Text>
            <Evidence detail={detail} />
          </>
        ) : (
          <>
            <View style={styles.divider} />
            <View style={styles.narrative}>
              {detail.narrative.map((paragraph, i) => (
                <Text key={i} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </View>
            <View style={styles.divider} />
            <Text style={styles.eyebrow}>
              {detail.reduction.value < 0
                ? 'More screen time'
                : 'Less screen time'}
            </Text>
            <View style={styles.statRow}>
              <Text style={styles.number}>{detail.reduction.display}</Text>
              <Text style={styles.percent}>
                {detail.percentageAvailable === false ? '' : '%'}
              </Text>
            </View>
            <Text style={styles.caption}>
              reduction compared to {detail.baseline.period}
            </Text>
            <Evidence detail={detail} />
          </>
        )
      ) : (
        <View style={styles.empty}>
          {reclaimed ? (
            <View style={styles.circles} accessibilityLabel="Screen time reduction: no measured data yet">
              {Array.from({ length: 10 }, (_, index) => <DesignArtwork key={index} asset={assets.remainingCircle} />)}
            </View>
          ) : null}
          <View style={styles.divider} />
          <Text style={styles.paragraph}>Your progress will appear here when comparable usage data is available.</Text>
          <View style={styles.divider} />
          <Text style={styles.eyebrow}>{reclaimed ? 'Time reclaimed' : 'Less screen time'}</Text>
          <Text style={styles.number}>—</Text>
          <Text style={styles.caption}>No measured data yet</Text>
          {state === 'loading' ? <InlineStatus state="loading" message="Loading your progress…" /> : state === 'error' ? <InlineStatus state="error" message="Your progress couldn’t be loaded." onRetry={onRetry} /> : null}
        </View>
      ))}
      {controls}
      {onNext && !reclaimed ? (
        <View style={styles.nextRow}>
          <Button
            label=""
            accessibilityLabel="View time reclaimed"
            onPress={onNext}
            leadingVisual={<DesignArtwork asset={assets.next} />}
            style={styles.next}
          />
        </View>
      ) : null}
    </Screen>
  );
}
function Evidence({ detail }: { detail: HistoryDetail }) {
  return (
    <View style={styles.evidence}>
      {[
        ['Baseline', detail.baseline],
        ['Current', detail.current],
        ['Saved time', detail.savedHours],
        ['Reduction', detail.reduction],
      ].map(([label, value]) =>
        typeof value !== 'string' ? (
          <Text key={String(label)} style={styles.evidenceText}>
            {String(label)}: {value.period} · {value.source} · {value.coverage}
          </Text>
        ) : null,
      )}
    </View>
  );
}
function ReductionCircles({ percentage }: { percentage: number }) {
  const filled = percentage / 10;
  return (
    <View
      accessible
      accessibilityLabel={`${percentage}% less screen time`}
      style={styles.circles}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={{
            width: assets.remainingCircle.width,
            height: assets.remainingCircle.height,
          }}
        >
          <DesignArtwork asset={assets.remainingCircle} />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width:
                Math.max(0, Math.min(1, filled - i)) * assets.freedCircle.width,
              overflow: 'hidden',
            }}
          >
            <DesignArtwork asset={assets.freedCircle} />
          </View>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { paddingHorizontal: 28, paddingTop: 16, gap: 12 },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    minHeight: 44,
    paddingHorizontal: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  backText: { fontSize: 13, color: colors.muted },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    color: '#6B6257',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 42,
    color: colors.warmForeground,
  },
  segments: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.warmOutline,
    borderRadius: 16,
    backgroundColor: colors.warmCard,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 9,
    borderWidth: 0,
    borderRadius: 12,
  },
  segmentText: { fontSize: 13, lineHeight: 18 },
  active: { backgroundColor: colors.warmForeground },
  divider: { height: 1, backgroundColor: colors.warmForeground, opacity: 0.12 },
  narrative: { paddingVertical: 16, gap: 20 },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.warmForeground,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
  },
  number: {
    fontFamily: fonts.bold,
    fontSize: 96,
    lineHeight: 120,
    color: colors.success,
    flexShrink: 1,
  },
  percent: {
    fontFamily: fonts.bold,
    fontSize: 48,
    color: colors.readableSuccess,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B6257',
  },
  circles: { flexDirection: 'row', flexWrap: 'wrap', gap: 9.16, rowGap: 12 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  saved: {
    fontFamily: fonts.bold,
    fontSize: 76,
    lineHeight: 84,
    color: colors.success,
    flexShrink: 1,
  },
  hours: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.readableSuccess,
  },
  empty: { gap: 16, minHeight: 330 },
  evidence: { position: 'absolute', width: 1, height: 1, overflow: 'hidden' },
  evidenceText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  nextRow: { alignItems: 'flex-end', marginTop: 24 },
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
