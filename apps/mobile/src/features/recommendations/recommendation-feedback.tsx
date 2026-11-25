import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { colors, fonts } from '@/design/tokens';
import type { useRecommendations } from './use-recommendations';

export function RecommendationFeedback({
  recommendations: r,
  onOpen,
}: {
  recommendations: ReturnType<typeof useRecommendations>;
  onOpen?: (id: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {r.message ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: colors.muted, fontFamily: fonts.regular }}
        >
          {r.message}
        </Text>
      ) : null}
      {r.notice && !r.notice.startsWith('A fresh suggestion will be available after ') ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.regular }}>
          {r.notice}
        </Text>
      ) : null}
      {r.data?.accepted_quest_id && onOpen ? (
        <Button
          label="Review one-time quest"
          variant="secondary"
          onPress={() => onOpen(r.data!.accepted_quest_id!)}
        />
      ) : null}
      {r.message || r.recommendation.state === 'error' || r.notice.includes('expired') ? <Button
        label="Check latest suggestion"
        variant="secondary"
        disabled={!r.canRefresh}
        busy={r.refreshing}
        onPress={r.refresh}
      /> : null}
    </View>
  );
}
