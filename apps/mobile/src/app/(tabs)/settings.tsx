import { router } from 'expo-router';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { ProfileSurface } from '@/features/account/profile-surface';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
export default function Settings() {
  const account = useOptionalAccountData();
  const open = (field: string) => () =>
    router.push({ pathname: '/settings/[field]', params: { field } });
  return (
    <SettingsScreen
      model={unavailableSettings}
      accountContent={account?.scope ? <ProfileSurface /> : undefined}
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
