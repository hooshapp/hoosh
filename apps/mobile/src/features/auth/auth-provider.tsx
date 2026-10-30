import { createContext, type PropsWithChildren, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createAuthRuntime } from '@/infrastructure/auth/supabase';
import { SessionController } from './session-controller';

const AuthContext = createContext<SessionController | null>(null);
export function AuthProvider({ children }: PropsWithChildren) {
  // Construction has no I/O, including during static export. Effects own startup.
  const [controller] = useState(() => new SessionController(createAuthRuntime));
  useEffect(() => {
    let disposed = false;
    void controller.start().then(() => {
      if (!disposed) controller.setForeground(AppState.currentState === 'active');
    });
    const subscription = AppState.addEventListener('change', state => controller.setForeground(state === 'active'));
    return () => { disposed = true; subscription.remove(); controller.stop(); };
  }, [controller]);
  return <AuthContext.Provider value={controller}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const controller = useContext(AuthContext);
  if (!controller) throw new Error('AuthProvider is required.');
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const links = useSyncExternalStore(controller.subscribe, controller.getLinkSnapshot, controller.getLinkSnapshot);
  return { controller, snapshot, links };
}
