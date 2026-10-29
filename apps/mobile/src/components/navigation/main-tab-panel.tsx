import type { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useFloatingTabBarMetrics } from './floating-tab-bar-metrics';

/** Web ARIA panel association; native accessibility stays on the actual screen content. */
export function MainTabPanel({ routeName, children }: PropsWithChildren<{ routeName: string }>) {
  const prefix = useFloatingTabBarMetrics()?.idPrefix ?? 'main-navigation';
  return (
    <View
      {...(Platform.OS === 'web'
        ? {
            role: 'tabpanel' as const,
            nativeID: `${prefix}-panel-${routeName}`,
            'aria-labelledby': `${prefix}-tab-${routeName}`,
            tabIndex: 0 as const,
          }
        : {})}
      style={styles.panel}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ panel: { flex: 1 } });
