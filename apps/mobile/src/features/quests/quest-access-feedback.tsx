import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAccountAction } from '@/features/account/use-account-action';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
/** Existing account recovery port only; no SDK/session/credential owner here. */
export function QuestAccessFeedback({ online }: { online: boolean }) {
  const { availability, controller } = useAccountData();
  const action = useAccountAction(controller, () => controller.recoverSession());
  if (!online) return <Text>Connect to load or save quests. Your draft is still here.</Text>;
  if (availability === 'api_paused' || availability === 'recovering')
    return (
      <View style={{ gap: 12 }}>
        <Text>
          {action.failed
            ? 'Account access could not be verified. Your draft is still here.'
            : 'Verify account access to continue with saved quests.'}
        </Text>
        <Button
          label="Verify account access"
          busy={action.busy || availability === 'recovering'}
          busyLabel="Verifying…"
          onPress={action.run}
        />
      </View>
    );
  return availability !== 'ready' ? (
    <Text>Quest storage is temporarily unavailable. Your draft is still here.</Text>
  ) : null;
}
