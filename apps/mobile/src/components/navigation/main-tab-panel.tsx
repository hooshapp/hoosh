import type { PropsWithChildren } from 'react';
import { useIsFocused } from 'expo-router/react-navigation';
import { Platform, StyleSheet, View } from 'react-native';

import { useFloatingTabBarMetrics } from './floating-tab-bar-metrics';

/** Web ARIA panel association; native accessibility stays on the actual screen content. */
export function MainTabPanel({ routeName, children }: PropsWithChildren<{ routeName: string }>) {
  const prefix = useFloatingTabBarMetrics()?.idPrefix ?? 'main-navigation';
  const focused = useIsFocused();
  return (
    <View
      {...(Platform.OS === 'web'
        ? {
            role: 'tabpanel' as const,
            nativeID: `${prefix}-panel-${routeName}`,
            'aria-labelledby': `${prefix}-tab-${routeName}`,
            tabIndex: focused ? (0 as const) : (-1 as const),
          }
        : {})}
      accessibilityElementsHidden={!focused}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      aria-hidden={!focused}
      // Keep drafts mounted while removing inactive controls from web keyboard order.
      style={[styles.panel, Platform.OS === 'web' && !focused && styles.hidden]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ panel: { flex: 1 }, hidden: { display: 'none' } });
