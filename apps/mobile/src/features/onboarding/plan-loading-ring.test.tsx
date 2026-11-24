import { render, act } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { PlanLoadingRing, PLAN_LOADING_FILL_MS, PLAN_LOADING_HOLD_MS } from './plan-loading-ring';
it('waits for the complete animation and never advances after cancellation', async () => {
  jest.useFakeTimers();
  let complete: ((result: { finished: boolean }) => void) | undefined;
  const stop = jest.fn();
  const sequence = jest.spyOn(Animated, 'sequence').mockReturnValue({ start: callback => { complete = callback; }, stop, reset: jest.fn() });
  const timing = jest.spyOn(Animated, 'timing');
  const done = jest.fn();
  const view = await render(<PlanLoadingRing onComplete={done} />);
  expect(PLAN_LOADING_FILL_MS + PLAN_LOADING_HOLD_MS).toBe(6000);
  expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: PLAN_LOADING_FILL_MS, useNativeDriver: true }));
  expect(done).not.toHaveBeenCalled();
  await act(async () => complete?.({ finished: false }));
  expect(done).not.toHaveBeenCalled();
  await act(async () => complete?.({ finished: true }));
  expect(done).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(5999));
  expect(done).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(done).toHaveBeenCalledTimes(1);
  await view.unmount();
  expect(stop).toHaveBeenCalled();
  sequence.mockRestore(); timing.mockRestore(); jest.useRealTimers();
});

it('preserves the six-second loading page when Reduce Motion skips the sweep', async () => {
  jest.useFakeTimers();
  const reduced = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  const sequence = jest.spyOn(Animated, 'sequence').mockReturnValue({ start: callback => callback?.({ finished: true }), stop: jest.fn(), reset: jest.fn() });
  const done = jest.fn();
  const view = await render(<PlanLoadingRing onComplete={done} />);
  await act(async () => jest.advanceTimersByTime(5999));
  expect(done).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(done).toHaveBeenCalledTimes(1);
  await view.unmount(); reduced.mockRestore(); sequence.mockRestore(); jest.useRealTimers();
});
