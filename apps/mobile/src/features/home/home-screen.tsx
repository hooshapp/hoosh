import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { homeAssets } from '@/design/home-assets';
import { colors, fonts } from '@/design/tokens';

import { HomeArtwork } from './home-artwork';
import { unavailableLabel, validateHomeDisplay, type HomeModel } from './home-model';
import { HomeOverview } from './home-overview';
import { HomeRecommendation } from './home-recommendation';

export type HomeScreenProps = {
  model: HomeModel;
  bottomClearance?: number;
  /** Inject only the actual RN-08/native-owner presentation; never derive from Home metrics. */
  protection?: ReactNode;
  protectionPlacement?: 'top' | 'bottom';
  /** Accepted preference summaries supplied by the account-scoped settings consumer. */
  preferences?: ReactNode;
  onFeed?: () => void;
  onOpenHistory?: () => void;
  onAcceptRecommendation?: (id: string) => void;
  onSkipRecommendation?: (id: string) => void;
  feeding?: boolean;
  recommendationBusy?: boolean;
};
/** Source Home composition. A future producer owns policy, freshness and account scoping. */
export function HomeScreen({
  model: input,
  bottomClearance,
  protection,
  protectionPlacement = 'bottom',
  preferences,
  onFeed,
  onOpenHistory,
  onAcceptRecommendation,
  onSkipRecommendation,
  feeding = false,
  recommendationBusy = false,
}: HomeScreenProps) {
  const model = validateHomeDisplay(input);
  const [contentWidth, setContentWidth] = useState<number>();
  const { fontScale } = useWindowDimensions();
  const stacked = (contentWidth !== undefined && contentWidth < 300) || fontScale > 1.3;
  return (
    <Screen title="Home" bottomClearance={bottomClearance} header={null} contentStyle={styles.content} testID="home-scroll">
      <View
        testID="home-content"
        style={styles.body}
        onLayout={({ nativeEvent }) => setContentWidth(Math.ceil(nativeEvent.layout.width))}>
        {protectionPlacement === 'top' ? protection : null}
        <HomeOverview
          dino={model.dino}
          credits={model.credits}
          weekly={model.weekly}
          stacked={stacked}
          onFeed={onFeed}
          onOpenHistory={onOpenHistory}
          feeding={feeding}
        />
        <HomeRecommendation
          recommendation={model.recommendation}
          onAccept={onAcceptRecommendation}
          onSkip={onSkipRecommendation}
          busy={recommendationBusy}
          stacked={stacked}
        />
        <View style={styles.streak} testID="home-streak">
          <View style={styles.streakText}>
            <Text style={styles.streakLabel}>Current streak</Text>
            <Text style={styles.streakValue}>
              {model.streak.state === 'ready'
                ? `🔥 ${model.streak.value.days} ${model.streak.value.days === 1 ? 'day' : 'days'}`
                : unavailableLabel(model.streak.state)}
            </Text>
          </View>
          {model.streak.state === 'ready' && model.streak.value.recentWeekComplete ? (
            <HomeArtwork asset={homeAssets.streak} testID="home-streak-dots" />
          ) : null}
        </View>
        {model.weekly.state === 'ready' ? (
          <Text style={styles.provenance} testID="home-weekly-provenance">
            {model.weekly.value.rangeLabel} · {model.weekly.value.sourceLabel} ·{' '}
            {model.weekly.value.coverageLabel}
          </Text>
        ) : null}
        {preferences}
        {protectionPlacement === 'bottom' ? protection : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8 },
  body: { gap: 12 },
  streak: {
    minHeight: 66,
    backgroundColor: colors.warmForeground,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  streakText: { flex: 1, minWidth: 140, gap: 2 },
  streakLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.warmHeader,
  },
  streakValue: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: colors.warmHeader },
  provenance: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: colors.muted },
});
