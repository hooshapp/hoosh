import { useSyncExternalStore } from 'react';

import { useAppRuntime } from '@/features/account/app-runtime-context';

import { INITIAL_LINK_STATE } from './link-flow';

const initialLinks = () => INITIAL_LINK_STATE;

/** Public forms use the root's existing runtime without mounting account data. */
export function usePublicAuth() {
  const runtime = useAppRuntime();
  if (!runtime) throw new Error('Public auth requires the app runtime.');
  const { subscribe, getSnapshot } = runtime.auth;
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const links = useSyncExternalStore(
    subscribe,
    runtime.authForms?.getLinkSnapshot ?? initialLinks,
    initialLinks,
  );
  return { runtime, snapshot, links };
}
