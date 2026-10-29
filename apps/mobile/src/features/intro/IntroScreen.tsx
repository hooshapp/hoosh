import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/design/tokens';
import { IntroSurface } from './IntroSurface';
import { introFraction, type IntroProgress } from './progress';

const arrowWhite = require('../../../assets/intro/arrow-white.png');
const arrowMuted = require('../../../assets/intro/arrow-muted.png');
const dinosaur = require('../../../assets/intro/dinosaur.png');

export type IntroScreenProps = {
  progress: IntroProgress;
  reducedMotion: boolean;
  busy: boolean;
  storageError: boolean;
  onScrollGesture(distance: number): void;
  onContinue(): void;
  onExit(): void;
  onRetry(): void;
  onContinueUnsaved(): void;
};

export function IntroScreen(props: IntroScreenProps) {
  const { height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const finished = props.progress.section === 2;
  const compact = height < 650 || fontScale > 1.4;
  const bottom = Math.max(insets.bottom + 24, height * 0.089);
  const story = (
    <View style={[styles.story, !compact && { paddingTop: height * 0.28 }]}>
      <Image source={dinosaur} style={styles.dinosaur} resizeMode="contain" accessible={false} />
      <Text style={[styles.caption, { marginTop: compact ? 28 : height * 0.102 }]} accessibilityRole="header">welcome!</Text>
      <Text style={[styles.caption, styles.finishedCopy]}>you have finished{ '\n' }<Text style={styles.bold}>ALL YOUR SCROLLS</Text></Text>
    </View>
  );
  return (
    <IntroSurface enabled={!finished && !props.reducedMotion} onScrollGesture={props.onScrollGesture}>
      <View style={styles.screen}>
        {!finished && (
          <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" disabled={props.busy}
            onPress={props.onExit} style={[styles.skip, { top: insets.top + 12 }]}>
            {props.busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.skipText}>Skip</Text>}
          </Pressable>
        )}
        {props.storageError && (
          <View style={[styles.warning, { top: insets.top + 64 }]} accessibilityLiveRegion="polite">
            <Text style={styles.warningText}>We couldn’t remember this introduction on your device.</Text>
            <View style={styles.recoveryActions}>
              <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onRetry} style={styles.recoveryButton}><Text style={styles.warningText}>Retry</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={props.onContinueUnsaved} style={styles.recoveryButton}><Text style={styles.warningText}>Continue without saving</Text></Pressable>
            </View>
          </View>
        )}
        {finished ? (
          <>
            {compact ? <ScrollView contentContainerStyle={styles.compactStory}>{story}</ScrollView> : story}
            <Pressable accessibilityRole="button" accessibilityLabel="Sign up" disabled={props.busy} onPress={props.onExit}
              style={[styles.signup, { bottom }]}>
              {props.busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.signupText}>SIGN UP</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <View pointerEvents="none" style={styles.arrowContainer}>
              <Image source={props.progress.section === 0 ? arrowWhite : arrowMuted} style={styles.arrow} resizeMode="contain" accessible={false} />
            </View>
            <View style={[styles.instruction, { bottom }]}>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.caption}>
                {props.progress.section === 0 ? 'scroll rapidly to unlock app' : 'keep scrolling!'}
              </Text>
              {props.reducedMotion && <Pressable accessibilityRole="button" onPress={props.onContinue} style={styles.continue}><Text style={styles.continueText}>Continue</Text></Pressable>}
            </View>
          </>
        )}
        {props.progress.section > 0 && <View style={styles.progressTrack} accessible accessibilityRole="progressbar"
          accessibilityLabel="Introduction progress" accessibilityValue={{ min: 0, max: 100, now: Math.round(introFraction(props.progress) * 100) }}>
          <LinearGradient colors={[colors.action, colors.success]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${introFraction(props.progress) * 100}%` }]} />
        </View>}
      </View>
    </IntroSurface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas, minHeight: 320 },
  skip: { position: 'absolute', right: 16, minWidth: 52, minHeight: 44, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  skipText: { color: colors.darkMuted, fontFamily: fonts.regular, fontSize: 14 },
  arrowContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  arrow: { width: 52, height: 52 },
  instruction: { position: 'absolute', left: 20, right: 20, alignItems: 'center', gap: 12 },
  caption: { fontFamily: fonts.regular, color: colors.white, fontSize: 18, textAlign: 'center', flexShrink: 1 },
  story: { alignItems: 'center', paddingHorizontal: 24 },
  compactStory: { flexGrow: 1, paddingTop: 100, paddingBottom: 160, justifyContent: 'center' },
  dinosaur: { width: 151, height: 136 },
  finishedCopy: { marginTop: 16 },
  bold: { fontFamily: fonts.bold },
  signup: { position: 'absolute', width: 151, minHeight: 48, paddingVertical: 11, paddingHorizontal: 12, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: colors.action },
  signupText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white, textAlign: 'center' },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 17 },
  progressFill: { height: 17, borderTopRightRadius: 8.5, borderBottomRightRadius: 8.5 },
  continue: { minHeight: 44, paddingHorizontal: 24, justifyContent: 'center' },
  continueText: { fontFamily: fonts.medium, fontSize: 16, color: colors.action },
  warning: { position: 'absolute', left: 16, right: 16, padding: 12, backgroundColor: colors.darkCard, borderRadius: 10, zIndex: 3 },
  warningText: { fontFamily: fonts.regular, fontSize: 13, color: colors.white },
  recoveryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  recoveryButton: { minHeight: 44, justifyContent: 'center' },
});
