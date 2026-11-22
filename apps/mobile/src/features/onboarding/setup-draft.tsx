import planAsset0 from '../../../assets/onboarding/hobby-gym.svg';
import planAsset1 from '../../../assets/onboarding/hobby-book.svg';
import planAsset2 from '../../../assets/onboarding/hobby-arts.svg';
import planAsset3 from '../../../assets/onboarding/hobby-walk.svg';
import planAsset4 from '../../../assets/onboarding/hobby-music.svg';
import planAsset5 from '../../../assets/onboarding/hobby-cooking.svg';
import planAsset6 from '../../../assets/icons/setup/calendar.svg';
import planAsset7 from '../../../assets/icons/setup/clock.svg';
import planAsset8 from '../../../assets/icons/setup/timer.svg';
import planAsset9 from '../../../assets/icons/setup/back.svg';
import planAsset10 from '../../../assets/onboarding/arrow-left.svg';
import planAsset11 from '../../../assets/onboarding/check.svg';
import planAsset12 from '../../../assets/onboarding/plus.svg';
import planAsset13 from '../../../assets/icons/setup/chevron.svg';
import { completeSchedule } from '@/features/plans/weekly-schedule';
import { FigmaManualPlan } from './figma-manual-plan';
import { PlanLoadingScreen, PlanSuggestionScreen } from './figma-plan-screens';
import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import { decodeSavedSelection } from '@/infrastructure/native/selection-editor';
import type { PlanDraft } from '@disconnect/contracts';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { formatTime, toggleItem, weekdays } from '@/features/editors/draft-utils';
import { planDraftInput, planSummary, type PlanField } from '@/features/plans/plan-draft-model';
import { ACTIVITY_LABELS, activityDraft, activityIds, activitySummary } from '@/features/preferences/activity-model';

import type { OnboardingProgress } from './progress-repository';
import { setupActivities, setupPlan, starterPlan } from './setup-model';

const icons = {
  gym: planAsset0,
  reading: planAsset1,
  arts_and_crafts: planAsset2,
  walking: planAsset3,
  music: planAsset4,
  cooking: planAsset5,
};
const planIcons = {
  days: planAsset6,
  hours: planAsset7,
  sessions: planAsset8,
};
const fields = { days: 'Active Days', hours: 'Active Hours', sessions: 'App Sessions' } as const;

function Art({ source, size = 20 }: { source: import('@/components/ui/design-artwork').DesignAsset['source']; size?: number }) {
  return <DesignArtwork asset={{ source, width: size, height: size }} />;
}

