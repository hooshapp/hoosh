import type { PlanDraft } from '@disconnect/contracts';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useDialogFocusReturn } from '@/components/ui/use-dialog-focus-return';
import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome } from '@/features/home/home-model';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import { colors } from '@/design/tokens';
import { formatTime, weekdays } from '@/features/editors/draft-utils';
import { DaysEditor, HoursEditor, SessionsEditor } from './plan-editors';
import { planDraftInput, samePlanInput, type PlanDraftInput, type PlanField } from './plan-draft-model';
import { completeSchedule } from './weekly-schedule';
import { WeeklyPlanCard } from './weekly-plan-card';
import { useWeeklyPlan, type WeeklyPlanPort } from './use-weekly-plan';

type Props = { owner: string; port: WeeklyPlanPort | null; initialPlan?: PlanDraft | null; visible?: boolean; onExit?: () => void };
type Editing = { field: PlanField; base: Exclude<PlanDraftInput, null>; value: Exclude<PlanDraftInput, null> };
const sameDraft = (a: PlanDraft, b: PlanDraft | null) => b !== null && JSON.stringify(a) === JSON.stringify(b);
/** Reuses product Home/Settings; caller owns verified identity/routing. No Auth or development owner lives here. */
export function WeeklyPlanJourney(props: Props) { return <ScopedWeeklyPlanJourney key={`${props.owner}:${Boolean(props.port)}`} {...props} />; }
function ScopedWeeklyPlanJourney({ owner, port, initialPlan, visible = true, onExit }: Props) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<'home' | 'settings'>('home'), [choosing, setChoosing] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null), [leave, setLeave] = useState<'home' | 'settings' | 'exit' | null>(null);
  const [editError, setEditError] = useState(false);
  const plan = useWeeklyPlan(owner, port, initialPlan, visible && !choosing);
  const homeButton = useRef<ComponentRef<typeof Button>>(null);
  const editorClose = useRef<ComponentRef<typeof Button>>(null), exitButton = useRef<ComponentRef<typeof Button>>(null);
  const restoreEditor = useDialogFocusReturn(editorClose), restoreExit = useDialogFocusReturn(exitButton);
  const ready = plan.read.phase === 'ready' ? plan.read : null;
  const installed = ready?.installation;
  const inlineDirty = editing ? !samePlanInput(editing.field, editing.base, editing.value) : false;
  const draftChanged = !sameDraft(plan.draft, installed?.spec ?? null) && (plan.draft.weekdays.length > 0 || plan.draft.hours !== null || plan.draft.session_count !== null || plan.draft.session_minutes !== null);
  const blocked = plan.busy || plan.read.phase === 'checking' || plan.read.phase === 'stale';
  const go = (next: 'home' | 'settings' | 'exit') => {
    if (blocked) return;
    if (inlineDirty || (next === 'exit' && draftChanged)) setLeave(next);
    else { setEditing(null); if (next === 'exit') onExit?.(); else setPage(next); }
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (choosing) return false;
      if (blocked) return true;
      if (editing) { if (inlineDirty) setLeave(page); else setEditing(null); return true; }
      if (page === 'settings') { setPage('home'); return true; }
      if (onExit) { if (draftChanged) setLeave('exit'); else onExit(); return true; }
      return false;
    });
    return () => subscription.remove();
  }, [blocked, choosing, draftChanged, editing, inlineDirty, onExit, page]);
  const open = (field: PlanField) => {
    if (blocked || inlineDirty) { if (inlineDirty) setLeave('settings'); return; }
    const value = planDraftInput(plan.draft); setEditError(false); setEditing({ field, base: value, value });
  };
  const stage = () => {
    if (!editing) return;
    try { plan.stage(editing.field, editing.value); setEditing(null); setEditError(false); }
    catch { setEditError(true); }
  };
  const actions = { dirty: inlineDirty, state: 'ready' as const, onSave: stage, onDiscard: () => setEditing(null) };
  const inline = editing ? <View style={{ gap: 12 }}>
    <Text>These edits update your draft. Apply the whole plan to change this device.</Text>
    {editError ? <Text accessibilityRole="alert">Check the entered values before using this draft.</Text> : null}
    {editing.field === 'days' ? <DaysEditor days={editing.value.weekdays} draftOnly saveLabel="Use days" onChange={(days) => setEditing({ ...editing, value: { ...editing.value, weekdays: days } })} {...actions} /> :
      editing.field === 'hours' ? <>
        <Field label="Plan time zone" hint="For example America/New_York. Hours stay in this zone when you travel." value={editing.value.timezone} autoCapitalize="none" autoCorrect={false} onChangeText={(timezone) => setEditing({ ...editing, value: { ...editing.value, timezone } })} />
        <HoursEditor draft={editing.value.hours ?? { start: '', end: '', nextDay: false }} draftOnly saveLabel="Use hours" onChange={(hours) => setEditing({ ...editing, value: { ...editing.value, hours } })} {...actions} />
      </> : <SessionsEditor draft={editing.value.sessions} draftOnly saveLabel="Use sessions" bounds={{ count: { min: 1, max: 1000, step: 1 }, minutes: { min: 1, max: 1440, step: 1 } }} onChange={(sessions) => setEditing({ ...editing, value: { ...editing.value, sessions } })} {...actions} />}
    <Button ref={editorClose} label="Close editor" variant="secondary" disabled={blocked} onPress={() => inlineDirty ? setLeave(page) : setEditing(null)} />
  </View> : undefined;
  let complete = false; try { completeSchedule(plan.draft); complete = true; } catch { /* Incomplete drafts never install. */ }
  const appsChanged = !!ready && !!installed?.spec && ready.selectionRevision !== installed.native.selectionRevision;
  const status = <WeeklyPlanCard read={plan.read} pending={!!plan.intent} busy={plan.busy} draftChanged={draftChanged} appsChanged={appsChanged}
    onRefresh={page === 'home' ? () => { void plan.refresh(); } : undefined} onSettings={page === 'home' ? () => go('settings') : undefined} onReviewAccess={ready ? () => { void plan.reviewAccess(); } : undefined} />;
  const body = choosing && port ? <NativeAppsEditor owner={owner} port={port} onBack={() => { setChoosing(false); }} /> : page === 'home' ?
    <HomeScreen protectionPlacement="top" bottomClearance={0} model={unavailableHome} protection={status} /> :
    <SettingsScreen bottomClearance={0} model={{ ...unavailableSettings,
      apps: ready ? { state: 'ready', text: `${ready.selectedAppCount} apps selected` } : { state: plan.read.phase === 'error' ? 'error' : 'unavailable' },
      days: { state: 'ready', text: plan.draft.weekdays.map((d) => weekdays[d]).join(', ') || null },
      hours: { state: 'ready', text: plan.draft.hours ? `${formatTime(plan.draft.hours.start_local ?? '')}–${formatTime(plan.draft.hours.end_local ?? '')}${plan.draft.hours.next_day ? ' (next day)' : ''}; ${plan.draft.timezone_id ?? 'zone not set'}` : null },
      sessions: { state: 'ready', text: `${plan.draft.session_count ?? '—'} per app per day · ${plan.draft.session_minutes ?? '—'} min` },
    }} planDraftOnly onEdit={blocked ? {} : { apps: port && !blocked && !editing ? () => setChoosing(true) : undefined, days: () => open('days'), hours: () => open('hours'), sessions: () => open('sessions') }}
      inlineEditor={editing && inline ? { field: editing.field, content: inline } : undefined}
      onRetry={() => { void plan.refresh(); }} planContent={<View style={{ gap: 12 }}>
        {status}
        <Text accessibilityLiveRegion="polite">{plan.notice}</Text>
        {!complete ? <Text>Complete days, hours, time zone and sessions before applying.</Text> : null}
        <Button label="Preview plan" disabled={blocked || !port || !complete || !!editing} onPress={() => { void plan.preview(); }} />
        <Button label={installed?.enabled ? 'Apply plan changes' : installed?.spec ? 'Resume plan' : 'Apply plan'} disabled={blocked || !ready || !complete || !!editing || installed?.otherInstallation || installed?.native.state === 'needs_permission' || installed?.native.state === 'failed'} onPress={() => { void plan.apply(); }} />
        <Button label="Stop plan" disabled={blocked || !ready || !installed?.enabled || !!editing} onPress={() => { void plan.stop(); }} />
        <Button label="Refresh device schedule" variant="secondary" disabled={blocked || !port} onPress={() => { void plan.refresh(); }} />
        {installed?.spec && !installed.enabled && installed.native.state === 'needs_permission' ? <Button label="Review app access" disabled={blocked} onPress={() => { void plan.reviewAccess(); }} /> : null}
        {plan.previewWindows ? <View><Text accessibilityRole="header">Upcoming times (UTC)</Text>{plan.previewWindows.filter((w) => !installed || w.endsAt > installed.observedAt).map((w) => <Text key={w.startsAt}>{new Date(w.startsAt).toISOString()} → {new Date(w.endsAt).toISOString()}</Text>)}</View> : null}
      </View>} />;
  return <View style={styles.root}>
    {body}
    {!choosing ? <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Button ref={homeButton} label="Home" selected={page === 'home'} variant="secondary" disabled={blocked} onPress={() => go('home')} style={styles.target} />
      <Button label="Settings" selected={page === 'settings'} variant="secondary" disabled={blocked} onPress={() => go('settings')} style={styles.target} />
      {onExit ? <Button ref={exitButton} label="Close" accessibilityLabel="Close app preview" variant="secondary" disabled={blocked} onPress={() => go('exit')} /> : null}
    </View> : null}
    {leave ? <ConfirmationDialog title={leave === 'exit' ? 'Leave without applying draft changes? Your device schedule will stay unchanged.' : 'Discard unfinished editor changes?'} keepLabel="Keep editing" discardLabel={leave === 'exit' ? 'Leave without applying' : 'Discard editor changes'} onKeep={() => { setLeave(null); if (editing) restoreEditor(); else restoreExit(); }} onDiscard={() => { const next = leave; setLeave(null); setEditing(null); if (next === 'exit') onExit?.(); else setPage(next); }} /> : null}
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.warmCanvas }, navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: colors.warmCard }, target: { flex: 1, minWidth: 90 } });
