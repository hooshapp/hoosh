import { AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Introduction } from './Introduction';

const mockReplace = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

let timestamp = 1;
beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  timestamp = 1;
});

async function open() {
  await render(
    <SafeAreaProvider initialMetrics={{
      frame: { x: 0, y: 0, width: 393, height: 852 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}>
      <Introduction />
    </SafeAreaProvider>,
  );
  await screen.findByText('scroll rapidly to unlock app');
}

// Feed the real RN PanResponder, including its capture/grant handoff. The older
// Introduction test replaces IntroSurface and cannot catch movement lost at grant.
function touch(x: number, y: number, previousX: number, previousY: number) {
  const currentTimeStamp = timestamp++;
  return {
    nativeEvent: { touches: [{ identifier: 0, pageX: x, pageY: y }] },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: currentTimeStamp,
      touchBank: [{
        touchActive: true,
        startPageX: 100, startPageY: 300, startTimeStamp: currentTimeStamp - 1,
        currentPageX: x, currentPageY: y, currentTimeStamp,
        previousPageX: previousX, previousPageY: previousY,
        previousTimeStamp: currentTimeStamp - 1,
      }],
    },
  };
}

async function swipe(dx: number, dy: number, options: { finishY?: number; cancel?: boolean } = {}) {
  const surface = screen.getByTestId('intro-gesture-surface');
  let claimed = false;
  await act(() => {
    surface.props.onStartShouldSetResponderCapture(touch(100, 300, 100, 300));
    const first = touch(100 + dx, 300 + dy, 100, 300);
    claimed = surface.props.onMoveShouldSetResponderCapture(first);
    if (!claimed) claimed = surface.props.onMoveShouldSetResponder(first);
    if (!claimed) return;
    surface.props.onResponderGrant(first);
    if (options.finishY !== undefined) {
      surface.props.onResponderMove(
        touch(100 + dx, 300 + options.finishY, 100 + dx, 300 + dy));
    }
    if (options.cancel) surface.props.onResponderTerminate(first);
    else surface.props.onResponderRelease(first);
  });
  return claimed;
}

it('captures three native upward drags and then requires Continue', async () => {
  await open();
  expect(await swipe(0, -8, { finishY: -100 })).toBe(true);
  expect(await swipe(0, -8, { finishY: -100 })).toBe(true);
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  expect(await swipe(0, -8, { finishY: -100 })).toBe(true);
  await fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
  expect(screen.getByText('welcome!')).toBeVisible();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-up');
});
it('captures vertical drags before children but ignores horizontal, downward and canceled input', async () => {
  await open();
  expect(await swipe(100, -20)).toBe(false);
  expect(await swipe(0, 100)).toBe(false);
  await swipe(0, -8, { cancel: true });
  expect(screen.getByText('scroll rapidly to unlock app')).toBeVisible();
  await swipe(0, -8); await swipe(0, -8);
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  await swipe(0, -8);
  expect(await screen.findByRole('button', { name: 'Continue' })).toBeVisible();
});

it('still accepts upward swipes when Reduce Motion is enabled on the phone', async () => {
  const reduce = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  try {
    await open();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(await swipe(0, -8, { finishY: -100 })).toBe(true);
    expect(screen.getByText('keep scrolling!')).toBeVisible();
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(33);
    await swipe(0, -8); await swipe(0, -8);
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(100);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('welcome!')).toBeVisible();
  } finally { reduce.mockRestore(); }
});
