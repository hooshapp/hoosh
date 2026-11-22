import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Text } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import type { IOSSelectionDevice } from '@/infrastructure/native/ios-selection-device';
import type { SavedSelectionSummary } from '@/infrastructure/native/selection-editor';
import type { ProtectionRead } from '@/features/protection/status-model';

type Snapshot = { selection: SavedSelectionSummary; status: Extract<ProtectionRead, { phase: 'ready' }> };
/** C03 selection/permission capability only; C04 supplies activation and plan review. */
export function IOSDeviceSetup({ device }: { device: IOSSelectionDevice }) {
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [choosing, setChoosing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [actionError, setActionError] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cycle, setCycle] = useState(0);
  const visible = focused && foreground && !choosing;
  const refresh = useCallback(() => { setSnapshot(undefined); setCycle(value => value + 1); }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      setSnapshot(undefined);
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => device.subscribe(refresh), [device, refresh]);
  useEffect(() => {
    if (!visible) return;
    let current = true;
    void Promise.all([device.readSelection(), device.readStatus()]).then(([selection, status]) => {
      if (current) { setSnapshot({ selection, status }); setError(false); }
    }).catch(() => { if (current) { setSnapshot(undefined); setError(true); } });
    return () => { current = false; };
  }, [device, visible, cycle]);
  async function action(kind: 'authorization' | 'stop') {
    if (busy || !visible) return;
    setBusy(true); setActionError(false);
    try {
      if (kind === 'authorization') await device.requestAuthorization();
      else await device.stop();
    } catch { setActionError(true); }
    finally { setBusy(false); refresh(); }
  }
  if (choosing) return <NativeAppsEditor owner={device.owner} generation={device.generation}
    port={device.selection} onBack={() => { setChoosing(false); refresh(); }} />;
  const authorized = visible && snapshot?.status.authorization === 'authorized';
  return <>
    <Text accessibilityRole="header">Screen Time access</Text>
    {visible && snapshot && <>
      <Text>{authorized ? 'Screen Time access allowed.' : 'Screen Time access is off. Review access to choose apps.'}</Text>
      <Text>{snapshot.selection.selectedAppCount} apps saved on this device.</Text>
      {snapshot.selection.needsReselection && <Text>Review your saved apps after restoring access.</Text>}
      <Text>{snapshot.status.status.state === 'degraded'
        ? 'Existing protection could not be reconciled. Review or stop the device setup.'
        : 'Saving apps does not enable protection. Review your plan in Settings; activation awaits physical iPhone testing.'}</Text>
    </>}
    {(error || actionError) && <InlineStatus state="error" message="Device access or saved apps could not be verified. Review the device setup above, then check again." />}
    {!error && !snapshot && <InlineStatus state="loading" message="Checking Screen Time access and saved apps…" />}
    <Button label="Review Screen Time access" busy={busy} disabled={!visible || !snapshot}
      onPress={() => { void action('authorization'); }} />
    <Button label="Choose apps on this device" disabled={!visible || busy || !authorized}
      onPress={() => setChoosing(true)} />
    <Button label="Check Screen Time again" variant="secondary" disabled={!visible || busy} onPress={refresh} />
    {snapshot?.status.status.state === 'degraded' && <Button label="Stop existing protection" variant="secondary" disabled={!visible || busy}
      onPress={() => Alert.alert('Stop Hoosh protection?', 'Existing Hoosh restrictions on this device will stop. Your account data will be kept.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => { void action('stop'); } },
      ])} />}
  </>;
}
