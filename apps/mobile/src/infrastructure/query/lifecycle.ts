import { focusManager, onlineManager } from '@tanstack/react-query';

export interface QueryLifecycleSource {
  focus: (notify: (focused: boolean) => void) => () => void;
  online: (notify: (online: boolean) => void) => () => void;
}
let installed:
  { source: QueryLifecycleSource; references: number; dispose: () => void } | undefined;

/** One process-wide event owner, even with repeated/nested boundary effects. */
export function attachQueryLifecycle(source: QueryLifecycleSource) {
  if (installed && installed.source !== source)
    throw new Error('Query lifecycle already has a different event owner.');
  if (!installed) {
    const focus = source.focus((value) => focusManager.setFocused(value));
    let online: () => void;
    try {
      online = source.online((value) => onlineManager.setOnline(value));
    } catch (error) {
      focus();
      throw error;
    }
    installed = {
      source,
      references: 0,
      dispose: () => {
        focus();
        online();
      },
    };
  }
  const owner = installed;
  owner.references++;
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    if (--owner.references === 0) {
      owner.dispose();
      installed = undefined;
      focusManager.setFocused(undefined);
      onlineManager.setOnline(true);
    }
  };
}

export type Connectivity = { isConnected?: boolean; isInternetReachable?: boolean };
/** Unknown is a hint, not a permanent offline gate. HTTP still decides reachability. */
export function connectivityOnline(state: Connectivity) {
  return state.isConnected !== false && state.isInternetReachable !== false;
}
