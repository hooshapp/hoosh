import { createContext, useContext } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import type { AppRuntime } from '@/infrastructure/auth/runtime';

export const AppRuntimeContext = createContext<AppRuntime | null>(null);
export const useAppRuntime = () => useContext(AppRuntimeContext);

export function AppSignOutAction() {
  const runtime = useAppRuntime();
  if (!runtime) return null;
  return <View style={{ gap: 12 }}>
    <Text>Signing out hides account data. Already scheduled device protection continues until you stop it explicitly.</Text>
    <Button label="Sign out of this device" variant="secondary" onPress={() => { void runtime.auth.signOut().catch(() => undefined); }} />
  </View>;
}
