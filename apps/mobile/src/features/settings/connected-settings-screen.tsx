import { ProfileSurface } from '@/features/account/profile-surface';
import { activitySummary } from '@/features/preferences/activity-model';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { SettingsScreen, type SettingsScreenProps } from './settings-screen';
import { unavailableSettings, type SettingsValue } from './settings-model';
import { planSummary, type PlanField } from '@/features/plans/plan-draft-model';
import { useSettingsQuery } from './settings-query';

/** The summary and editors observe one account-scoped resource, including its shared revision. */
export function ConnectedSettingsScreen({ onOpen }: Pick<SettingsScreenProps, 'onOpen'>) {
  const { availability } = useAccountData();
  const query = useSettingsQuery();
  const value = (text: string | null): SettingsValue =>
    availability !== 'ready'
      ? { state: 'unavailable' }
      : query.isError
        ? { state: 'error' }
        : query.data
          ? { state: 'ready', text }
          : { state: query.isPaused ? 'unavailable' : 'loading' };
  const activities = value(
    query.data?.settings ? activitySummary(query.data.settings.activities) : 'Not saved yet',
  );
  const draftValue = (field: PlanField) =>
    value(planSummary(field, query.data?.settings?.plan_draft ?? null));
  return (
    <SettingsScreen
      model={{
        ...unavailableSettings,
        activities,
        days: draftValue('days'),
        hours: draftValue('hours'),
        sessions: draftValue('sessions'),
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
