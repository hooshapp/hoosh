import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';
import { ProfileSurface } from '@/features/account/profile-surface';
import { useRuntime } from '../runtime';
export default function Profile() {
  const { runtime } = useRuntime();
  return (
    <SettingsScreen
      model={unavailableSettings}
      accountContent={runtime ? <ProfileSurface /> : undefined}
    />
  );
}
