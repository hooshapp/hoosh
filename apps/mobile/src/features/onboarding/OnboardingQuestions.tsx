import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  ActivityIndicator,
  AppState,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { colors, fonts } from '@/design/tokens';
import { useAuth } from '@/features/auth/auth-provider';
import {
  makeSavedQuestionAnswers,
  parseQuestionDraft,
  questionAnswersKey,
  questionCompleteKey,
  questionDraftKey,
  serializeQuestionDraft,
} from './draft';
import { getScreenTimeAuthorization, requestScreenTimeAuthorization } from '@/infrastructure/screen-time/authorization';
import type { AuthorizationState } from '@disconnect/contracts';
import { figmaIcons } from './figma-icons';

type QuestionStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type Answers = { apps: string[]; hobbies: string[] };
type SelectionKind = 'apps' | 'hobbies';
type DraftLoadResult = { accountId: string; status: 'ready'; notice?: string } | { accountId: string; status: 'failed' };

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

const STEP_COUNT = 7;
const LAST_STEP: QuestionStep = 6;
const AGE_MIN = 1;
const AGE_MAX = 100;
const AGE_ROW_HEIGHT = 28;
const AGE_WHEEL_HEIGHT = 242;
const QUESTION_COPY = [
  'What’s your gender?',
  'How old are you?',
  'Which apps do you use most?',
  'What do you want to do instead?',
  'Screen Time access',
  'We are creating a plan for you',
  'We created a plan for you',
] as const;

