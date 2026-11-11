import type { PlanDraft } from '@disconnect/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Choice, weekdays, toggleItem } from '@/features/editors/editor-controls';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';
import { completeSchedule, createWeeklyScheduleClient, type ScheduleInstallation, type WeeklySchedulePort } from './weekly-schedule';

type Props = { owner: string; port: (WeeklySchedulePort & SelectionEditorPort) | null; initialPlan?: PlanDraft | null };
type Input = { days: number[]; start: string; end: string; nextDay: boolean; zone: string; count: string; minutes: string };
const input = (p?: PlanDraft | null): Input => ({ days: [...p?.weekdays ?? []], start: p?.hours?.start_local ?? '', end: p?.hours?.end_local ?? '',
  nextDay: p?.hours?.next_day ?? false, zone: p?.timezone_id ?? '', count: p?.session_count?.toString() ?? '', minutes: p?.session_minutes?.toString() ?? '' });
const plan = (v: Input): PlanDraft => ({ weekdays: v.days, hours: { start_local: v.start || null, end_local: v.end || null, next_day: v.nextDay },
  timezone_id: v.zone || null, session_count: /^\d+$/.test(v.count) ? Number(v.count) : null, session_minutes: /^\d+$/.test(v.minutes) ? Number(v.minutes) : null });
