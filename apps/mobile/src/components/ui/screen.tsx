import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  /** Undefined keeps the standard heading; null is for a source layout without one. */
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({
  title,
  subtitle,
  dark = false,
  bottomClearance,
  keyboardVerticalOffset = 0,
  testID,
  header,
  contentStyle,
  children,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarMetrics = useFloatingTabBarMetrics();
  const clearance = bottomClearance ?? tabBarMetrics?.clearance ?? 0;
  // Android scroll-to-focus uses the actual viewport, not trailing content padding.
  // Exclude the floating footer so keyboard/TalkBack focus cannot land behind it.
  const footerViewport =
    Platform.OS === 'android' && clearance > 0 ? clearance + insets.bottom : 0;
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
            style={footerViewport > 0 ? { marginBottom: footerViewport } : undefined}
            accessibilityLabel={Platform.OS === 'android' ? undefined : title}
            accessible={Platform.OS === 'android' ? false : undefined}
            {...(Platform.OS === 'web' ? { role: 'region' as const } : {})}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={[
              styles.content,
              contentStyle,
              { paddingBottom: insets.bottom + 24 + clearance - footerViewport },
            ]}>
            {header === undefined ? (
              <>
                <Text
                  accessibilityRole="header"
                  style={[styles.title, { color: theme.foreground }]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
                ) : null}
              </>
            ) : (
              header
            )}
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