export function SetupDraft({
  progress, busy, failed, onSave, onLeave, onDiscard, reviewActions, suggestion,
}: {
  progress: OnboardingProgress;
  busy: boolean;
  failed: boolean;
  onSave: (progress: OnboardingProgress) => void;
  onLeave: () => void;
  onDiscard: () => void;
  reviewActions?: ReactNode;
  suggestion?: { planDraft: PlanDraft; apps: import('./figma-plan-screens').PlanAppCard[]; description: string; estimate: { label: string; detail: string } };
}) {
  const [activities, setActivities] = useState(() => activityDraft(progress.activities ?? null));
  const [input, setInput] = useState(() =>
    progress.planDraft === undefined
      ? starterPlan(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '')
      : planDraftInput(progress.planDraft),
  );
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string>();
  const iosDevice = useIOSSelectionDevice();
  const native = useNativeOwner();
  const binding = iosDevice ? { owner: iosDevice.owner, port: iosDevice.selection, read: iosDevice.readSelection } : native ? {
    owner: native.owner, port: native.port,
    read: async () => decodeSavedSelection(await native.port.selectionRead(native.owner), native.owner),
  } : null;
  const [choosingApps, setChoosingApps] = useState(false);
  const [selection, setSelection] = useState<{ owner: string; count: number }>();
  const readSelection = iosDevice?.readSelection, nativePort = native?.port, nativeOwner = native?.owner;
  useEffect(() => {
    let active = true;
    const owner = iosDevice?.owner ?? nativeOwner;
    if (owner) void (readSelection ? readSelection() : nativePort ? Promise.resolve(nativePort.selectionRead(owner)).then(raw => decodeSavedSelection(raw, owner)) : Promise.reject())
      .then(value => { if (active) setSelection({ owner, count: value.selectedAppCount }); }).catch(() => undefined);
    return () => { active = false; };
  }, [readSelection, nativeOwner, nativePort, iosDevice?.owner, choosingApps]);
  const appCount = binding && selection?.owner === binding.owner ? selection.count : 0;
  const appSummary = appCount ? `${appCount} ${appCount === 1 ? 'app' : 'apps'} saved on this device` : 'Choose apps in device setup';
  const hobbyLabels = progress.activities ? activitySummary(progress.activities)?.replaceAll('Custom: ', '') ?? '' : '';
  const step = progress.step;
  const preferences = step === 'preferences';
  const review = step === 'review';
  const title = preferences
    ? 'What do you want to do instead?'
    : review ? 'Review your draft' : manual ? 'Set up on your own' : 'We created a plan for you';
  const draft = setupPlan(input);
  const visiblePlan = review ? progress.planDraft ?? null : draft.value ?? null;

  function nextFromActivities() {
    const result = setupActivities(activities.selected, activities.custom !== '' ? [activities.custom] : []);
    setError(result.error);
    if (result.value) onSave({ ...progress, step: 'plan', activities: result.value });
  }
  function nextFromPlan() {
    setError(draft.error);
    if (draft.error === undefined) onSave({ ...progress, step: 'review', planDraft: draft.value });
  }
  function back() {
    setError(undefined);
    if (manual) setManual(false);
    else if (preferences) onLeave();
    else onSave({ ...progress, step: review ? 'plan' : 'preferences' });
  }

  if (step === 'plan') {
    if (choosingApps && binding) return <NativeAppsEditor owner={binding.owner} port={binding.port} onBack={() => setChoosingApps(false)} />;
    if (manual) return <FigmaManualPlan input={input} onChange={setInput} onSave={nextFromPlan} onBack={() => setManual(false)}
      busy={busy} error={error ?? (failed ? 'Setup could not be saved. Try again.' : undefined)} appSummary={appSummary}
      onChooseApps={binding ? () => setChoosingApps(true) : undefined} />;
    if (busy) return <PlanLoadingScreen busy apps={appCount ? appSummary : ''} hobbies={hobbyLabels} onSkip={onLeave} />;
    const count = visiblePlan?.session_count, minutes = visiblePlan?.session_minutes;
    const weeklyMinutes = count != null && minutes != null ? count * minutes * (visiblePlan?.weekdays.length ?? 0) : null;
    const weeklyLabel = weeklyMinutes === null ? 'DRAFT' : `${Math.floor(weeklyMinutes / 60)}h ${weeklyMinutes % 60}m`;
    if (suggestion) return <PlanSuggestionScreen {...suggestion} onAccept={() => {
      try {
        completeSchedule(suggestion.planDraft);
        setError(undefined);
        onSave({ ...progress, step: 'review', planDraft: suggestion.planDraft });
      } catch { setError('The suggested schedule needs review. Set up on your own.'); }
    }}
      onManual={() => { setError(undefined); setManual(true); }} onSkip={onLeave} busy={busy}
      error={error ?? (failed ? 'Setup could not be saved. Try again.' : undefined)} />;
    return <PlanSuggestionScreen description={`A starting schedule for your selected apps. Make room for ${hobbyLabels || 'what you love'}.`}
      apps={[{ name: appCount ? 'Your selected apps' : 'Choose your apps', minutes: appCount ? minutes ?? null : null, caption: appCount && minutes != null ? `${minutes} min per session` : 'Choose apps in device setup',
        detail: count != null && minutes != null ? `${count} sessions per app each day, ${minutes} minutes each. App selection and protection are reviewed separately.` : 'Set your days, hours and sessions before applying protection.' }]}
      estimate={{ label: weeklyLabel, detail: 'Planned weekly access per selected app across your chosen days. This is a draft budget, not measured time saved.' }}
      onAccept={nextFromPlan} onManual={() => { setError(undefined); setManual(true); }} onSkip={onLeave}
      error={error ?? (failed ? 'Setup could not be saved. Try again.' : undefined)} />;
  }
  return (
    <Screen dark title={title} contentStyle={styles.content} header={
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" disabled={busy || !!progress.settingsAttempt} onPress={back} style={styles.back}>
          {manual ? <Art source={planAsset9} size={16} />
            : <Art source={planAsset10} size={18} />}
          <Text style={styles.body}>{preferences ? 'Back to Home' : 'Back'}</Text>
        </Pressable>
        {!manual && (
          <View style={styles.progress} accessible accessibilityLabel={`Step ${preferences ? 1 : review ? 3 : 2} of 3`}>
            {[1, 2, 3].map(n => <View key={n} style={[styles.segment, n <= (preferences ? 1 : review ? 3 : 2) && styles.selected]} />)}
          </View>
        )}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {!preferences && <Text style={styles.body}>{review
          ? 'Your choices are saved on this device.'
          : 'Choose the days, hours, and time you want to set aside per app.'}</Text>}
      </View>
    }>
      {preferences ? (
        <>
          <View style={styles.grid}>
            {activityIds.map(id => {
              const checked = activities.selected.includes(id);
              return (
                <Pressable key={id} accessibilityRole="checkbox" accessibilityState={{ checked, disabled: busy }}
                  disabled={busy} style={[styles.hobby, checked && styles.checked]}
                  onPress={() => setActivities({ ...activities, selected: toggleItem(activities.selected, id) })}>
                  <View style={styles.hobbyIcon}><Art source={icons[id]} /></View>
                  <Text style={styles.label}>{ACTIVITY_LABELS[id]}</Text>
                  {checked && <View style={styles.check}><Art source={planAsset11} size={12} /></View>}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.custom}>
            <Art source={planAsset12} size={18} />
            <TextInput accessibilityLabel="Custom activity" placeholder="e.g. gardening, drawing, yoga"
              placeholderTextColor={colors.darkMuted} style={styles.customInput} value={activities.custom}
              editable={!busy} onChangeText={custom => setActivities({ ...activities, custom })} />
          </View>
          <View style={styles.footer}>
            <Text style={[styles.body, styles.footerText]}>These are starting points. You can change them later.</Text>
            <Button label="Next →" busy={busy} onPress={nextFromActivities} />
          </View>
        </>
      ) : (
        <>
          {review && <Text style={styles.body}>{progress.activities ? activitySummary(progress.activities) ?? 'No activities chosen' : 'No activities chosen'}</Text>}
          <PlanSummary plan={visiblePlan} />
          {review && reviewActions}
          {review && <Button label="Continue to Home" variant="secondary" disabled={busy} onPress={onLeave} />}
        </>
      )}
      {review && !progress.settingsAttempt && <Button label="Discard setup progress" variant="secondary" disabled={busy} onPress={onDiscard} />}
      {(error || failed) && <Text accessibilityRole="alert" style={styles.error}>{error ?? 'Setup could not be saved. Try again.'}</Text>}
    </Screen>
  );
}

function summary(field: PlanField, plan: PlanDraft | null): string {
  if (plan && field === 'days' && plan.weekdays.join(',') === '0,1,2,3,4') return 'Mon – Fri';
  if (plan && field === 'days' && plan.weekdays.length) return plan.weekdays.map(day => weekdays[day]).join(', ');
  if (plan && field === 'sessions' && plan.session_count !== null && plan.session_minutes !== null) {
    return `${plan.session_count} per day · ${plan.session_minutes} min each per app`;
  }
  if (plan && field === 'hours' && plan.hours?.start_local && plan.hours.end_local) {
    const { start_local, end_local, next_day } = plan.hours;
    return `${formatTime(start_local)} – ${formatTime(end_local)}${next_day ? ' next day' : ''} · ${plan.timezone_id ?? 'timezone not set'}`;
  }
  return planSummary(field, plan).replace(/^Draft: /, '');
}

export function PlanSummary({ plan, onEdit }: { plan: PlanDraft | null; onEdit?: (field: PlanField) => void }) {
  return (
    <View style={styles.cards}>
      {(Object.keys(fields) as PlanField[]).map(field => {
        const contents = <>
          <View style={styles.icon}><Art source={planIcons[field]} size={18} /></View>
          <View style={styles.detail}>
            <Text style={styles.label}>{fields[field]}</Text>
            <Text style={styles.body}>{summary(field, plan)}</Text>
          </View>
          {onEdit && <Art source={planAsset13} size={16} />}
        </>;
        return onEdit ? (
          <Pressable key={field} accessibilityRole="button" accessibilityLabel={fields[field]} style={styles.card} onPress={() => onEdit(field)}>
            {contents}
          </Pressable>
        ) : <View key={field} style={styles.card}>{contents}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 16 },
  heading: { gap: 12 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44 },
  footer: { marginTop: 'auto', paddingTop: 13, borderTopWidth: 1, borderColor: '#333333', gap: 14 },
  footerText: { textAlign: 'center' },
  hobbyIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333333', alignItems: 'center', justifyContent: 'center' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 10,
    backgroundColor: '#222F25', borderWidth: 1, borderColor: '#2A5134' },
  progress: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 4, backgroundColor: '#363636', borderRadius: 2 },
  selected: { backgroundColor: colors.action },
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, color: colors.white },
  body: { fontFamily: fonts.regular, color: colors.darkMuted, fontSize: 14, lineHeight: 19 },
  label: { fontFamily: fonts.bold, color: colors.white, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  hobby: { width: '47.5%', minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, borderWidth: 1, borderColor: '#393939', backgroundColor: colors.darkCard },
  checked: { borderWidth: 2, borderColor: colors.action },
  check: { position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.action },
  custom: { flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: '#393939' },
  customInput: { flex: 1, minHeight: 50, fontFamily: fonts.regular, color: colors.white, fontSize: 14 },
  cards: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, padding: 15,
    borderRadius: 14, borderWidth: 1, borderColor: '#393939', backgroundColor: colors.darkCard },
  icon: { width: 36, height: 36, backgroundColor: '#333333', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detail: { flex: 1, gap: 3 },
  error: { color: colors.darkError, fontFamily: fonts.medium },
});
