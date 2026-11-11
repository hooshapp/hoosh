import { requireOptionalNativeModule } from 'expo';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { decodeSelectionDraft, type SelectionEditorPort } from '@/infrastructure/native/selection-editor';
import { decodeInterventionEventIds, decodeInterventionStatus, type InterventionCoordinatorPort, type InterventionStatus } from '@/infrastructure/native/intervention-coordinator';
const OWNER = 'qa-development:00000000-0000-4000-8000-000000000001';
type Port = InterventionCoordinatorPort & Pick<SelectionEditorPort, 'selectionBegin' | 'selectionRelease'>;
function nativePort(): Port | null {
  if (Platform.OS !== 'android') return null;
  const value = requireOptionalNativeModule<Partial<Port>>('HooshUsage');
  const methods: (keyof Port)[] = ['interventionOpen', 'interventionRelease', 'interventionStatus', 'interventionReviewAccess', 'interventionInstall', 'interventionCancel', 'interventionDrain', 'interventionAcknowledge', 'interventionEndOwner', 'selectionBegin', 'selectionRelease'];
  return value && methods.every((key) => typeof value[key] === 'function') ? value as Port : null;
}
/** Explicit synthetic-owner diagnostics; no Auth/root imports or default production identity. */
export function InterventionQa({ port: supplied }: { port?: Port | null }) {
  const [port] = useState(() => supplied === undefined ? nativePort() : supplied);
  const [status, setStatus] = useState<InterventionStatus | null>(null);
  const [message, setMessage] = useState('Save apps under test owner A in Saved apps editor first.');
  const [busy, setBusy] = useState(false);
  const live = useRef(false), lock = useRef(false), readEpoch = useRef(0);
  const insets = useSafeAreaInsets();
  const run = async (action: (native: Port) => Promise<unknown>) => {
    if (!port || lock.current) return;
    lock.current = true; const stamp = ++readEpoch.current; setBusy(true);
    try {
      await action(port);
      const next = decodeInterventionStatus(await port.interventionStatus(OWNER));
      if (live.current && stamp === readEpoch.current) { setStatus(next); setMessage('Native state refreshed. Test windows are separate from a production plan.'); }
    } catch {
      if (live.current && stamp === readEpoch.current) { setStatus(null); setMessage('Test could not be confirmed. Refresh native state before another write. Check saved test apps and access.'); }
    } finally { lock.current = false; if (live.current) setBusy(false); }
  };
  useEffect(() => {
    live.current = true;
    let active = true;
    const read = () => { if (port && !lock.current) { const stamp = ++readEpoch.current; void port.interventionStatus(OWNER).then(decodeInterventionStatus).then((v) => { if (active && stamp === readEpoch.current) setStatus(v); }).catch(() => { if (active && stamp === readEpoch.current) setStatus(null); }); } };
    read(); const subscription = AppState.addEventListener('change', (next) => { if (next === 'active') read(); });
    return () => { active = false; live.current = false; subscription.remove(); };
  }, [port]);
  const withLease = async (native: Port, action: (token: string) => Promise<unknown>) => {
    const token = await native.interventionOpen(OWNER);
    if (typeof token !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(token)) throw new Error('Invalid native lease');
    try { if (live.current) await action(token); } finally { await native.interventionRelease(OWNER, token); }
  };
  const disabled = !port || busy;
  return <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 16, gap: 12 }}>
    <Text accessibilityRole="header">Android intervention test</Text>
    <Text>RN08_INTERVENTION_QA_ONLY · owner A. Two-minute native windows. Each Open anyway starts a 15-second per-app timer; two sessions per day in UTC. These are test values, not your saved product plan.</Text>
    <Text accessibilityLiveRegion="polite">{busy ? 'Working with native test…' : message}</Text>
    <Text>{status ? `Native: ${status.state} · revision ${status.installedRevision ?? 'none'} · apps ${status.selectedAppCount} · reasons ${status.reasonCount} · events ${status.pendingEventCount}` : 'Native state unavailable'}</Text>
    <Button label="Review intervention access" disabled={disabled} onPress={() => { void run((n) => n.interventionReviewAccess()); }} />
    <Button label="Refresh native installation" disabled={disabled} onPress={() => { void run(async () => {}); }} />
    <Button label="Install two-minute test" disabled={disabled || !status?.serviceConnected || !status.disclosureAccepted || status.state === 'needs_permission' || status.state === 'failed'} onPress={() => { void run((n) => withLease(n, async (token) => {
      const draft = decodeSelectionDraft(await n.selectionBegin(OWNER));
      try {
        if (!live.current) return;
        const expected = status?.installedRevision ?? 0, now = Date.now();
        await n.interventionInstall(OWNER, token, expected, expected + 1, draft.baseRevision,
          [{ reasonId: 'test-schedule', startsAt: now, endsAt: now + 120000 }, { reasonId: 'test-quest', startsAt: now, endsAt: now + 90000 }],
          { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 15 });
      } finally { await n.selectionRelease(OWNER, draft.draftId); }
    })); }} />
    <Button label="Cancel test quest only" disabled={disabled || !status?.installedRevision} onPress={() => { void run((n) => withLease(n, (token) => n.interventionCancel(OWNER, token, status!.installedRevision!, 'test-quest'))); }} />
    <Button label="Stop installed test" disabled={disabled || !status?.installedRevision} onPress={() => { void run((n) => withLease(n, (token) => n.interventionCancel(OWNER, token, status!.installedRevision!, null))); }} />
    <Button label="Acknowledge test events" disabled={disabled || !status} onPress={() => { void run((n) => withLease(n, async (token) => {
      const ids = decodeInterventionEventIds(await n.interventionDrain(OWNER, token, 256));
      if (live.current && ids.length) await n.interventionAcknowledge(OWNER, token, ids);
    })); }} />
    <Button label="Erase local intervention test" disabled={disabled} onPress={() => { void run((n) => n.interventionEndOwner(OWNER, true)); }} />
    <View><Text>Erasure deletes this test owner’s local test installation, timers, counters and test events. It does not delete saved app selection, an Auth account or server data. Disable Disconnect intervention test in Android Settings when finished.</Text></View>
  </ScrollView>;
}
