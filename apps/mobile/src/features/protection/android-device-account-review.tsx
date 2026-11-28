import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';

export function AndroidDeviceAccountReview() {
  const account = useAccountWeeklyPlan();
  const [confirm, setConfirm] = useState(false);
  if (!account) return null;
  const { plan, claiming, claimMessage, claim } = account;
  const conflict = plan.read.phase === 'error' && plan.read.otherAccount;
  if (!conflict && !claimMessage) return null;

  return (
    <View style={{ gap: 12 }}>
      {conflict ? (
        <Button
          label="Use this account on this device"
          variant="secondary"
          busy={claiming}
          disabled={plan.busy}
          onPress={() => setConfirm(true)}
        />
      ) : null}
      {claimMessage ? <Text accessibilityLiveRegion="polite">{claimMessage}</Text> : null}
      {confirm && conflict ? (
        <ConfirmationDialog
          title="Use this account on this device? Previous account rules will stop. Its private history is retained. No schedule will start automatically."
          keepLabel="Keep current setup"
          discardLabel="Confirm device account"
          onKeep={() => setConfirm(false)}
          onDiscard={() => {
            setConfirm(false);
            claim();
          }}
        />
      ) : null}
    </View>
  );
}
