import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { QueryLifecycleBoundary } from '@/infrastructure/query/query-lifecycle-boundary';
import { RuntimeContext, type Runtime } from '../runtime';
import { NativeOwnerContext } from '@/features/protection/native-owner-boundary';

export default function Layout() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  useEffect(() => {
    const native = runtime?.nativeOwner;
    if (!native) return;
    return () => {
      void Promise.allSettled([
        native.port.interventionEndOwner(native.owner, false),
        native.port.selectionEndOwner(native.owner, false),
      ]);
    };
  }, [runtime]);
  const [loaded, error] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  if (!__DEV__) return null;
  if (error) return <Text>QA fonts unavailable.</Text>;
  if (!loaded) return <Text>Loading QA fonts…</Text>;
  const stack = <Stack screenOptions={{ headerShown: false }} />;
  return (
    <SafeAreaProvider>
      <QueryLifecycleBoundary>
        <RuntimeContext.Provider
          value={{
            runtime,
            install: (next) => {
              setRuntime(next);
            },
          }}
        >
          {runtime ? (
            <AccountDataProvider controller={runtime.controller}>
              <NativeOwnerContext.Provider value={runtime.nativeOwner}>
                {stack}
              </NativeOwnerContext.Provider>
            </AccountDataProvider>
          ) : (
            stack
          )}
        </RuntimeContext.Provider>
      </QueryLifecycleBoundary>
    </SafeAreaProvider>
  );
}
