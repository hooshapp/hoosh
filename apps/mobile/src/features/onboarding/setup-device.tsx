import type { AuthorizationState, ProtectionIntegration } from '@disconnect/contracts';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { colors } from '@/design/tokens';
import { Screen } from '@/components/ui/screen';
import { InlineStatus } from '@/components/ui/inline-status';
import { IOSDeviceSetup } from './ios-device-setup';
import { InstallationReviewPanel } from '@/features/protection/installation-review';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import { useIOSSelectionDevice, useNativeOwner, type NativeOwner } from '@/features/protection/native-owner-boundary';
import { useUsagePermissionAction } from '@/features/protection/use-usage-permission-action';
import { decodeInterventionProtectionRead } from '@/infrastructure/native/intervention-protection-reader';
import { deviceProtectionIntegration } from '@/infrastructure/native/protection-integration';
import { decodeSavedSelection, type SavedSelectionSummary } from '@/infrastructure/native/selection-editor';

type Props = {
  preferencesSaved: boolean;
  busy: boolean;
  failed: boolean;
  onReview: (revision: number) => Promise<boolean>;
  onFinish: () => void;
};
type DeviceRead = {
  selection: SavedSelectionSummary | null;
  accessibility: AuthorizationState | null;
  usage: AuthorizationState | null;
};
async function readDevice({ owner, port }: NativeOwner, integration: ProtectionIntegration): Promise<DeviceRead> {
  const [selection, accessibility, usage] = await Promise.allSettled([
    Promise.resolve().then(async () => decodeSavedSelection(await port.selectionRead(owner), owner)),
    Promise.resolve().then(async () => {
      const protection = decodeInterventionProtectionRead(await port.interventionProtectionRead(owner));
      return protection.status.state === 'failed' ? null : protection.authorization;
    }),
    integration.availability === 'connected' && integration.platform === 'android'
      ? Promise.resolve().then(() => integration.service.getAuthorization())
      : Promise.resolve(null),
  ]);
  return {
    selection: selection.status === 'fulfilled' ? selection.value : null,
    accessibility: accessibility.status === 'fulfilled' ? accessibility.value : null,
    usage: usage.status === 'fulfilled' ? usage.value : null,
  };
}
function ready(read: DeviceRead | null): read is DeviceRead & { selection: SavedSelectionSummary } {
  return !!read?.selection?.selectedAppCount && !read.selection.needsReselection &&
    read.accessibility === 'authorized';
}

export function SetupDevice(props: Props) {
  const owner = useNativeOwner();
  const iosDevice = useIOSSelectionDevice();
  if (Platform.OS === 'ios' && iosDevice) return <DeviceScreen {...props}>
    <IOSDeviceSetup key={`${iosDevice.owner}:${iosDevice.generation}`} device={iosDevice} />
  </DeviceScreen>;
  if (owner) {
    return <ConnectedDevice key={`${owner.owner}:${owner.generation}`} owner={owner} {...props} />;
  }
  return (
    <DeviceScreen {...props}>
      <InlineStatus state="unavailable" message={Platform.OS === 'ios'
        ? 'Screen Time setup is unavailable in this iPhone build.'
        : 'Device permissions and app selection are unavailable in this build.'} />
    </DeviceScreen>
  );
}

function DeviceScreen({ preferencesSaved, busy, failed, onFinish, children }: Props & {
  children: ReactNode;
}) {
  return (
    <Screen title="Preferences reviewed">
      <Text style={{ color: colors.warmForeground }}>{preferencesSaved ? 'Your preferences are saved to your account.' : 'No account settings changes were needed.'}</Text>
      <InstallationReviewPanel />
      {children}
      {failed && <InlineStatus state="error" message="Setup progress could not be recorded. Try again." />}
      <Button label="Finish for now" variant="secondary" busy={busy} onPress={onFinish} />
    </Screen>
  );
}

