import { act, renderHook } from '@testing-library/react-native';
import {
  AccessibilityInfo,
  AppState,
  Platform,
  type AppStateStatus,
  type HostInstance,
} from 'react-native';
import { useDialogFocusReturn } from './use-dialog-focus-return';

function setup() {
  const focusListeners: { callback: () => void; remove: jest.Mock }[] = [];
  const stateListeners: { callback: (state: AppStateStatus) => void; remove: jest.Mock }[] = [];
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, callback) => {
    const subscription = { callback, remove: jest.fn() };
    if (event === 'focus') focusListeners.push({ ...subscription, callback: () => callback() });
    else if (event === 'change') stateListeners.push({ ...subscription, callback });
    else throw new Error('Unexpected subscription');
    return subscription;
  });
  const focus = jest.fn();
  const target = { current: { focus } as unknown as HostInstance | null };
  const assistive = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
  return { focusListeners, stateListeners, focus, target, assistive };
}
beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('explicit return waits for Android dismissal focus and settles once', async () => {
  const { target, focus, focusListeners, stateListeners, assistive } = setup();
  const { result } = await renderHook(() => useDialogFocusReturn(target));
  expect(focus).not.toHaveBeenCalled();
  await act(() => result.current());
  if (Platform.OS === 'android') {
    await act(() => {
      focusListeners[0].callback();
      focusListeners[0].callback();
    });
    await act(() => jest.advanceTimersByTime(149));
    expect(focus).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(1));
    expect(focusListeners[0].remove).toHaveBeenCalledTimes(1);
    expect(stateListeners[0].remove).toHaveBeenCalledTimes(1);
    await act(() => focusListeners[0].callback());
  } else {
    expect(focusListeners).toHaveLength(0);
  }
  expect(focus).toHaveBeenCalledTimes(1);
  expect(assistive).toHaveBeenCalledTimes(1);
});

test.each(['unmount', 'background', 'timeout', 'replacement'] as const)(
  '%s cancels a pending Android target and any late callbacks', async (reason) => {
    const { target, focus, focusListeners, stateListeners } = setup();
    const replacement = { current: { focus: jest.fn() } as unknown as HostInstance | null };
    const { result, unmount, rerender } = await renderHook(
      ({ owner }: { owner: typeof target }) => useDialogFocusReturn(owner),
      { initialProps: { owner: target } },
    );
    await act(() => result.current());
    focus.mockClear();
    if (reason === 'unmount') await unmount();
    if (reason === 'replacement') await rerender({ owner: replacement });
    if (Platform.OS === 'android') {
      if (reason === 'background') await act(() => stateListeners[0].callback('background'));
      if (reason === 'timeout') await act(() => jest.advanceTimersByTime(1000));
      await act(() => {
        focusListeners[0].callback();
        jest.advanceTimersByTime(1000);
      });
      expect(focusListeners[0].remove).toHaveBeenCalledTimes(1);
      expect(stateListeners[0].remove).toHaveBeenCalledTimes(1);
    }
    expect(focus).not.toHaveBeenCalled();
    expect(replacement.current?.focus).not.toHaveBeenCalled();
  },
);

test('unmount after the focus event cancels the settle callback', async () => {
  const { target, focus, focusListeners } = setup();
  const { result, unmount } = await renderHook(() => useDialogFocusReturn(target));
  await act(() => result.current());
  focus.mockClear();
  if (Platform.OS === 'android') await act(() => focusListeners[0].callback());
  await unmount();
  await act(() => jest.advanceTimersByTime(1000));
  expect(focus).not.toHaveBeenCalled();
});

test('replacing an explicit request invalidates the prior callback', async () => {
  const { target, focus, focusListeners } = setup();
  const { result } = await renderHook(() => useDialogFocusReturn(target));
  await act(() => result.current());
  await act(() => result.current());
  if (Platform.OS === 'android') {
    await act(() => focusListeners[0].callback());
    expect(focus).not.toHaveBeenCalled();
    await act(() => {
      focusListeners[1].callback();
      jest.advanceTimersByTime(150);
    });
    expect(focus).toHaveBeenCalledTimes(1);
  } else expect(focus).toHaveBeenCalledTimes(2);
});

test('detached targets are safe and rendering alone never requests focus', async () => {
  const { target, focus, focusListeners } = setup();
  const { result } = await renderHook(() => useDialogFocusReturn(target));
  expect(focus).not.toHaveBeenCalled();
  target.current = null;
  await act(() => result.current());
  if (Platform.OS === 'android')
    await act(() => {
      focusListeners[0].callback();
      jest.advanceTimersByTime(150);
    });
  expect(focus).not.toHaveBeenCalled();
});
