import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';
import { completeSchedule, sameSchedule, type ScheduleInstallation } from '@/features/plans/weekly-schedule';
import type { ReviewedWeeklyPlan } from '@/features/plans/use-weekly-plan';
import { WeeklyPlanCard } from '@/features/plans/weekly-plan-card';
import type { OnboardingProgress } from './progress-repository';
import { PlanSummary } from './setup-draft';

type Props = {
  progress: OnboardingProgress;
  busy: boolean;
  failed: boolean;
  record: (next: OnboardingProgress) => Promise<boolean>;
  onManage: () => void;
};

function matchesInstallation(
  installation: ScheduleInstallation | undefined,
  reviewed: ReviewedWeeklyPlan,
  exactRevision: boolean,
) {
  return !!installation?.enabled && !installation.otherInstallation &&
    installation.native.state === 'armed' &&
    (!exactRevision || installation.native.installedRevision === reviewed.revision) &&
    installation.native.selectionRevision === reviewed.selectionRevision &&
    sameSchedule(installation.spec, reviewed.spec);
}

export function SetupProtection({ progress, busy, failed, record, onManage }: Props) {
  const account = useAccountWeeklyPlan();
  const plan = account?.plan;
  const refresh = plan?.refresh;
  useEffect(() => {
    void refresh?.();
  }, [refresh]);
  const read = plan?.read;
  const ready = read?.phase === 'ready' ? read : null;
  const install = ready?.installation;
  const attempt = progress.protectionAttempt;
  const [reconciled, setReconciled] = useState<ReviewedWeeklyPlan>();
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const blocked = busy || checking || !!plan?.busy || !!account?.claiming;
  let review: ReviewedWeeklyPlan | undefined;
  if (account?.draftAvailable && plan && ready?.selectedAppCount &&
    ready.selectionAvailable !== false && install && !install.otherInstallation &&
    (install.native.installedRevision ?? 0) < 2147483647 &&
    !(install.native.platform === 'ios' && !install.native.activationAvailable) &&
    install.native.state !== 'failed' && install.native.state !== 'needs_permission') {
    try {
      review = {
        spec: completeSchedule(plan.draft),
        revision: install.native.installedRevision ?? 0,
        selectionRevision: ready.selectionRevision,
      };
    } catch {
      // Saving an incomplete draft is allowed. Apply requires a complete schedule.
    }
  }
  const selectionChanged = !!ready && progress.selectionRevision !== ready.selectionRevision;
  const confirmed = attempt
    ? matchesInstallation(install, attempt, true)
    : !!review && !selectionChanged && matchesInstallation(install, review, false);

  async function reconcile() {
    if (!plan || !attempt || blocked) return;
    setChecking(true);
    setCheckFailed(false);
    setReconciled(undefined);
    try {
      const latest = await plan.refresh();
      if (latest?.phase === 'ready') setReconciled(attempt);
      else setCheckFailed(true);
    } finally {
      setChecking(false);
    }
  }
  function finish(applied: boolean) {
    if (blocked) return;
    void record({
      ...progress, step: 'complete',
      permissionDeferred: !applied,
      protectionAttempt: applied ? undefined : attempt,
    });
  }

  return (
    <Screen title="Review device setup">
      <Text>Your preferences can be kept on your account while you set up protection on this device.</Text>
      <PlanSummary plan={account?.draftAvailable ? plan?.draft ?? null : null} />
      {!account?.draftAvailable && <Text>Connect to verify the latest saved plan before applying.</Text>}
      {ready && (
        <>
          <Text>{ready.selectionAvailable === false
            ? 'Saved apps need to be reviewed.'
            : ready.selectedAppCount === 1 ? '1 app saved on this device.'
            : `${ready.selectedAppCount} apps saved on this device.`}</Text>
          <Text>{install?.native.serviceConnected && install.native.disclosureAccepted
            ? 'App protection access is allowed.' : 'App protection access needs review.'}</Text>
          {!!install?.native.reasonCount && (
            <Text>Current schedule periods on this device: {install.native.reasonCount}.</Text>
          )}
        </>
      )}
      <Text>During the scheduled hours, your session allowance applies per selected app.</Text>
      <WeeklyPlanCard
        read={read ?? { phase: 'unavailable' }}
        pending={!!attempt && !confirmed}
        busy={!!plan?.busy}
        draftChanged={!!review && !!install?.spec && !sameSchedule(install.spec, review.spec)}
        appsChanged={selectionChanged}
      />
      {confirmed && <Text accessibilityLiveRegion="polite">This device confirmed the applied schedule.</Text>}
      {attempt && !confirmed && (
        <>
          {checkFailed && <InlineStatus state="error" message="The device could not confirm its latest schedule. Check again when ready." />}
          <Button label="Check device after Apply" busy={checking} disabled={blocked} onPress={() => { void reconcile(); }} />
          {reconciled === attempt && ready && (
            <Button label="Review latest device setup" variant="secondary" disabled={blocked}
              onPress={() => {
                void record({ ...progress, protectionAttempt: undefined }).then(saved => {
                  if (saved) setReconciled(undefined);
                });
              }} />
          )}
        </>
      )}
      {!attempt && !confirmed && (
        <>
          {account?.draftAvailable && !review && ready && (
            <Text>Review your saved hours, days, session allowance and apps before applying.</Text>
          )}
          {!!plan?.notice && <Text accessibilityLiveRegion="polite">{plan.notice}</Text>}
          <Button label="Preview schedule" variant="secondary"
            disabled={blocked || !review || selectionChanged} onPress={() => { void plan?.preview(); }} />
          {plan?.previewWindows && (
            <View style={{ gap: 6 }}>
              <Text accessibilityRole="header">Upcoming times on this device</Text>
              {plan.previewWindows.map(window => (
                <Text key={window.startsAt}>{new Date(window.startsAt).toLocaleString()} – {new Date(window.endsAt).toLocaleString()}</Text>
              ))}
            </View>
          )}
          <Button label="Apply protection" busy={!!plan?.busy}
            disabled={blocked || !review || selectionChanged || !!plan?.intent}
            onPress={() => {
              if (!review) return;
              void plan?.applyReviewed(review, protectionAttempt => record({ ...progress, protectionAttempt }));
            }} />
          <Button label="Review device access again" variant="secondary" disabled={blocked}
            onPress={() => {
              void record({ ...progress, step: 'permission', selectionRevision: undefined });
            }} />
          {plan && <Button label="Refresh device schedule" variant="secondary" disabled={blocked}
            onPress={() => { void plan.refresh(); }} />}
        </>
      )}
      {(read?.phase === 'error' || install?.otherInstallation) && (
        <Button label="Manage existing device setup in Settings" variant="secondary" disabled={blocked} onPress={onManage} />
      )}
      {failed && <InlineStatus state="error" message="Setup progress could not be recorded. Try again." />}
      <Button label={confirmed ? 'Finish setup' : 'Finish for now'} variant={confirmed ? 'primary' : 'secondary'}
        disabled={blocked} onPress={() => finish(confirmed)} />
    </Screen>
  );
}
