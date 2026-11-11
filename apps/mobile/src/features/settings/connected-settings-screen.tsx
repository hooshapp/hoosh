import { ProfileSurface } from '@/features/account/profile-surface';
import { AppSignOutAction } from '@/features/account/app-runtime-context';
import { SettingsScreen, type SettingsScreenProps } from './settings-screen';
import { unavailableSettings } from './settings-model';
import { useSettingsSummary } from './use-settings-summary';

/** The summary and editors observe one account-scoped resource, including its shared revision. */
export function ConnectedSettingsScreen({ onOpen }: Pick<SettingsScreenProps, 'onOpen'>) {
  const { query, summary } = useSettingsSummary();
  return (
    <SettingsScreen
      model={{
        ...unavailableSettings,
        ...summary,
      }}
      planDraftOnly
      accountContent={<><ProfileSurface /><AppSignOutAction /></>}
      onOpen={onOpen}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
