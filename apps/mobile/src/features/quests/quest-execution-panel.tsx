import type { QuestView } from '@disconnect/contracts';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useDialogFocusReturn } from '@/components/ui/use-dialog-focus-return';
import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { editorStyles } from '@/features/editors/editor-controls';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { isQuestDate } from '@/domain/quest-values';
import type { useQuestLifecycle } from './use-quest-lifecycle';

type Lifecycle = ReturnType<typeof useQuestLifecycle>;
export function QuestExecutionPanel({
  quest,
  definitionDirty,
  lifecycle,
  onDraftDirtyChange,
}: {
  quest: QuestView;
  definitionDirty: boolean;
  lifecycle: Lifecycle;
  onDraftDirtyChange: (dirty: boolean) => void;
}) {
  const { state, controller, owner } = lifecycle;
  const settings = useSettingsQuery();
  const [firstDate, setFirstDate] = useState('');
  useEffect(
    () => onDraftDirtyChange(firstDate.length > 0),
    [firstDate, onDraftDirtyChange],
  );
  const plan = settings.data?.settings?.plan_draft;
  // An installed policy owns the allowance day/zone. Changing it needs a separate migration.
  const policy =
    state.device?.policy ??
    (plan?.session_count && plan.session_minutes
      ? {
          sessionsPerDay: plan.session_count,
          sessionSeconds: plan.session_minutes * 60,
          timezoneId: plan.timezone_id ?? quest.definition.timezone_id,
        }
      : null);
  const ready = !state.busy && !state.reviewRequired && !!state.remote;
  const device = state.device;
  const gated = device?.native.platform === 'ios' && !device.native.activationAvailable;
  const deviceLabel = gated ? 'iPhone activation is paused until physical Screen Time testing is complete. You can still review and save quest details.' : !owner
    ? 'Device installation unavailable on this platform.'
    : !device
      ? 'Device schedule unconfirmed. Check access before relying on protection.'
      : !device.enabled
        ? 'This quest is stopped on this device.'
        : device.native.state === 'needs_permission'
          ? 'Quest installed, but protection access is missing.'
          : device.native.state === 'failed'
            ? 'Device protection reported a problem.'
            : device.native.state === 'armed'
              ? 'Quest installed. Native protection follows its saved times.'
              : 'Quest installed; no intervention is active right now.';
  return (
    <View style={editorStyles.panel}>
      <Text accessibilityRole="header" style={editorStyles.title}>
        Quest schedule
      </Text>
      <Text style={editorStyles.body}>
        {state.remote
          ? state.remote.enabled
            ? 'Account schedule is enabled.'
            : 'Account schedule is stopped.'
          : 'Account schedule unavailable.'}
      </Text>
      {state.remote?.versions
        .filter(
          (version) =>
            version.effective_until === null ||
            Date.parse(version.effective_until) >
              Date.parse(state.remote!.observed_at) - 2 * 86400000,
        )
        .map((version) => (
          <Text key={version.revision} style={editorStyles.body}>
            {version.definition.title} · from {version.first_date} ·{' '}
            {version.definition.start_local}–{version.definition.end_local}
            {version.definition.next_day ? ' (next day)' : ''} ·{' '}
            {version.definition.repeat === 'none'
              ? 'Once'
              : version.definition.repeat === 'daily'
                ? 'Daily'
                : `Weekly on ${version.definition.weekdays.map((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]).join(', ')}`}{' '}
            · {version.definition.timezone_id}
            {version.effective_until
              ? ' · previous schedule; already started occurrences keep their times'
              : ''}
          </Text>
        ))}
      <Text accessibilityLiveRegion="polite" style={editorStyles.body}>
        {deviceLabel}
      </Text>
      {state.remote?.enabled &&
      device &&
      (!device.enabled || device.remoteRevision !== state.remote.revision) ? (
        <Text accessibilityRole="alert">
          The account schedule and this device differ. Apply the saved schedule
          explicitly or Stop; checking does not resume it.
        </Text>
      ) : null}
      <Text accessibilityLiveRegion="polite" style={editorStyles.body}>
        {state.message}
      </Text>
      <Button
        label="Check latest schedule and device"
        disabled={state.busy}
        onPress={() => {
          void controller.refresh(true);
        }}
      />
      {owner && !device ? (
        <ConfirmQuestAction
          label="Use this account on this device"
          title="Use this account on this device? This stops the previous account’s local rules and keeps its private history. No cloud account is deleted and no schedule resumes automatically."
          confirmLabel="Confirm device account"
          disabled={state.busy}
          onConfirm={() => {
            void controller.claim();
          }}
        />
      ) : null}
      {owner ? (
        <Button
          label="Review app protection access"
          disabled={state.busy}
          onPress={() => {
            void owner.port
              .interventionReviewAccess()
              .then(() => controller.refresh())
              .catch(() => controller.refresh());
          }}
        />
      ) : null}
      <Text style={editorStyles.body}>
        {state.selection
          ? `${state.selection.selectedAppCount} apps saved on this device.`
          : 'Saved apps not yet confirmed.'}
      </Text>
      <Button
        label="Choose distracting apps"
        variant="secondary"
        disabled={state.busy}
        onPress={() => router.push('/settings/apps')}
      />
      <Text style={editorStyles.body}>
        {policy
          ? `${policy.sessionsPerDay} allowances per app each day · ${policy.sessionSeconds / 60} minutes each · ${policy.timezoneId}.`
          : 'Save a session count and duration in Settings before scheduling.'}
      </Text>
      <Button
        label="Review session settings"
        variant="secondary"
        disabled={state.busy}
        onPress={() => router.push('/settings/sessions')}
      />
      <Field
        label="First quest date (YYYY-MM-DD)"
        value={firstDate}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!state.busy}
        onChangeText={setFirstDate}
        hint={`Choose a future start in ${quest.definition.timezone_id}. Saving details alone does not schedule it.`}
      />
      {definitionDirty ? (
        <Text>Save or discard your quest edits before scheduling.</Text>
      ) : null}
      <Button
        label={
          state.remote?.enabled ? 'Update quest schedule' : 'Schedule quest'
        }
        disabled={
          !ready ||
          definitionDirty ||
          !owner ||
          !policy ||
          !isQuestDate(firstDate) ||
          !state.selection?.selectedAppCount ||
          gated ||
          (device?.native.platform === 'ios' ? device.native.state === 'needs_permission' || device.native.state === 'failed' : !device?.native.serviceConnected || !device.native.disclosureAccepted)
        }
        onPress={() => {
          void controller
            .schedule(quest, firstDate, policy)
            .then((confirmed) => {
              if (confirmed) setFirstDate('');
            });
        }}
      />
      {state.remote?.enabled ? (
        <Button
          label="Apply saved schedule to this device"
          disabled={!ready || !owner || !policy || gated}
          onPress={() => {
            void controller.applySaved(policy);
          }}
        />
      ) : null}
      {owner ? (
        <ConfirmQuestAction
          label="Stop this quest"
          title="Stop this quest on this device and in your account? Other quests and plans keep their own rules."
          confirmLabel="Confirm Stop"
          disabled={state.busy}
          onConfirm={() => {
            void controller.stop();
          }}
        />
      ) : null}
      <Text style={editorStyles.body}>
        {state.remote
          ? `${state.remote.completed_count} confirmed completions · ${state.remote.credits} quest credits`
          : 'Quest credits unavailable.'}
      </Text>
      <Text style={editorStyles.body}>
        After the scheduled end, confirm what you did within seven days to earn
        50 credits once. This is self-reported; the timer alone does not
        complete a quest.
      </Text>
      {state.remote?.occurrences.map((occurrence) => (
        <View
          key={`${occurrence.schedule_revision}:${occurrence.local_date}`}
          style={editorStyles.panel}
        >
          <Text style={editorStyles.body}>
            {occurrence.title} · {occurrence.local_date} · {occurrence.state}
          </Text>
          <Text style={editorStyles.body}>
            {occurrence.starts_at} – {occurrence.ends_at} (UTC)
          </Text>
          {occurrence.can_confirm ? (
            <ConfirmQuestAction
              label={`Confirm completion for ${occurrence.local_date}`}
              title="Did you complete this activity? Confirm once to earn 50 quest credits."
              confirmLabel="Confirm completion"
              disabled={!ready}
              onConfirm={() => {
                void controller.outcome(
                  occurrence.schedule_revision,
                  occurrence.local_date,
                  true,
                );
              }}
            />
          ) : null}
          {['upcoming', 'active'].includes(occurrence.state) ? (
            <ConfirmQuestAction
              label={`Cancel occurrence ${occurrence.local_date}`}
              title="Cancel only this occurrence? Future repeats and other quests stay unchanged."
              confirmLabel="Confirm cancellation"
              disabled={!ready || !owner || gated}
              onConfirm={() => {
                void controller.outcome(
                  occurrence.schedule_revision,
                  occurrence.local_date,
                  false,
                );
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Each confirmation owns its real trigger so dismissal restores the correct control. */
function ConfirmQuestAction({
  label,
  title,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string;
  title: string;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<ComponentRef<typeof Button>>(null);
  const restoreFocus = useDialogFocusReturn(trigger);
  const close = () => {
    setOpen(false);
    restoreFocus();
  };
  return (
    <>
      <Button
        ref={trigger}
        label={label}
        variant="secondary"
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <ConfirmationDialog
          title={title}
          keepLabel="Keep reviewing"
          discardLabel={confirmLabel}
          discardDisabled={disabled}
          onKeep={close}
          onDiscard={() => {
            close();
            onConfirm();
          }}
        />
      ) : null}
    </>
  );
}
