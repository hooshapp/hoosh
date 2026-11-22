import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Choice, weekdays, toggleItem } from '@/features/editors/editor-controls';
import { completeSchedule } from '@/features/plans/weekly-schedule';
import { WeeklyPlanCard } from '@/features/plans/weekly-plan-card';
import { decodeInterventionStatus } from '@/infrastructure/native/intervention-coordinator';

/** Isolated browser review; never imported by the normal app or a release build. */
export function C04BrowserReview() {
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [start, setStart] = useState('09:00'), [end, setEnd] = useState('17:00');
  const [overnight, setOvernight] = useState(false), [zone, setZone] = useState('America/New_York');
  const [count, setCount] = useState('3'), [minutes, setMinutes] = useState('5');
  const [reviewed, setReviewed] = useState<string>();
  let validated: ReturnType<typeof completeSchedule> | undefined;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    validated = completeSchedule({ weekdays: days, hours: { start_local: start, end_local: end, next_day: overnight },
      timezone_id: zone, session_count: /^\d+$/.test(count) ? Number(count) : null,
      session_minutes: /^\d+$/.test(minutes) ? Number(minutes) : null });
  } catch { /* Incomplete and invalid drafts remain editable. */ }
  const native = decodeInterventionStatus({ schemaVersion: 4, platform: 'ios', phase: 'gated', enabled: false,
    authorization: 'authorized', activationAvailable: false, installedRevision: null, selectionRevision: null,
    selectedAppCount: 0, reasonCount: 0, pendingRequestID: null });
  const edit = <T,>(setter: (value: T) => void, value: T) => { setter(value); setReviewed(undefined); };
  return <main style={{ maxWidth: 440, margin: '0 auto', height: '100dvh', display: 'flex', padding: 0 }}>
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
      <Screen title="Plan review" subtitle="C04 browser check" bottomClearance={0}>
        <Text>Browser review only. This page uses the app’s validation and status components. It does not save account data, choose phone apps, or enable Screen Time.</Text>
        <WeeklyPlanCard read={{ phase: 'ready', selectionRevision: 0, selectedAppCount: 0,
          installation: { observedAt: 0, native, spec: null, enabled: false, otherInstallation: false, windows: [] } }}
          pending={false} busy={false} draftChanged={false} appsChanged={false} />
        <Text accessibilityRole="header">Weekly start days</Text>
        <View style={{ gap: 6 }}>{weekdays.map((day, i) => <Choice key={day} label={day} checked={days.includes(i)}
          onPress={() => edit(setDays, toggleItem(days, i))} />)}</View>
        <Field label="Start time (HH:mm)" value={start} onChangeText={value => edit(setStart, value)} />
        <Field label="End time (HH:mm)" value={end} onChangeText={value => edit(setEnd, value)} />
        <Choice label="Ends the next day" checked={overnight} onPress={() => edit(setOvernight, !overnight)} />
        <Field label="Saved time zone" value={zone} autoCapitalize="none" onChangeText={value => edit(setZone, value)} />
        <Field label="Sessions per app per day" keyboardType="number-pad" value={count} onChangeText={value => edit(setCount, value)} />
        <Field label="Minutes per session" keyboardType="number-pad" value={minutes} onChangeText={value => edit(setMinutes, value)} />
        {!validated && <Text accessibilityRole="alert">Choose days, valid hours and time zone, 1–1000 sessions, and 1–1440 minutes. Overnight must end earlier than it starts.</Text>}
        <Button label="Review plan" disabled={!validated} onPress={() => setReviewed(JSON.stringify(validated, null, 2))} />
        {reviewed && <><Text accessibilityLiveRegion="polite">Plan validated for review. Nothing has been installed.</Text><Text selectable>{reviewed}</Text></>}
        <Button label="Apply on iPhone — testing pending" disabled onPress={() => undefined} />
        <Text>Native weekly/quest recurrence, reason-scoped Stop, retries and deadlines are checked separately by automated Swift tests. Phone permission prompts and actual blocking still need an iPhone.</Text>
      </Screen>
    </SafeAreaProvider>
  </main>;
}
