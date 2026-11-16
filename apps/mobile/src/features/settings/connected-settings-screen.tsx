import { RouteButton } from '@/components/ui/route-button';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';
import { AccountPlanControls } from '@/features/plans/account-plan-controls';
import { ProfileSurface } from '@/features/account/profile-surface';
import { AppSignOutAction } from '@/features/account/app-runtime-context';
import { SettingsScreen, type SettingsScreenProps } from './settings-screen';
import { unavailableSettings } from './settings-model';
import { useSettingsSummary } from './use-settings-summary';

/** The summary and editors observe one account-scoped resource, including its shared revision. */
export function ConnectedSettingsScreen({
  onOpen,
}: Pick<SettingsScreenProps, 'onOpen'>) {
  const { query, summary } = useSettingsSummary();
  const device = useAccountWeeklyPlan();
  const read = device?.plan.read;
  const apps =
    read?.phase === 'ready' && read.selectionAvailable !== false
      ? {
          state: 'ready' as const,
          text: `${read.selectedAppCount} apps selected on this device`,
        }
      : {
          state:
            read?.phase === 'error' ||
            (read?.phase === 'ready' && read.selectionAvailable === false)
              ? ('error' as const)
              : ('unavailable' as const),
        };
  return (
    <SettingsScreen
      model={{
        ...unavailableSettings,
        ...summary,
        apps,
      }}
      planDraftOnly
      planContent={device ? <AccountPlanControls /> : undefined}
      accountContent={
        <>
          <RouteButton href="/(onboarding)/welcome" label="Set up Hoosh" />
          <ProfileSurface />
          <AppSignOutAction />
        </>
      }
      onOpen={onOpen}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
