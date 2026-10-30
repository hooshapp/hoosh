import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { homeAssets } from '@/design/home-assets';
import { colors, fonts } from '@/design/tokens';

import { HomeArtwork } from './home-artwork';
import type { HomeModel } from './home-model';

type Props = {
  recommendation: HomeModel['recommendation'];
  onAccept?: (id: string) => void;
  onSkip?: (id: string) => void;
  busy?: boolean;
  stacked: boolean;
};
/** Temporary recommendation presentation. No accepted quest, reward or installed plan is created. */
export function HomeRecommendation({
  recommendation,
  onAccept,
  onSkip,
  busy = false,
  stacked,
}: Props) {
  const value = recommendation.state === 'ready' ? recommendation.value : undefined;
  return (
    <View style={styles.card} testID="home-recommendation">
      <View style={[styles.header, stacked && styles.compactHeader]}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>⚡ QUEST</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.heading, stacked && styles.compactHeading]}>
          Recommended for you
        </Text>
        {value?.rewardCredits !== null && value?.rewardCredits !== undefined ? (
          <View style={styles.reward}>
            <Text style={styles.rewardLabel}>+{value.rewardCredits} ✦</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        {value ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {value.title}
            </Text>
            <Text style={styles.description}>{value.description}</Text>
            {value.restrictionNotice ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{value.restrictionNotice}</Text>
              </View>
            ) : null}
            <View style={[styles.actions, stacked && styles.stacked]}>
              <Button
                label="✕ Skip"
                variant="secondary"
                style={styles.skip}
                labelStyle={styles.skipLabel}
                disabled={!onSkip}
                busy={busy}
                busyLabel="Working…"
                onPress={() => onSkip?.(value.id)}
              />
              <Button
                label="Accept"
                style={styles.accept}
                labelStyle={styles.acceptLabel}
                leadingVisual={<HomeArtwork asset={homeAssets.check} testID="home-accept-check" />}
                disabled={!onAccept}
                busy={busy}
                busyLabel="Working…"
                onPress={() => onAccept?.(value.id)}
              />
            </View>
            {!onAccept && !onSkip ? (
              <Text style={styles.unavailable}>Quest actions aren’t available yet.</Text>
            ) : null}
          </>
        ) : recommendation.state === 'loading' ? (
          <InlineStatus state="loading" message="Finding recommendations…" />
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {recommendation.state === 'empty'
                ? 'No recommendations right now'
                : recommendation.state === 'error'
                  ? 'Couldn’t load recommendations'
                  : 'Make time for what you love'}
            </Text>
            <Text style={styles.description}>
              {recommendation.state === 'empty'
                ? 'Check back another time for a little inspiration.'
                : recommendation.state === 'error'
                  ? 'Please try again later.'
                  : 'Recommendations will appear here when they’re available.'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.warmOutline,
    borderRadius: 24,
    backgroundColor: colors.warmCard,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.warmHeader,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 14.5,
    paddingVertical: 10.5,
    gap: 8,
  },
  badge: {
    backgroundColor: colors.readableSuccess,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.white },
  heading: {
    flex: 1,
    minWidth: 100,
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.warmForeground,
  },
  compactHeader: { flexDirection: 'column', flexWrap: 'nowrap', alignItems: 'flex-start' },
  compactHeading: {
    alignSelf: 'stretch',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    minWidth: 0,
    width: '100%',
    maxWidth: '100%',
  },
  reward: {
    backgroundColor: colors.warmForeground,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rewardLabel: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 12, color: colors.warmHeader },
  body: { paddingHorizontal: 14.5, paddingTop: 14, paddingBottom: 16, gap: 10 },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.warmForeground },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15.5,
    color: colors.warmForeground,
  },
  notice: {
    backgroundColor: '#FFF0D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  noticeText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 13,
    color: colors.warmForeground,
  },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  stacked: { flexDirection: 'column' },
  skip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderWidth: 0,
    backgroundColor: '#F0EBE0',
  },
  skipLabel: { fontSize: 14, lineHeight: 20, color: colors.muted },
  accept: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderWidth: 0,
  },
  acceptLabel: { fontSize: 14, lineHeight: 20, color: colors.onAction },
  unavailable: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
});
