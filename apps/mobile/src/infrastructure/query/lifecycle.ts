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
    let receiving = true;
    let focus: (() => void) | undefined;
    let online: () => void;
    try {
      focus = source.focus((value) => {
        if (receiving) focusManager.setFocused(value);
      });
      online = source.online((value) => {
        if (receiving) onlineManager.setOnline(value);
      });
    } catch (error) {
      receiving = false;
      try {
        focus?.();
      } finally {
        focusManager.setFocused(undefined);
        onlineManager.setOnline(true);
      }
      throw error;
    }
    installed = {
      source,
      references: 0,
      dispose: () => {
        receiving = false;
        try {
          focus?.();
        } finally {
          online();
        }
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
      try {
        owner.dispose();
      } finally {
        installed = undefined;
        focusManager.setFocused(undefined);
        onlineManager.setOnline(true);
      }
    }
  };
}

export type Connectivity = { isConnected?: boolean; isInternetReachable?: boolean };
/** Unknown is a hint, not a permanent offline gate. HTTP still decides reachability. */
export function connectivityOnline(state: Connectivity) {
  return state.isConnected !== false && state.isInternetReachable !== false;
}
