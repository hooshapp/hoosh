import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, type RefObject } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/design/tokens';
import { AppSessionBoundary } from '@/features/account/session-boundary';
import { SetupResume } from '@/features/onboarding/setup-resume';
import { usePublicAuth } from '@/features/auth/use-public-auth';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const previousPrivateGenerationRef = useRef<number | null>(null);
  const [loaded, error] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.warmCanvas }}>
        <Text>Unable to load Disconnect. Please restart the app.</Text>
      </View>
    );
  }
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AppSessionBoundary publicContent={<AppNavigator publicOnly />}>
        <AppNavigator previousPrivateGenerationRef={previousPrivateGenerationRef} />
      </AppSessionBoundary>
    </SafeAreaProvider>
  );
}

function AppNavigator({ publicOnly = false, previousPrivateGenerationRef }: {
  publicOnly?: boolean;
  previousPrivateGenerationRef?: RefObject<number | null>;
}) {
  const { snapshot } = usePublicAuth();
  const navigation = useNavigationContainerRef();
  const generation = snapshot.sessionGeneration;
  useEffect(() => {
    if (!previousPrivateGenerationRef || snapshot.status !== 'signed_in') return;
    const previous = previousPrivateGenerationRef.current;
    previousPrivateGenerationRef.current = generation;
    // The account scope remounts the private navigator. Replace its current
    // location too, so a new session cannot inherit the previous editor URL.
    if (previous !== null && previous !== generation) {
      const root = navigation.getRootState();
      // Expo keeps the app layout stack inside its outer navigation container.
      const state = root.routes[root.index]?.state;
      if (!state || state.stale !== false) return;
      navigation.dispatch({
        type: 'RESET',
        target: state.key,
        payload: {
          ...state,
          index: 0,
          routes: [{ name: '(tabs)', key: `(tabs)-session-${generation}` }],
        },
      });
    }
  }, [generation, navigation, previousPrivateGenerationRef, snapshot.status]);
  // Wait for session restoration before a protected deep link can be discarded.
  if (snapshot.status === 'bootstrapping' || snapshot.status === 'signing_out') {
    return <View style={{ flex: 1, backgroundColor: colors.darkCanvas }} />;
  }
  return (
    <>
      <StatusBar style={publicOnly ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, statusBarStyle: publicOnly ? 'light' : 'dark', contentStyle: { backgroundColor: publicOnly ? colors.darkCanvas : colors.warmCanvas } }}>
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="auth/link-error" />
        <Stack.Protected guard={publicOnly}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!publicOnly} redirectTo="/(auth)/sign-in">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings/[field]" />
          <Stack.Screen name="settings/device" />
          <Stack.Screen name="quest/new" />
          <Stack.Screen name="quest/[id]" />
          <Stack.Screen name="(onboarding)" options={{ statusBarStyle: 'light' }} />
        </Stack.Protected>
      </Stack>
      {!publicOnly && <SetupResume />}
    </>
  );
}
