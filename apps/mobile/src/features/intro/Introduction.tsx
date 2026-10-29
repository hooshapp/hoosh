import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '@/design/tokens';
import { IntroScreen } from './IntroScreen';
import { INITIAL_PROGRESS, SECTION_DISTANCE, scrollIntro, type IntroProgress } from './progress';
import { hasSeenIntro, rememberIntro } from './storage';

export function Introduction() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState<IntroProgress>(INITIAL_PROGRESS);
  const current = useRef(INITIAL_PROGRESS);
  const remembered = useRef(false);
  const saving = useRef<Promise<boolean> | null>(null);
  const mounted = useRef(true);
  const exiting = useRef(false);

  const saveSeen = useCallback((): Promise<boolean> => {
    if (saving.current) return saving.current;
    saving.current = (async () => {
      try {
        await rememberIntro(AsyncStorage);
        remembered.current = true;
        if (mounted.current) setStorageError(false);
        return true;
      } catch {
        if (mounted.current) setStorageError(true);
        return false;
      } finally {
        saving.current = null;
      }
    })();
    return saving.current;
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    void (async () => {
      try {
        if (await hasSeenIntro(AsyncStorage)) {
          if (!cancelled) router.replace('/(auth)/sign-up');
          return;
        }
      } catch { if (!cancelled) setStorageError(true); }
      if (!cancelled) {
        setLoading(false);
        // First launch only, even if the app is closed midway through the story.
        void saveSeen();
      }
    })();
    return () => { cancelled = true; mounted.current = false; };
  }, [router, saveSeen]);

  useEffect(() => {
    let active = true;
    let motion = false;
    let reader = false;
    const update = () => { if (active) setReducedMotion(motion || reader); };
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { motion = value; update(); }).catch(() => undefined);
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { reader = value; update(); }).catch(() => undefined);
    const a = AccessibilityInfo.addEventListener('reduceMotionChanged', value => { motion = value; update(); });
    const b = AccessibilityInfo.addEventListener('screenReaderChanged', value => { reader = value; update(); });
    return () => { active = false; a.remove(); b.remove(); };
  }, []);

  const scroll = useCallback((distance: number) => {
    const next = scrollIntro(current.current, distance);
    current.current = next;
    setProgress(next);
  }, []);

  const exit = useCallback(async () => {
    if (exiting.current) return;
    exiting.current = true;
    setBusy(true);
    if (remembered.current || await saveSeen()) {
      if (mounted.current) router.replace('/(auth)/sign-up');
    }
    if (mounted.current) setBusy(false);
    exiting.current = false;
  }, [router, saveSeen]);

  if (loading) return <View style={styles.loading}><StatusBar style="light" /><ActivityIndicator color={colors.action} /><Text style={styles.loadingText}>Opening Disconnect…</Text></View>;
  return <><StatusBar style="light" /><IntroScreen progress={progress} reducedMotion={reducedMotion} busy={busy} storageError={storageError}
    onScrollGesture={scroll} onContinue={() => scroll(SECTION_DISTANCE)} onExit={() => { void exit(); }}
    onRetry={() => {
      if (exiting.current) return;
      setBusy(true);
      void saveSeen().finally(() => { if (mounted.current) setBusy(false); });
    }} onContinueUnsaved={() => router.replace('/(auth)/sign-up')} /></>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.darkCanvas, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: fonts.regular, color: colors.white, fontSize: 14 },
});