/** Explicit caller scope. A verified future account consumer can supply its saved PlanDraft unchanged. */
export function WeeklyScheduleSetup(props: Props) {
  return <ScopedWeeklyScheduleSetup key={`${props.owner}:${Boolean(props.port)}`} {...props} />;
}
function ScopedWeeklyScheduleSetup({ owner, port, initialPlan }: Props) {
  const [draft, setDraft] = useState(() => input(initialPlan));
  const [installed, setInstalled] = useState<ScheduleInstallation | null>(null);
  const [preview, setPreview] = useState<readonly { startsAt: number; endsAt: number }[] | null>(null);
  const [message, setMessage] = useState(port ? 'Loading native installation…' : 'Weekly installation is unavailable in this build.');
  const [busy, setBusy] = useState(Boolean(port)), [choosing, setChoosing] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const scope = useRef<{ active: boolean; client: ReturnType<typeof createWeeklyScheduleClient>; lock: boolean } | null>(null);
  const seed = useRef(initialPlan), firstRead = useRef(true);
  const refresh = useCallback(async () => {
    const s = scope.current; if (!s?.active || s.lock) return;
    s.lock = true; setBusy(true); setCanWrite(false);
    try {
      const next = await s.client.read();
      if (s.active) {
        setInstalled(next); setCanWrite(true);
        if (firstRead.current && !seed.current && next.spec) setDraft(input(next.spec));
        firstRead.current = false;
        setMessage('Native installation refreshed. Draft edits do not apply automatically.');
      }
    } catch { if (s.active) { setInstalled(null); setMessage('Installation unknown. Refresh before applying changes.'); } }
    finally { s.lock = false; if (s.active) setBusy(false); }
  }, []);
  useEffect(() => {
    if (!port) return;
    const s = { active: true, client: createWeeklyScheduleClient(owner, port), lock: false }; scope.current = s;
    void refresh(); const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refresh(); });
    return () => { s.active = false; s.client.dispose(); subscription.remove(); if (scope.current === s) scope.current = null; };
  }, [owner, port, refresh]);
  const edit = (value: Partial<Input>) => { setDraft((old) => ({ ...old, ...value })); setPreview(null); };
  let valid = false; try { completeSchedule(plan(draft)); valid = true; } catch { /* Incomplete drafts stay editable. */ }
  const action = async (kind: 'preview' | 'apply' | 'stop') => {
    const s = scope.current; if (!s?.active || s.lock || (kind !== 'preview' && !canWrite)) return;
    s.lock = true; setBusy(true);
    if (kind !== 'preview') setCanWrite(false);
    try {
      if (kind === 'preview') {
        const next = await s.client.preview(plan(draft));
        if (s.active) { setPreview(next); setMessage('Preview only. No installation changed.'); }
      } else {
        const next = kind === 'apply' ? await s.client.apply(plan(draft), installed?.native.installedRevision ?? 0)
          : await s.client.stop(installed!.native.installedRevision!);
        if (s.active) { setInstalled(next); setCanWrite(true); setPreview(null); setMessage(kind === 'stop' ? 'Stopped on this device. Allowance history is retained.' : 'Weekly plan confirmed on this device.'); }
      }
    } catch {
      if (s.active) {
        setMessage(kind === 'preview' ? 'Preview unavailable. Check complete values and the IANA time zone.' : 'Change not confirmed. Refresh installation and review before retrying. Saved apps, access, revisions and time zone must match. Time zone changes require an explicit local test reset; Stop retains history.');
        if (kind !== 'preview') setInstalled(null);
      }
    } finally { s.lock = false; if (s.active) setBusy(false); }
  };
  if (choosing && port) return <NativeAppsEditor owner={owner} port={port} onBack={() => { setChoosing(false); void refresh(); }} />;
  const blocked = busy || !port;
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
    <Text accessibilityRole="header">Weekly app schedule</Text>
    <Text>Choose apps and a complete weekly plan, then apply it explicitly. A saved draft alone does not activate interventions.</Text>
    <Text accessibilityLiveRegion="polite">{busy ? 'Checking native schedule…' : message}</Text>
    <Text>{installed ? `Installed revision: ${installed.native.installedRevision ?? 'none'} · ${installed.enabled ? 'enabled' : 'stopped'} · ${installed.native.state}` : 'Installation not confirmed'}</Text>
    {installed?.otherInstallation ? <Text>Another native test is installed. Stop it in Android interventions before applying this weekly plan.</Text> : null}
    <Button label="Choose scheduled apps" disabled={blocked} onPress={() => setChoosing(true)} />
    <Text accessibilityRole="header">Start days</Text>
    {weekdays.map((day, i) => <Choice key={day} label={day} checked={draft.days.includes(i)} disabled={blocked} onPress={() => edit({ days: toggleItem(draft.days, i) })} />)}
    <Field label="Schedule start (HH:mm)" value={draft.start} editable={!blocked} autoCapitalize="none" onChangeText={(start) => edit({ start })} />
    <Field label="Schedule end (HH:mm)" value={draft.end} editable={!blocked} autoCapitalize="none" onChangeText={(end) => edit({ end })} />
    <Choice label="Ends the next day" checked={draft.nextDay} disabled={blocked} onPress={() => edit({ nextDay: !draft.nextDay })} />
    <Field label="Schedule time zone" hint="Saved IANA zone, for example America/New_York. Travel does not change it." value={draft.zone} editable={!blocked} autoCapitalize="none" autoCorrect={false} onChangeText={(zone) => edit({ zone })} />
    <Field label="Sessions per app per day" value={draft.count} keyboardType="number-pad" editable={!blocked} onChangeText={(count) => edit({ count })} />
    <Field label="Minutes per session" value={draft.minutes} keyboardType="number-pad" editable={!blocked} onChangeText={(minutes) => edit({ minutes })} />
    <Text>Outside the chosen hours apps are unrestricted. Overnight belongs to its start day. DST gaps use the first valid time; repeated hours form one continuous window. An extra session remains available after the daily allowance.</Text>
    {!valid ? <Text>Choose at least one day, complete valid hours and time zone, 1–1000 sessions and 1–1440 minutes.</Text> : null}
    <Button label="Preview schedule" disabled={blocked || !valid} onPress={() => { void action('preview'); }} />
    <Button label={installed?.enabled ? 'Update weekly plan' : installed?.spec ? 'Resume weekly plan' : 'Apply weekly plan'} disabled={blocked || !valid || !canWrite || installed?.otherInstallation || installed?.native.state === 'needs_permission' || installed?.native.state === 'failed'} onPress={() => { void action('apply'); }} />
    <Button label="Stop weekly plan" disabled={blocked || !canWrite || !installed?.enabled} onPress={() => { void action('stop'); }} />
    <Button label="Refresh installation" disabled={blocked} variant="secondary" onPress={() => { void refresh(); }} />
    <Button label="Use installed settings" disabled={blocked || !installed?.spec} variant="secondary" onPress={() => { if (installed?.spec) { setDraft(input(installed.spec)); setPreview(null); } }} />
    {(preview ?? installed?.windows)?.map((w) => <Text key={w.startsAt}>{new Date(w.startsAt).toISOString()} → {new Date(w.endsAt).toISOString()} (UTC)</Text>)}
    <Text>Preview shows upcoming occurrences in UTC. The saved weekly definition repeats locally while Android access is enabled; this is a visible pause, not a force-stop guarantee.</Text>
    <View />
  </ScrollView>;
}
