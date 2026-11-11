import type { PlanDraft } from '@disconnect/contracts';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { decodeSelectionDraft, type SelectionEditorPort } from '@/infrastructure/native/selection-editor';
import { emptyPlanDraft, planDraftSection, type PlanDraftInput, type PlanField } from './plan-draft-model';
import { completeSchedule, createWeeklyScheduleClient, sameSchedule, type WeeklySchedulePort } from './weekly-schedule';
import { weeklyStatusRefreshDelay, type WeeklyPlanRead } from './weekly-plan-status';

export type WeeklyPlanPort = WeeklySchedulePort & SelectionEditorPort & { interventionReviewAccess(): Promise<unknown> };
type Intent = { kind: 'apply' | 'stop'; revision: number; spec: PlanDraft | null };
/** One owner/controller shared across product views. No Auth, default identity or backend mutation. */
export function useWeeklyPlan(owner: string, port: WeeklyPlanPort | null, initialPlan?: PlanDraft | null, visible = true) {
  const seed = useRef(initialPlan);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const allowed = visible && foreground;
  // A fresh visibility cycle cannot briefly expose the prior active observation before effects run.
  const key = useMemo(() => ({ owner, port, allowed }), [owner, port, allowed]);
  const [ticket, setTicket] = useState<{ key: typeof key; read: WeeklyPlanRead }>();
  const [draft, setDraft] = useState<PlanDraft>(() => initialPlan ?? emptyPlanDraft());
  const draftRef = useRef(draft);
  const [intent, setIntent] = useState<Intent | null>(null); const intentRef = useRef(intent);
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const allowedRef = useRef(allowed);
  useLayoutEffect(() => { allowedRef.current = allowed; }, [allowed]);
  const scope = useRef<{ active: boolean; lock: boolean; epoch: number; client: ReturnType<typeof createWeeklyScheduleClient>; timer?: ReturnType<typeof setTimeout>; seeded: boolean; refreshRequested: boolean } | null>(null);
  const refreshRef = useRef<(quiet?: boolean) => Promise<void>>(async () => {});
  const refresh = useCallback(async (quiet = false) => {
    const s = scope.current; if (!s?.active || !port || !allowedRef.current) return;
    if (s.lock) { s.refreshRequested = true; return; }
    s.refreshRequested = false;
    s.lock = true; const epoch = ++s.epoch; clearTimeout(s.timer);
    if (!quiet) setTicket({ key, read: { phase: 'checking' } });
    try {
      const installation = await s.client.read();
      if (!s.active || !allowedRef.current || s.epoch !== epoch) return;
      const selection = decodeSelectionDraft(await port.selectionBegin(owner));
      try {
        if (!s.active || !allowedRef.current || s.epoch !== epoch) return;
        const read: WeeklyPlanRead = { phase: 'ready', installation, selectionRevision: selection.baseRevision, selectedAppCount: selection.savedAppCount };
        setTicket({ key, read });
        if (!s.seeded) { s.seeded = true; if (!seed.current && installation.spec) { draftRef.current = installation.spec; setDraft(installation.spec); } }
        const desired = intentRef.current;
        if (desired && installation.native.installedRevision === desired.revision && installation.enabled === (desired.kind === 'apply') && sameSchedule(installation.spec, desired.spec)) {
          intentRef.current = null; setIntent(null); setNotice('Device change confirmed.');
        }
        const delay = weeklyStatusRefreshDelay(installation);
        const boundary = installation.windows.some((w) => [w.startsAt, w.endsAt].some((t) => t > installation.observedAt && t - installation.observedAt <= delay));
        s.timer = setTimeout(() => { void refreshRef.current(!boundary); }, delay);
      } finally { await port.selectionRelease(owner, selection.draftId); }
    } catch {
      if (s.active && allowedRef.current && s.epoch === epoch) { setTicket({ key, read: { phase: 'error' } }); }
    } finally { s.lock = false; if (s.active && s.refreshRequested && allowedRef.current) void refreshRef.current(); }
  }, [key, owner, port]);
  useLayoutEffect(() => { refreshRef.current = refresh; }, [refresh]);
  useEffect(() => {
    if (!port) return;
    const s = { active: true, lock: false, epoch: 0, client: createWeeklyScheduleClient(owner, port), seeded: false, refreshRequested: false, timer: undefined as ReturnType<typeof setTimeout> | undefined };
    scope.current = s;
    return () => { s.active = false; s.epoch++; clearTimeout(s.timer); s.client.dispose(); if (scope.current === s) scope.current = null; };
  }, [owner, port]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { setForeground(state === 'active'); });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const s = scope.current;
    if (allowed && s) {
      void Promise.resolve().then(() => { if (s.active && scope.current === s && allowedRef.current) return refresh(); });
    }
    else if (s) { s.epoch++; clearTimeout(s.timer); }
  }, [allowed, refresh]);
  const current: WeeklyPlanRead = !port ? { phase: 'unavailable' } : !allowed ? { phase: 'stale' } : ticket?.key === key ? ticket.read : { phase: 'checking' };
  const stage = (field: PlanField, value: PlanDraftInput) => {
    if (busy) return;
    const next = planDraftSection(field, value, draftRef.current) ?? emptyPlanDraft();
    draftRef.current = next; setDraft(next); setNotice('Draft updated. Apply it to change this device schedule.');
  };
  const run = async (kind: 'apply' | 'stop' | 'access') => {
    const s = scope.current; if (!s?.active || !port || !allowedRef.current || s.lock || current.phase !== 'ready') return;
    s.lock = true; clearTimeout(s.timer); s.epoch++; setBusy(true);
    try {
      const before = current.installation, revision = before.native.installedRevision ?? 0;
      if (kind === 'access') await port.interventionReviewAccess();
      else {
        const spec = kind === 'apply' ? completeSchedule(draftRef.current) : before.spec;
        const nextIntent: Intent = { kind, revision: revision + 1, spec };
        intentRef.current = nextIntent; setIntent(nextIntent);
        const result = kind === 'apply' ? await s.client.apply(spec!, revision) : await s.client.stop(revision);
        if (!s.active) return;
        if (result.native.installedRevision !== nextIntent.revision) throw new Error('Unconfirmed device change');
        intentRef.current = null; setIntent(null); setNotice(kind === 'stop' ? 'Schedule stopped. Settings and allowance history retained.' : 'Plan applied to this device.');
      }
    } catch {
      if (s.active) { setTicket({ key, read: { phase: 'error' } }); setNotice('Change not confirmed. Refresh and review before retrying.'); }
      s.refreshRequested = false;
      return; // Uncertain writes require an explicit refresh; never replay automatically.
    } finally { s.lock = false; if (s.active) setBusy(false); }
    if (s.active) await refresh();
  };
  const [preview, setPreview] = useState<{ spec: string; windows: readonly { startsAt: number; endsAt: number }[] } | null>(null);
  const showPreview = async () => {
    const s = scope.current; if (!s?.active || s.lock || !allowedRef.current) return;
    s.lock = true; clearTimeout(s.timer); setBusy(true);
    try { const spec = completeSchedule(draftRef.current); const windows = await s.client.preview(spec); if (s.active) { setPreview({ spec: JSON.stringify(spec), windows }); setNotice('Preview only. Your device schedule is unchanged.'); } }
    catch { if (s.active) setNotice('Preview unavailable. Complete the schedule and check its time zone.'); }
    finally { s.lock = false; if (s.active) { setBusy(false); void refreshRef.current(); } }
  };
  let previewWindows = null;
  try { if (preview?.spec === JSON.stringify(completeSchedule(draft))) previewWindows = preview.windows; } catch { /* Partial drafts have no applicable preview. */ }
  return { read: current, draft, intent, busy, notice, stage, refresh, previewWindows, preview: showPreview,
    apply: () => run('apply'), stop: () => run('stop'), reviewAccess: () => run('access') };
}
