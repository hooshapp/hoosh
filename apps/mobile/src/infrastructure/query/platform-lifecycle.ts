import type { QueryLifecycleSource } from './lifecycle';

/** Browser events stay browser events; no Expo native network module on web/SSR. */
export const platformQueryLifecycle: QueryLifecycleSource = {
  focus(notify) {
    if (typeof document === 'undefined') return () => {};
    const changed = () => notify(document.visibilityState !== 'hidden');
    changed();
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  },
  online(notify) {
    if (typeof window === 'undefined') return () => {};
    const connected = () => notify(true);
    const disconnected = () => notify(false);
    // Do not let a stale navigator.onLine initial hint lock the app indefinitely.
    window.addEventListener('online', connected);
    window.addEventListener('offline', disconnected);
    return () => {
      window.removeEventListener('online', connected);
      window.removeEventListener('offline', disconnected);
    };
  },
};
