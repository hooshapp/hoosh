import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { ConnectedSettingsScreen } from '@/features/settings/connected-settings-screen';
import { router } from 'expo-router';
import { useRuntime } from '../runtime';
export default function Profile() {
  const { runtime } = useRuntime();
  return runtime ? (
    <ConnectedSettingsScreen onOpen={{ activities: () => router.push('./activities') }} />
  ) : (
    <SettingsScreen model={unavailableSettings} />
  );
}
