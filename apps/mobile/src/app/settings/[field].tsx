import { AgePreferenceScreen } from '@/features/settings/age-preference-screen';
import {
  DaysEditor,
  HoursEditor,
  SessionsEditor,
  type HoursDraft,
} from '@/features/plans/plan-editors';
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AgeEditor,
  ActivitiesEditor,
  AppsEditor,
  type ActivityDraft,
} from '@/features/preferences/preference-editors';
import { EditorPage } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { EmptyCard } from '@/components/ui/empty-card';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { ActivityPreferencesScreen } from '@/features/settings/activity-preferences-screen';
import { PlanDraftScreen } from '@/features/settings/plan-draft-screen';
import { isPlanField } from '@/features/plans/plan-draft-model';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import { useAccountWeeklyPlan, weeklyPort } from '@/features/plans/account-weekly-plan';
import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { activateAcceptedPlan } from '@/features/onboarding/activate-accepted-plan';
import { createWeeklyScheduleClient } from '@/features/plans/weekly-schedule';
export default function PreferenceDetail() {
  const { field } = useLocalSearchParams<{ field: string }>();
  const account = useOptionalAccountData();
  const native = useNativeOwner();
  const ios = useIOSSelectionDevice();
  const weekly = useAccountWeeklyPlan();
  if (field === 'age' && account?.scope) return <AgePreferenceScreen onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/settings'); }} />;
  if (field === 'apps' && native)
    return (
      <NativeAppsEditor
        owner={native.owner}
        generation={native.generation}
        port={native.port}
        onApply={async (selection, assertEditorCurrent) => {
          const scope = account?.scope;
          const port = weeklyPort(native);
          if (!scope || !port || !weekly) throw new Error('Device protection unavailable');
          const assertCurrent = () => {
            assertEditorCurrent();
            scope.assertCurrent();
            if (native.generation !== scope.account.sessionGeneration) throw new Error('Account changed');
          };
          assertCurrent();
          const client = createWeeklyScheduleClient(native.owner, port);
          let installation;
          try {
            installation = await client.read();
            assertCurrent();
            if (installation.otherInstallation) throw new Error('Device protection unavailable');
            if (installation.native.pendingRequestID && ios?.recover) {
              await ios.recover(installation.native.pendingRequestID);
              assertCurrent();
              installation = await client.read();
            }
          } finally { client.dispose(); }
          assertCurrent();
          if (installation.native.pendingRequestID) throw new Error('Device update pending');
          if (!installation.enabled) return false;
          await activateAcceptedPlan({ owner: native.owner, port, draft: installation.spec,
            selectionRevision: selection.baseRevision, assertCurrent, recoverPending: ios?.recover });
          await weekly.plan.refresh();
          return true;
        }}
        onBack={() => {
          void weekly?.plan.refresh();
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/settings');
        }}
      />
    );
  if (isPlanField(field) && account?.scope)
    return (
      <PlanDraftScreen
        key={field}
        field={field}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/settings');
        }}
      />
    );
  if (field === 'activities' && account?.scope)
    return (
      <ActivityPreferencesScreen
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/settings');
        }}
      />
    );
  return <UnavailableDetail field={field} />;
}
function UnavailableDetail({ field }: { field: string }) {
  const [age, setAge] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityDraft>({
    selected: [],
    customSelected: false,
    custom: '',
  });
  const [days, setDays] = useState<readonly number[]>([]);
  const [hours, setHours] = useState<HoursDraft>({
    start: '',
    end: '',
    nextDay: false,
  });
  const dirty =
    activities.customSelected ||
    activities.custom !== '' ||
    days.length > 0 ||
    Boolean(hours.start || hours.end);
  const guard = useRouteDraftGuard(dirty);
  const back = () =>
    guard.exit(() => {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/settings');
    });
  const editor =
    field === 'age' ? (
      <AgeEditor
        value={age}
        options={[]}
        onChange={setAge}
        onBack={back}
        dirty={false}
        state="unavailable"
      />
    ) : field === 'activities' ? (
      <ActivitiesEditor
        draft={activities}
        options={[]}
        onChange={setActivities}
        onBack={back}
        dirty={dirty}
        state="unavailable"
      />
    ) : field === 'apps' ? (
      <AppsEditor
        selection={{ kind: 'native', summary: null }}
        onBack={back}
        dirty={false}
        state="unavailable"
      />
    ) : ['days', 'hours', 'sessions'].includes(field) ? (
      <EditorPage
        title={
          field === 'days'
            ? 'Active Days'
            : field === 'hours'
              ? 'Active Hours'
              : 'App Sessions'
        }
        dirty={dirty}
        onBack={back}
      >
        {field === 'days' ? (
          <DaysEditor
            days={days}
            onChange={setDays}
            dirty={dirty}
            state="unavailable"
          />
        ) : field === 'hours' ? (
          <HoursEditor
            draft={hours}
            onChange={setHours}
            dirty={dirty}
            state="unavailable"
          />
        ) : (
          <SessionsEditor
            draft={{ count: null, minutes: null }}
            onChange={() => {}}
            dirty={false}
            state="unavailable"
          />
        )}
      </EditorPage>
    ) : (
      <EditorPage title="Settings" onBack={back}>
        <EmptyCard
          title="Setting unavailable"
          description="Return to Settings to choose an available option."
        />
      </EditorPage>
    );
  return (
    <View style={{ flex: 1 }}>
      {guard.confirmation}
      {editor}
    </View>
  );
}
