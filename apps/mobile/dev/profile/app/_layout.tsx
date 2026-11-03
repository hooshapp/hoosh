import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { QueryLifecycleBoundary } from '@/infrastructure/query/query-lifecycle-boundary';
import { RuntimeContext, type Runtime } from '../runtime';

export default function Layout() {
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [loaded, error] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });
  if (!__DEV__) return null;
  if (error) return <Text>QA fonts unavailable.</Text>;
  if (!loaded) return null;
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
            <AccountDataProvider controller={runtime.controller}>{stack}</AccountDataProvider>
          ) : (
            stack
          )}
        </RuntimeContext.Provider>
      </QueryLifecycleBoundary>
    </SafeAreaProvider>
  );
}
