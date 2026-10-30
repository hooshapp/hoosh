import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useAnnouncement } from '@/components/ui/use-announcement';
import { homeAssets, homeDinoAssets } from '@/design/home-assets';
import { colors, fonts } from '@/design/tokens';

import { HomeArtwork } from './home-artwork';
import { unavailableLabel, type HomeModel } from './home-model';

type Props = Pick<HomeModel, 'dino' | 'credits' | 'weekly'> & {
  stacked: boolean;
  onFeed?: () => void;
  onOpenHistory?: () => void;
  feeding?: boolean;
};
export function HomeOverview({
  dino,
  credits,
  weekly,
  stacked,
  onFeed,
  onOpenHistory,
  feeding = false,
}: Props) {
  const [failedDino, setFailedDino] = useState<unknown>();
  const dinoSource = dino.state === 'ready' ? homeDinoAssets[dino.value.artwork] : undefined;
  useAnnouncement(feeding ? 'Feeding Dino…' : undefined);
  return (
    <View style={[styles.overview, stacked && styles.stacked]} testID="home-overview">
      <View style={[styles.dinoCard, !stacked && styles.dinoColumn]} testID="home-dino-card">
        {dino.state === 'ready' ? (
          <>
            <View
              style={styles.health}
              accessible
              accessibilityLabel={`Dino health ${dino.value.percent}%`}>
              <HomeArtwork asset={homeAssets.heart} testID="home-heart" />
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${dino.value.percent}%` }]} />
              </View>
              <Text style={styles.percent}>{dino.value.percent}%</Text>
            </View>
            <View style={styles.habitat}>
              {failedDino !== dinoSource ? (
                <Image
                  source={dinoSource}
                  contentFit="contain"
                  accessible={false}
                  accessibilityElementsHidden
                  aria-hidden
                  testID="home-dino-artwork"
                  onError={() => setFailedDino(dinoSource)}
                  style={styles.dino}
                />
              ) : (
                <Text style={styles.unavailable}>Illustration unavailable</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.dinoUnavailable}>
            <Text accessibilityRole="header" style={styles.dinoHeading}>
              Dino health
            </Text>
            <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.unavailable}>
              {unavailableLabel(dino.state)}
            </Text>
            <Text style={styles.hint}>
              Your Dino’s health will appear here when it’s available.
            </Text>
          </View>
        )}
        <Button
          label="🍃 Feed"
          accessibilityLabel={
            feeding
              ? 'Feeding Dino…'
              : dino.state === 'ready' && dino.value.feedCost !== null
                ? `Feed Dino for ${dino.value.feedCost} credits`
                : 'Feed Dino'
          }
          disabled={
            !onFeed ||
            dino.state !== 'ready' ||
            dino.value.feedCost === null ||
            credits.state !== 'ready' ||
            (dino.state === 'ready' &&
              dino.value.feedCost !== null &&
              credits.state === 'ready' &&
              credits.value < dino.value.feedCost)
          }
          busy={feeding}
          busyLabel="Feeding…"
          onPress={() => onFeed?.()}
          style={styles.feed}
          labelStyle={styles.feedLabel}
          trailingVisual={
            dino.state === 'ready' && dino.value.feedCost !== null ? (
              <View style={styles.cost}>
                <Text style={styles.costText}>-{dino.value.feedCost} ✦</Text>
              </View>
            ) : undefined
          }
        />
      </View>
      <View style={[styles.statsColumn, !stacked && styles.statsFlex]}>
        <View
          style={styles.credits}
          accessible
          accessibilityLabel={`Credits: ${credits.state === 'ready' ? credits.value : unavailableLabel(credits.state)}`}>
          <Text style={styles.creditsLabel}>✦ Credits</Text>
          <View style={styles.divider} />
          <Text testID="home-credit-value" style={styles.creditsValue}>
            {credits.state === 'ready' ? credits.value : '—'}
          </Text>
          {credits.state === 'ready' ? null : (
            <Text style={styles.creditHint}>{unavailableLabel(credits.state)}</Text>
          )}
        </View>
        <View style={styles.weekly} testID="home-weekly-card">
          <View style={styles.ellipse}>
            <HomeArtwork asset={homeAssets.ellipse} testID="home-ellipse" />
          </View>
          <Text style={styles.period}>
            {weekly.state === 'ready' ? weekly.value.periodLabel : 'Time saved'}
          </Text>
          <Text style={styles.hours}>{weekly.state === 'ready' ? weekly.value.hours : '—'}</Text>
          {weekly.state === 'ready' ? (
            <>
              <Text style={styles.unit}>HRS</Text>
              <Text style={styles.saved}>saved 🧠</Text>
              {onOpenHistory ? (
                <Button
                  label=">"
                  accessibilityLabel="View time saved in History"
                  onPress={onOpenHistory}
                  style={styles.arrow}
                  labelStyle={styles.arrowLabel}
                />
              ) : null}
            </>
          ) : (
            <Text accessibilityLiveRegion="polite" aria-live="polite" style={styles.saved}>
              {unavailableLabel(weekly.state)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  overview: { flexDirection: 'row', gap: 16, alignItems: 'stretch', marginBottom: 6 },
  stacked: { flexDirection: 'column' },
  // Flex distributes the content width; the left card also owns its 3 px border.
  dinoColumn: { flex: 193 },
  dinoCard: {
    minWidth: 0,
    minHeight: 210,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.warmOutline,
    backgroundColor: colors.warmCard,
    alignItems: 'center',
    paddingBottom: 9,
  },
  health: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    paddingHorizontal: 12.5,
    alignSelf: 'stretch',
  },
  track: {
    flex: 1,
    minWidth: 0,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.warmOutline,
    overflow: 'hidden',
  },
  fill: { height: 7, borderRadius: 4, backgroundColor: colors.action },
  percent: { fontFamily: fonts.bold, fontSize: 9, color: colors.readableSuccess },
  habitat: { height: 110, width: 110, justifyContent: 'center', alignItems: 'center' },
  dino: { width: 110, height: 110 },
  dinoUnavailable: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  dinoHeading: { fontFamily: fonts.bold, fontSize: 17, color: colors.warmForeground },
  unavailable: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, textAlign: 'center' },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
  },
  feed: {
    marginTop: 'auto',
    minHeight: 44,
    minWidth: 130,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    maxWidth: '94%',
  },
  feedLabel: { fontSize: 13, lineHeight: 18, color: colors.onAction },
  cost: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.readableSuccess,
  },
  costText: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 13, color: colors.white },
  statsColumn: { minWidth: 0, gap: 12 },
  statsFlex: { flex: 149 },
  credits: {
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: colors.warmForeground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  creditsLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.warmHeader },
  divider: { width: 1, height: 14, backgroundColor: '#444444' },
  creditsValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.warmHeader, flexShrink: 1 },
  creditHint: {
    width: '100%',
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.warmHeader,
  },
  weekly: {
    minHeight: 158,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 2,
    borderRadius: 28,
    backgroundColor: colors.action,
    overflow: 'hidden',
  },
  ellipse: { position: 'absolute', left: 80, top: -30 },
  period: { fontFamily: fonts.medium, fontSize: 11, color: colors.onAction, opacity: 0.8 },
  hours: { fontFamily: fonts.bold, fontSize: 38, color: colors.onAction },
  unit: { fontFamily: fonts.bold, fontSize: 17, color: colors.onAction },
  saved: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.onAction,
    paddingRight: 20,
  },
  arrow: {
    position: 'absolute',
    right: 8,
    bottom: 4,
    minHeight: 44,
    minWidth: 44,
    width: 44,
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 22,
    backgroundColor: colors.success,
  },
  arrowLabel: { fontSize: 21, color: colors.white },
});
