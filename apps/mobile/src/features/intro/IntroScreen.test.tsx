import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { IntroScreen, type IntroScreenProps } from './IntroScreen';
import { StyleSheet } from 'react-native';
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
it('does not show Continue early when reduced motion is enabled', async () => {
  await render(<IntroScreen {...props({ reducedMotion: true })} />, { wrapper: Wrapper });
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Skip introduction' })).toBeTruthy();
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
  expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(33);
  expect(screen.queryByText(/protected|signed in/i)).toBeNull();
});

it('reveals Continue after the third animation without navigating automatically', async () => {
  const state = props();
  const view = await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  await view.rerender(<IntroScreen {...state} progress={{ section: 1, gestures: 2, distance: 1000 }} />);
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  await view.rerender(<IntroScreen {...state} progress={{ section: 1, gestures: 3, distance: 1100 }} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Continue' }));
  expect(state.onContinue).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('keep scrolling!')).toBeNull();
  expect(state.onExit).not.toHaveBeenCalled();
});

it('keeps native swipes enabled with reduced motion while retaining accessible Continue', async () => {
  const state = props({ reducedMotion: true });
  await render(<IntroScreen {...state} />, { wrapper: Wrapper });
  expect(screen.getByTestId('intro-gesture-surface').props.onMoveShouldSetResponderCapture).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
});

it('aligns both arrow layers using the same vector and upward rotation', async () => {
  await render(<IntroScreen {...props()} />, { wrapper: Wrapper });
  const base = screen.getByTestId('intro-arrow-base');
  const fill = screen.getByTestId('intro-arrow-fill-shape');
  expect(fill.props.source).toEqual(base.props.source);
  expect(StyleSheet.flatten(fill.props.style)).toEqual(StyleSheet.flatten(base.props.style));
  expect(StyleSheet.flatten(fill.props.style).transform).toEqual([{ rotate: '-90deg' }]);
});
