import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { router, Stack, Tabs } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { useState } from 'react';
import { SafeAreaProvider, type EdgeInsets } from 'react-native-safe-area-context';

import TabsLayout from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Quests from '@/app/(tabs)/quests';
import History from '@/app/(tabs)/history';
import Settings from '@/app/(tabs)/settings';
import SignIn from '@/app/(auth)/sign-in';
import { Screen } from '@/components/ui/screen';
import { Field } from '@/components/ui/field';

import { FloatingTabBarProvider } from './floating-tab-bar-metrics';
import { MainTabBar } from './main-tab-bar';

function TestRoot({
  insets = { top: 44, right: 0, bottom: 34, left: 0 },
}: {
  insets?: EdgeInsets;
}) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 393, height: 852 },
        insets,
      }}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

const actualRoutes = {
  _layout: TestRoot,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': Home,
  '(tabs)/quests': Quests,
  '(tabs)/history': History,
  '(tabs)/settings': Settings,
  '(auth)/sign-in': SignIn,
};

describe('Main navigation', () => {
  const originalWindow = Dimensions.get('window');
  beforeEach(() => Dimensions.set({ window: { width: 393, height: 852, scale: 3, fontScale: 1 } }));
  afterEach(async () => {
    await act(() => Dimensions.set({ window: originalWindow }));
  });
  it('hides an inactive panel from accessibility without discarding its unsaved input', async () => {
    function DraftHome() {
      const [draft, setDraft] = useState('');
      return (
        <Screen title="Draft screen">
          <Field label="Local draft" value={draft} onChangeText={setDraft} />
        </Screen>
      );
    }
    await renderRouter({ ...actualRoutes, '(tabs)/index': DraftHome });
    await fireEvent.changeText(screen.getByLabelText('Local draft'), 'Retained task draft');
    await userEvent.press(screen.getByRole('tab', { name: 'Quests' }));
    expect(screen.queryByLabelText('Local draft')).toBeNull();
    await userEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(screen.getByLabelText('Local draft')).toHaveDisplayValue('Retained task draft');
  });

  it('navigates every actual tab, labels only the active tab and preserves visited-tab back history', async () => {
    await renderRouter(actualRoutes);
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    expect(screen.queryByText('Quests')).not.toBeOnTheScreen();
    for (const [tab, heading] of [
      ['Quests', 'Your Quests'],
      ['History', 'Your stats'],
      ['Settings', 'Settings'],
    ] as const) {
      await userEvent.press(screen.getByRole('tab', { name: tab }));
      expect(await screen.findByRole('header', { name: heading })).toBeVisible();
      expect(screen.getByRole('tab', { name: tab })).toBeSelected();
      expect(screen.getAllByRole('tab')).toHaveLength(4);
      if (tab === 'History') await userEvent.press(screen.getByRole('tab', { name: tab }));
    }
    for (const tab of ['History', 'Quests', 'Home']) {
      await act(() => router.back());
      expect(screen.getByRole('tab', { name: tab })).toBeSelected();
    }
    expect(screen).toHavePathname('/');
  });

  it.each([
    ['/', 'Home'],
    ['/quests', 'Quests'],
    ['/history', 'History'],
    ['/settings', 'Settings'],
  ])('resolves a direct link to %s without changing the route group', async (initialUrl, tab) => {
    await renderRouter(actualRoutes, { initialUrl });
    expect(screen.getByRole('tab', { name: tab })).toBeSelected();
    expect(screen).toHavePathname(initialUrl);
  });

  it('keeps auth outside the tab shell and returns to the selected settings tab', async () => {
    await renderRouter(actualRoutes, { initialUrl: '/settings' });
    expect(screen.queryByRole('link', { name: 'View sign-in screen' })).toBeNull();
    await act(() => router.push('/(auth)/sign-in'));
    expect(await screen.findByRole('header', { name: 'Welcome back' })).toBeVisible();
    expect(screen.queryByRole('tab', { name: 'Settings' })).not.toBeOnTheScreen();
    await act(() => router.back());
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeSelected();
    expect(screen.getByRole('header', { name: 'Your account' })).toBeVisible();
  });

  it('honors cancellable tabPress and tabLongPress events without replacing the navigator', async () => {
    const onPress = jest.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const onLongPress = jest.fn();
    await renderRouter({
      ...actualRoutes,
      '(tabs)/_layout': () => (
        <FloatingTabBarProvider>
          <Tabs
            tabBar={(props) => <MainTabBar {...props} />}
            screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="index" />
            <Tabs.Screen
              name="quests"
              listeners={{ tabPress: onPress, tabLongPress: onLongPress }}
            />
          </Tabs>
        </FloatingTabBarProvider>
      ),
    });
    await userEvent.press(screen.getByRole('tab', { name: 'Quests' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
    await fireEvent(screen.getByRole('tab', { name: 'Quests' }), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('uses the measured large-text bar height with the safe inset exactly once', async () => {
    await renderRouter({
      ...actualRoutes,
      '(tabs)/index': () => <Screen title="Content" testID="main-content" />,
    });
    expect(screen.queryByText('Quests')).not.toBeOnTheScreen();
    await act(() =>
      Dimensions.set({ window: { width: 320, height: 568, scale: 3, fontScale: 2 } }),
    );
    for (const tab of ['Home', 'Quests', 'History', 'Settings'])
      expect(screen.getByText(tab)).toBeVisible();
    expect(screen.getByTestId('main-tab-bar')).toHaveStyle({ bottom: 34, flexWrap: 'wrap' });
    await fireEvent(screen.getByTestId('main-tab-bar'), 'layout', {
      nativeEvent: { layout: { x: 20, y: 384, width: 280, height: 150 } },
    });
    expect(screen.getByTestId('main-content').props.contentContainerStyle).toEqual(
      expect.arrayContaining([{ paddingBottom: 208 }]),
    );
    await fireEvent(screen.getByTestId('main-tab-bar'), 'layout', {
      nativeEvent: { layout: { x: 20, y: 456, width: 280, height: 78 } },
    });
    expect(screen.getByTestId('main-content').props.contentContainerStyle).toEqual(
      expect.arrayContaining([{ paddingBottom: 136 }]),
    );
  });

  it('reveals the destination name if a local image fails and keeps the tab usable', async () => {
    await renderRouter(actualRoutes);
    await fireEvent(
      screen.getByTestId('main-tab-icon-quests', { includeHiddenElements: true }),
      'error',
      { nativeEvent: { error: 'Image unavailable' } },
    );
    expect(screen.getByText('Quests')).toBeVisible();
    await userEvent.press(screen.getByRole('tab', { name: 'Quests' }));
    expect(await screen.findByRole('header', { name: 'Your Quests' })).toBeVisible();
  });

  it('respects horizontal safe areas and keeps the design bottom gap when there is no bottom inset', async () => {
    await renderRouter({
      ...actualRoutes,
      _layout: () => <TestRoot insets={{ top: 44, right: 12, bottom: 0, left: 10 }} />,
    });
    expect(screen.getByTestId('main-tab-bar')).toHaveStyle({ left: 30, right: 32, bottom: 28 });
    expect(screen.getByRole('tab', { name: 'Home' })).toBeSelected();
  });
});
