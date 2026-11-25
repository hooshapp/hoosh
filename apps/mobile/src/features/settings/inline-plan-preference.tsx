import { useEffect, useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { DaysEditor, HoursEditor, SessionsEditor } from '@/features/plans/plan-editors';
import type { SettingsResponse } from '@disconnect/contracts';
import type { PlanField } from '@/features/plans/plan-draft-model';
import { sameSchedule } from '@/features/plans/weekly-schedule';
import { weeklyPort, useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';
import { activateAcceptedPlan } from '@/features/onboarding/activate-accepted-plan';
import { useNativeOwner, useIOSSelectionDevice } from '@/features/protection/native-owner-boundary';
import { decodeSavedSelection } from '@/infrastructure/native/selection-editor';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { usePlanDraftEditor } from './use-plan-draft-editor';
import { SettingsEditorFeedback } from './settings-editor-feedback';

/** Save is the user's activation intent. Opening Settings never installs a plan. */
export function InlinePlanPreference({ field, onDone, onDirty }: { field: PlanField; onDone(): void; onDirty(dirty: boolean): void }) {
  const editor = usePlanDraftEditor(field);
  const owner = useNativeOwner();
  const iosDevice = useIOSSelectionDevice();
  const account = useAccountWeeklyPlan();
  const { scope } = useAccountData();
  const form = editor.form;
  const installed = account?.plan.read.phase === 'ready' ? account.plan.read.installation : null;
  let needsActivation = !!installed?.native.pendingRequestID;
  try {
    needsActivation ||= !!installed && (!installed.enabled || installed.native.state !== 'armed' ||
      !sameSchedule(editor.query.data?.settings?.plan_draft ?? null, installed.spec));
  } catch { /* Incomplete plans must be completed before activation. */ }
  const requested = useRef(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const [activation, setActivation] = useState<'idle' | 'applying' | 'error'>('idle');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { onDirty(!!form?.navigationDirty || activation !== 'idle'); return () => onDirty(false); }, [form?.navigationDirty, activation, onDirty]);
  const activate = async () => {
    if (running.current || !editor.enabled || !editor.query.data || form?.dirty) return;
    running.current = true;
    setActivation('applying');
    const current = () => {
      scope?.assertCurrent();
      if (!scope || !mounted.current) throw new Error('Closed plan editor');
      if (scope.client.getQueryData<SettingsResponse>(scope.key('settings'))?.settings?.revision !== editor.query.data?.settings?.revision) throw new Error('Saved plan changed');
      if (owner && (owner.generation !== scope.account.sessionGeneration || !owner.owner.endsWith(`:${scope.account.user_id}`))) throw new Error('Account changed');
    };
    try {
      current();
      if (Platform.OS !== 'web') {
        const port = owner && weeklyPort(owner);
        if (!owner || !port?.selectionRead) throw new Error('Device access unavailable');
        const selection = decodeSavedSelection(await port.selectionRead(owner.owner), owner.owner);
        current();
        if (selection.needsReselection || !selection.selectedAppCount) throw new Error('Choose target apps first');
        await activateAcceptedPlan({ owner: owner.owner, port, draft: editor.query.data?.settings?.plan_draft,
          selectionRevision: selection.revision, assertCurrent: current, recoverPending: iosDevice?.recover });
        current();
        await account?.plan.refresh();
        current();
      }
      setActivation('idle');
      onDone();
    } catch {
      if (mounted.current) setActivation('error');
    } finally { running.current = false; }
  };
  useEffect(() => {
    if (!requested.current || !editor.saved) return;
    requested.current = false;
    void activate();
  });
  const draft = form?.draft;
  const actions = {
    dirty: !!form?.dirty || needsActivation,
    state: activation === 'applying' ? 'saving' as const : form?.state ?? 'unavailable' as const,
    onSave: () => {
      if (!editor.enabled || !form || (!form.dirty && !needsActivation) || !['ready', 'error'].includes(form.state) || activation === 'applying') return;
      if (!form.dirty) { void activate(); return; }
      requested.current = true;
      setActivation('idle');
      form.onSave();
    },
    onDiscard: () => { requested.current = false; setActivation('idle'); form?.onDiscard(); },
  };
  return <View style={{ gap: 10 }}>
    {draft && form ? field === 'days' ? <DaysEditor days={draft.weekdays} onChange={weekdays => form.onChange({ ...draft, weekdays })} {...actions} />
      : field === 'hours' ? <HoursEditor draft={draft.hours ?? { start: '', end: '', nextDay: false }} onChange={hours => form.onChange({ ...draft, hours })} {...actions} />
      : <SessionsEditor draft={draft.sessions} onChange={sessions => form.onChange({ ...draft, sessions })} bounds={{ count: { min: 1, max: 1000, step: 1 }, minutes: { min: 1, max: 1440, step: 1 } }} {...actions} /> : null}
    {activation === 'applying' ? <Text accessibilityLiveRegion="polite">Updating your plan on this device…</Text> : null}
    {activation === 'error' ? <><Text accessibilityRole="alert">Your preferences are saved, but the device update could not be confirmed. Your previous protection has not been deliberately stopped.</Text><Button label="Retry plan update" disabled={!editor.enabled || !!form?.dirty} onPress={() => { void activate(); }} /></> : null}
    <SettingsEditorFeedback editor={{ ...editor, saved: editor.saved && activation === 'idle' }} kind="plan" />
  </View>;
}
