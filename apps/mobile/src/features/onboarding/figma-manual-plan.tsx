import planAsset0 from '../../../assets/onboarding/plan/current/manual-imgDisconnectSettingsIconActiveDays.svg';
import planAsset1 from '../../../assets/onboarding/plan/current/manual-imgDisconnectSettingsIconActiveHours.svg';
import planAsset2 from '../../../assets/onboarding/plan/current/manual-imgTimer.svg';
import planAsset3 from '../../../assets/onboarding/plan/current/manual-imgDisconnectSettingsIconDistractingApps.svg';
import planAsset4 from '../../../assets/onboarding/plan/current/manual-imgFrame1.svg';
import planAsset5 from '../../../assets/onboarding/plan/current/manual-imgInfo.svg';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { colors, fonts } from '@/design/tokens';
import { formatTime, parseTime, toggleItem, weekdays } from '@/features/editors/draft-utils';
import type { PlanDraftInput } from '@/features/plans/plan-draft-model';
import { TimeRangeControl, minutesTime } from '@/features/plans/time-range-control';
import { completeSchedule } from '@/features/plans/weekly-schedule';
import { setupPlan } from './setup-model';
import { PlanAction, PlanFrame } from './figma-plan-screens';

type Input = Exclude<PlanDraftInput, null>;
const icons = {
  days: planAsset0,
  hours: planAsset1,
  sessions: planAsset2,
  apps: planAsset3,
  chevron: planAsset4,
  info: planAsset5,
};
function Art({ name, size = 18 }: { name: keyof typeof icons; size?: number }) {
  return <DesignArtwork asset={{ source: icons[name], width: size, height: size }} />;
}
export function FigmaManualPlan({ input, onChange, onSave, onBack, onChooseApps, appSummary, busy, error }: {
  input: Input; onChange(value: Input): void; onSave(): void; onBack(): void; onChooseApps?: () => void;
  appSummary: string; busy: boolean; error?: string;
}) {
  const [editZone] = useState(() => { try { new Intl.DateTimeFormat('en', { timeZone: input.timezone }); return !input.timezone; } catch { return true; } });
  const [focusedTime, setFocusedTime] = useState<'start' | 'end' | null>(null);
  const [expanded, setExpanded] = useState<'days' | 'hours' | 'sessions' | 'apps' | null>(null);
  const [customCount] = useState(![1, 2, 3, 4].includes(input.sessions.count ?? 0));
  const [customMinutes] = useState(![5, 10, 15, 30].includes(input.sessions.minutes ?? 0));
  const result = setupPlan(input);
  let invalid = result.error;
  if (!invalid) { try { completeSchedule(result.value); } catch { invalid = 'Complete your days, hours, time zone and session values before saving.'; } }
  const toggle = (field: NonNullable<typeof expanded>) => setExpanded(old => old === field ? null : field);
  const hours = input.hours ?? { start: '', end: '', nextDay: false };
  const start = parseTime(hours.start), end = parseTime(hours.end);
  const days = input.weekdays.join(',') === '0,1,2,3,4' ? 'Mon – Fri' : input.weekdays.map(day => weekdays[day]?.slice(0, 3)).join(', ') || 'Choose days';
  const hoursLabel = start !== null && end !== null ? `${formatTime(hours.start)} – ${formatTime(hours.end)}${hours.nextDay ? ' next day' : ''}` : 'Choose hours';
  const sessionLabel = `${input.sessions.count ?? '—'} ${input.sessions.count === 1 ? 'session' : 'sessions'}/day · ${input.sessions.minutes ?? '—'} min each · ${input.budgetScope === 'all_selected_apps' ? 'shared across apps' : 'per app'}`;
  const patchHours = (change: Partial<typeof hours>) => onChange({ ...input, hours: { ...hours, ...change } });
  return <PlanFrame manual onBack={onBack} busy={busy}>
    <Text accessibilityRole="header" style={s.title}>Set up on your own</Text>
    <Text style={s.description}>Customize when and where do you want your personalized nudges to be</Text>
    <Text style={s.eyebrow}>MY PLAN</Text>
    <Section title="Active Days" detail={days} icon="days" expanded={expanded === 'days'} onPress={() => toggle('days')} disabled={busy}>
      <View style={s.choices}>{weekdays.map((day, i) => <Choice key={day} label={day.slice(0, 3)} name={day}
        selected={input.weekdays.includes(i)} checkbox disabled={busy} onPress={() => onChange({ ...input, weekdays: toggleItem(input.weekdays, i) })} />)}</View>
      <View style={s.choices}>{[['Weekdays', [0,1,2,3,4]], ['Every day', [0,1,2,3,4,5,6]], ['Weekends', [5,6]]].map(([label, values]) =>
        <Choice key={String(label)} label={String(label)} selected={input.weekdays.join(',') === (values as number[]).join(',')} disabled={busy}
          onPress={() => onChange({ ...input, weekdays: values as number[] })} />)}</View>
    </Section>
    <Section title="Active Hours" detail={hoursLabel} icon="hours" expanded={expanded === 'hours'} onPress={() => toggle('hours')} disabled={busy}>
      <Text style={s.helper}>Nudges are active only within this time range. Move either handle to adjust.</Text>
      <View style={s.timeRow}>{(['start', 'end'] as const).map(key => <View key={key} style={s.timeField}>
        <Text style={s.timeLabel}>{key === 'start' ? 'Start time' : 'End time'}</Text>
        <TextInput accessibilityLabel={key === 'start' ? 'Start time (HH:mm)' : 'End time (HH:mm)'} value={focusedTime === key || parseTime(hours[key]) === null ? hours[key] : formatTime(hours[key])} onFocus={() => setFocusedTime(key)} onBlur={() => setFocusedTime(null)} selectTextOnFocus
          placeholder="HH:mm" placeholderTextColor={colors.darkOnboardingMuted} editable={!busy} autoCapitalize="none"
          onChangeText={value => patchHours({ [key]: value })} style={s.timeValue} />
      </View>)}</View>
      {start !== null && end !== null && <>
        <TimeRangeControl appearance="onboarding" start={start} end={end} disabled={busy} onChange={(a,b) => patchHours({ start: minutesTime(a), end: minutesTime(b) })} />
        <View style={s.legend}><Text style={s.legendText}>12:00 AM</Text><Text style={s.legendText}>12:00 PM</Text><Text style={s.legendText}>11:59 PM</Text></View>
      </>}
      {(hours.nextDay || (start !== null && end !== null && end <= start)) && <Pressable accessibilityRole="checkbox" accessibilityLabel="Ends the next day" accessibilityState={{ checked: hours.nextDay, disabled: busy }}
        disabled={busy} onPress={() => patchHours({ nextDay: !hours.nextDay })} style={s.overnight}>
        <Text style={s.helper}>{hours.nextDay ? '☑' : '☐'} Ends the next day</Text>
      </Pressable>}
      {editZone && <><Text style={s.timeLabel}>Saved time zone</Text><TextInput accessibilityLabel="Saved time zone" value={input.timezone}
        autoCapitalize="none" editable={!busy} onChangeText={timezone => onChange({ ...input, timezone })} style={s.zone} /></>}
    </Section>
    <Section title="App Sessions" detail={sessionLabel} icon="sessions" expanded={expanded === 'sessions'} onPress={() => toggle('sessions')} disabled={busy}>
      <View style={s.optionRow}><Text style={s.optionLabel}>Sessions per day</Text><View style={s.choices}>{[1,2,3,4].map(value =>
        <Choice key={value} label={String(value)} name={`${value} sessions per day`} selected={input.sessions.count === value} disabled={busy}
          onPress={() => onChange({ ...input, sessions: { ...input.sessions, count: value } })} />)}</View></View>
      <View style={s.optionRow}><Text style={s.optionLabel}>Duration (min)</Text><View style={s.choices}>{[5,10,15,30].map(value =>
        <Choice key={value} label={String(value)} name={`${value} minutes per session`} selected={input.sessions.minutes === value} disabled={busy}
          onPress={() => onChange({ ...input, sessions: { ...input.sessions, minutes: value } })} />)}</View></View>
      {customCount && <TextInput accessibilityLabel="Custom sessions per day" editable={!busy} keyboardType="number-pad" value={input.sessions.count?.toString() ?? ''}
        onChangeText={value => onChange({ ...input, sessions: { ...input.sessions, count: /^\d+$/.test(value) ? Number(value) : null } })} style={s.zone} />}
      {customMinutes && <TextInput accessibilityLabel="Custom minutes per session" editable={!busy} keyboardType="number-pad" value={input.sessions.minutes?.toString() ?? ''}
        onChangeText={value => onChange({ ...input, sessions: { ...input.sessions, minutes: /^\d+$/.test(value) ? Number(value) : null } })} style={s.zone} />}
    </Section>
    <View style={s.info}><Art name="info" size={14} /><Text style={s.infoText}>These are your planned times to use distracting apps — not how long nudges run.</Text></View>
    <View style={s.apps}><Section title="Select Apps" detail={appSummary} icon="apps" expanded={expanded === 'apps'} disabled={busy} onPress={() => toggle('apps')}>
      <Text style={s.helper}>{onChooseApps ? 'Choose and save apps with the device picker. Saving this plan does not enable protection.' : 'App selection needs the iPhone or Android app. Your schedule can still be saved as a draft.'}</Text>
      {onChooseApps && <PlanAction label="Review device app selection" onPress={onChooseApps} disabled={busy} />}
    </Section></View>
    {(error || invalid) && <Text accessibilityRole="alert" style={s.error}>{error ?? invalid}</Text>}
    <View style={s.divider} /><PlanAction label="Save my plan" busy={busy} disabled={!!invalid} onPress={onSave} />
    <Text style={s.footer}>You can adjust these settings anytime from the app.</Text>
  </PlanFrame>;
}
function Section({ title, detail, icon, expanded, onPress, children, disabled }: {
  title: string; detail: string; icon: 'days' | 'hours' | 'sessions' | 'apps'; expanded: boolean;
  onPress(): void; children: ReactNode; disabled: boolean;
}) {
  return <View style={[s.section, expanded && s.expanded]}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded, disabled }} {...(Platform.OS === 'web' ? { 'aria-expanded': expanded } : {})} disabled={disabled} onPress={onPress} style={s.header}>
      <View style={s.icon}><Art name={icon} /></View><View style={s.copy}><Text style={s.label}>{title}</Text><Text style={s.summary}>{detail}</Text></View>
      <View style={expanded && s.rotate}><Art name="chevron" size={16} /></View>
    </Pressable>
    {expanded && <View style={s.panel}><View style={s.rule} />{children}</View>}
  </View>;
}
function Choice({ label, name = label, selected, onPress, disabled, checkbox = false }: {
  label: string; name?: string; selected: boolean; onPress(): void; disabled: boolean; checkbox?: boolean;
}) {
  return <Pressable accessibilityRole={checkbox ? 'checkbox' : 'button'} accessibilityLabel={name}
    accessibilityState={{ checked: checkbox ? selected : undefined, selected: checkbox ? undefined : selected, disabled }}
    {...(Platform.OS === 'web' ? { 'aria-checked': checkbox ? selected : undefined, 'aria-selected': checkbox ? undefined : selected } : {})}
    disabled={disabled} onPress={onPress} hitSlop={{ top: 7, bottom: 7 }} style={[s.choice, selected && s.selected]}>
    <Text style={[s.choiceText, selected && s.selectedText]}>{label}</Text>
  </Pressable>;
}
const s = StyleSheet.create({
  title: { marginTop: 12, color: colors.white, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5 },
  description: { marginTop: 10, fontFamily: fonts.light, fontSize: 14, lineHeight: 19, letterSpacing: 0.1, color: colors.darkOnboardingMuted },
  eyebrow: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.8, color: colors.darkOnboardingMuted, marginTop: 18, marginBottom: 8 },
  section: { borderWidth: 1, borderColor: colors.darkOutline, borderRadius: 14, backgroundColor: colors.darkCard, marginBottom: 12 }, expanded: { borderColor: 'rgba(51,198,89,0.38)' },
  header: { minHeight: 66, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 36, height: 36, backgroundColor: '#313131', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0, gap: 3 }, label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19, color: colors.white }, summary: { fontFamily: fonts.light, fontSize: 12, lineHeight: 16, color: colors.darkOnboardingMuted }, rotate: { transform: [{ rotate: '-90deg' }] },
  panel: { paddingHorizontal: 15, paddingBottom: 12, gap: 10 }, rule: { height: 1, backgroundColor: colors.darkOutline }, choices: { flexDirection: 'row', flex: 1, gap: 6 },
  choice: { flex: 1, minWidth: 0, minHeight: 30, borderRadius: 7, borderWidth: 1, borderColor: colors.darkOutline, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' }, selected: { borderColor: colors.action, backgroundColor: 'rgba(51,198,89,0.14)' }, choiceText: { fontFamily: fonts.regular, color: colors.darkOnboardingMuted, fontSize: 12 }, selectedText: { fontFamily: fonts.bold, color: colors.action },
  info: { flexDirection: 'row', gap: 8, paddingVertical: 9, paddingHorizontal: 12, minHeight: 54, borderWidth: 1, borderColor: 'rgba(51,198,89,0.19)', borderRadius: 10, backgroundColor: 'rgba(51,198,89,0.08)', alignItems: 'center', marginTop: -2 }, infoText: { flex: 1, fontFamily: fonts.light, fontSize: 12, lineHeight: 17, color: colors.darkOnboardingMuted }, apps: { marginTop: 18 }, divider: { height: 1, backgroundColor: colors.darkOutline, marginTop: 4, marginBottom: 19 }, footer: { fontFamily: fonts.light, color: colors.darkOnboardingMuted, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  helper: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.darkOnboardingMuted }, timeRow: { flexDirection: 'row', gap: 10 }, timeField: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(51,198,89,0.38)', backgroundColor: 'rgba(51,198,89,0.08)' }, timeLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.darkOnboardingMuted }, timeValue: { fontFamily: fonts.bold, fontSize: 18, color: colors.action, minHeight: 24, lineHeight: 24, padding: 0, marginTop: 4 }, legend: { flexDirection: 'row', justifyContent: 'space-between' }, legendText: { fontFamily: fonts.regular, color: '#E0E8E3', fontSize: 11 }, overnight: { minHeight: 44, justifyContent: 'center' }, zone: { fontFamily: fonts.regular, fontSize: 13, color: colors.white, minHeight: 44, borderWidth: 1, borderColor: colors.darkOnboardingMuted, borderRadius: 7, paddingHorizontal: 10 }, optionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' }, optionLabel: { fontFamily: fonts.medium, color: colors.darkOnboardingMuted, fontSize: 11, width: 98 }, error: { fontFamily: fonts.regular, color: colors.darkError, fontSize: 13, lineHeight: 18, marginVertical: 8 },
});
