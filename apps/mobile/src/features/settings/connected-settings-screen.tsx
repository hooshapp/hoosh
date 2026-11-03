import { ProfileSurface } from '@/features/account/profile-surface';
import { activitySummary } from '@/features/preferences/activity-model';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { SettingsScreen, type SettingsScreenProps } from './settings-screen';
import { unavailableSettings, type SettingsValue } from './settings-model';
import { useSettingsQuery } from './settings-query';

/** The summary and editors observe one account-scoped resource, including its shared revision. */
export function ConnectedSettingsScreen({ onOpen }: Pick<SettingsScreenProps, 'onOpen'>) {
  const { availability } = useAccountData();
  const query = useSettingsQuery();
  const activities: SettingsValue =
    availability !== 'ready'
      ? { state: 'unavailable' }
      : query.isError
        ? { state: 'error' }
        : query.data
          ? {
              state: 'ready',
              text: query.data.settings
                ? activitySummary(query.data.settings.activities)
                : 'Not saved yet',
            }
          : { state: query.isPaused ? 'unavailable' : 'loading' };
  return (
    <SettingsScreen
      model={{ ...unavailableSettings, activities }}
      accountContent={<ProfileSurface />}
      onOpen={onOpen}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
