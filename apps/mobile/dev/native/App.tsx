import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { DesignArtwork, type DesignAsset } from '@/components/ui/design-artwork';
import {
  FloatingTabBarProvider,
  useFloatingTabBarMetrics,
} from '@/components/navigation/floating-tab-bar-metrics';
import { colors, fonts } from '@/design/tokens';
import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome, type HomeModel } from '@/features/home/home-model';
import { QuestsScreen } from '@/features/quests/quests-screen';
import { unavailableQuests } from '@/features/quests/quests-model';
import { QuestEditor } from '@/features/quests/quest-editor';
import { emptyQuestDraft, type QuestDraft } from '@/features/quests/quest-draft';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { unavailableSettings, type SettingsField } from '@/features/settings/settings-model';
import { HistoryScreen } from '@/features/history/history-screen';
import { HistoryDetails } from '@/features/history/history-details';
import { unavailableHistory } from '@/features/history/history-model';
import {
  AgeEditor,
  ActivitiesEditor,
  AppsEditor,
  GenderEditor,
  type ActivityDraft,
  type SelectionOption,
} from '@/features/preferences/preference-editors';
import {
  DaysEditor,
  HoursEditor,
  SessionsEditor,
  type HoursDraft,
  type SessionsDraft,
} from '@/features/plans/plan-editors';
import { ProfileForm, type ProfileNameDraft } from '@/features/account/profile-form';
import { AccountHeader } from '@/features/account/account-header';
import type { EditorState } from '@/features/editors/editor-controls';
import { homeAssets, homeDinoAssets } from '@/design/home-assets';
import { navigationAssets } from '@/design/navigation-assets';
import { questAssets } from '@/design/quest-assets';
import { questeditorAssets } from '@/design/questeditor-assets';
import { preferenceAssets } from '@/design/preference-assets';
import { settingsAssets } from '@/design/settings-assets';
import { historyAssets } from '@/design/history-assets';
import { historydetailAssets } from '@/design/historydetail-assets';
import { planeditorAssets } from '@/design/planeditor-assets';
import {
  homeExample,
  questsExample,
  settingsExample,
  historyExample,
  historyDetailExample,
} from '../shared/ui-samples';

