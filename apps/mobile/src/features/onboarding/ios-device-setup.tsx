import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, StyleSheet, Text } from 'react-native';
import { useIsFocused } from 'expo-router';
import { colors, fonts } from '@/design/tokens';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import type { IOSSelectionDevice } from '@/infrastructure/native/ios-selection-device';
import type { SavedSelectionSummary } from '@/infrastructure/native/selection-editor';
import type { ProtectionRead } from '@/features/protection/status-model';

type Snapshot = { selection: SavedSelectionSummary; status: Extract<ProtectionRead, { phase: 'ready' }> };
/** C03 selection/permission capability only; C04 supplies activation and plan review. */
export function IOSDeviceSetup({ device, onChooseApps, showHeading = true }: { device: IOSSelectionDevice; onChooseApps?: () => void; showHeading?: boolean }) {
  const focused = useIsFocused();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [choosing, setChoosing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [actionError, setActionError] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [checking, setChecking] = useState(true);
  const [cycle, setCycle] = useState(0);
  const visible = focused && foreground && !choosing;
  const refresh = useCallback(() => { setChecking(true); setCycle(value => value + 1); }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      setForeground(state === 'active');
      setChecking(true);
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
    }).catch(() => { if (current) { setSnapshot(undefined); setError(true); } }).finally(() => { if (current) setChecking(false); });
    return () => { current = false; };
  }, [device, visible, cycle]);
  async function action(kind: 'authorization' | 'stop') {
    if (actionLock.current || busy || !visible || (kind === 'authorization' && snapshot?.status.authorization === 'authorized')) return;
    actionLock.current = true;
    setBusy(true); setActionError(false);
    try {
      if (kind === 'authorization') await device.requestAuthorization();
      else await device.stop();
    } catch { setActionError(true); }
    finally { actionLock.current = false; setBusy(false); refresh(); }
  }
  if (choosing) return <NativeAppsEditor owner={device.owner} generation={device.generation}
    port={device.selection} onBack={() => { setChoosing(false); refresh(); }} />;
  const authorized = visible && snapshot?.status.authorization === 'authorized';
  return <>
    {showHeading ? <Text accessibilityRole="header" style={styles.heading}>Screen Time access</Text> : null}
    {visible && snapshot && <>
      <Text style={styles.body}>{authorized ? 'Screen Time access allowed.' : 'Screen Time access is off. Review access to choose apps.'}</Text>
      <Text style={styles.body}>{snapshot.selection.selectedAppCount} apps saved on this device.</Text>
      {snapshot.selection.needsReselection && <Text style={styles.body}>Review your saved apps after restoring access.</Text>}
      <Text style={styles.body}>{snapshot.status.status.state === 'degraded'
        ? 'Existing protection could not be reconciled. Review or stop the device setup.'
        : 'Saving apps does not start protection. Review your plan in Settings before applying it to this device.'}</Text>
    </>}
    {(error || actionError) && <InlineStatus state="error" message="Device access or saved apps could not be verified. Review the device setup above, then check again." />}
    {!error && !snapshot && <InlineStatus state="loading" message="Checking Screen Time access and saved apps…" />}
    {!authorized && <Button label="Review Screen Time access" busy={busy} disabled={!visible || !snapshot || checking}
      onPress={() => { void action('authorization'); }} />}
    <Button label="Choose apps on this device" disabled={!visible || busy || checking || !authorized}
      onPress={() => { if (onChooseApps) onChooseApps(); else setChoosing(true); }} />
    <Button label="Check Screen Time again" variant="secondary" busy={checking} disabled={!visible || busy} onPress={refresh} />
    {snapshot?.status.status.state === 'degraded' && <Button label="Stop existing protection" variant="secondary" disabled={!visible || busy}
      onPress={() => Alert.alert('Stop Hoosh protection?', 'Existing Hoosh restrictions on this device will stop. Your account data will be kept.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => { void action('stop'); } },
      ])} />}
  </>;
}

const styles = StyleSheet.create({
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.warmForeground },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
});
