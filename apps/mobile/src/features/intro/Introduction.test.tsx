import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Introduction } from './Introduction';
import { INTRO_SEEN_KEY } from './storage';
import type { IntroSurfaceProps } from './IntroSurface.types';

jest.mock('./IntroSurface', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { IntroSurface: ({ children, enabled, onScrollGesture }: IntroSurfaceProps) => React.createElement(View, {
    testID: 'intro-gesture-input', onTouchEnd: () => { if (enabled) onScrollGesture(8); },
  }, children) };
});

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
  jest.mocked(AsyncStorage.setItem).mockResolvedValue(undefined);
});
async function open() {
  await render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}><Introduction /></SafeAreaProvider>);
}
it('shows the first launch and remembers it even if the user later closes mid-story', async () => {
  await open();
  await screen.findByText('scroll rapidly to unlock app');
  await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith(INTRO_SEEN_KEY, 'seen'));
  expect(mockReplace).not.toHaveBeenCalled();
});
it('sends returning launches to signup without flashing the intro or Home', async () => {
  jest.mocked(AsyncStorage.getItem).mockResolvedValue('seen');
  await open();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-up'));
  expect(screen.queryByText('scroll rapidly to unlock app')).toBeNull();
});
it('lets a first-time user skip directly to the existing signup route', async () => {
  await open();
  await screen.findByText('scroll rapidly to unlock app');
  await fireEvent.press(screen.getByRole('button', { name: 'Skip introduction' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-up');
});
it('recovers from blocked storage without trapping the user or claiming a saved flag', async () => {
  jest.mocked(AsyncStorage.getItem).mockRejectedValue(new Error('unavailable'));
  jest.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('unavailable'));
  await open();
  await screen.findByText('We couldn’t remember this introduction on your device.');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue without saving' }));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-up');
});
it('counts all five intentional gestures in each section, even immediately after a transition', async () => {
  await open();
  await screen.findByText('scroll rapidly to unlock app');
  for (let i = 0; i < 5; i++) await fireEvent(screen.getByTestId('intro-gesture-input'), 'touchEnd');
  expect(screen.getByText('keep scrolling!')).toBeTruthy();
  for (let i = 0; i < 5; i++) await fireEvent(screen.getByTestId('intro-gesture-input'), 'touchEnd');
  expect(screen.getByText('welcome!')).toBeTruthy();
});
