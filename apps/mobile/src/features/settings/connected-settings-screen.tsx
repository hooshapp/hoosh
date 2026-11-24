import { RestartQuestionnaires } from '@/features/onboarding/restart-questionnaires';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { DetailsPanel } from '@/components/ui/details-panel';
import { SettingsRow } from './settings-row';
import { settingsAssets } from '@/design/settings-assets';
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
      planContent={device ? <DetailsPanel title="Manage device schedule" description="Review and apply your saved plan"><AccountPlanControls /></DetailsPanel> : undefined}
      deviceContent={<SettingsRow label={Platform.OS === 'ios' ? "Screen Time access" : "App usage access"}
        value={{ state: 'ready', text: 'Permissions and selected apps' }} icon={settingsAssets.apps} iconID="settings-device-access"
        onView={() => router.push('/settings/device')} />}
      accountContent={
        <>
          <ProfileSurface compact />
        </>
      }
      accountActions={<><RouteButton href="/(onboarding)/welcome" label="Set up Hoosh" /><RestartQuestionnaires /><AppSignOutAction /></>}
      onOpen={onOpen}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
