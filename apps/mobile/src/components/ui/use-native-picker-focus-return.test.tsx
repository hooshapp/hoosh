import { act, renderHook } from '@testing-library/react-native';
import { AppState, Platform, type HostInstance } from 'react-native';
import { focusControl } from './focus-control';
import { useNativePickerFocusReturn } from './use-native-picker-focus-return';
jest.mock('./focus-control', () => ({ focusControl: jest.fn() }));
const originalState = Object.getOwnPropertyDescriptor(AppState, 'currentState');
function setup() {
  const events: Record<string, (value?: string) => void> = {};
  const removed: jest.Mock[] = [];
  Object.defineProperty(AppState, 'currentState', { configurable: true, writable: true, value: 'active' });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, callback) => {
    events[event] = callback as (value?: string) => void;
    const remove = jest.fn(); removed.push(remove); return { remove };
  });
  const target = { current: {} as HostInstance | null };
  return { events, removed, target };
}
beforeEach(() => { jest.useFakeTimers(); jest.mocked(focusControl).mockClear(); });
afterEach(() => {
  jest.useRealTimers(); jest.restoreAllMocks();
  if (originalState) Object.defineProperty(AppState, 'currentState', originalState);
});

test('long-running picker never times out its return request before it actually closes', async () => {
  const { events, target } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: false } });
  await view.rerender({ busy: true });
  await act(() => { events.blur?.(); jest.advanceTimersByTime(5000); events.focus?.(); });
  expect(focusControl).not.toHaveBeenCalled();
  await view.rerender({ busy: false }); await act(() => jest.advanceTimersByTime(150));
  expect(focusControl).toHaveBeenCalledTimes(1); expect(focusControl).toHaveBeenCalledWith(target.current);
});
const androidTest = Platform.OS === 'android' ? test : test.skip;
androidTest('Promise may settle before native window focus; wait for both', async () => {
  const { events, target } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: true } });
  await act(() => events.blur()); await view.rerender({ busy: false });
  await act(() => jest.advanceTimersByTime(200)); expect(focusControl).not.toHaveBeenCalled();
  await act(() => { events.focus(); jest.advanceTimersByTime(149); }); expect(focusControl).not.toHaveBeenCalled();
  await act(() => jest.advanceTimersByTime(1)); expect(focusControl).toHaveBeenCalledTimes(1);
});
androidTest('missing window focus expires without stealing focus after a later return', async () => {
  const { events, target } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: true } });
  await act(() => events.blur()); await view.rerender({ busy: false });
  await act(() => { jest.advanceTimersByTime(1001); events.focus(); jest.advanceTimersByTime(200); });
  expect(focusControl).not.toHaveBeenCalled();
});
test('backgrounding cancels return and ordinary foreground/read updates do not focus', async () => {
  const { events, target } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: true } });
  await act(() => { events.change('background'); }); await view.rerender({ busy: false });
  await act(() => { events.change('active'); events.focus?.(); jest.advanceTimersByTime(5000); });
  expect(focusControl).not.toHaveBeenCalled();
});
test('unmount cancels settlement and removes every listener', async () => {
  const { events, target, removed } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: true } });
  await act(() => events.focus?.()); await view.rerender({ busy: false }); await view.unmount();
  await act(() => jest.advanceTimersByTime(5000));
  expect(focusControl).not.toHaveBeenCalled(); expect(removed.every((remove) => remove.mock.calls.length === 1)).toBe(true);
});
test('ordinary rendering and unrelated focus events never schedule a return', async () => {
  const { events, target } = setup(); await renderHook(() => useNativePickerFocusReturn(target, false));
  await act(() => { events.focus?.(); jest.advanceTimersByTime(5000); }); expect(focusControl).not.toHaveBeenCalled();
});
test('replacement picker cancels the previous close and returns once after its own close', async () => {
  const { events, target } = setup();
  const view = await renderHook(({ busy }: { busy: boolean }) => useNativePickerFocusReturn(target, busy), { initialProps: { busy: true } });
  await view.rerender({ busy: false }); await view.rerender({ busy: true });
  await act(() => { events.focus?.(); jest.advanceTimersByTime(1000); }); expect(focusControl).not.toHaveBeenCalled();
  await view.rerender({ busy: false }); await act(() => jest.advanceTimersByTime(150));
  expect(focusControl).toHaveBeenCalledTimes(1);
});
