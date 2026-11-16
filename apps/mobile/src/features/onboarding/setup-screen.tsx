import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useUiTheme } from '@/components/ui/theme';
import { useAppRuntime } from '@/features/account/app-runtime-context';
import { useIdentityQuery } from '@/features/account/identity-query';
import { readSettings } from '@/features/settings/settings-api';
import { useAccountData, useAccountQuery } from '@/infrastructure/query/account-data-provider';

import type { OnboardingProgress, OnboardingProgressRead } from './progress-repository';
import { PlanSummary, SetupDraft } from './setup-draft';
import { reviewSavedSettings } from './setup-model';
import { activityPayload, activitySummary } from '../preferences/activity-model';
import { setupRepository } from './progress-storage';

export function SetupScreen() {
  const router = useRouter();
  const theme = useUiTheme();
  const { scope, availability } = useAccountData();
  const project = useAppRuntime()?.nativeNamespace;
  const repo = project ? setupRepository(project) : null;
  const identity = useIdentityQuery();
  const verified = scope && !identity.isError && identity.data?.user_id === scope.account.user_id;
  const settings = useAccountQuery(['settings'], readSettings);
  const [result, setResult] = useState<OnboardingProgressRead | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scope || !repo || !verified) return;
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

  async function update(progress: OnboardingProgress | null) {
    if (busy || !repo || !scope || !verified || !scope.isCurrent()) return;
    setBusy(true);
    setFailed(false);
    try {
      if (progress) await repo.save(scope, progress);
      else await repo.discard(scope);
      if (!scope.isCurrent()) return;
      setResult(progress ? { status: 'found', progress } : { status: 'not_started' });
      if (progress?.step === 'complete') router.replace('/(tabs)');
    } catch {
      if (scope.isCurrent()) setFailed(true);
    } finally {
      if (scope.isCurrent()) setBusy(false);
    }
  }

  const retry = () => {
    setResult(null);
    setAttempt(value => value + 1);
    void identity.refetch();
    void settings.refetch();
  };
  const progress = result?.status === 'found' ? result.progress : null;
  if (progress && (status === 'draft' || status === 'ready_to_finish') &&
    (progress.step === 'preferences' || progress.step === 'plan' ||
      (progress.step === 'review' && progress.settingsRevision === undefined))) {
    return (
      <SetupDraft key={progress.step} progress={progress} busy={busy} failed={failed}
        onDiscard={() => { void update(null); }} onSave={next => { void update(next); }} onLeave={() => router.replace('/(tabs)')} />
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
    completed: 'Setup is complete on this device.',
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
            : { version: 1, step: 'preferences' });
        }} />
      )}
      {existing && status === 'ready_to_finish' && (
        <Button label="Keep my settings" busy={busy} onPress={() => {
          void update({ version: 1, step: 'complete', settingsRevision: existing.revision });
        }} />
      )}
      {(status === 'read_failed' || status === 'incompatible' || status === 'unavailable') && (
        <Button label="Retry setup" busy={busy} onPress={retry} />
      )}
      {(status === 'draft' || status === 'ready_to_finish' || status === 'read_failed' || status === 'incompatible') && (
        <Button label="Discard setup progress" variant="secondary" busy={busy} onPress={() => { void update(null); }} />
      )}
      <Button label="Continue to Home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
