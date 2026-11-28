import { useNativeOwner } from '@/features/protection/native-owner-boundary';
import { weeklyPort } from '@/features/plans/account-weekly-plan';
import { activateAcceptedPlan, AndroidProtectionAccessRequired } from './activate-accepted-plan';
import type { SettingsPatch, SettingsView } from '@disconnect/contracts';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useSettingsQuery, useSettingsMutation } from '@/features/settings/settings-query';
import { changedSettings, hasSettingsChanges } from './setup-model';
import type { OnboardingProgress } from './progress-repository';
import { PlanLoadingScreen, PlanSuggestionScreen } from './figma-plan-screens';

/** The accepted plan saves behind the existing Figma screens, with readback before retry. */
export function SetupPlanSave({ progress, busy, record, onEdit }: {
  progress: OnboardingProgress; busy: boolean;
  record(next: OnboardingProgress, expectedAttempt?: SettingsPatch): Promise<boolean>;
  onEdit(): void;
}) {
  const { scope, availability } = useAccountData();
  const nativeOwner = useNativeOwner();
  const query = useSettingsQuery();
  const [failed, setFailed] = useState(false);
  const [activationFailed, setActivationFailed] = useState(false);
  const [working, setWorking] = useState(false);
  const started = useRef(false), running = useRef(false);
  const target = { activities: progress.activities, plan_draft: progress.planDraft };
  async function finish(settings: SettingsView | null, attempt?: SettingsPatch) {
    let step: 'complete' | 'permission' = 'complete';
    try {
      const port = nativeOwner && weeklyPort(nativeOwner);
      if (!scope?.canRun() || !nativeOwner || !port) throw new Error('Device unavailable');
      await activateAcceptedPlan({ owner: nativeOwner.owner, port, draft: settings?.plan_draft,
        selectionRevision: progress.selectionRevision, assertCurrent: () => scope.assertCurrent() });
    } catch (error) {
      if (error instanceof AndroidProtectionAccessRequired) {
        step = 'permission';
      } else {
        if (scope?.isCurrent()) { running.current = false; setWorking(false); setFailed(true); setActivationFailed(true); }
        return;
      }
    }
    const saved = await record({ ...progress, step, activities: settings?.activities,
      planDraft: settings?.plan_draft, settingsRevision: settings?.revision,
      settingsBaseRevision: undefined, settingsAttempt: undefined }, attempt);
    if (!saved && scope?.isCurrent()) { running.current = false; setWorking(false); setFailed(true); }
  }
  const mutation = useSettingsMutation({
    onSuccess: (response, attempt) => { void finish(response.settings, attempt); },
    onError: () => { running.current = false; setWorking(false); setFailed(true); },
  });
  async function save() {
    if (!scope?.canRun() || running.current || busy) return;
    running.current = true; setWorking(true); setFailed(false); setActivationFailed(false);
    try {
      const result = await query.refetch({ cancelRefetch: false });
      if (!scope.isCurrent()) return;
      if (result.isError || !result.data) throw new Error('read');
      const latest = result.data.settings;
      const patch = changedSettings(target, latest);
      if (!hasSettingsChanges(patch)) { await finish(latest, progress.settingsAttempt); return; }
      // Readback prevents replaying an uncertain write that already committed.
      if (!await record({ ...progress, settingsBaseRevision: latest?.revision ?? 0,
        settingsAttempt: patch }, progress.settingsAttempt)) throw new Error('storage');
      if (!scope.canRun()) throw new Error('account');
      mutation.submit(patch);
    } catch {
      if (scope?.isCurrent()) { running.current = false; setWorking(false); setFailed(true); }
    }
  }
  useEffect(() => {
    if (started.current || availability !== 'ready' || !query.data || busy) return;
    started.current = true; void save();
  });
  if (!failed && !query.isError && availability === 'ready') return <PlanLoadingScreen busy apps="Your selected apps" hobbies="" onSkip={() => undefined} />;
  const plan = progress.planDraft;
  return <PlanSuggestionScreen description={activationFailed ? "Your plan is saved. We couldn’t confirm app protection yet; your choices are still here." : "Your plan is ready. We couldn’t save it yet; your choices are still here."}
    apps={[{ name: 'Your selected apps', minutes: plan?.session_minutes ?? null,
      caption: `${plan?.session_count ?? '—'} sessions per day`, detail: 'The plan you chose.' }]}
    estimate={{ label: 'Your plan', detail: 'Nothing is marked complete until your plan is saved.' }}
    error={activationFailed ? (Platform.OS === 'android'
      ? "Couldn’t start app protection. Check device access and try again."
      : "Couldn’t start app protection. Check Screen Time access and try again.")
      : "Couldn’t save your plan. Try accepting it again."} busy={working || busy}
    onAccept={() => { void save(); }} onManual={onEdit} onSkip={() => undefined} />;
}
