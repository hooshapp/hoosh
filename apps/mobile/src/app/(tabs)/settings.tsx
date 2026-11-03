import { router } from 'expo-router';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { ConnectedSettingsScreen } from '@/features/settings/connected-settings-screen';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
export default function Settings() {
  const account = useOptionalAccountData();
  const open = (field: string) => () =>
    router.push({ pathname: '/settings/[field]', params: { field } });
  const onOpen = {
    apps: open('apps'),
    activities: open('activities'),
    days: open('days'),
    hours: open('hours'),
    sessions: open('sessions'),
  };
  return account?.scope ? (
    <ConnectedSettingsScreen onOpen={onOpen} />
  ) : (
    <SettingsScreen model={unavailableSettings} onOpen={onOpen} />
  );
}
