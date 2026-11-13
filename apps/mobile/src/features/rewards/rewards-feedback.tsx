import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { colors, fonts } from '@/design/tokens';
import type { useRewards } from './use-rewards';

/** Status and recovery for the existing Home cards; no substitute outcome metrics. */
export function RewardsFeedback({ rewards }: { rewards: ReturnType<typeof useRewards> }) {
  return (
    <>
      {rewards.wallet ? (
        <Text style={styles.policy}>
          Dino starts at 50 health. After your first reward, it loses 5 per day.
          {' '}Feed restores up to 20 for 20 credits.
          {rewards.wallet.streak_days === null ? ' Streak coverage is not available yet.' : ''}
        </Text>
      ) : (
        <InlineStatus
          state={rewards.loading ? 'loading' : 'unavailable'}
          message={rewards.loading ? 'Checking your rewards…' : rewards.unavailable}
        />
      )}
      {rewards.message ? <Text style={styles.message}>{rewards.message}</Text> : null}
      {rewards.syncNotice ? <InlineStatus state="unavailable" message={rewards.syncNotice} /> : null}
      {rewards.pending ? (
        <Button
          label="Check last Feed"
          busyLabel="Checking…"
          disabled={!rewards.canCheck}
          busy={rewards.feeding}
          onPress={rewards.checkFeed}
        />
      ) : null}
      <Button label="Refresh rewards" busy={rewards.refreshing} onPress={rewards.refresh} />
    </>
  );
}
const styles = StyleSheet.create({
  policy: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  message: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
