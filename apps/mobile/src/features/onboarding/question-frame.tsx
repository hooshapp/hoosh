import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UiThemeProvider } from '@/components/ui/theme';
import { colors, fonts } from '@/design/tokens';

/** Figma 393×852 geometry, with natural reflow/scrolling for smaller screens and larger text. */
export function QuestionFrame({ step, title, children, footer, skip }: {
  step: number; title: string; children: ReactNode; footer: ReactNode; skip?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const bodyHeight = step === 2 ? 524 : step === 3 ? 530 : 465;
  return <UiThemeProvider theme="dark"><SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" contentContainerStyle={[styles.page, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.top}>{skip}</View>
        <View accessible style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={`Onboarding step ${step + 1} of 7`} accessibilityValue={{ min: 1, max: 7, now: step + 1 }}>
          {Array.from({ length: 7 }, (_, i) => <View key={i} style={[styles.segment, i <= step && styles.active]} />)}
        </View>
        <Text style={styles.count}>{step + 1} of 7</Text>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <View style={{ minHeight: bodyHeight, paddingTop: 10 }}>{children}</View>
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView></UiThemeProvider>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas }, page: { paddingHorizontal: 24, flexGrow: 1 },
  top: { height: 32, alignItems: 'flex-end', justifyContent: 'center' },
  progress: { height: 4, flexDirection: 'row', gap: 4 }, segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' }, active: { backgroundColor: colors.action },
  count: { marginTop: 8, fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.action },
  title: { marginTop: 14, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5, color: colors.white },
});
