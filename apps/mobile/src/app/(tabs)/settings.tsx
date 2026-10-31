import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings } from '@/features/settings/settings-model';

export default function Settings() {
  return <SettingsScreen model={unavailableSettings} />;
}