/** The five preference/permission frames, in Figma order: 27:113, 48:79, 48:81, 50:83, 50:85. */
export function OnboardingQuestions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const { snapshot } = useAuth();
  const accountId = snapshot.status === 'signed_in' ? snapshot.user.user_id : null;
  const ageList = useRef<ScrollViewInstance>(null);
  const selectedAge = useRef(24);
  const draftWrites = useRef<Promise<void>>(Promise.resolve());
  const [step, setStep] = useState<QuestionStep>(0);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState(24);
  const [answers, setAnswers] = useState<Answers>({
    apps: ['Instagram', 'Snapchat'],
    hobbies: ['Gym', 'Reading'],
  });
  const [customHobby, setCustomHobby] = useState('');
  const [saving, setSaving] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState(false);
  const [authorization, setAuthorization] = useState<AuthorizationState>('not_requested');
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  useEffect(() => {
    if (step !== 4) return;
    let current = true;
    const refresh = () => { void getScreenTimeAuthorization().then(value => {
      if (current) setAuthorization(value);
    }).catch(() => { if (current) setAuthorization('error'); }); };
    refresh();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { current = false; subscription.remove(); };
  }, [step]);
  const requestPermission = async () => {
    if (requestingPermission) return;
    setRequestingPermission(true);
    setPermissionNotice(true);
    try { setAuthorization(await requestScreenTimeAuthorization()); }
    catch {
      const observed = await getScreenTimeAuthorization().catch(() => 'error' as const);
      setAuthorization(observed === 'denied' || observed === 'revoked' ? observed : 'error');
    }
    finally { setRequestingPermission(false); }
  };
  const [loadResult, setLoadResult] = useState<DraftLoadResult | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [draftWriteFailed, setDraftWriteFailed] = useState(false);
  const compact = height < 740 || fontScale > 1.25;
  const safeTop = Math.min(insets.top || 44, 44);
  const safeBottom = Math.max(insets.bottom, step === 1 ? 64 : step === 4 ? 60 : 24);

  const draftReady = accountId !== null && loadResult?.accountId === accountId && loadResult.status === 'ready';

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    void AsyncStorage.getItem(questionDraftKey(accountId)).then(async raw => {
      const draft = parseQuestionDraft(raw);
      let notice: string | undefined;
      if (raw && !draft) {
        await AsyncStorage.removeItem(questionDraftKey(accountId));
        notice = 'Your saved setup was out of date, so we started a fresh one.';
      }
      if (cancelled) return;
      if (draft) {
        setStep(draft.step as QuestionStep);
        setAnswers({ apps: draft.apps, hobbies: draft.hobbies });
      }
      setLoadResult({ accountId, status: 'ready', notice });
    }).catch(() => {
      if (!cancelled) setLoadResult({ accountId, status: 'failed' });
    });
    return () => { cancelled = true; };
  }, [accountId, loadAttempt]);

  useEffect(() => {
    if (step !== 1) return;
    requestAnimationFrame(() => {
      ageList.current?.scrollTo({
        y: (selectedAge.current - AGE_MIN) * AGE_ROW_HEIGHT,
        x: 0,
        animated: false,
      });
    });
  }, [step]);

  const saveDraft = useCallback(() => {
    if (!accountId) return Promise.reject(new Error('Sign in required'));
    const value = serializeQuestionDraft({ step, apps: answers.apps, hobbies: answers.hobbies });
    const nextWrite = draftWrites.current.catch(() => undefined).then(() =>
      AsyncStorage.setItem(questionDraftKey(accountId), value),
    );
    draftWrites.current = nextWrite;
    void nextWrite.then(() => setDraftWriteFailed(false)).catch(() => setDraftWriteFailed(true));
    return nextWrite;
  }, [accountId, answers.apps, answers.hobbies, step]);

  useEffect(() => {
    if (!draftReady) return;
    void saveDraft().catch(() => undefined);
  }, [draftReady, saveDraft]);

  const toggle = useCallback((kind: SelectionKind, value: string, limit: number) => {
    setAnswers(current => {
      const previous = current[kind];
      const alreadySelected = previous.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase());
      if (alreadySelected) {
        return { ...current, [kind]: previous.filter(item => item.toLocaleLowerCase() !== value.toLocaleLowerCase()) };
      }
      if (previous.length >= limit) return current;
      return { ...current, [kind]: [...previous, value] };
    });
  }, []);

  const finish = useCallback(async () => {
    if (!accountId) {
      Alert.alert('Sign in required', 'Please sign in before saving your setup.');
      return;
    }
    setSaving(true);
    try {
      await saveDraft();
      // Demographic answers remain transient until Q19/PD-17 is decided. Permission state is an OS observation, never a protection claim.
      const savedAnswers = makeSavedQuestionAnswers(answers.apps, answers.hobbies, authorization);
      await AsyncStorage.setItem(questionAnswersKey(accountId), JSON.stringify(savedAnswers));
      await AsyncStorage.setItem(questionCompleteKey(accountId), '1');
      await AsyncStorage.removeItem(questionDraftKey(accountId));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Could not save', 'Your setup wasn’t saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [accountId, answers.apps, answers.hobbies, router, saveDraft, authorization]);

  const finishOnboarding = useCallback(async () => {
    setShowPlan(false);
    await finish();
  }, [finish]);

  const skip = useCallback(() => {
    switch (step) {
      case 0:
        setGender(null);
        break;
      case 1:
        selectedAge.current = 24;
        setAge(24);
        break;
      case 2:
        setAnswers(current => ({ ...current, apps: [] }));
        break;
      case 3:
        setAnswers(current => ({ ...current, hobbies: [] }));
        break;
      case 4:
        setShowPlan(true);
        setStep(5);
        return;
      case 5:
        setStep(6);
        return;
      case 6:
        void finishOnboarding();
        return;
    }
    setStep(current => Math.min(LAST_STEP, current + 1) as QuestionStep);
  }, [finish, finishOnboarding, step]);

  const addCustomHobby = useCallback(() => {
    const value = customHobby.trim().replace(/\s+/g, ' ');
    if (!value) return true;
    if (value.length > 40) {
      Alert.alert('That hobby is too long', 'Please keep it under 40 characters.');
      return false;
    }
    if (answers.hobbies.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setCustomHobby('');
      Keyboard.dismiss();
      return true;
    }
    if (answers.hobbies.length >= 12) {
      Alert.alert('Hobby limit reached', 'Choose up to 12 activities.');
      return false;
    }
    setAnswers(current => ({ ...current, hobbies: [...current.hobbies, value] }));
    setCustomHobby('');
    Keyboard.dismiss();
    return true;
  }, [answers.hobbies, customHobby]);

  const next = useCallback(() => {
    Keyboard.dismiss();
    if (step === 3 && !addCustomHobby()) return;
    if (step === 4) {
      setShowPlan(true);
      setStep(5);
      return;
    }
    if (step === 5) {
      setStep(6);
      return;
    }
    if (step === LAST_STEP) {
      void finishOnboarding();
      return;
    }
    setStep(current => Math.min(LAST_STEP, current + 1) as QuestionStep);
  }, [finish, finishOnboarding, step, addCustomHobby]);

  const onAgeScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const value = AGE_MIN + Math.round(event.nativeEvent.contentOffset.y / AGE_ROW_HEIGHT);
    const nextAge = Math.max(AGE_MIN, Math.min(AGE_MAX, value));
    selectedAge.current = nextAge;
    setAge(nextAge);
  }, []);

  const appSelection = answers.apps.length;

  if (!accountId || loadResult?.accountId !== accountId) {
    return <View style={styles.loadScreen}><ActivityIndicator color={colors.action} /><Text style={styles.loadText}>Loading your setup…</Text></View>;
  }
  if (loadResult.status === 'failed') {
    return (
      <View style={styles.loadScreen}>
        <Text accessibilityRole="header" style={styles.title}>Couldn’t load your setup</Text>
        <Text style={styles.description}>Your saved answers are safe. Check your device storage, then try again.</Text>
        <Pressable accessibilityRole="button" onPress={() => setLoadAttempt(value => value + 1)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: safeTop + 10 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip this question" disabled={saving || requestingPermission} onPress={skip}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
        <View style={styles.progress} accessibilityRole="progressbar"
          accessibilityLabel={`Onboarding step ${step + 1} of ${STEP_COUNT}`}
          accessibilityValue={{ min: 1, max: STEP_COUNT, now: step + 1 }}>
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <View key={index} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />
          ))}
        </View>
        <Text style={styles.stepCount}>{step + 1} of {STEP_COUNT}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" scrollEnabled>
        {loadResult.notice && <Text accessibilityLiveRegion="polite" style={styles.draftNotice}>{loadResult.notice}</Text>}
        {draftWriteFailed && <View style={styles.draftWarning}>
          <Text style={styles.draftWarningText}>We couldn’t save your progress.</Text>
          <Pressable accessibilityRole="button" onPress={() => { void saveDraft().catch(() => undefined); }}>
            <Text style={styles.draftRetry}>Retry</Text>
          </Pressable>
        </View>}
        <Text accessibilityRole="header" style={styles.title}>{QUESTION_COPY[step]}</Text>

        {step === 0 && <GenderStep value={gender} onChange={setGender} />}
        {step === 1 && <AgeStep value={age} listRef={ageList} onScrollEnd={onAgeScrollEnd} onChange={value => { selectedAge.current = value; setAge(value); }} />}
        {step === 2 && <AppsStep selected={answers.apps} selectedCount={appSelection} onToggle={name => toggle('apps', name, 4)} />}
        {step === 3 && <HobbiesStep
          selected={answers.hobbies}
          customValue={customHobby}
          onCustomChange={setCustomHobby}
          onCustomSubmit={addCustomHobby}
          onToggle={name => toggle('hobbies', name, 12)}
        />}
        {step === 4 && <PermissionStep notice={permissionNotice} authorization={authorization} />}
      </ScrollView>

      <Footer
        step={step}
        compact={compact}
        bottomInset={safeBottom}
        canContinue={step !== 2 || answers.apps.length >= 2}
        saving={saving || requestingPermission}
        authorized={authorization === 'authorized'}
        onBack={() => setStep(current => Math.max(0, current - 1) as QuestionStep)}
        onNext={next}
        onSkip={skip}
        onPermissionRequest={() => { if (authorization === 'authorized') void finish(); else void requestPermission(); }}
      />
    </KeyboardAvoidingView>
  );
}