const screens = [
  'Home',
  'Quests',
  'Settings',
  'History',
  'Personalize',
  'Custom quest',
  'Edit quest',
  'Age',
  'Activities',
  'Apps',
  'Native selection',
  'Gender',
  'Days',
  'Hours',
  'Sessions',
  'Progress',
  'Time reclaimed',
  'Profile',
  'Original assets',
] as const;
type Page = (typeof screens)[number];
const states = ['Ready', 'Loading', 'Error', 'Unavailable', 'Busy', 'Long text'] as const;
type Scenario = (typeof states)[number];
export default function App() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  if (!loaded || error)
    return (
      <View style={styles.loading}>
        <Text>{error ? 'Unable to load QA fonts.' : 'Loading QA fonts…'}</Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <FloatingTabBarProvider>
        <QaHost />
      </FloatingTabBarProvider>
    </SafeAreaProvider>
  );
}
function QaHost() {
  const [page, setPage] = useState<Page | null>(null),
    [scenario, setScenario] = useState<Scenario>('Ready'),
    [reset, setReset] = useState(0);
  const [notice, setNotice] = useState(
    'Sample data only. No account, API or protection connected.',
  );
  const metrics = useFloatingTabBarMetrics(),
    insets = useSafeAreaInsets();
  const action = () => setNotice('UI intent only. Nothing saved, connected, earned or installed.');
  return (
    <View testID="RN10_NATIVE_QA_ONLY" style={styles.app}>
      {page ? (
        <QaScreen
          key={`${page}:${scenario}:${reset}`}
          page={page}
          scenario={scenario}
          navigate={setPage}
          action={action}
        />
      ) : (
        <Screen
          title="Disconnect UI QA"
          subtitle="Developer-only source examples. No account or native service connected.">
          {screens.map((name) => (
            <Button
              key={name}
              label={name}
              variant="secondary"
              onPress={() => {
                setPage(name);
                setNotice('Sample data only. No account, API or protection connected.');
              }}
            />
          ))}
        </Screen>
      )}
      <View
        onLayout={(e) => metrics?.reportHeight(Math.ceil(e.nativeEvent.layout.height))}
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Text style={styles.qaLabel}>
          UI QA SAMPLE · {page ?? 'Screens'} · {scenario}
        </Text>
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {notice}
        </Text>
        <View style={styles.actions}>
          <Button
            label="Screens"
            variant="secondary"
            onPress={() => setPage(null)}
            style={styles.action}
          />
          <Button
            label="State"
            accessibilityLabel={`Change QA state, currently ${scenario}`}
            variant="secondary"
            onPress={() => setScenario(states[(states.indexOf(scenario) + 1) % states.length])}
            style={styles.action}
          />
          <Button
            label="Reset"
            variant="secondary"
            onPress={() => setReset((value) => value + 1)}
            style={styles.action}
          />
        </View>
      </View>
    </View>
  );
}
function QaScreen({
  page,
  scenario,
  navigate,
  action,
}: {
  page: Page;
  scenario: Scenario;
  navigate: (page: Page | null) => void;
  action: () => void;
}) {
  const [quest, setQuest] = useState<QuestDraft>({
    ...emptyQuestDraft,
    title: 'Evening Gym Session',
    activity: 'Gym workout',
    start: '18:00',
    end: '20:00',
    repeat: 'weekly',
    days: [0, 2, 4],
  });
  const [activity, setActivity] = useState<ActivityDraft>({
    selected: ['Gym', 'Reading'],
    customSelected: true,
    custom: 'Studying',
  });
  const [age, setAge] = useState<number | null>(24),
    [gender, setGender] = useState<string | null>('Men');
  const [selected, setSelected] = useState<readonly string[]>(['Instagram', 'TikTok', 'YouTube']);
  const [days, setDays] = useState<readonly number[]>([0, 1, 2, 3, 4]);
  const [hours, setHours] = useState<HoursDraft>({ start: '09:00', end: '22:00', nextDay: false });
  const [sessions, setSessions] = useState<SessionsDraft>({ count: 2, minutes: 15 });
  const [profile, setProfile] = useState<ProfileNameDraft>({
    kind: 'text',
    value: 'Jordan Rivera',
  });
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const state: EditorState =
    scenario === 'Busy'
      ? 'saving'
      : scenario === 'Error'
        ? 'error'
        : scenario === 'Unavailable' || scenario === 'Loading'
          ? 'unavailable'
          : 'ready';
  const actions = { dirty: true, state, onSave: action, onDiscard: action };
  const readState =
    scenario === 'Loading' ? 'loading' : scenario === 'Error' ? 'error' : 'unavailable';
  const ready = ['Ready', 'Busy', 'Long text'].includes(scenario);
  const back = () => navigate(null);
  const onEdit: Partial<Record<SettingsField, () => void>> = {
    age: () => navigate('Age'),
    gender: () => navigate(page === 'Gender' ? 'Settings' : 'Gender'),
    apps: () => navigate('Apps'),
    activities: () => navigate('Activities'),
    days: () => navigate(page === 'Days' ? 'Settings' : 'Days'),
    hours: () => navigate(page === 'Hours' ? 'Settings' : 'Hours'),
    sessions: () => navigate(page === 'Sessions' ? 'Settings' : 'Sessions'),
  };
  if (page === 'Home') {
    const model: HomeModel = ready
      ? scenario === 'Long text'
        ? {
            ...homeExample,
            recommendation: {
              state: 'ready',
              value: {
                id: 'RN10_NATIVE_LONG_ONLY',
                title: 'A deliberately long localized recommendation title that must wrap',
                description:
                  'A deliberately long description for font scaling and narrow-screen testing. No actual activity or phone usage is inferred.',
                rewardCredits: null,
                restrictionNotice: null,
              },
            },
          }
        : homeExample
      : {
          ...unavailableHome,
          dino: { state: readState },
          credits: { state: readState },
          weekly: { state: readState },
          streak: { state: readState },
          recommendation: { state: readState },
        };
    return (
      <HomeScreen
        model={model}
        onFeed={action}
        onOpenHistory={() => navigate('History')}
        onAcceptRecommendation={action}
        onSkipRecommendation={action}
        feeding={scenario === 'Busy'}
        recommendationBusy={scenario === 'Busy'}
      />
    );
  }
  if (page === 'Quests')
    return (
      <QuestsScreen
        model={ready ? questsExample : { ...unavailableQuests, suggestions: { state: readState } }}
        onCreate={() => navigate('Custom quest')}
        onPersonalize={() => navigate('Personalize')}
        onAccept={action}
        onRetry={action}
        busy={scenario === 'Busy'}
      />
    );
  if (page === 'History')
    return (
      <HistoryScreen
        model={
          ready
            ? historyExample
            : {
                ...unavailableHistory,
                turnOffs: { state: readState },
                screenTime: { state: readState },
                savedHours: { state: readState },
              }
        }
        onNext={() => navigate('Progress')}
        onRetry={action}
      />
    );
  if (page === 'Progress' || page === 'Time reclaimed')
    return (
      <HistoryDetails
        reading={
          ready && period === 'week'
            ? { state: 'ready', data: historyDetailExample }
            : { state: readState }
        }
        period={period}
        onPeriodChange={setPeriod}
        reclaimed={page === 'Time reclaimed'}
        onBack={() => navigate(page === 'Progress' ? 'History' : 'Progress')}
        onNext={() => navigate('Time reclaimed')}
        onRetry={action}
      />
    );
  if (page === 'Personalize' || page === 'Custom quest' || page === 'Edit quest')
    return (
      <QuestEditor
        mode={page === 'Personalize' ? 'personalize' : page === 'Edit quest' ? 'edit' : 'create'}
        draft={quest}
        onChange={setQuest}
        onBack={back}
        onDiscard={() => setQuest(emptyQuestDraft)}
        onSave={action}
        onCancelQuest={action}
        state={state}
        dirty
        interestLabel="GYM"
        restrictionNotice="Example only: selected apps locked during this quest."
      />
    );
  if (page === 'Age')
    return (
      <AgeEditor
        value={age}
        options={[21, 22, 23, 24, 25, 26, 27]}
        onChange={setAge}
        onBack={back}
        {...actions}
      />
    );
  const activities: SelectionOption[] = [
    'Gym',
    'Reading',
    'Arts and crafts',
    'Walking',
    'Music',
    'Cooking',
  ].map((label, i) => ({
    id: label,
    label:
      scenario === 'Long text'
        ? `${label}: a deliberately long localized label for testing`
        : label,
    icon: [
      preferenceAssets.gym,
      preferenceAssets.reading,
      preferenceAssets.arts,
      preferenceAssets.walking,
      preferenceAssets.music,
      preferenceAssets.cooking,
    ][i],
  }));
  if (page === 'Activities')
    return (
      <ActivitiesEditor
        draft={activity}
        options={activities}
        onChange={setActivity}
        onBack={back}
        {...actions}
      />
    );
  if (page === 'Apps' || page === 'Native selection') {
    const options: SelectionOption[] = [
      'Instagram',
      'TikTok',
      'YouTube',
      'Snapchat',
      'WhatsApp',
      'Spotify',
    ].map((label, i) => ({
      id: label,
      label,
      icon: [
        preferenceAssets.instagram,
        preferenceAssets.tiktok,
        preferenceAssets.youtube,
        preferenceAssets.snapchat,
        preferenceAssets.whatsapp,
        preferenceAssets.spotify,
      ][i],
      background: ['#CF3489', '#151515', '#F12B31', '#F7E300', '#23B963', '#181818'][i],
    }));
    return (
      <AppsEditor
        selection={
          page === 'Native selection'
            ? { kind: 'native', summary: null }
            : {
                kind: 'catalog',
                options,
                selected,
                onChange: setSelected,
                sourceLabel: 'Source example list · not installed apps',
              }
        }
        onBack={back}
        {...actions}
      />
    );
  }
  let inline: React.ReactNode;
  if (page === 'Gender')
    inline = (
      <GenderEditor
        value={gender}
        options={['Men', 'Women', 'Other'].map((label) => ({ id: label, label }))}
        onChange={setGender}
        {...actions}
      />
    );
  if (page === 'Days') inline = <DaysEditor days={days} onChange={setDays} {...actions} />;
  if (page === 'Hours') inline = <HoursEditor draft={hours} onChange={setHours} {...actions} />;
  if (page === 'Sessions')
    inline = (
      <SessionsEditor
        draft={sessions}
        onChange={setSessions}
        bounds={{ count: { min: 1, max: 10, step: 1 }, minutes: { min: 5, max: 120, step: 5 } }}
        {...actions}
      />
    );
  if (page === 'Settings' || inline)
    return (
      <SettingsScreen
        model={ready ? settingsExample : unavailableSettings}
        onEdit={onEdit}
        inlineEditor={
          inline
            ? {
                field: (
                  { Gender: 'gender', Days: 'days', Hours: 'hours', Sessions: 'sessions' } as const
                )[page as 'Gender'],
                content: inline,
              }
            : undefined
        }
        onRetry={action}
      />
    );
  if (page === 'Profile')
    return (
      <Screen title="Profile editor">
        <AccountHeader identity={settingsExample.account!.identity} displayName="Jordan Rivera" />
        <ProfileForm
          draft={profile}
          onDraftChange={setProfile}
          dirty
          state={{ kind: state }}
          onSave={action}
          onDiscard={() => setProfile({ kind: 'text', value: 'Jordan Rivera' })}
        />
      </Screen>
    );
  return <AssetInventory />;
}
function AssetInventory() {
  const assets: [string, DesignAsset][] = [];
  for (const [family, values] of Object.entries({
    home: homeAssets,
    quest: questAssets,
    questeditor: questeditorAssets,
    preference: preferenceAssets,
    settings: settingsAssets,
    history: historyAssets,
    historydetail: historydetailAssets,
    planeditor: planeditorAssets,
  }))
    for (const [name, asset] of Object.entries(values)) assets.push([`${family}/${name}`, asset]);
  for (const [name, source] of Object.entries(homeDinoAssets))
    assets.push([`Dino/${name}`, { source, width: 110, height: 110 }]);
  for (const [name, asset] of Object.entries(navigationAssets))
    for (const variant of ['active', 'inactive'] as const)
      assets.push([
        `${name}/${variant}`,
        { source: asset[variant], width: asset.width, height: asset.height },
      ]);
  return (
    <Screen
      title="Original assets"
      subtitle="Native rendering inspection. Original dimensions; no inferred score or device capability.">
      {assets.map(([name, asset]) => (
        <View key={name} style={styles.asset}>
          <Text style={styles.assetLabel}>
            {name} · {asset.width}×{asset.height}
          </Text>
          <ScrollView
            horizontal
            contentContainerStyle={{
              minWidth: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: asset.height,
            }}>
            <DesignArtwork asset={asset} />
          </ScrollView>
        </View>
      ))}
    </Screen>
  );
}
const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.warmCanvas },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmCanvas,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    gap: 4,
    backgroundColor: '#FFFAF2',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  qaLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.warmForeground },
  notice: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, paddingHorizontal: 8, minHeight: 44 },
  asset: {
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 8,
    borderRadius: 12,
  },
  assetLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginBottom: 8 },
});
