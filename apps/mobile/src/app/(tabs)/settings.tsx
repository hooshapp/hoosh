import { router } from 'expo-router';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
export default function Settings() {
  const open = (field: string) => () =>
    router.push({ pathname: '/settings/[field]', params: { field } });
  return (
    <SettingsScreen
      model={unavailableSettings}
      onOpen={{
        apps: open('apps'),
        activities: open('activities'),
        days: open('days'),
        hours: open('hours'),
        sessions: open('sessions'),
      }}
    />
  );
}
