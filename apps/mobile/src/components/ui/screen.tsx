import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/design/tokens';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  dark?: boolean;
}>;

export function Screen({ title, subtitle, dark = false, children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.screen, dark && styles.darkScreen]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}>
        <Text accessibilityRole="header" style={[styles.title, dark && styles.darkTitle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, dark && styles.darkSubtitle]}>{subtitle}</Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.warmCanvas },
  darkScreen: { backgroundColor: colors.darkCanvas },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  title: { fontFamily: fonts.bold, fontSize: 30, color: colors.warmForeground },
  darkTitle: { color: colors.white },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  darkSubtitle: { color: colors.darkMuted },
});