function GenderStep({ value, onChange }: { value: string | null; onChange(value: string | null): void }) {
  return (
    <>
      <View pointerEvents="none" style={styles.genderGlow}><SvgXmlIcon name="permission-glow" width={160} height={160} /></View>
      <Text style={styles.description}>Quick one-time setup so we can tailor your experience. Totally optional. :)</Text>
      <View style={styles.genderRow}>
        <GenderCard label="Male" selected={value === 'Male'} icon="gender-male" onPress={() => onChange(value === 'Male' ? null : 'Male')} />
        <GenderCard label="Female" selected={value === 'Female'} icon="gender-female" onPress={() => onChange(value === 'Female' ? null : 'Female')} />
      </View>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'Other / Prefer not to say' }}
        onPress={() => onChange(value === 'Other / Prefer not to say' ? null : 'Other / Prefer not to say')}
        style={[styles.otherGenderCard, value === 'Other / Prefer not to say' && styles.cardSelected]}
      >
        <View style={styles.cardBadge}><SelectionMark selected={value === 'Other / Prefer not to say'} /></View>
        <View style={styles.genderArt}><View style={styles.genderSparkle}><SvgXmlIcon name="permission-sparkle" width={10} height={10} /></View><View style={styles.genderStar}><SvgXmlIcon name="gender-star" width={14} height={14} /></View><SvgXmlIcon name="gender-other" width={52} height={52} /></View>
        <Text style={styles.cardLabel}>Other / Prefer not to say</Text>
        <Text style={styles.smallMuted}>You can always change this later</Text>
      </Pressable>
    </>
  );
}

