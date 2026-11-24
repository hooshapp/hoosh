import { useRecommendations } from '@/features/recommendations/use-recommendations';
import { RecommendationFeedback } from '@/features/recommendations/recommendation-feedback';
import type { PreferencesNavigation } from './home-preferences';
import { HomeScreen } from './home-screen';
import { useHistory } from '@/features/history/use-history';
import { historyProjection } from '@/features/history/history-projection';
import { useRewards } from '@/features/rewards/use-rewards';
import { RewardsFeedback } from '@/features/rewards/rewards-feedback';
import { unavailableHome, type HomeModel } from './home-model';

export { UnavailableDeviceProtection } from '@/features/protection/device-protection';

export function ConnectedHomeScreen({
  onOpenHistory,
  onOpenQuest,
}: {
  onOpen?: PreferencesNavigation;
  onOpenHistory?: () => void;
  onOpenQuest?: (id: string) => void;
  onManageProtection?: () => void;
}) {
  const recommendations = useRecommendations(onOpenQuest);
  const rewards = useRewards();
  const history = useHistory();
  const weekly = historyProjection(
    history.snapshot?.view,
    history.snapshot?.matching ?? false,
  ).weekly;
  const wallet = rewards.wallet;
  const rewardModel: HomeModel = wallet
    ? {
        ...unavailableHome,
        recommendation: recommendations.recommendation,
        weekly,
        credits: { state: 'ready', value: wallet.balance },
        dino: {
          state: 'ready',
          value: {
            percent: wallet.health,
            artwork: wallet.artwork,
            feedCost: wallet.feed_cost,
          },
        },
        streak:
          wallet.streak_days === null
            ? { state: 'unavailable' }
            : {
                state: 'ready',
                value: {
                  days: wallet.streak_days,
                  recentWeekComplete: wallet.recent_week_complete,
                },
              },
      }
    : {
        ...unavailableHome,
        weekly,
        recommendation: recommendations.recommendation,
      };
  return (
    <HomeScreen
      model={rewardModel}
      onFeed={rewards.canFeed ? rewards.feed : undefined}
      feeding={rewards.feeding}
      onAcceptRecommendation={
        recommendations.canAct && onOpenQuest
          ? recommendations.accept
          : undefined
      }
      onSkipRecommendation={
        recommendations.canAct ? recommendations.skip : undefined
      }
      recommendationBusy={recommendations.busy}
      recommendationFeedback={
        <RecommendationFeedback
          recommendations={recommendations}
          onOpen={onOpenQuest}
        />
      }
      onOpenHistory={onOpenHistory}
      preferences={<RewardsFeedback rewards={rewards} />}

    />
  );
}
