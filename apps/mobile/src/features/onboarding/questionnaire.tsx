import { useRef, useState, type RefObject } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { QuestionnairePermission } from './questionnaire-permission';
import { Image } from 'expo-image';
import { QuestionFrame } from './question-frame';
import { Button } from '@/components/ui/button';
import { colors, fonts } from '@/design/tokens';
import type { OnboardingProgress, QuestionnaireAnswers } from './progress-repository';
import { setupActivities } from './setup-model';
const AGE_MIN = 18, AGE_MAX = 80, AGE_ROW_HEIGHT = 28, AGE_WHEEL_HEIGHT = 242;
const APP_OPTIONS = [
  { name: 'Instagram', detail: 'Photos, stories, reels', icon: 'app-camera' },
  { name: 'Snapchat', detail: 'Snaps, chats, lenses', icon: 'app-ghost' },
  { name: 'TikTok', detail: 'Short videos, trends', icon: 'app-play' },
  { name: 'YouTube', detail: 'Videos, creators, watch time', icon: 'app-play' },
  { name: 'Reddit', detail: 'Communities, browsing', letter: 'R' },
  { name: 'X', detail: 'Tweets, replies, threads', icon: 'app-bird' },
] as const;

const HOBBY_OPTIONS = [
  { name: 'Gym', icon: 'hobby-gym' },
  { name: 'Reading', icon: 'hobby-book' },
  { name: 'Arts & crafts', icon: 'hobby-arts' },
  { name: 'Walking', icon: 'hobby-walk' },
  { name: 'Music', icon: 'hobby-music' },
  { name: 'Cooking', icon: 'hobby-cooking' },
] as const;

const icons: Record<string, number> = {
  'gender-male': require('../../../assets/onboarding/gender-male.svg'),
  'gender-female': require('../../../assets/onboarding/gender-female.svg'),
  'gender-other': require('../../../assets/onboarding/gender-other.svg'),
  'gender-star': require('../../../assets/onboarding/gender-star.svg'),
  'app-camera': require('../../../assets/onboarding/app-camera.svg'),
  'app-ghost': require('../../../assets/onboarding/app-ghost.svg'),
  'app-play': require('../../../assets/onboarding/app-play.svg'),
  'app-bird': require('../../../assets/onboarding/app-bird.svg'),
  'hobby-gym': require('../../../assets/onboarding/hobby-gym.svg'),
  'hobby-book': require('../../../assets/onboarding/hobby-book.svg'),
  'hobby-arts': require('../../../assets/onboarding/hobby-arts.svg'),
  'hobby-walk': require('../../../assets/onboarding/hobby-walk.svg'),
  'hobby-music': require('../../../assets/onboarding/hobby-music.svg'),
  'hobby-cooking': require('../../../assets/onboarding/hobby-cooking.svg'),
  'check': require('../../../assets/onboarding/check.svg'),
  'plus': require('../../../assets/onboarding/plus.svg'),
  'arrow-left': require('../../../assets/onboarding/arrow-left.svg'),
  'permission-glow': require('../../../assets/onboarding/permission/glow.svg'),
  'permission-sparkle': require('../../../assets/onboarding/permission/sparkle.svg'),
  'permission-dinosaur': require('../../../assets/onboarding/permission/dinosaur.svg'),
};
function SvgXmlIcon({ name, width, height, tint }: { name: string; width: number; height: number; tint?: string }) {
  return <Image source={icons[name]} style={{ width, height }} tintColor={tint} contentFit="contain" accessible={false} />;
}

