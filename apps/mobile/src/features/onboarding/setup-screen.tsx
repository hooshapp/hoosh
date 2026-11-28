import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { Questionnaire } from './questionnaire';
import { PlanCompletionScreen } from './figma-plan-screens';
import type { SettingsPatch } from '@disconnect/contracts';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useUiTheme } from '@/components/ui/theme';
import { useAppRuntime } from '@/features/account/app-runtime-context';
import { ProfileSurface } from '@/features/account/profile-surface';
import { useIdentityQuery } from '@/features/account/identity-query';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { useAccountData } from '@/infrastructure/query/account-data-provider';

import type { OnboardingProgress, OnboardingProgressRead } from './progress-repository';
import { SetupProtection } from './setup-protection';
import { SetupDevice } from './setup-device';
import { PlanSummary, SetupDraft } from './setup-draft';
import { reviewSavedSettings } from './setup-model';
import { activityPayload, activitySummary } from '../preferences/activity-model';
import { SetupSettingsReview } from './setup-settings-review';
import { SetupPlanSave } from './setup-plan-save';
import { setupRepository } from './progress-storage';

export function SetupScreen() {
  const router = useRouter();
  const iosDevice = useIOSSelectionDevice();
  const nativeOwner = useNativeOwner();
  const usesScreenTime = Platform.OS === 'ios' && Boolean(iosDevice || nativeOwner);
  const theme = useUiTheme();
  const { scope, availability } = useAccountData();
  const project = useAppRuntime()?.nativeNamespace;
  const repo = project ? setupRepository(project) : null;
  const identity = useIdentityQuery();
  const verified = scope && !identity.isError && identity.data?.user_id === scope.account.user_id;
  const settings = useSettingsQuery();
  const [result, setResult] = useState<OnboardingProgressRead | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [completionScope, setCompletionScope] = useState<number>();
  const [failed, setFailed] = useState(false);
  const writing = useRef(false);
  const [reviewProfile, setReviewProfile] = useState(false);
  const [profileReceipt, setProfileReceipt] = useState<number>();

  useEffect(() => {
    if (!scope || !repo || !scope.isCurrent()) return;
    let active = true;
    void repo.read(scope).then(next => {
      if (active && scope.isCurrent()) setResult(next);
    }).catch(() => {
      if (active && scope.isCurrent()) setResult({ status: 'read_failed' });
    });
    return () => { active = false; };
  }, [scope, repo, verified, attempt]);

  const existing = settings.data?.settings;
  const status = !repo || availability !== 'ready' || identity.isError || settings.isError || settings.isPaused
    ? 'unavailable' : !verified || !result || !settings.data
      ? 'loading' : result.status === 'found'
        ? result.progress.step === 'complete' ? 'completed'
          : result.progress.step === 'review' ? 'ready_to_finish' : 'draft'
        : result.status;

  async function update(progress: OnboardingProgress | null, expectedAttempt?: SettingsPatch) {
    if (writing.current || !repo || !scope || (!verified && progress?.step !== 'questions') || !scope.isCurrent()) return false;
    // Older iOS progress may already have reviewed Screen Time in the questionnaire.
    if (progress?.step === 'permission' && progress.questionsCompleted && usesScreenTime) {
      progress = { ...progress, step: 'complete' };
    }
    writing.current = true;
    setBusy(true);
    setFailed(false);
    try {
      if (progress) await repo.save(scope, progress, expectedAttempt);
      else await repo.discard(scope);
      if (!scope.isCurrent()) return false;
      setResult(progress ? { status: 'found', progress } : { status: 'not_started' });
      if (progress?.step === 'complete') setCompletionScope(scope.id);
      return true;
    } catch {
      if (scope.isCurrent()) setFailed(true);
      return false;
    } finally {
      writing.current = false;
      if (scope.isCurrent()) setBusy(false);
    }
  }

  function leaveSetup() {
    if (scope?.isCurrent()) scope.client.setQueryData(scope.key('setup-resume-dismissed'), true);
    router.replace('/(tabs)');
  }

  const retry = () => {
    setResult(null);
    setAttempt(value => value + 1);
    void identity.refetch();
    void settings.refetch();
  };
  const progress = result?.status === 'found' ? result.progress : null;
  if (verified && scope && completionScope === scope.id && progress?.step === 'complete') {
    const hobbies = progress.activities?.selected_activity_ids.map(id => ({ gym: 'Gym', reading: 'Reading', arts_and_crafts: 'Arts and crafts', walking: 'Walking', music: 'Music', cooking: 'Cooking' }[id])) ?? [];
    if (progress.activities?.custom_text) hobbies.push(progress.activities.custom_text);
    return <PlanCompletionScreen hobbies={hobbies} message={progress.settingsDeferred
      ? 'Your draft is saved on this device. Finish account and device setup from Settings.'
      : progress.permissionDeferred
      ? Platform.OS === 'android'
        ? 'Your choices are saved. App protection setup is still pending. You can continue from Settings.'
        : 'Your choices are saved. Screen Time setup is still pending. You can continue from Settings.'
      : 'Your preferences are saved. You can adjust them anytime in Settings.'}
      onFinish={() => router.replace('/(tabs)')} />;
  }
  if (verified && reviewProfile && progress?.step === 'review' && !progress.settingsAttempt) {
    return (
      <Screen title="Review your profile">
        <ProfileSurface recordingSetup={busy} onBackToSetup={() => setReviewProfile(false)} onProfileSaved={revision => {
          setProfileReceipt(revision);
          void update({ ...progress, profileRevision: revision });
        }} />
        {failed && profileReceipt !== undefined && (
          <>
            <Text accessibilityRole="alert" style={{ color: theme.error }}>
              Your profile was saved. Retry recording your setup progress.
            </Text>
            <Button label="Record profile progress" busy={busy} onPress={() => {
              void update({ ...progress, profileRevision: profileReceipt });
            }} />
          </>
        )}
      </Screen>
    );
  }

  if (scope?.isCurrent() && ((progress?.step === 'questions') || (verified && status === 'not_started' && !existing))) {
    return <Questionnaire key={scope.id} progress={progress ?? { version: 1, step: 'questions', settingsBaseRevision: 0 }} busy={busy} failed={failed} onSave={update} />;
  }

  if (verified && progress?.step === 'review' && progress.questionsCompleted && (iosDevice || nativeOwner) && progress.settingsRevision === undefined) {
    return <SetupPlanSave progress={progress} busy={busy} record={update} onEdit={() => { void update({ ...progress, step: 'plan', settingsAttempt: undefined }); }} />;
  }

  if (verified && progress && (progress.step === 'preferences' || progress.step === 'plan' ||
    (progress.step === 'review' && progress.settingsRevision === undefined))) {
    return (
      <SetupDraft key={progress.step} progress={progress} busy={busy} failed={failed}
        onDiscard={() => { void update(null); }}
        onSave={next => { void update(next); }}
        onLeave={leaveSetup}
        reviewActions={progress.step === 'review' && (
          <>
            {!progress.settingsAttempt && (
              <Button label="Review profile" variant="secondary" disabled={busy}
                onPress={() => { setProfileReceipt(undefined); setFailed(false); setReviewProfile(true); }} />
            )}
            <SetupSettingsReview progress={progress} busy={busy} record={update} />
            {!progress.settingsAttempt && (
              <Button label="Finish setup for now" variant="secondary" disabled={busy} onPress={() => {
                void update({ ...progress, step: 'complete', settingsDeferred: true });
              }} />
            )}
          </>
        )}
      />
    );
  }

  if (verified && progress?.step === 'protection') {
    return <SetupProtection progress={progress} busy={busy} failed={failed} record={update}
      onManage={() => router.push('/(tabs)/settings')} />;
  }

  if (verified && progress?.step === 'permission' && progress.questionsCompleted && usesScreenTime) {
    return <PlanCompletionScreen hobbies={progress.questions?.hobbies ?? []}
      message="Your preferences are saved. App protection starts only after you apply your plan in Settings."
      onFinish={() => { void update({ ...progress, step: 'complete' }).then(saved => { if (saved) router.replace('/(tabs)'); }); }} />;
  }

  if (verified && progress?.step === 'permission') {
    return (
      <SetupDevice
        preferencesSaved={progress.settingsRevision !== undefined}
        busy={busy}
        failed={failed}
        onReview={selectionRevision => update({
          ...progress, step: 'protection', selectionRevision, permissionDeferred: undefined,
        })}
        onFinish={() => {
          void update({ ...progress, step: 'complete', permissionDeferred: true });
        }}
      />
    );
  }

  const saved = existing && status === 'ready_to_finish' ? reviewSavedSettings(existing) : null;
  const copy = {
    loading: 'Checking your account and saved setup…',
    unavailable: 'Your account or saved settings could not be verified. Try again when connected.',
    not_started: existing
      ? 'This account already has saved settings. Review them before deciding how to continue.'
      : 'Start setup on this device. You can return here to finish later.',
    draft: 'Your setup progress is saved on this device. You can leave and return later.',
    ready_to_finish: 'Review the settings already saved for this account.',
    completed: progress?.settingsDeferred
      ? 'You finished setup for now. Your draft is still on this device.'
      : 'Setup is complete on this device.',
    read_failed: 'Your saved progress could not be read. Retry before starting over.',
    incompatible: 'Your saved setup was created by another version of Hoosh. Retry or discard it to start over.',
  }[status];

  return (
    <Screen title="Set up Hoosh">
      <Text accessibilityLiveRegion="polite" style={{ color: theme.foreground }}>{copy}</Text>
      {failed && <Text accessibilityRole="alert" style={{ color: theme.error }}>Setup could not be saved. Try again.</Text>}
      {saved && existing && (
        <>
          <Text style={{ color: theme.foreground }}>{activitySummary(activityPayload(saved.activities)) ?? 'No saved activities'}</Text>
          <PlanSummary plan={existing.plan_draft} />
        </>
      )}
      {existing && status === 'not_started' && (
        <Text style={{ color: theme.foreground }}>
          Saved activities: {existing.activities.selected_activity_ids.length}
          {existing.plan_draft ? '. A schedule draft is saved.' : '. No schedule draft is saved.'}
        </Text>
      )}
      {status === 'not_started' && (
        <Button label={existing ? 'Review saved settings' : 'Start setup'} busy={busy} onPress={() => {
          void update(existing
            ? { version: 1, step: 'review', settingsRevision: existing.revision }
            : { version: 1, step: 'preferences', settingsBaseRevision: 0 });
        }} />
      )}
      {status === 'completed' && progress?.permissionDeferred && (
        <Button label="Resume device setup" busy={busy} onPress={() => {
          void update({
            ...progress, step: progress.protectionAttempt ? 'protection' : 'permission',
            permissionDeferred: undefined,
            selectionRevision: progress.protectionAttempt ? progress.selectionRevision : undefined,
          });
        }} />
      )}
      {status === 'completed' && progress?.settingsDeferred && (
        <Button label="Resume my draft" busy={busy} onPress={() => {
          void update({ ...progress, step: 'review', settingsDeferred: undefined });
        }} />
      )}
      {existing && status === 'ready_to_finish' && (
        <Button label="Keep my settings" busy={busy} onPress={() => {
          void update({
            version: 1, step: 'complete', settingsRevision: existing.revision, permissionDeferred: true,
          });
        }} />
      )}
      {existing && status === 'ready_to_finish' && (
        <Button label="Keep settings and review device access" variant="secondary" busy={busy} onPress={() => {
          void update({ version: 1, step: 'permission', settingsRevision: existing.revision });
        }} />
      )}
      {(status === 'read_failed' || status === 'incompatible' || status === 'unavailable') && (
        <Button label="Retry setup" busy={busy} onPress={retry} />
      )}
      {(status === 'draft' || status === 'ready_to_finish' || status === 'read_failed' || status === 'incompatible') && (
        <Button label="Discard setup progress" variant="secondary" busy={busy} onPress={() => { void update(null); }} />
      )}
      <Button label="Continue to Home" variant="secondary" onPress={leaveSetup} />
    </Screen>
  );
}
