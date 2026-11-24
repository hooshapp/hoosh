import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@/design/tokens';

export const PLAN_LOADING_FILL_MS = 5500;
export const PLAN_LOADING_HOLD_MS = 500;
/** Native transform animation: two clipped semicircles reveal a continuous clockwise fill. */
export function PlanLoadingRing({ onComplete }: { onComplete?: () => void }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReducedMotion(value); }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { active = false; listener.remove(); };
  }, []);
  useEffect(() => {
    let active = true;
    const started = Date.now();
    let completionTimer: ReturnType<typeof setTimeout> | undefined;
    progress.setValue(reducedMotion ? 1 : 0);
    const motion = Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: reducedMotion ? 0 : PLAN_LOADING_FILL_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.delay(reducedMotion ? PLAN_LOADING_FILL_MS + PLAN_LOADING_HOLD_MS : PLAN_LOADING_HOLD_MS),
    ]);
    motion.start(({ finished }) => {
      if (!finished || !active) return;
      // Native accessibility/animation settings can complete animations immediately.
      // Keep the presentation duration independently of that completion signal.
      const remaining = Math.max(0, PLAN_LOADING_FILL_MS + PLAN_LOADING_HOLD_MS - (Date.now() - started));
      completionTimer = setTimeout(() => { if (active) onComplete?.(); }, remaining);
    });
    return () => { active = false; clearTimeout(completionTimer); motion.stop(); };
  }, [progress, reducedMotion, onComplete]);
  const right = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-180deg', '0deg', '0deg'], extrapolate: 'clamp' });
  const left = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '0deg', '180deg'], extrapolate: 'clamp' });
  const tip = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <View pointerEvents="none" accessible={false} style={s.frame} testID="plan-loading-ring">
    <View style={[s.clip, { left: 80 }]}><Animated.View style={[s.rotor, { left: -80, transform: [{ rotate: right }] }]}><View style={s.half}><View style={s.stroke} /></View></Animated.View></View>
    <View style={[s.clip, { left: 0 }]}><Animated.View style={[s.rotor, { left: 0, transform: [{ rotate: left }] }]}><View style={s.half}><View style={s.stroke} /></View></Animated.View></View>
    <Animated.View style={[s.rotor, { transform: [{ rotate: tip }] }]}><View style={s.tip} /></Animated.View>
  </View>;
}
const s = StyleSheet.create({
  frame: { position: 'absolute', left: 8, top: 8, width: 160, height: 160 },
  clip: { position: 'absolute', width: 80, height: 160, overflow: 'hidden' },
  rotor: { position: 'absolute', width: 160, height: 160 },
  half: { position: 'absolute', left: 80, width: 80, height: 160, overflow: 'hidden' },
  stroke: { position: 'absolute', left: -80, width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: colors.action },
  tip: { position: 'absolute', left: 76, top: -2.5, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.action },
});