const copy = ['What’s your gender?', 'How old are you?', 'Which apps do you use most?', 'What do you want to do instead?', 'Screen Time access'];
const hobbyIDs: Record<string, string> = { Gym: 'gym', Reading: 'reading', 'Arts & crafts': 'arts_and_crafts', Walking: 'walking', Music: 'music', Cooking: 'cooking' };
/** Original landing-page presentation, hosted by the shared verified-account progress repository. */
export function Questionnaire({ progress, busy, failed, onSave }: {
  progress: OnboardingProgress; busy: boolean; failed: boolean; onSave(next: OnboardingProgress): Promise<boolean>;
}) {
  const initial = progress.questions;
  const nativeApps = Platform.OS === 'ios' || Platform.OS === 'android';
  const [targetRevision, setTargetRevision] = useState(progress.selectionRevision);
  const [targetCount, setTargetCount] = useState(initial?.nativeTargetCount ?? 0);
  const [step, setStep] = useState(nativeApps && (initial?.index ?? 0) >= 3 && !initial?.nativeTargetCount ? 2 : nativeApps && initial?.index === 4 ? 3 : initial?.index ?? 0);
  const [gender, setGender] = useState<string | null>(initial?.gender ?? null);
  const [age, setAge] = useState(initial?.age ?? 24);
  const [ageChosen, setAgeChosen] = useState(initial?.age !== undefined);
  const [apps, setApps] = useState<string[]>(initial?.apps ?? []);
  const [hobbies, setHobbies] = useState<string[]>(initial?.hobbies ?? []);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const ageList = useRef<ScrollViewInstance>(null);
  const valid = step === 0 ? !!gender : step === 1 ? ageChosen && age >= 18 && age <= 80 : step === 2 ? apps.length >= 2 && apps.length <= 4 : step === 3 ? hobbies.length > 0 && !custom.trim() : true;
  function toggle(kind: 'apps' | 'hobbies', name: string) {
    const list = kind === 'apps' ? apps : hobbies;
    if (!list.includes(name) && list.length >= (kind === 'apps' ? 4 : 12)) return;
    (kind === 'apps' ? setApps : setHobbies)(list.includes(name) ? list.filter(v => v !== name) : [...list, name]);
  }
  function add() {
    const value = custom.trim();
    if (!value || hobbies.includes(value)) return;
    if (hobbies.some(v => !hobbyIDs[v])) { setError('Keep one custom activity, or remove it before adding another.'); return; }
    setHobbies([...hobbies, value]); setCustom(''); setError('');
  }
  async function advance(next: number, deferred = false, selectionRevision?: number, selectedAppCount?: number) {
    if (busy || (next > step && !valid && !(nativeApps && step === 2 && selectedAppCount))) return;
    selectionRevision ??= targetRevision;
    const questions: QuestionnaireAnswers = { index: Math.min(next, 4), gender: gender as QuestionnaireAnswers['gender'], age: ageChosen ? age : undefined, apps: nativeApps ? [] : apps, hobbies, ...(nativeApps && (selectedAppCount ?? targetCount) > 0 ? { nativeTargetCount: selectedAppCount ?? targetCount } : {}) };
    const activities = setupActivities(hobbies.filter(v => hobbyIDs[v]).map(v => hobbyIDs[v]), hobbies.filter(v => !hobbyIDs[v]));
    if (next === 5 && activities.error) { setError(activities.error); return; }
    const saved = await onSave({ ...progress, version: 1, step: next === 5 ? 'plan' : 'questions', questions, ...(selectionRevision ? { selectionRevision } : {}),
      ...(next === 5 ? { questionsCompleted: true, permissionDeferred: deferred, ...(selectionRevision ? { selectionRevision } : {}), activities: activities.value } : {}) });
    if (saved && next < 5) { if (selectedAppCount) setTargetCount(selectedAppCount); if (selectionRevision) setTargetRevision(selectionRevision); setStep(next); }
  }
  const notes = ['Choose an avatar to personalize your experience.', 'Your age helps personalize your plan.', 'Pick 2–4 preferences. You’ll confirm target apps in the device picker during Screen Time setup.', 'Choose activities you’d like more time for.'];
  const next = <Button label={step === 3 ? 'Continue' : 'Next →'} disabled={!valid} busy={busy} onPress={() => { void advance(nativeApps && step === 3 ? 5 : step + 1); }} />;
  const back = <Button label="Back" variant="secondary" disabled={busy} onPress={() => { void advance(step - 1); }} />;
  const footer = step < 4 && !(step === 2 && nativeApps) ? <View style={styles.footer}>
    <Text style={styles.footerNote}>{notes[step]}</Text>
    <View style={step === 0 ? styles.genderActions : styles.ageActions}>
      {next}
      {step > 0 && back}
    </View>
  </View> : null;
  return <QuestionFrame step={step} title={copy[step]} footer={footer}>
    {step === 0 && <GenderStep value={gender} onChange={setGender} />}
    {step === 1 && <AgeStep value={age} listRef={ageList} onChange={value => { setAge(value); setAgeChosen(true); }}
      onScrollEnd={event => { setAge(Math.max(18, Math.min(80, 18 + Math.round(event.nativeEvent.contentOffset.y / AGE_ROW_HEIGHT)))); setAgeChosen(true); }} />}
    {step === 2 && nativeApps && <QuestionnairePermission selectionQuestion busy={busy} onBack={() => { void advance(1); }} onContinue={(_deferred, revision, count) => { void advance(3, false, revision, count); }} />}
    {step === 2 && !nativeApps && <AppsStep selected={apps} selectedCount={apps.length} onToggle={name => toggle('apps', name)} />}
    {step === 3 && <HobbiesStep selected={hobbies} customValue={custom} onCustomChange={setCustom} onCustomSubmit={add} onToggle={name => toggle('hobbies', name)} />}
    {step === 4 && <QuestionnairePermission reviewSavedSelection={nativeApps && targetCount > 0} busy={busy} onBack={() => { void advance(3); }} onContinue={(deferred, revision) => { void advance(5, deferred, revision); }} />}
    {(failed || error) && <Text accessibilityRole="alert" style={styles.draftWarningText}>{error || 'Your answers could not be saved. Try again.'}</Text>}
  </QuestionFrame>;

}
function GenderStep({ value, onChange }: { value: string | null; onChange(value: string | null): void }) {
  return (
    <>
      <View pointerEvents="none" style={styles.genderGlow}><SvgXmlIcon name="permission-glow" width={160} height={160} /></View>
      <Text style={styles.description}>Choose the avatar that feels right for you. This helps personalize your experience.</Text>
      <View style={styles.genderRow}>
        <GenderCard label="Male" selected={value === 'Male'} icon="gender-male" onPress={() => onChange(value === 'Male' ? null : 'Male')} />
        <GenderCard label="Female" selected={value === 'Female'} icon="gender-female" onPress={() => onChange(value === 'Female' ? null : 'Female')} />
      </View>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: value === 'Other' }}
        onPress={() => onChange(value === 'Other' ? null : 'Other')}
        style={[styles.otherGenderCard, value === 'Other' && styles.cardSelected]}
      >
        <View style={styles.cardBadge}><SelectionMark selected={value === 'Other'} /></View>
        <View style={styles.genderArt}><View style={styles.genderSparkle}><SvgXmlIcon name="permission-sparkle" width={10} height={10} /></View><View style={styles.genderStar}><SvgXmlIcon name="gender-star" width={14} height={14} /></View><SvgXmlIcon name="gender-other" width={52} height={52} /></View>
        <Text style={styles.cardLabel}>Other</Text>
        <Text style={styles.smallMuted}>You can always change this later</Text>
      </Pressable>
    </>
  );
}

