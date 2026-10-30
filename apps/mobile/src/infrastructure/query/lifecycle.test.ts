import { focusManager, onlineManager } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { attachQueryLifecycle, connectivityOnline, type QueryLifecycleSource } from './lifecycle';
import { platformQueryLifecycle } from './platform-lifecycle';

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const stop of cleanups.splice(0).reverse()) stop();
  vi.unstubAllGlobals();
});
function source() {
  let focus!: (value: boolean) => void;
  let online!: (value: boolean) => void;
  const stopFocus = vi.fn();
  const stopOnline = vi.fn();
  const adapter: QueryLifecycleSource = {
    focus: vi.fn((notify) => {
      focus = notify;
      return stopFocus;
    }),
    online: vi.fn((notify) => {
      online = notify;
      return stopOnline;
    }),
  };
  return {
    adapter,
    stopFocus,
    stopOnline,
    focus: (v: boolean) => focus(v),
    online: (v: boolean) => online(v),
  };
}
describe('query lifecycle registration', () => {
  it('ignores callbacks from a disposed owner after another owner takes over', () => {
    const old = source();
    const stop = attachQueryLifecycle(old.adapter);
    cleanups.push(stop);
    stop();
    const current = source();
    cleanups.push(attachQueryLifecycle(current.adapter));
    current.focus(true);
    current.online(true);
    old.focus(false);
    old.online(false);
    expect(focusManager.isFocused()).toBe(true);
    expect(onlineManager.isOnline()).toBe(true);
  });
  it.each(['focus', 'online'] as const)(
    'ignores callbacks after %s registration fails and permits a clean retry',
    (stage) => {
      const events = source();
      let late!: (value: boolean) => void;
      events.adapter[stage] = (notify) => {
        late = notify;
        notify(false);
        throw new Error('registration failed');
      };
      expect(() => attachQueryLifecycle(events.adapter)).toThrow('registration failed');
      const current = source();
      cleanups.push(attachQueryLifecycle(current.adapter));
      current.focus(true);
      current.online(true);
      late(false);
      expect(focusManager.isFocused()).toBe(true);
      expect(onlineManager.isOnline()).toBe(true);
    },
  );
  it('releases both listeners and resets ownership even when a disposer throws', () => {
    const events = source();
    events.stopFocus.mockImplementation(() => {
      throw new Error('cleanup failed');
    });
    const stop = attachQueryLifecycle(events.adapter);
    cleanups.push(stop);
    expect(stop).toThrow('cleanup failed');
    expect(events.stopOnline).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
    const current = source();
    cleanups.push(attachQueryLifecycle(current.adapter));
    current.focus(true);
    current.online(true);
    events.focus(false);
    events.online(false);
    expect(focusManager.isFocused()).toBe(true);
    expect(onlineManager.isOnline()).toBe(true);
  });
  it('installs once, forwards hints, ref-counts cleanup and allows a clean remount', () => {
    const events = source();
    const stop1 = attachQueryLifecycle(events.adapter);
    const stop2 = attachQueryLifecycle(events.adapter);
    cleanups.push(stop1, stop2);
    expect(events.adapter.focus).toHaveBeenCalledTimes(1);
    expect(events.adapter.online).toHaveBeenCalledTimes(1);
    events.focus(false);
    events.online(false);
    expect(focusManager.isFocused()).toBe(false);
    expect(onlineManager.isOnline()).toBe(false);
    stop1();
    stop1();
    expect(events.stopFocus).not.toHaveBeenCalled();
    stop2();
    expect(events.stopFocus).toHaveBeenCalledTimes(1);
    expect(events.stopOnline).toHaveBeenCalledTimes(1);
    expect(onlineManager.isOnline()).toBe(true);
    cleanups.push(attachQueryLifecycle(events.adapter));
    expect(events.adapter.focus).toHaveBeenCalledTimes(2);
  });
  it('rejects competing event owners without silently replacing the active one', () => {
    const first = source();
    cleanups.push(attachQueryLifecycle(first.adapter));
    const other = source();
    expect(() => attachQueryLifecycle(other.adapter)).toThrow('different event owner');
    expect(other.adapter.focus).not.toHaveBeenCalled();
  });
  it('cleans up focus if online registration fails', () => {
    const events = source();
    events.adapter.online = () => {
      throw new Error('unavailable');
    };
    expect(() => attachQueryLifecycle(events.adapter)).toThrow();
    expect(events.stopFocus).toHaveBeenCalledTimes(1);
    cleanups.push(attachQueryLifecycle(source().adapter));
  });
  it.each([
    [{}, true],
    [{ isConnected: true }, true],
    [{ isInternetReachable: true }, true],
    [{ isConnected: false }, false],
    [{ isInternetReachable: false }, false],
    [{ isConnected: true, isInternetReachable: false }, false],
  ])('treats connectivity %j as online=%s', (state, online) => {
    expect(connectivityOnline(state)).toBe(online);
  });
});
describe('browser/SSR adapter', () => {
  it('has no browser side effects in SSR', () => {
    const notify = vi.fn();
    platformQueryLifecycle.focus(notify)();
    platformQueryLifecycle.online(notify)();
    expect(notify).not.toHaveBeenCalled();
  });
  it('uses visibility/online/offline events and cleans each exact listener', () => {
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const win = new EventTarget();
    vi.stubGlobal('document', doc);
    vi.stubGlobal('window', win);
    const focus = vi.fn();
    const online = vi.fn();
    const stopFocus = platformQueryLifecycle.focus(focus);
    const stopOnline = platformQueryLifecycle.online(online);
    expect(focus).toHaveBeenLastCalledWith(true);
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(focus).toHaveBeenLastCalledWith(false);
    win.dispatchEvent(new Event('offline'));
    expect(online).toHaveBeenLastCalledWith(false);
    win.dispatchEvent(new Event('online'));
    expect(online).toHaveBeenLastCalledWith(true);
    stopFocus();
    stopOnline();
    focus.mockClear();
    online.mockClear();
    doc.dispatchEvent(new Event('visibilitychange'));
    win.dispatchEvent(new Event('offline'));
    expect(focus).not.toHaveBeenCalled();
    expect(online).not.toHaveBeenCalled();
  });
});
