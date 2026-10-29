import { Tabs } from 'expo-router';

import { FloatingTabBarProvider } from '@/components/navigation/floating-tab-bar-metrics';
import { MainTabBar } from '@/components/navigation/main-tab-bar';
import { MainTabPanel } from '@/components/navigation/main-tab-panel';

export default function TabsLayout() {
  return (
    <FloatingTabBarProvider>
      <Tabs
        backBehavior="history"
        tabBar={(props) => <MainTabBar {...props} />}
        screenLayout={({ children, route }) => (
          <MainTabPanel routeName={route.name}>{children}</MainTabPanel>
        )}
        screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="quests" options={{ title: 'Quests' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </FloatingTabBarProvider>
  );
}
