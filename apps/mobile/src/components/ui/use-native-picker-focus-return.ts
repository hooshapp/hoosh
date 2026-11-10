import { useEffect, useRef, type RefObject } from 'react';
import { AppState, Platform, type HostInstance } from 'react-native';
import { focusControl } from './focus-control';

/** Native picker closes before/after its Promise may settle; wait for both UI readiness and window focus. */
export function useNativePickerFocusReturn(target: RefObject<HostInstance | null>, busy: boolean) {
  const state = useRef({ busy: false, opened: false, focused: true, pending: false, backgrounded: false });
  const schedule = useRef<() => void>(() => {});
  useEffect(() => {
    const current = state.current;
    let settle: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => {
      current.pending = false;
      clearTimeout(settle); clearTimeout(deadline); settle = undefined; deadline = undefined;
    };
    const focus = () => {
      if (!current.pending || current.busy || !current.focused || AppState.currentState !== 'active' || settle !== undefined) return;
      settle = setTimeout(() => {
        settle = undefined;
        if (!current.pending || current.busy || !current.focused || AppState.currentState !== 'active') return;
        cancel(); focusControl(target.current);
      }, Platform.OS === 'android' ? 150 : 0);
    };
    schedule.current = () => {
      clearTimeout(deadline);
      if (!current.pending) { cancel(); return; }
      deadline = setTimeout(cancel, 1000);
      focus();
    };
    const focusEvent = Platform.OS === 'android' ? AppState.addEventListener('focus', () => { current.focused = true; focus(); }) : null;
    const blurEvent = Platform.OS === 'android' ? AppState.addEventListener('blur', () => {
      current.focused = false; clearTimeout(settle); settle = undefined;
    }) : null;
    const change = AppState.addEventListener('change', (next) => {
      if (next !== 'active') { current.backgrounded = true; current.focused = false; cancel(); }
    });
    return () => {
      cancel(); schedule.current = () => {};
      focusEvent?.remove(); blurEvent?.remove(); change.remove();
    };
  }, [target]);
  useEffect(() => {
    const current = state.current;
    current.busy = busy;
    if (busy) {
      current.opened = true; current.backgrounded = false; current.pending = false;
      schedule.current();
    } else if (current.opened) {
      current.opened = false;
      current.pending = !current.backgrounded && AppState.currentState === 'active';
      schedule.current();
    }
  }, [busy]);
}
