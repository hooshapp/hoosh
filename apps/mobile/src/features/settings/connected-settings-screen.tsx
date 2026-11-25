import { HistoryCollectionSettings } from '@/features/history/history-collection-settings';
import { InlinePlanPreference } from './inline-plan-preference';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { formatTime, weekdays } from '@/features/editors/draft-utils';
import { useCallback, useState } from 'react';
import { usePersonalization } from './use-personalization';
import { PersonalizationControls } from './personalization-controls';
import { Platform, Text } from 'react-native';
import { router } from 'expo-router';
import { DetailsPanel } from '@/components/ui/details-panel';
import { SettingsRow } from './settings-row';
import { settingsAssets } from '@/design/settings-assets';
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
  const personal = usePersonalization();
  const [expanded, setExpanded] = useState<'gender' | 'nudge_tone' | 'days' | 'hours' | 'sessions' | null>(null);
  const answers = personal.form?.draft;
  const [planDirty, setPlanDirty] = useState(false);
  const guard = useRouteDraftGuard(planDirty || (!!expanded && expanded !== 'days' && expanded !== 'hours' && expanded !== 'sessions' && !!personal.form?.navigationDirty));
  const closeEditor = useCallback(() => setExpanded(null), []);
  const toggle = (field: Exclude<typeof expanded, null>) => { if (personal.saved) personal.form?.onDiscard(); guard.exit(() => setExpanded(expanded === field ? null : field)); };
  const saved = query.data?.settings?.plan_draft;
  const rowValue = (text: string) => ({ state: 'ready' as const, text });
  const planValues = saved ? {
    days: rowValue(saved.weekdays.join(',') === '0,1,2,3,4' ? 'Mon – Fri' : saved.weekdays.map(day => weekdays[day]).join(', ') || 'Not set'),
    hours: rowValue(saved.hours?.start_local && saved.hours.end_local ? `${formatTime(saved.hours.start_local)} – ${formatTime(saved.hours.end_local)}` : 'Not set'),
    sessions: rowValue(saved.session_count && saved.session_minutes ? `${saved.session_count} sessions/day · ${saved.session_minutes} min each${saved.budget_scope ? ' · shared' : ''}` : 'Not set'),
  } : {};

  const personalValue = (value: string | null | undefined) => personal.query.isError ? { state: 'error' as const } : answers ? { state: 'ready' as const, text: value ?? 'Not set' } : { state: 'loading' as const };

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
        ...(query.isError ? {} : planValues),
        apps,
        calendars: { googleCalendar: { state: 'unavailable' }, appleCalendar: { state: 'unavailable' } },
        personalInfo: { age: personalValue(answers?.age?.toString()), gender: personalValue(answers?.gender) },
      }}
      planDraftOnly
      onEdit={{ age: () => router.push({ pathname: '/settings/[field]', params: { field: 'age' } }), gender: () => toggle('gender'), days: () => toggle('days'), hours: () => toggle('hours'), sessions: () => toggle('sessions') }}
      inlineEditor={expanded === 'days' || expanded === 'hours' || expanded === 'sessions' ? { field: expanded, content: <InlinePlanPreference field={expanded} onDone={closeEditor} onDirty={setPlanDirty} /> } : expanded === 'gender' ? { field: 'gender', content: <PersonalizationControls editor={personal} field="gender" onDone={closeEditor} /> } : undefined}
      toneContent={<>{personal.tonePending ? <Text accessibilityRole="alert">Your tone is saved. It could not yet be applied on this device.</Text> : null}<SettingsRow label="Nudge Tone" value={personalValue(answers?.nudge_tone)} icon={settingsAssets.tone} iconID="settings-tone" inline
        onPress={() => toggle('nudge_tone')} inlineEditor={expanded === 'nudge_tone' ? <PersonalizationControls editor={personal} field="nudge_tone" onDone={closeEditor} /> : undefined} /></>}
      planContent={device ? <DetailsPanel title="Manage device schedule" description="Review and apply your saved plan"><AccountPlanControls /></DetailsPanel> : undefined}
      deviceContent={<><SettingsRow label={Platform.OS === 'ios' ? "Screen Time access" : "App usage access"}
        value={{ state: 'ready', text: 'Permissions and selected apps' }} icon={settingsAssets.apps} iconID="settings-device-access"
        onView={() => router.push('/settings/device')} />{Platform.OS === 'android' ? <HistoryCollectionSettings /> : null}</>}
      accountContent={
        <>
          <ProfileSurface compact />
        </>
      }
      accountActions={<>{guard.confirmation}<AppSignOutAction /></>}
      onOpen={{ ...onOpen, days: () => toggle('days'), hours: () => toggle('hours'), sessions: () => toggle('sessions') }}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
