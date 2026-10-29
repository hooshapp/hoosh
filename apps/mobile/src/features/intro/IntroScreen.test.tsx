import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { IntroScreen, type IntroScreenProps } from './IntroScreen';
import { INITIAL_PROGRESS } from './progress';

function Wrapper({ children }: PropsWithChildren) {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, left: 0, bottom: 0, right: 0 } }}>{children}</SafeAreaProvider>;
}
function props(overrides: Partial<IntroScreenProps> = {}): IntroScreenProps {
  return { progress: INITIAL_PROGRESS, reducedMotion: false, busy: false, storageError: false,
    onScrollGesture: jest.fn(), onContinue: jest.fn(), onExit: jest.fn(), onRetry: jest.fn(), onContinueUnsaved: jest.fn(), ...overrides };
}
it('allows immediate skipping without requiring gestures', async () => {
  const state = props();
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Skip introduction' }));
  expect(state.onExit).toHaveBeenCalledTimes(1);
});
it('provides a non-gesture path for reduced motion and screen readers', async () => {
  const state = props({ reducedMotion: true });
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(state.onContinue).toHaveBeenCalledTimes(1);
});
it('renders the final Figma copy and signup destination action', async () => {
  const state = props({ progress: { section: 2, distance: 0, gestures: 0 } });
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  expect(screen.getByText('welcome!')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Skip introduction' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));
  expect(state.onExit).toHaveBeenCalledTimes(1);
});
it('prevents repeated signup actions while saving', async () => {
  const state = props({ progress: { section: 2, distance: 0, gestures: 0 }, busy: true });
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Sign up' }));
  expect(state.onExit).not.toHaveBeenCalled();
});
it('offers both retry and escape when device storage fails', async () => {
  const state = props({ storageError: true });
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue without saving' }));
  expect(state.onRetry).toHaveBeenCalledTimes(1);
  expect(state.onContinueUnsaved).toHaveBeenCalledTimes(1);
});
it('announces progress without claiming protection or account completion', async () => {
  await render(<IntroScreen {...props({ progress: { section: 1, distance: 80, gestures: 1 } })} />, { wrapper: Wrapper });
  expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(75);
  expect(screen.queryByText(/protected|signed in/i)).toBeNull();
});
