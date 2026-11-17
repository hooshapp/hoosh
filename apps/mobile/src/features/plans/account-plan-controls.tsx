import { useRef, useState, type ComponentRef } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useDialogFocusReturn } from '@/components/ui/use-dialog-focus-return';
import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { useAccountWeeklyPlan } from './account-weekly-plan';
import { completeSchedule, sameSchedule } from './weekly-schedule';
import { WeeklyPlanCard } from './weekly-plan-card';

/** Normal Settings consumes the saved account draft; reads/Preview never install it. */
export function AccountPlanControls() {
  const account = useAccountWeeklyPlan();
  const [confirm, setConfirm] = useState(false);
  const claimButton = useRef<ComponentRef<typeof Button>>(null);
  const restore = useDialogFocusReturn(claimButton);
  if (!account)
    return (
      <Text>
        Verify your account and use a supported native build to manage this
        device’s app schedule.
      </Text>
    );
  const { plan, draftAvailable, claiming } = account;
  const ready = plan.read.phase === 'ready' ? plan.read : null;
  const installed = ready?.installation;
  const blocked = plan.busy || claiming || !!plan.intent || !ready;
  let complete = false,
    changed = false;
  try {
    completeSchedule(plan.draft);
    complete = true;
    changed =
      draftAvailable && !sameSchedule(plan.draft, installed?.spec ?? null);
  } catch {
    /* Incomplete drafts stay editable, never installable. */
  }
  const applyDisabled =
    blocked ||
    !draftAvailable ||
    !complete ||
    !ready?.selectedAppCount ||
    ready.selectionAvailable === false ||
    installed?.otherInstallation ||
    installed?.native.state === 'needs_permission' ||
    installed?.native.state === 'failed';
  const appsChanged =
    !!ready &&
    ready.selectionAvailable !== false &&
    !!installed?.spec &&
    ready.selectionRevision !== installed.native.selectionRevision;
  return (
    <View style={{ gap: 12 }}>
      <WeeklyPlanCard
        read={plan.read}
        busy={plan.busy || claiming}
        pending={!!plan.intent}
        draftChanged={changed}
        appsChanged={appsChanged}
        onReviewAccess={() => {
          void plan.reviewAccess();
        }}
      />
      <Text>
        {draftAvailable
          ? complete
            ? 'Review your saved draft and selected apps, then apply it to this device.'
            : 'Save days, hours, a time zone and session allowances before applying.'
          : 'Connect and verify your saved draft to Preview or Apply. You can still refresh or Stop an installed weekly plan.'}
      </Text>
      {ready && ready.selectionAvailable === false ? (
        <Text>
          Saved app choices could not be read. Refresh before applying. Your
          installed weekly plan can still be stopped.
        </Text>
      ) : null}
      {ready &&
      ready.selectionAvailable !== false &&
      !ready.selectedAppCount ? (
        <Text>Choose and save at least one distracting app first.</Text>
      ) : null}
      <Text accessibilityLiveRegion="polite">{plan.notice}</Text>
      {account.claimMessage ? (
        <Text accessibilityLiveRegion="polite">{account.claimMessage}</Text>
      ) : null}
      <Button
        label="Preview saved plan"
        disabled={blocked || !draftAvailable || !complete}
        onPress={() => {
          void plan.preview();
        }}
      />
      <Button
        label={
          installed?.enabled
            ? 'Apply saved plan changes'
            : installed?.spec
              ? 'Resume saved plan'
              : 'Apply saved plan'
        }
        busy={plan.busy}
        disabled={!!applyDisabled}
        onPress={() => {
          void plan.apply();
        }}
      />
      <Button
        label="Stop weekly plan"
        disabled={blocked || !installed?.enabled}
        onPress={() => {
          void plan.stop();
        }}
      />
      <Button
        label="Refresh device schedule"
        variant="secondary"
        disabled={plan.busy || claiming || plan.read.phase === 'checking'}
        onPress={() => {
          void plan.refresh();
        }}
      />
      <Button
        label="Review app protection access"
        disabled={plan.busy || claiming || !ready}
        onPress={() => {
          void plan.reviewAccess();
        }}
      />
      {plan.read.phase === 'error' ? (
        <>
          <Text>
            If another account previously managed this device, confirm using
            this account. This stops its local rules and retains its private
            history.
          </Text>
          <Button
            ref={claimButton}
            label="Use this account on this device"
            variant="secondary"
            disabled={plan.busy || claiming}
            busy={claiming}
            onPress={() => setConfirm(true)}
          />
        </>
      ) : null}
      {confirm ? (
        <ConfirmationDialog
          title="Use this account on this device? Previous account rules will stop. Its private history is retained. No schedule will start automatically."
          keepLabel="Keep current setup"
          discardLabel="Confirm device account"
          onKeep={() => {
            setConfirm(false);
            restore();
          }}
          onDiscard={() => {
            setConfirm(false);
            account.claim();
            restore();
          }}
        />
      ) : null}
      {plan.previewWindows ? (
        <View>
          <Text accessibilityRole="header">Upcoming times on this device</Text>
          {plan.previewWindows.map((window) => (
            <Text key={window.startsAt}>
              {new Date(window.startsAt).toLocaleString()} →{' '}
              {new Date(window.endsAt).toLocaleString()}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
