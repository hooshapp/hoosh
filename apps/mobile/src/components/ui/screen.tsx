import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, uiRecipes } from '@/design/tokens';
import { useFloatingTabBarMetrics } from '@/components/navigation/floating-tab-bar-metrics';

import { UiThemeProvider } from './theme';

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  dark?: boolean;
  /** Space occupied by an overlapping footer/tab bar; zero for a standalone form. */
  bottomClearance?: number;
  keyboardVerticalOffset?: number;
  testID?: string;
}>;

export function Screen({
  title,
  subtitle,
  dark = false,
  bottomClearance,
  keyboardVerticalOffset = 0,
  testID,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarMetrics = useFloatingTabBarMetrics();
  const clearance = bottomClearance ?? tabBarMetrics?.clearance ?? 0;
  const theme = uiRecipes[dark ? 'dark' : 'warm'];
  return (
    <UiThemeProvider theme={dark ? 'dark' : 'warm'}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.screen, { backgroundColor: theme.canvas }]}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={
            Platform.OS === 'web' ? undefined : Platform.OS === 'ios' ? 'padding' : 'height'
          }
          keyboardVerticalOffset={keyboardVerticalOffset}>
          <ScrollView
            testID={testID}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 24 + clearance },
            ]}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
            ) : null}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </UiThemeProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },
  title: { fontFamily: fonts.bold, fontSize: 30 },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
