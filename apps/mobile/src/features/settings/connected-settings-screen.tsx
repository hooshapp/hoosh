import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { HistoryCollectionSettings } from '@/features/history/history-collection-settings';
import { InlinePlanPreference } from './inline-plan-preference';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { formatTime, weekdays } from '@/features/editors/draft-utils';
import { useCallback, useEffect, useState } from 'react';
import { usePersonalization } from './use-personalization';
import { PersonalizationControls } from './personalization-controls';
import { ActionSheetIOS, Alert, AppState, Linking, PermissionsAndroid, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SettingsRow } from './settings-row';
import { settingsAssets } from '@/design/settings-assets';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';
import { ProfileSurface } from '@/features/account/profile-surface';
import { AppSignOutAction } from '@/features/account/app-runtime-context';
import { SettingsScreen, type SettingsScreenProps } from './settings-screen';
import { unavailableSettings } from './settings-model';
import { useSettingsSummary } from './use-settings-summary';
import type { IOSGoogleCalendarStatus } from '@/infrastructure/native/ios-selection-device';

/** The summary and editors observe one account-scoped resource, including its shared revision. */
export function ConnectedSettingsScreen({
  onOpen,
}: Pick<SettingsScreenProps, 'onOpen'>) {
  const ios = useIOSSelectionDevice();
  const [calendar, setCalendar] = useState<'off' | 'on' | 'checking' | 'error'>('checking');
  const [reminders, setReminders] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);
  useEffect(() => {
    let current = true;
    const refresh = () => {
      void ios?.calendarNudgeSettings?.().then(value => {
        if (current) setCalendar(previous => value ? 'on' : previous === 'error' ? previous : 'off');
      }).catch(() => { if (current) setCalendar('error'); });
      void ios?.remindersNudgeSettings?.().then(value => {
        if (current) setReminders(value);
      }).catch(() => undefined);
    };
    refresh();
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => { current = false; listener.remove(); };
  }, [ios]);
  const editCalendar = ios?.calendarNudgeSettings && calendar !== 'checking' && !appleBusy ? () => {
    const calendarOn = calendar === 'on';
    const options = [calendarOn ? 'Disconnect Apple Calendar' : 'Connect Apple Calendar'];
    if (ios.remindersNudgeSettings) {
      options.push(reminders ? 'Disconnect Apple Reminders' : 'Connect Apple Reminders');
    }
    options.push('Cancel');
    setAppleBusy(true);
    void (async () => {
      const selected = await new Promise<number>(resolve => {
        ActionSheetIOS.showActionSheetWithOptions({
          title: 'Apple Calendar & Reminders',
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: [...(calendarOn ? [0] : []), ...(reminders && ios.remindersNudgeSettings ? [1] : [])],
        }, resolve);
      });
      if (selected === options.length - 1) return;
      const isCalendar = selected === 0;
      const source = isCalendar ? 'Calendar' : 'Reminders';
      const enabling = !(isCalendar ? calendarOn : reminders);
      const configure = isCalendar ? ios.calendarNudgeSettings : ios.remindersNudgeSettings;
      const connected = await configure?.(enabling);
      if (isCalendar) setCalendar(connected ? 'on' : enabling ? 'error' : 'off');
      else setReminders(connected === true);
      if (enabling && !connected) {
        Alert.alert(`${source} access needed`, `Allow ${source} access for Hoosh in iPhone Settings.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => { void Linking.openSettings().catch(() => undefined); } },
        ]);
      }
    })().catch(() => Alert.alert('Couldn’t update Apple connection', 'Try again in Hoosh Settings.'))
      .finally(() => setAppleBusy(false));
  } : undefined;
  const native = useNativeOwner();
  const googleSettings = Platform.OS === 'android' ? native?.port.googleCalendarNudgeSettings : undefined;
  const googleOwner = native?.owner;
  const [google, setGoogle] = useState<
    'checking' | 'off' | 'connected' | 'permission' | 'sync_required' | 'unavailable'
  >('checking');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleDetails, setGoogleDetails] = useState<Partial<IOSGoogleCalendarStatus>>({});
  const nextGoogleEvent = googleDetails.nextEventStartsAt;
  const googleConnectionLabel = googleDetails.calendarLabel
    ? `${googleDetails.calendarLabel} · ${googleDetails.activeEvent ? 'Timed event in progress' : nextGoogleEvent
      ? `Next timed event ${new Date(nextGoogleEvent).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
      : 'No timed event in the next 24 hours'}${googleDetails.tasks === 'connected' ? ' · Tasks connected' : ''}`
    : 'Connected on iPhone · tap to disconnect';
  useEffect(() => {
    if (!ios?.googleCalendarNudges && (!googleSettings || !googleOwner)) return;
    let current = true;
    async function refresh() {
      try {
        const details = await ios?.googleCalendarNudges?.('status');
        const result = details?.status ?? await googleSettings!(googleOwner!, null);
        if (!current || result === 'choose') return;
        setGoogleDetails(details ?? {});
        setGoogle(previous => previous === 'sync_required' && result === 'off' ? previous : result);
      } catch { if (current) setGoogle('unavailable'); }
    }
    void refresh();
    const unsubscribe = ios?.subscribeCalendar?.(() => { void refresh(); });
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => { current = false; listener.remove(); unsubscribe?.(); };
  }, [googleOwner, googleSettings, ios]);
  const editAndroidGoogleCalendar = googleSettings && googleOwner && !googleBusy && google !== 'checking' ? () => {
    setGoogleBusy(true);
    void (async () => {
      if (google === 'connected') {
        setGoogle(await googleSettings(googleOwner, false));
        return;
      }
      const access = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CALENDAR);
      if (access !== PermissionsAndroid.RESULTS.GRANTED) {
        setGoogle('permission');
        if (access === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) await Linking.openSettings();
        return;
      }
      const result = await googleSettings(googleOwner, true);
      setGoogle(result);
      if (result === 'sync_required' && google === 'sync_required') {
        await Linking.sendIntent('android.settings.SYNC_SETTINGS').catch(() => undefined);
      }
    })().catch(() => setGoogle('unavailable')).finally(() => setGoogleBusy(false));
  } : undefined;
  const editIOSGoogleCalendar = ios?.googleCalendarNudges && !googleBusy && google !== 'checking' ? () => {
    const configure = ios.googleCalendarNudges!;
    setGoogleBusy(true);
    void (async () => {
      if (google === 'connected' && ios.googleCalendarDirect) {
        const tasksConnected = googleDetails.tasks === 'connected';
        const options = [tasksConnected ? 'Disconnect Google Tasks' : 'Connect Google Tasks', 'Disconnect Google Calendar', 'Cancel'];
        const selected = await new Promise<number>(resolve => {
          ActionSheetIOS.showActionSheetWithOptions({
            title: 'Google Calendar',
            message: 'Connect Google Tasks to get reminders for unfinished tasks. Choose the Google account where you keep them.',
            options,
            cancelButtonIndex: 2,
            destructiveButtonIndex: tasksConnected ? [0, 1] : 1,
          }, resolve);
        });
        if (selected === 2) return;
        try {
          const result = await configure(selected === 1 ? 'disconnect' : tasksConnected ? 'disconnect_tasks' : 'connect_tasks');
          if (result.status !== 'choose') {
            setGoogleDetails(result);
            setGoogle(result.status);
          }
        } catch {
          Alert.alert('Couldn’t update Google connection', 'Try again in Settings. Your current calendar and task choices are still here.');
        }
        return;
      }
      const result = await configure('choose');
      if (result.status !== 'choose') {
        setGoogleDetails(result);
        setGoogle(result.status);
        if (result.status === 'permission') {
          Alert.alert('Calendar access needed', 'Allow Hoosh to read Google calendars synced to your iPhone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => { void Linking.openSettings().catch(() => undefined); } },
          ]);
        } else if (result.status === 'sync_required') {
          Alert.alert('Sync Google Calendar', 'In iPhone Settings, go to Apps → Calendar → Calendar Accounts. Add your Google account, turn on Calendars, then return here.');
        }
        return;
      }
      const calendars = result.calendars ?? [];
      if (!calendars.length) { setGoogle('sync_required'); return; }
      const canDisconnect = google === 'connected';
      const options = [...calendars.map(calendar => calendar.label), ...(canDisconnect ? ['Disconnect'] : []), 'Cancel'];
      const selected = await new Promise<number>(resolve => {
        ActionSheetIOS.showActionSheetWithOptions({
          title: 'Choose your synced Google account',
          message: 'Hoosh checks timed events across calendars synced from the selected account.',
          options,
          cancelButtonIndex: options.length - 1,
          ...(canDisconnect ? { destructiveButtonIndex: calendars.length } : {}),
        }, resolve);
      });
      if (canDisconnect && selected === calendars.length) {
        await configure('disconnect');
        setGoogleDetails({});
        setGoogle('off');
        return;
      }
      const calendar = calendars[selected];
      if (calendar) {
        const connected = await configure('connect', calendar.id);
        if (connected.status !== 'choose') {
          setGoogleDetails(connected);
          setGoogle(connected.status);
        }
      }
    })().catch(() => setGoogle('unavailable')).finally(() => setGoogleBusy(false));
  } : undefined;
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
        calendars: { googleCalendar: googleSettings || ios?.googleCalendarNudges
          ? google === 'checking' ? { state: 'loading' }
            : rowValue({
              connected: ios ? googleConnectionLabel : 'Connected through Android · tap to disconnect',
              off: ios?.googleCalendarDirect ? 'Connect directly with your Google account'
                : ios ? 'Use a Google calendar already synced to this iPhone' : 'Use the Google calendars synced to this device',
              permission: 'Calendar access needed · tap to review',
              sync_required: ios ? 'Add your Google account in iPhone Calendar settings' : 'Enable Google Calendar sync in Android Settings',
              unavailable: 'Calendar could not be read · tap to retry',
            }[google])
          : { state: 'unavailable' }, appleCalendar: ios?.calendarNudgeSettings
          ? calendar === 'checking' ? { state: 'loading' }
            : rowValue(calendar === 'on' && reminders ? 'Calendar and Reminders connected'
              : reminders ? 'Reminders connected' : calendar === 'on' ? 'Calendar connected'
              : calendar === 'error' ? 'Calendar access needed · tap to review' : 'Connect Calendar or Reminders')
          : { state: 'unavailable' } },
        personalInfo: { age: personalValue(answers?.age?.toString()), gender: personalValue(answers?.gender) },
      }}
      onEdit={{ googleCalendar: editIOSGoogleCalendar ?? editAndroidGoogleCalendar, appleCalendar: editCalendar, age: () => router.push({ pathname: '/settings/[field]', params: { field: 'age' } }), gender: () => toggle('gender'), days: () => toggle('days'), hours: () => toggle('hours'), sessions: () => toggle('sessions') }}
      inlineEditor={expanded === 'days' || expanded === 'hours' || expanded === 'sessions' ? { field: expanded, content: <InlinePlanPreference field={expanded} onDone={closeEditor} onDirty={setPlanDirty} /> } : expanded === 'gender' ? { field: 'gender', content: <PersonalizationControls editor={personal} field="gender" onDone={closeEditor} /> } : undefined}
      toneContent={<>{personal.tonePending ? <Text accessibilityRole="alert">Your tone is saved. It could not yet be applied on this device.</Text> : null}<SettingsRow label="Nudge Tone" value={personalValue(answers?.nudge_tone)} icon={settingsAssets.tone} iconID="settings-tone" inline
        onPress={() => toggle('nudge_tone')} inlineEditor={expanded === 'nudge_tone' ? <PersonalizationControls editor={personal} field="nudge_tone" onDone={closeEditor} /> : undefined} /></>}
      deviceContent={<>
        <SettingsRow label={Platform.OS === 'ios' ? "Screen Time access" : "App usage access"}
        value={{ state: 'ready', text: 'Permissions and selected apps' }} icon={settingsAssets.apps} iconID="settings-device-access"
        onView={() => router.push('/settings/device')} />{Platform.OS === 'android' ? <HistoryCollectionSettings /> : null}</>}
      accountContent={
        <>
          <ProfileSurface compact avatarGender={personal.savedGender} />
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
