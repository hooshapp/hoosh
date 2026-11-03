import type { ProtectionIntegration } from '@disconnect/contracts';
import { useSyncExternalStore } from 'react';
import { AppState, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Button } from '@/components/ui/button';
import { EmptyCard } from '@/components/ui/empty-card';
import { InlineStatus } from '@/components/ui/inline-status';
import { deviceProtectionIntegration } from '@/infrastructure/native/protection-integration';
import { ProtectionStatus } from './protection-status';
import { useProtectionStatus } from './use-protection-status';
import { useUsagePermissionAction } from './use-usage-permission-action';

const subscribe = (notify: () => void) => {
  const subscription = AppState.addEventListener('change', notify);
  return () => subscription.remove();
};
const snapshot = () => AppState.currentState === 'active';
const serverSnapshot = () => false;
export function UnavailableDeviceProtection() {
  return (
    <EmptyCard
      title="Protection unavailable"
      description="We can’t confirm protection on this device right now."
    />
  );
}
/** Existing Router host provides focus; private Auth/cache state is not native ownership evidence. */
export function DeviceProtection() {
  return deviceProtectionIntegration.availability === 'connected' ? (
    <FocusedProtection integration={deviceProtectionIntegration} />
  ) : (
    <UnavailableDeviceProtection />
  );
}
function FocusedProtection({ integration }: { integration: ProtectionIntegration }) {
  const focused = useIsFocused();
  const active = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return <DeviceProtectionView integration={integration} visible={focused && active} />;
}
/** QA can supply actual visibility without a Router. Desired native revision is deliberately unknown. */
export function DeviceProtectionView({
  integration,
  visible,
}: {
  integration: ProtectionIntegration;
  visible: boolean;
}) {
  const status = useProtectionStatus(integration, null, visible);
  const permission = useUsagePermissionAction(integration, status.refresh);
  const authorization = status.authorization;
  const message =
    authorization === 'authorized'
      ? 'Usage access allowed. App protection is not active.'
      : authorization === 'denied' ||
          authorization === 'revoked' ||
          authorization === 'not_requested'
        ? 'Usage access is not allowed. Granting access does not activate protection.'
        : 'Usage access could not be verified.';
  if (integration.availability !== 'connected') return <UnavailableDeviceProtection />;
  return (
    <View style={{ gap: 12 }}>
      <ProtectionStatus model={status.model} onRetry={visible ? status.refresh : undefined} />
      <EmptyCard title="Usage access" description={message} />
      {permission.failed ? (
        <InlineStatus
          state="error"
          message="Usage access settings could not be opened. Try again."
        />
      ) : null}
      <Button
        label="Review usage access"
        busyLabel="Opening usage access…"
        busy={permission.busy}
        disabled={!visible}
        onPress={permission.run}
      />
    </View>
  );
}
