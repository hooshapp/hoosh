import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { weeklyPort } from '@/features/plans/account-weekly-plan';
import { activateAcceptedPlan } from './activate-accepted-plan';
import type { SettingsPatch, SettingsView } from '@disconnect/contracts';
import { useEffect, useRef, useState } from 'react';
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
  const ios = useIOSSelectionDevice();
  const query = useSettingsQuery();
  const [failed, setFailed] = useState(false);
  const [activationFailed, setActivationFailed] = useState(false);
  const [needsApps, setNeedsApps] = useState(false);
  const [working, setWorking] = useState(false);
  const started = useRef(false), running = useRef(false);
  const target = { activities: progress.activities, plan_draft: progress.planDraft };
  async function finish(settings: SettingsView | null, attempt?: SettingsPatch) {
    let selectionRevision: number | undefined;
    let timedOut = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      const port = nativeOwner && weeklyPort(nativeOwner);
      if (!scope?.canRun() || !nativeOwner || !port) throw new Error('Device unavailable');
      selectionRevision = await Promise.race([
        (async () => {
          const current = await ios?.readSelection();
          scope.assertCurrent();
          if (timedOut) throw new Error('Protection confirmation expired');
          if (current && (current.needsReselection || !current.selectedAppCount ||
            (progress.questions?.nativeTargetCount && current.selectedAppCount !== progress.questions.nativeTargetCount))) {
            setNeedsApps(true);
            throw new Error('Target apps need review');
          }
          const revision = current?.revision ?? progress.selectionRevision;
          await activateAcceptedPlan({
            owner: nativeOwner.owner, port, draft: settings?.plan_draft,
            selectionRevision: revision, recoverPending: ios?.recover,
            assertCurrent: () => {
              scope.assertCurrent();
              if (timedOut) throw new Error('Protection confirmation expired');
            },
          });
          return revision;
        })(),
        new Promise<never>((_, reject) => {
          deadline = setTimeout(() => {
            timedOut = true;
            reject(new Error('Protection confirmation expired'));
          }, 15000);
        }),
      ]);
    } catch {
      if (scope?.isCurrent()) { running.current = false; setWorking(false); setFailed(true); setActivationFailed(true); }
      return;
    } finally {
      clearTimeout(deadline);
    }
    const saved = await record({ ...progress, step: 'permission', selectionRevision, activities: settings?.activities,
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
    running.current = true; setWorking(true); setFailed(false); setNeedsApps(false);
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
    if (!scope?.canRun()) return;
    started.current = true; void save();
  });
  if (!failed && !query.isError && availability === 'ready') return <PlanLoadingScreen saving busy apps="Your selected apps" hobbies="" onSkip={() => undefined} />;
  const plan = progress.planDraft;
  return <PlanSuggestionScreen description={activationFailed ? "Your plan is saved. We couldn’t confirm app protection yet; your choices are still here." : "Your plan is ready. We couldn’t save it yet; your choices are still here."}
    apps={[{ name: 'Your selected apps', minutes: plan?.session_minutes ?? null,
      caption: `${plan?.session_count ?? '—'} sessions per day`, detail: 'The plan you chose.' }]}
    estimate={{ label: 'Your plan', detail: 'Nothing is marked complete until your plan is saved.' }}
    error={needsApps ? "Your target app selection changed. Choose your apps again before applying this plan." : activationFailed ? "Couldn’t start app protection. Check Screen Time access and try again." : "Couldn’t save your plan. Try accepting it again."} busy={working || busy}
    onAccept={() => { void save(); }} onManual={onEdit} onSkip={() => undefined} />;
}
