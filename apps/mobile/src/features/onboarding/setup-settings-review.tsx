import type { SettingsPatch, SettingsView } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Text } from 'react-native';

import { PlanLoadingScreen } from './figma-plan-screens';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { useUiTheme } from '@/components/ui/theme';
import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { activitySummary } from '../preferences/activity-model';
import { useSettingsMutation, useSettingsQuery } from '../settings/settings-query';
import type { OnboardingProgress } from './progress-repository';
import { PlanSummary } from './setup-draft';
import { changedSettings, hasSettingsChanges } from './setup-model';

const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();

type Comparison = { latest: SettingsView | null; patch: ReturnType<typeof changedSettings> };

function savedProgress(progress: OnboardingProgress, settings: SettingsView | null): OnboardingProgress {
  return {
    ...progress,
    step: 'permission',
    activities: settings?.activities,
    planDraft: settings?.plan_draft,
    settingsRevision: settings?.revision,
    settingsBaseRevision: undefined,
    settingsAttempt: undefined,
  };
}

export function SetupSettingsReview({
  progress, busy, record, autoSave = false,
}: {
  autoSave?: boolean;
  progress: OnboardingProgress;
  busy: boolean;
  record: (next: OnboardingProgress, expectedAttempt?: SettingsPatch) => Promise<boolean>;
}) {
  const { scope, availability } = useAccountData();
  const theme = useUiTheme();
  const query = useSettingsQuery();
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, () => true);
  const [comparison, setComparison] = useState<Comparison>();
  const [receipt, setReceipt] = useState<{ settings: SettingsView; patch: SettingsPatch }>();
  const [failure, setFailure] = useState<'conflict' | 'unconfirmed' | 'failed' | 'read'>(
    progress.settingsAttempt ? 'unconfirmed' : 'failed',
  );
  const [checking, setChecking] = useState(false);
  const starting = useRef(false);
  const attempt = progress.settingsAttempt;
  const reviewed = { activities: progress.activities, plan_draft: progress.planDraft };
  const mutation = useSettingsMutation({
    onSuccess: (response, patchForReceipt) => {
      setReceipt({ settings: response.settings, patch: patchForReceipt });
      void record(savedProgress(progress, response.settings), patchForReceipt);
    },
    onError: error => {
      if (error instanceof ApiError && error.kind === 'conflict') {
        setFailure('conflict');
      } else if (!(error instanceof ApiError) || error.requestMayHaveCommitted) {
        setFailure('unconfirmed');
      } else {
        setFailure('failed');
      }
    },
  });
  const locked = busy || checking || mutation.isPending;
  const canRead = online && availability === 'ready' && !!scope?.canRun();
  const ready = canRead && !query.isFetching && !query.isError && !query.isPaused && !!query.data;
  const latestRevision = query.data?.settings?.revision ?? 0;
  const baseRevision = progress.settingsBaseRevision ?? 0;
  const needsComparison = !!attempt || (!!query.data && latestRevision !== baseRevision);

  async function checkLatest() {
    if (!scope || !canRead || locked || starting.current) return;
    starting.current = true;
    setChecking(true);
    setComparison(undefined);
    try {
      const result = await query.refetch({ cancelRefetch: false });
      scope.commit(() => {
        if (result.isError || !result.data) setFailure('read');
        else {
          const latest = result.data.settings;
          setComparison({ latest, patch: attempt ?? { expected_revision: baseRevision, ...reviewed } });
        }
      });
    } finally {
      starting.current = false;
      scope.commit(() => setChecking(false));
    }
  }

  async function save() {
    if (!scope || !ready || !query.data || locked || needsComparison || starting.current) return;
    const latest = query.data.settings;
    const patch = changedSettings(reviewed, latest);
    if (patch.expected_revision >= 2147483647) return;
    starting.current = true;
    try {
      if (!hasSettingsChanges(patch)) {
        await record(savedProgress(progress, latest));
      } else if (await record({ ...progress, settingsAttempt: patch })) {
        if (scope.canRun() && onlineManager.isOnline()) mutation.submit(patch);
        else setFailure('unconfirmed');
      }
    } finally {
      starting.current = false;
    }
  }

  // The user has already accepted the suggestion or saved their manual plan.
  // Initiate once; a failed/uncertain write must use the existing explicit recovery flow.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoSave || autoStarted.current || !ready || locked || needsComparison || receipt) return;
    autoStarted.current = true;
    void save();
  });
  if (autoSave && !receipt && (mutation.isPending || busy)) {
    return <PlanLoadingScreen busy apps={(progress.questions?.apps ?? []).join(', ')} hobbies={progress.activities ? activitySummary(progress.activities) ?? '' : ''} onSkip={() => undefined} />;
  }

  const comparisonCurrent = !!comparison && ready && (comparison.latest?.revision ?? 0) === latestRevision;
  const matches = comparison && !hasSettingsChanges(changedSettings(comparison.patch, comparison.latest));
  async function resolve(keep: boolean) {
    if (!comparison || !comparisonCurrent || locked || starting.current) return;
    starting.current = true;
    try {
      if (!keep || matches) {
        await record(savedProgress(progress, comparison.latest), attempt);
      } else {
        const { patch, latest } = comparison;
        if (await record({
          ...progress,
          activities: patch.activities,
          planDraft: patch.plan_draft,
          settingsBaseRevision: latest?.revision ?? 0,
          settingsAttempt: undefined,
        }, attempt)) setComparison(undefined);
      }
    } finally {
      starting.current = false;
    }
  }

  if (receipt) {
    return <>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.foreground }}>Your settings were saved to your account.</Text>
      <Button label="Record setup progress" busy={busy}
        onPress={() => { void record(savedProgress(progress, receipt.settings), receipt.patch); }} />
    </>;
  }
  if (comparison) {
    return <>
      <Text accessibilityRole="header" style={{ color: theme.foreground }}>Latest account settings</Text>
      <Text style={{ color: theme.foreground }}>
        {comparison.latest ? activitySummary(comparison.latest.activities) ?? 'No saved activities' : 'No saved activities'}
      </Text>
      <PlanSummary plan={comparison.latest?.plan_draft ?? null} />
      <Text style={{ color: theme.foreground }}>{matches
        ? 'The latest settings already match the fields you reviewed.'
        : 'Choose which values to keep. Keeping your edits lets you review and save them again.'}</Text>
      {!comparisonCurrent && (
        <Button label="Refresh comparison" busy={locked} disabled={!canRead} onPress={() => { void checkLatest(); }} />
      )}
      {!matches && <Button label="Keep my edits" busy={busy} disabled={!comparisonCurrent} onPress={() => { void resolve(true); }} />}
      <Button label={matches ? 'Confirm saved settings' : 'Use latest settings'} busy={busy} disabled={!comparisonCurrent}
        onPress={() => { void resolve(false); }} />
    </>;
  }
  if (needsComparison) {
    return <>
      <InlineStatus state={checking || mutation.isPending ? 'loading' : 'unavailable'} message={
        mutation.isPending ? 'Saving to your account…' :
          failure === 'read' ? 'Latest settings could not be loaded. Your draft is still here.' :
          failure === 'conflict' || !attempt ? 'Settings changed elsewhere. Review the latest values.' :
          !mutation.error || failure === 'unconfirmed' ? 'The save could not be confirmed. Check the latest settings.' :
          'The server declined this update. Check the latest settings to recover your draft.'
      } />
      <Button label="Check latest settings" busy={locked} disabled={!canRead} onPress={() => { void checkLatest(); }} />
    </>;
  }
  return <>
    {!ready && <InlineStatus state="unavailable" message="Your draft is on this device. Connect to save it to your account." />}
    {query.isError && <Button label="Retry loading settings" disabled={!canRead || locked}
      onPress={() => { void query.refetch(); }} />}
    <Button label="Save to my account" busy={locked}
      disabled={!ready || (query.data?.settings?.revision ?? 0) >= 2147483647}
      onPress={() => { void save(); }} />
  </>;
}
