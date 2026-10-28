import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/design/tokens';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onAction,
        tabBarInactiveTintColor: '#CCCCCC',
        // Text-only scaffold. Add the original Figma vector icons during UI implementation.
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarLabel: ({ focused, children }) => (
          <View style={[styles.pill, focused && styles.activePill]}>
            <Text style={[styles.label, focused && styles.activeLabel]}>{children}</Text>
          </View>
        ),
        tabBarItemStyle: { marginHorizontal: 2 },
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(insets.bottom, 16),
          height: 62,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 8,
          borderTopWidth: 0,
          borderRadius: 31,
          backgroundColor: colors.darkNav,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePill: { backgroundColor: colors.action },
  label: { fontFamily: fonts.bold, fontSize: 12, color: '#CCCCCC' },
  activeLabel: { color: colors.onAction },
});
