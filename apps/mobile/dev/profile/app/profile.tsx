import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { ConnectedSettingsScreen } from '@/features/settings/connected-settings-screen';
import { router } from 'expo-router';
import { useRuntime } from '../runtime';
export default function Profile() {
  const { runtime } = useRuntime();
  return runtime ? (
    <ConnectedSettingsScreen
      onOpen={{
        activities: () => router.push('./activities'),
        days: () => router.push('./plan?field=days'),
        hours: () => router.push('./plan?field=hours'),
        sessions: () => router.push('./plan?field=sessions'),
      }}
    />
  ) : (
    <SettingsScreen model={unavailableSettings} />
  );
}
