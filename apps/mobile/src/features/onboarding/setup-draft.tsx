import type { PlanDraft } from '@disconnect/contracts';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { formatTime, toggleItem, weekdays } from '@/features/editors/draft-utils';
import { planDraftInput, planSummary, type PlanField } from '@/features/plans/plan-draft-model';
import { DaysEditor, HoursEditor, SessionsEditor } from '@/features/plans/plan-editors';
import { ACTIVITY_LABELS, activityDraft, activityIds, activitySummary } from '@/features/preferences/activity-model';

import type { OnboardingProgress } from './progress-repository';
import { setupActivities, setupPlan, starterPlan } from './setup-model';

const icons = {
  gym: require('../../../assets/onboarding/hobby-gym.svg'),
  reading: require('../../../assets/onboarding/hobby-book.svg'),
  arts_and_crafts: require('../../../assets/onboarding/hobby-arts.svg'),
  walking: require('../../../assets/onboarding/hobby-walk.svg'),
  music: require('../../../assets/onboarding/hobby-music.svg'),
  cooking: require('../../../assets/onboarding/hobby-cooking.svg'),
};
const planIcons = {
  days: require('../../../assets/icons/setup/calendar.svg'),
  hours: require('../../../assets/icons/setup/clock.svg'),
  sessions: require('../../../assets/icons/setup/timer.svg'),
};
const fields = { days: 'Active Days', hours: 'Active Hours', sessions: 'App Sessions' } as const;
const bounds = { count: { min: 1, max: 1000, step: 1 }, minutes: { min: 1, max: 1440, step: 1 } };

function Art({ source, size = 20 }: { source: number; size?: number }) {
  return <DesignArtwork asset={{ source, width: size, height: size }} />;
}

export function SetupDraft({
  progress, busy, failed, onSave, onLeave, onDiscard,
}: {
  progress: OnboardingProgress;
  busy: boolean;
  failed: boolean;
  onSave: (progress: OnboardingProgress) => void;
  onLeave: () => void;
  onDiscard: () => void;
}) {
  const [activities, setActivities] = useState(() => activityDraft(progress.activities ?? null));
  const [input, setInput] = useState(() =>
    progress.planDraft === undefined
      ? starterPlan(Intl.DateTimeFormat().resolvedOptions().timeZone ?? '')
      : planDraftInput(progress.planDraft),
  );
  const [manual, setManual] = useState(false);
  const [field, setField] = useState<PlanField | null>(null);
  const [error, setError] = useState<string>();
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
    if (field) setField(null);
    else if (manual) setManual(false);
    else if (preferences) onLeave();
    else onSave({ ...progress, step: review ? 'plan' : 'preferences' });
  }

  return (
    <Screen dark title={title} contentStyle={styles.content} header={
      <View style={styles.heading}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={back} style={styles.back}>
          {manual ? <Art source={require('../../../assets/icons/setup/back.svg')} size={16} />
            : <Art source={require('../../../assets/onboarding/arrow-left.svg')} size={18} />}
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
                  {checked && <View style={styles.check}><Art source={require('../../../assets/onboarding/check.svg')} size={12} /></View>}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.custom}>
            <Art source={require('../../../assets/onboarding/plus.svg')} size={18} />
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
          {field === null && <PlanSummary plan={visiblePlan} onEdit={manual && !review ? setField : undefined} />}
          {field === 'days' && <DaysEditor draftOnly dirty saveLabel="Review days" days={input.weekdays}
            onChange={weekdays => setInput({ ...input, weekdays })} onSave={() => setField(null)} />}
          {field === 'hours' && <>
            <Field label="Timezone (IANA)" autoCapitalize="none" autoCorrect={false} value={input.timezone}
              onChangeText={timezone => setInput({ ...input, timezone })} />
            <HoursEditor draftOnly dirty saveLabel="Review hours"
              draft={input.hours ?? { start: '', end: '', nextDay: false }}
              onChange={hours => setInput({ ...input, hours })} onSave={() => setField(null)} />
          </>}
          {field === 'sessions' && <SessionsEditor draftOnly dirty saveLabel="Review sessions" bounds={bounds}
            draft={input.sessions} onChange={sessions => setInput({ ...input, sessions })} onSave={() => setField(null)} />}
          {!review && field === null && draft.error && error !== draft.error &&
            <Text accessibilityRole="alert" style={styles.error}>{draft.error}</Text>}
          {!review && field === null && !draft.error && (!visiblePlan?.timezone_id || !visiblePlan.weekdays.length ||
            !visiblePlan.hours?.start_local || !visiblePlan.hours.end_local ||
            visiblePlan.session_count === null || visiblePlan.session_minutes === null) &&
            <Text style={styles.body}>Fill in the missing schedule details before applying protection.</Text>}
          {field === null && manual && (
            <View style={styles.info}>
              <Art source={require('../../../assets/icons/setup/info.svg')} size={14} />
              <Text style={[styles.body, styles.detail]}>These are your planned times to use distracting apps.</Text>
            </View>
          )}
          {field === null && (
            <View style={styles.card}>
              <View style={styles.icon}><Art source={require('../../../assets/icons/setup/apps.svg')} size={18} /></View>
              <View style={styles.detail}>
                <Text style={styles.label}>Select Apps</Text>
                <Text style={styles.body}>App selection is unavailable in this setup step.</Text>
              </View>
            </View>
          )}
          {!review && field === null && <>
            <Button label={manual ? 'Review my plan' : 'Go with suggestion'} busy={busy} onPress={nextFromPlan} />
            {!manual && <Button label="Set up on my own" variant="secondary" disabled={busy}
              onPress={() => { setError(undefined); setManual(true); }} />}
          </>}
          {review && <Button label="Continue to Home" variant="secondary" onPress={onLeave} />}
        </>
      )}
      {review && <Button label="Discard setup progress" variant="secondary" disabled={busy} onPress={onDiscard} />}
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
          {onEdit && <Art source={require('../../../assets/icons/setup/chevron.svg')} size={16} />}
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
