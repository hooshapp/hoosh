import { Button } from '@/components/ui/button';
import { DeviceProtection } from '@/features/protection/device-protection';
export { UnavailableDeviceProtection } from '@/features/protection/device-protection';
import { InlineStatus } from '@/components/ui/inline-status';
import { useAccountAction } from '@/features/account/use-account-action';
import { useSettingsSummary } from '@/features/settings/use-settings-summary';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { HomePreferences, type PreferencesNavigation } from './home-preferences';
import { HomeScreen } from './home-screen';
import { unavailableHome } from './home-model';

export function ConnectedHomeScreen({ onOpen }: { onOpen?: PreferencesNavigation }) {
  const { query, summary, availability, online } = useSettingsSummary();
  const { controller } = useAccountData();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const paused = availability === 'api_paused' || availability === 'recovering';
  const notice = paused ? (
    <>
      <InlineStatus
        state="unavailable"
        message={
          recovery.failed
            ? 'Account access could not be verified. Try again.'
            : 'Verify your account access to load saved preferences.'
        }
      />
      <Button
        label="Verify account access"
        busyLabel="Verifying…"
        busy={recovery.busy || availability === 'recovering'}
        onPress={recovery.run}
      />
    </>
  ) : !online ? (
    <InlineStatus state="unavailable" message="Connect to verify your saved preferences." />
  ) : availability !== 'ready' ? (
    <InlineStatus state="unavailable" message="Saved preferences are temporarily unavailable." />
  ) : undefined;
  return (
    <HomeScreen
      model={unavailableHome}
      preferences={
        <HomePreferences
          summary={summary}
          onOpen={onOpen}
          recovery={notice}
          onRetry={
            availability === 'ready' && online
              ? () => {
                  void query.refetch();
                }
              : undefined
          }
          retrying={query.isFetching}
          refreshing={availability === 'ready' && online && query.isFetching}
        />
      }
      protection={<DeviceProtection />}
    />
  );
}
