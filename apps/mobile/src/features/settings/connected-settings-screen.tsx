import { ProfileSurface } from '@/features/account/profile-surface';
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
      accountContent={<ProfileSurface />}
      onOpen={onOpen}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