function GenderCard({ label, icon, selected, onPress }: { label: string; icon: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}
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
            accessibilityState={{ selected: item === value }}
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

function PermissionStep({ notice, authorization }: { notice: boolean; authorization: AuthorizationState }) {
  return (
    <>
      <View pointerEvents="none" style={styles.permissionGlow}>
        <SvgXmlIcon name="permission-glow" width={160} height={160} />
      </View>
      <Text style={styles.description}>
        {Platform.OS === 'android' ? 'Allow usage access so Hoosh can help you understand your app habits and take breaks.' : 'We need to see which apps you use so we can protect the ones you choose and help you take breaks when it matters.'}
      </Text>
      <View style={styles.permissionCard}>
        <View style={styles.permissionArt}>
          <View style={styles.permissionDinosaurTile}>
            <View style={styles.permissionSparkle}><SvgXmlIcon name="permission-sparkle" width={10} height={10} /></View>
            <SvgXmlIcon name="permission-dinosaur" width={60} height={60} />
          </View>
        </View>
        <View style={styles.permissionCopyGroup}><Text style={styles.permissionTitle}>See app activity to help you stay on track</Text>
        <Text style={styles.permissionCopy}>
          {Platform.OS === 'android' ? 'Usage access lets Hoosh measure app activity on this device. It does not restrict other apps.' : 'We use Screen Time access to understand which apps you open and when, so we can protect the apps you choose and suggest healthier breaks.'}
        </Text></View>
        <View style={styles.systemPromptNotice}>
          <Text style={styles.systemPromptCopy}>
            {Platform.OS === 'android' ? 'Next, open Usage Access settings and allow access for Hoosh. This permission does not block apps.' : authorization === 'unavailable' ? 'Screen Time access requires a native Hoosh build. You can set this up later.' : 'The system permission prompt comes next. You can review it before deciding whether to allow access.'}
          </Text>
        </View>
      </View>
      {notice && <Text accessibilityLiveRegion="polite" style={styles.permissionUnavailable}>
        {authorization === 'authorized' ? 'Access allowed. Continue to finish setup. App protection has not been activated.' : authorization === 'error' ? 'Could not request access. Please try again, or continue without access.' : authorization === 'denied' || authorization === 'revoked' ? 'Access was not allowed. You can try again or continue without access.' : authorization === 'unavailable' ? 'Screen Time setup isn’t connected in this app build yet. No app activity is accessed or restricted.' : 'Access is not enabled yet. Return after allowing Hoosh in system settings, or choose Not now.'}
      </Text>}
    </>
  );
}

function Footer({ step, compact, bottomInset, canContinue, saving, onBack, onNext, onSkip, onPermissionRequest, authorized }: {
  authorized: boolean;
  step: QuestionStep;
  compact: boolean;
  bottomInset: number;
  canContinue: boolean;
  saving: boolean;
  onBack(): void;
  onNext(): void;
  onSkip(): void;
  onPermissionRequest(): void;
}) {
  const note = step === 0
    ? 'Gender doesn’t determine your app restrictions.'
    : step === 1
      ? 'Age doesn’t determine your app restrictions.'
      : step === 2
        ? 'You can always update these later in settings.'
        : step === 3
          ? 'These are just starting points. You can always change them later.'
          : 'You can change this later in settings if you need to.';
  return (
    <View style={[styles.footer, { paddingBottom: bottomInset }]}>
      <View style={styles.footerRule} />
      {step !== 4 && <Text style={[styles.note, styles.footerNote]}>{note}</Text>}
      {step === 0 && !compact && <View style={styles.genderFooterSpacer} />}
      {step === 1 ? (
        <View style={styles.ageActions}>
          <SecondaryButton label="Back" onPress={onBack} wide />
          <PrimaryButton label="Next →" onPress={onNext} disabled={!canContinue || saving} wide />
        </View>
      ) : step === 4 ? (
        <>
          <Text style={[styles.note, styles.permissionFooterNote]}>{note}</Text>
          <PrimaryButton label={authorized ? 'Continue →' : Platform.OS === 'android' ? 'Allow Usage Access' : 'Allow Screen Time access'} onPress={onPermissionRequest} disabled={saving} wide />
          <View style={styles.permissionActions}>
            <SecondaryButton label="Not now" onPress={onSkip} />
            <SecondaryButton label="Back" onPress={onBack} />
          </View>
        </>
      ) : (
        <View style={[styles.rowActions, step === 3 && { marginTop: 14 }]}>
          {step === 2 && <SecondaryButton label="Back" onPress={onBack} narrow />}
          {step === 3 && <BackButton onPress={onBack} />}
          <PrimaryButton label="Next →" onPress={onNext} disabled={!canContinue || saving} />
        </View>
      )}
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled = false, wide = false }: { label: string; onPress(): void; disabled?: boolean; wide?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={[styles.primaryButton, wide && styles.wideButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress, wide = false, narrow = false }: { label: string; onPress(): void; wide?: boolean; narrow?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.secondaryButton, wide && styles.wideButton, narrow && { flexGrow: 0, flexShrink: 0, flexBasis: 103, height: 52 }]}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function BackButton({ onPress }: { onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onPress} style={styles.backButton}>
      <SvgXmlIcon name="arrow-left" width={18} height={18} />
    </Pressable>
  );
}

function SelectionMark({ selected, empty = false }: { selected: boolean; empty?: boolean }) {
  return (
    <View style={[styles.selectionMark, selected && styles.selectionMarkSelected, empty && styles.selectionMarkEmpty]}>
      {selected ? <SvgXmlIcon name="check" width={12} height={12} /> : empty ? <View style={styles.emptyMark} /> : null}
    </View>
  );
}

function SvgXmlIcon({ name, width, height, tint }: { name: string; width: number; height: number; tint?: string }) {
  const source = figmaIcons[name as keyof typeof figmaIcons] ?? '';
  const xml = tint ? source.replace(/stroke="[^"]+"/g, `stroke="${tint}"`) : source;
  return <SvgXml xml={xml} width={width} height={height} />;
}

const styles = StyleSheet.create({
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
  footer: { backgroundColor: colors.darkCanvas, paddingTop: 0 },
  footerRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  footerNote: { marginTop: 12 },
  genderFooterSpacer: { height: 96 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 34 },
  primaryButton: { height: 52, flex: 1, borderRadius: 10, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  wideButton: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', width: '100%', alignSelf: 'stretch' },
  primaryButtonText: { color: '#080B09', fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  buttonDisabled: { opacity: 0.45 },
  secondaryButton: { height: 48, flex: 1, borderRadius: 10, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  secondaryButtonText: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, textAlign: 'center' },
  backButton: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  ageWheel: { position: 'relative', height: AGE_WHEEL_HEIGHT, marginTop: 91, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, overflow: 'hidden' },
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
  ageActions: { gap: 12, marginTop: 30 },
  selectionHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  selectionPill: { overflow: 'hidden', color: '#080B09', backgroundColor: colors.action, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5, fontFamily: fonts.medium, fontSize: 11, lineHeight: 16 },
  list: { gap: 8 },
  appRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, paddingHorizontal: 14 },
  disabledChoice: { opacity: 0.45 },
  appIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  redditLetter: { color: '#858585', fontFamily: fonts.bold, fontSize: 18 },
  rowCopy: { flex: 1, gap: 2, alignItems: 'flex-start' },
  appDetail: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.light, fontSize: 11, lineHeight: 15 },
  hobbyGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  hobbyCard: { position: 'relative', width: '47.54%', height: 96, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, alignItems: 'center', justifyContent: 'center', gap: 4 },
  hobbyIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  customInput: { height: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, marginTop: 12, paddingHorizontal: 14 },
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