function GenderCard({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}
      style={[styles.genderCard, selected && styles.cardSelected]}>
      <View style={styles.cardBadge}><SelectionMark selected={selected} /></View>
      <View style={styles.genderArt}><View style={styles.genderSparkle}><SvgXmlIcon name="permission-sparkle" width={10} height={10} /></View><SvgXmlIcon name={icon} width={52} height={52} /></View>
      <Text style={styles.cardLabel}>{label}</Text>
      {selected && <Text style={styles.selectedCaption}>Selected</Text>}
    </Pressable>
  );
}

function AgeStep({ value, listRef, onScrollEnd, onChange }: {
  onChange(value: number): void;
  value: number;
  listRef: RefObject<ScrollViewInstance | null>;
  onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>): void;
}) {
  const itemOffset = (AGE_WHEEL_HEIGHT - AGE_ROW_HEIGHT) / 2;
  return (
    <>
      <View style={styles.ageWheel}>
      <ScrollView
        ref={listRef}
        onLayout={() => listRef.current?.scrollTo({ y: (value - AGE_MIN) * AGE_ROW_HEIGHT, animated: false })}
        contentContainerStyle={{ paddingVertical: itemOffset }}
        nestedScrollEnabled
        snapToInterval={AGE_ROW_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        style={styles.ageWheelList}
        accessibilityLabel="Choose your age"
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
      >
        {Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, index) => index + AGE_MIN).map(item => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={`Age ${item}`}
            accessibilityState={{ checked: item === value }}
            onPress={() => { onChange(item); listRef.current?.scrollTo({
              y: Math.max(0, (item - AGE_MIN) * AGE_ROW_HEIGHT),
              x: 0,
              animated: true,
            }); }}
            style={styles.ageItem}
          >
            <Text style={[styles.ageOther, { transform: [{ translateY: item < value ? -22 : item > value ? 22 : 0 }] }, item === value && styles.ageTransparent]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View pointerEvents="none" style={[styles.ageSelection, { top: (AGE_WHEEL_HEIGHT - AGE_ROW_HEIGHT - 44) / 2 }]}>
        <View style={styles.ageSelectedPill}><Text accessibilityLiveRegion="polite" style={styles.ageValue}>{value}</Text></View>
      </View>
      </View>
      <View style={styles.ageHomeIndicator}><View style={styles.ageIndicatorTrack} /><View style={styles.ageIndicatorActive} /></View>
    </>
  );
}

function AppsStep({ selected, selectedCount, onToggle }: { selected: string[]; selectedCount: number; onToggle(name: string): void }) {
  return (
    <>
      <View style={styles.selectionHint}>
        <Text style={styles.selectionPill}>{selectedCount} selected</Text>
        <Text style={styles.smallMuted}>Choose 2–4 apps</Text>
      </View>
      <View style={styles.list}>
        {APP_OPTIONS.map(option => {
          const isSelected = selected.includes(option.name);
          const isAtLimit = selected.length >= 4 && !isSelected;
          return (
            <Pressable
              key={option.name}
              accessibilityRole="checkbox"
              disabled={isAtLimit}
              accessibilityState={{ checked: isSelected, disabled: isAtLimit }}
              accessibilityHint={isAtLimit ? 'Remove a selected app before choosing another.' : undefined}
              onPress={() => onToggle(option.name)}
              style={[styles.appRow, isSelected && styles.cardSelected, isAtLimit && styles.disabledChoice]}
            >
              <View style={styles.appIcon}>
                {'icon' in option
                  ? <SvgXmlIcon name={option.icon} width={20} height={20} tint={isSelected ? colors.action : '#858585'} />
                  : <Text style={styles.redditLetter}>{option.letter}</Text>}
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.cardLabel, { textAlign: 'left' }]}>{option.name}</Text>
                <Text style={styles.appDetail}>{option.detail}</Text>
              </View>
              <SelectionMark selected={isSelected} empty={!isSelected} />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function HobbiesStep({ selected, customValue, onCustomChange, onCustomSubmit, onToggle }: {
  selected: string[];
  customValue: string;
  onCustomChange(value: string): void;
  onCustomSubmit(): void;
  onToggle(name: string): void;
}) {
  const customHobbies = selected.filter(name => !HOBBY_OPTIONS.some(option => option.name === name));
  return (
    <>
      <View style={styles.hobbyGrid}>
        {HOBBY_OPTIONS.map(option => {
          const isSelected = selected.includes(option.name);
          return (
            <Pressable key={option.name} accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }} onPress={() => onToggle(option.name)}
              style={[styles.hobbyCard, isSelected && styles.cardSelected]}>
              <View style={styles.cardBadge}><SelectionMark selected={isSelected} /></View>
              <View style={styles.hobbyIcon}>
                <SvgXmlIcon name={option.icon} width={20} height={20} tint={isSelected ? colors.action : '#858585'} />
              </View>
              <Text style={styles.cardLabel}>{option.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.customInput}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add this hobby" onPress={onCustomSubmit} style={styles.addButton}>
          <SvgXmlIcon name="plus" width={16} height={16} />
        </Pressable>
        <TextInput
          accessibilityLabel="Add a custom activity"
          value={customValue}
          onChangeText={onCustomChange}
          onSubmitEditing={onCustomSubmit}
          returnKeyType="done"
          maxLength={60}
          placeholder="e.g. gardening, drawing, yoga"
          placeholderTextColor={colors.darkMuted}
          style={styles.customTextInput}
        />
      </View>
      {customHobbies.length > 0 && (
        <View style={styles.customChips} accessibilityLabel="Added activities">
          {customHobbies.map(name => (
            <Pressable key={name} accessibilityRole="button" accessibilityLabel={`Remove ${name}`} onPress={() => onToggle(name)} style={styles.customChip}>
              <Text style={styles.customChipText}>{name}  ×</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

function SelectionMark({ selected, empty = false }: { selected: boolean; empty?: boolean }) {
  return (
    <View style={[styles.selectionMark, selected && styles.selectionMarkSelected, empty && styles.selectionMarkEmpty]}>
      {selected ? <SvgXmlIcon name="check" width={12} height={12} /> : empty ? <View style={styles.emptyMark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12 },
  footerNote: { color: colors.darkMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  genderActions: { marginTop: 128 },
  ageActions: { marginTop: 30, gap: 12 },
  rowActions: { flexDirection: 'row', gap: 12, marginTop: 34, alignItems: 'center' },
  loadScreen: { flex: 1, backgroundColor: colors.darkCanvas, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadText: { color: colors.darkMuted, fontFamily: fonts.regular, fontSize: 14 },
  screen: { flex: 1, backgroundColor: colors.darkCanvas, paddingHorizontal: 24 },
  header: { paddingBottom: 0, alignItems: 'flex-end' },
  skip: { minWidth: 46, textAlign: 'right', color: 'rgba(255,255,255,0.68)', fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  progress: { width: '100%', height: 4, flexDirection: 'row', gap: 4, marginTop: 2 },
  progressSegment: { height: 4, flex: 1, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressSegmentActive: { backgroundColor: colors.action },
  stepCount: { alignSelf: 'flex-start', marginTop: 8, color: colors.action, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  body: { flexGrow: 1, paddingTop: 18, paddingBottom: 20 },
  draftNotice: { color: '#F6C663', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  draftWarning: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#3A3021', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  draftWarningText: { flex: 1, color: '#F6C663', fontFamily: fonts.regular, fontSize: 12 },
  draftRetry: { color: colors.action, fontFamily: fonts.bold, fontSize: 12 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5, marginBottom: 10 },
  description: { color: colors.darkMuted, fontFamily: fonts.light, fontSize: 14, lineHeight: 19 },
  genderGlow: { position: 'absolute', left: 93, top: 60, width: 160, height: 160 },
  genderSparkle: { position: 'absolute', left: 6, top: 6 },
  genderStar: { position: 'absolute', left: 54, top: 2 },
  genderRow: { flexDirection: 'row', gap: 17, marginTop: 25 },
  genderCard: { position: 'relative', flex: 1, height: 172, borderRadius: 14, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cardBadge: { position: 'absolute', right: 8, top: 8, zIndex: 1 },
  cardSelected: { borderWidth: 2, borderColor: colors.action, shadowColor: colors.action, shadowOpacity: 0.25, shadowRadius: 10, elevation: 2 },
  genderArt: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardLabel: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, textAlign: 'center' },
  selectedCaption: { color: colors.action, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  selectionMark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selectionMarkSelected: { backgroundColor: colors.action },
  selectionMarkEmpty: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' },
  emptyMark: { width: 18, height: 18, borderRadius: 9 },
  checkmark: { color: '#164626', fontFamily: fonts.bold, fontSize: 14, lineHeight: 18 },
  otherGenderCard: { position: 'relative', height: 172, marginTop: 18, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, alignItems: 'center', justifyContent: 'center', gap: 4 },
  smallMuted: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 12, lineHeight: 16 },
  note: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  footerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  genderFooterSpacer: { height: 96 },
  primaryButton: { height: 52, flex: 1, borderRadius: 10, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  wideButton: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%', alignSelf: 'stretch' },
  primaryButtonText: { color: '#080B09', fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  buttonDisabled: { opacity: 0.45 },
  secondaryButton: { height: 48, flex: 1, borderRadius: 10, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  secondaryButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, textAlign: 'center' },
  backButton: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  ageWheel: { position: 'relative', height: AGE_WHEEL_HEIGHT, marginTop: 93, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, overflow: 'hidden' },
  ageWheelList: { flex: 1 },
  ageItem: { height: AGE_ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  ageOther: { color: 'rgba(255,255,255,0.62)', fontFamily: fonts.medium, fontSize: 12, lineHeight: AGE_ROW_HEIGHT, textAlign: 'center' },
  ageTransparent: { color: 'transparent' },
  ageSelection: { position: 'absolute', left: 0, right: 0, height: AGE_ROW_HEIGHT + 44, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  ageSelectedPill: { width: 96, height: AGE_ROW_HEIGHT + 44, borderRadius: 18, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  ageValue: { color: '#080B09', fontFamily: fonts.bold, fontSize: 32, lineHeight: 40 },
  ageHomeIndicator: { alignItems: 'center', gap: 7, marginTop: 12 },
  ageIndicatorTrack: { width: 96, height: 4, borderRadius: 3, backgroundColor: '#383838' },
  ageIndicatorActive: { width: 40, height: 4, borderRadius: 3, backgroundColor: colors.action },
  selectionHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  selectionPill: { overflow: 'hidden', color: '#080B09', backgroundColor: colors.action, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
  list: { gap: 8 },
  appRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, paddingHorizontal: 16 },
  disabledChoice: { opacity: 0.45 },
  appIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  redditLetter: { color: '#858585', fontFamily: fonts.bold, fontSize: 18 },
  rowCopy: { flex: 1, gap: 2, alignItems: 'flex-start' },
  appDetail: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 11, lineHeight: 15 },
  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  hobbyCard: { position: 'relative', width: '47.54%', height: 96, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, alignItems: 'center', justifyContent: 'center', gap: 4 },
  hobbyIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  customInput: { height: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, marginTop: 12, paddingHorizontal: 16 },
  addButton: { width: 28, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  customTextInput: { flex: 1, color: colors.white, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, paddingVertical: 0 },
  customChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  customChip: { borderRadius: 16, backgroundColor: 'rgba(51,198,89,0.14)', paddingHorizontal: 12, paddingVertical: 6 },
  customChipText: { color: colors.action, fontFamily: fonts.medium, fontSize: 12 },
  permissionCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20, alignItems: 'center', marginTop: 7, gap: 20, minHeight: 360 },
  permissionGlow: { position: 'absolute', left: 92, top: -34, width: 160, height: 160, opacity: 0.45 },
  permissionCopyGroup: { gap: 8, width: '100%' },
  permissionArt: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  permissionDinosaurTile: { position: 'absolute', width: 100, height: 100, borderRadius: 24, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  permissionSparkle: { position: 'absolute', top: 6, left: 6 },
  permissionTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, lineHeight: 19, textAlign: 'center' },
  permissionCopy: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  systemPromptNotice: { alignSelf: 'stretch', borderRadius: 12, backgroundColor: '#333333', paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  systemPromptCopy: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  permissionUnavailable: { marginTop: 10, color: '#F6C663', fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, textAlign: 'center' },
  permissionFooterNote: { marginTop: 12, marginBottom: 30 },
  permissionActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