function ConnectedDevice({ owner, ...props }: Props & { owner: NativeOwner }) {
  const focused = useIsFocused();
  const integration = deviceProtectionIntegration;
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [choosing, setChoosing] = useState(false);
  const visible = focused && foreground && !choosing;
  const cycle = useMemo(() => ({ visible, owner }), [visible, owner]);
  const [ticket, setTicket] = useState<{ cycle: typeof cycle; value: DeviceRead | null }>();
  const read = visible && ticket?.cycle === cycle ? ticket.value : null;
  const checking = visible && ticket?.cycle !== cycle;
  const [opening, setOpening] = useState(false);
  const [accessError, setAccessError] = useState(false);
  const [changed, setChanged] = useState(false);
  const epoch = useRef(0);
  const cancelPending = useRef<(() => void) | undefined>(undefined);
  const alive = useRef(true);
  const launching = useRef(false);
  const advancing = useRef(false);

  const cancelRead = useCallback(() => {
    epoch.current++;
    cancelPending.current?.();
  }, []);

  const refresh = useCallback(async () => {
    cancelRead();
    const id = epoch.current;
    setTicket(undefined);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = new Promise<null>(resolve => {
      cancelPending.current = () => resolve(null);
      timer = setTimeout(() => resolve(null), 10000);
    });
    const next = await Promise.race([readDevice(owner, integration), stop]);
    clearTimeout(timer);
    if (epoch.current !== id) return null;
    cancelPending.current = undefined;
    setTicket({ cycle, value: next });
    return next;
  }, [cancelRead, cycle, integration, owner]);

  useEffect(() => {
    if (!visible) return;
    let current = true;
    void Promise.resolve().then(() => { if (current) return refresh(); });
    return () => { current = false; cancelRead(); };
  }, [cancelRead, refresh, visible]);
  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        cancelRead();
        setTicket(undefined);
      }
      setForeground(state === 'active');
    });
    return () => { alive.current = false; subscription.remove(); };
  }, [cancelRead]);

  const usageAction = useUsagePermissionAction(integration, () => { if (visible) void refresh(); });
  async function openAccessibility() {
    if (launching.current || !visible) return;
    launching.current = true;
    setOpening(true);
    setAccessError(false);
    try {
      await owner.port.interventionReviewAccess();
    } catch {
      if (alive.current) setAccessError(true);
    } finally {
      launching.current = false;
      if (alive.current) {
        setOpening(false);
        if (AppState.currentState === 'active' && visible) void refresh();
      }
    }
  }

  async function continueToReview() {
    if (!visible || !ready(read) || advancing.current) return;
    advancing.current = true;
    const revision = read.selection.revision;
    setChanged(false);
    try {
      const current = await refresh();
      if (!ready(current) || current.selection.revision !== revision) {
        if (alive.current && visible) setChanged(true);
        return;
      }
      await props.onReview(current.selection.revision);
    } finally {
      advancing.current = false;
    }
  }

  if (choosing) {
    return <NativeAppsEditor owner={owner.owner} generation={owner.generation} port={owner.port}
      onBack={() => setChoosing(false)} />;
  }

  const selection = visible ? read?.selection : null;
  const busy = props.busy || checking || opening || usageAction.busy;
  return (
    <DeviceScreen {...props} onFinish={() => { if (!advancing.current) props.onFinish(); }}>
      <Text accessibilityRole="header">Device access</Text>
      {checking && <InlineStatus state="loading" message="Checking device access and saved apps…" />}
      {visible && !checking && (
        <>
          <Text>{read?.usage === 'authorized' ? 'Usage Access allowed.'
            : read?.usage === 'denied' ? 'Usage Access is off. Allow it for usage measurement.'
            : 'Usage Access could not be verified.'}</Text>
          <Text>{read?.accessibility === 'authorized' ? 'Accessibility access allowed for app protection.'
            : read?.accessibility ? 'Accessibility access is off. Review the disclosure before enabling protection.'
            : 'Accessibility access could not be verified.'}</Text>
          <Text>{selection?.needsReselection ? 'Some saved apps are no longer available. Choose your apps again.'
            : selection ? selection.selectedAppCount === 0 ? 'No apps saved.'
              : selection.selectedAppCount === 1 ? '1 app saved on this device.'
              : `${selection.selectedAppCount} apps saved on this device.`
            : 'Saved apps could not be verified. Unlock your device and check again.'}</Text>
        </>
      )}
      {integration.availability === 'connected' && integration.platform === 'android' && read?.usage !== 'authorized' && (
        <Button label="Review Usage Access" variant="secondary" disabled={!visible || !!busy}
          onPress={usageAction.run} />
      )}
      {read?.accessibility !== 'authorized' && <Button label="Review Accessibility access" variant="secondary" disabled={!visible || !!busy}
        onPress={() => { void openAccessibility(); }} />}
      {(accessError || usageAction.failed) && (
        <InlineStatus state="error" message="Device settings could not be opened. Try again." />
      )}
      <Button label="Choose apps on this device" disabled={!visible || !!busy}
        onPress={() => setChoosing(true)} />
      <Button label="Check device access again" variant="secondary" disabled={!visible || props.busy || opening}
        onPress={() => { if (!advancing.current) void refresh(); }} />
      {changed && <InlineStatus state="unavailable" message="Device access or app selection changed. Review the latest values." />}
      <Button label="Continue to protection review" disabled={!visible || !!busy || !ready(read)}
        onPress={() => { void continueToReview(); }} />
    </DeviceScreen>
  );
}
