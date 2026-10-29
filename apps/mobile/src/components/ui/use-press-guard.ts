import { useRef } from 'react';

/** Close the same-turn gap before the controller's busy prop is rendered. */
export function usePressGuard<Args extends unknown[]>(
  onPress: (...args: Args) => void,
  blocked: boolean,
) {
  const pressLocked = useRef(false);
  return (...args: Args) => {
    if (blocked || pressLocked.current) return;
    pressLocked.current = true;
    try {
      onPress(...args);
    } finally {
      queueMicrotask(() => {
        pressLocked.current = false;
      });
    }
  };
}
