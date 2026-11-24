import { Image as VectorImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/design/tokens';
import { IntroSurface } from './IntroSurface';
import { introFraction, REQUIRED_GESTURES, type IntroProgress } from './progress';

const arrowVector = require('../../../assets/intro/originals/arrow-white.svg');
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
  const [animation] = useState(() => new Animated.Value(0));
  const [animatedGestures, setAnimatedGestures] = useState(0);
  const trackSwipe = useCallback((fraction: number) => {
    animation.stopAnimation();
    // Follow the finger directly; only settle to the completed third on release.
    if (fraction > 0) animation.setValue(props.progress.gestures + fraction);
    else Animated.timing(animation, { toValue: props.progress.gestures,
      duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [animation, props.progress.gestures]);
  useEffect(() => {
    if (props.reducedMotion) { animation.setValue(props.progress.gestures); return; }
    const motion = Animated.timing(animation, {
      toValue: props.progress.gestures, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true,
    });
    motion.start(({ finished: done }) => { if (done) setAnimatedGestures(props.progress.gestures); });
    return () => motion.stop();
  }, [animation, props.progress.gestures, props.reducedMotion]);
  const ready = props.progress.gestures >= REQUIRED_GESTURES && (props.reducedMotion || animatedGestures >= REQUIRED_GESTURES);
  const fillOffset = animation.interpolate({ inputRange: [0, 3], outputRange: [52, 0], extrapolate: 'clamp' });
  const inverseOffset = Animated.multiply(fillOffset, -1);
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
    <IntroSurface enabled={!finished && props.progress.gestures < REQUIRED_GESTURES && !props.busy} onScrollGesture={props.onScrollGesture} onScrollProgress={trackSwipe}>
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
              <View testID="intro-scroll-animation" style={styles.arrow}>
                <VectorImage testID="intro-arrow-base" source={arrowVector} style={[styles.arrow, styles.upwardArrow]}
                  tintColor={props.progress.section === 0 ? colors.white : colors.darkMuted} contentFit="contain" accessible={false} />
                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                  <Animated.View testID="intro-arrow-green-fill" style={[styles.arrow, { overflow: 'hidden', transform: [{ translateY: fillOffset }] }]}>
                    <Animated.View style={{ transform: [{ translateY: inverseOffset }] }}>
                      <VectorImage testID="intro-arrow-fill-shape" source={arrowVector} style={[styles.arrow, styles.upwardArrow]}
                        tintColor={colors.action} contentFit="contain" accessible={false} />
                    </Animated.View>
                  </Animated.View>
                </View>
              </View>
            </View>
            <View style={[styles.instruction, { bottom }]}>
              {!ready && <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.caption}>
                {props.progress.section === 0 ? 'scroll rapidly to unlock app' : 'keep scrolling!'}
              </Text>}
              {ready && <Pressable accessibilityRole="button" disabled={props.busy} onPress={props.onContinue} style={styles.continue}><Text style={styles.continueText}>Continue</Text></Pressable>}
            </View>

          </>
        )}
        {props.progress.section > 0 && <View style={styles.progressTrack} accessible accessibilityRole="progressbar"
          accessibilityLabel="Introduction progress" accessibilityValue={{ min: 0, max: 100, now: Math.round(introFraction(props.progress) * 100) }}>
          <Animated.View style={{ height: 17, width: '100%', transformOrigin: 'left center',
            transform: [{ scaleX: finished ? 1 : animation.interpolate({ inputRange: [0, 3], outputRange: [0, 1], extrapolate: 'clamp' }) }] }}>
            <LinearGradient colors={[colors.action, colors.success]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: '100%' }]} />
          </Animated.View>
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
  upwardArrow: { transform: [{ rotate: '-90deg' }] },
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
