import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { AppState, Platform, type HostInstance } from 'react-native';
import { focusControl } from './focus-control';

/** An explicit modal dismissal only; never used for ordinary screen/status updates. */
export function useDialogFocusReturn(target: RefObject<HostInstance | null>) {
  const pending = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      pending.current?.();
      pending.current = null;
    },
    [target],
  );
  return useCallback(() => {
    pending.current?.();
    pending.current = null;
    if (Platform.OS !== 'android') {
      focusControl(target.current);
      return;
    }
    let active = true;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (!active) return;
      active = false;
      focusSubscription.remove();
      stateSubscription.remove();
      clearTimeout(deadline);
      if (settle !== undefined) clearTimeout(settle);
      pending.current = null;
    };
    const focusSubscription = AppState.addEventListener('focus', () => {
      if (!active || settle !== undefined) return;
      // The native window focus arrives before TalkBack handles its window event.
      // One settle after that event avoids replacing the explicit target again.
      settle = setTimeout(() => {
        if (!active) return;
        stop();
        focusControl(target.current);
      }, 150);
    });
    const stateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stop();
    });
    // A missing dismissal/focus event must not retain a request for a later screen.
    const deadline = setTimeout(stop, 1000);
    pending.current = stop;
  }, [target]);
}
