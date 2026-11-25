import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { colors, fonts } from '@/design/tokens';
import type { useRewards } from './use-rewards';

/** Status and recovery for the existing Home cards; no substitute outcome metrics. */
export function RewardsFeedback({ rewards }: { rewards: ReturnType<typeof useRewards> }) {
  return (
    <>
      {!rewards.wallet ? <InlineStatus state={rewards.loading ? 'loading' : 'unavailable'}
        message={rewards.loading ? 'Checking your rewards…' : rewards.unavailable} /> : null}
      {rewards.wallet && rewards.wallet.health <= 25 ? (
        <Text style={styles.message}>Dino’s a little droopy. Feed costs 10 credits and restores up to 20 health points.</Text>
      ) : null}
      {rewards.wallet && rewards.syncNotice ? (
        <Text style={styles.policy}>{rewards.syncNotice}</Text>
      ) : null}
      {rewards.message ? <Text accessibilityLiveRegion="polite" role="status" style={styles.message}>{rewards.message}</Text> : null}
      {rewards.pending ? (
        <Button
          label="Check last Feed"
          busyLabel="Checking…"
          disabled={!rewards.canCheck}
          busy={rewards.feeding}
          onPress={rewards.checkFeed}
        />
      ) : null}
      {!rewards.wallet && !rewards.loading ? <Button label="Try rewards again" busy={rewards.refreshing} onPress={rewards.refresh} /> : null}
    </>
  );
}
const styles = StyleSheet.create({
  policy: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  message: { color: colors.muted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
