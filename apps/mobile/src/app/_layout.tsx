import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/design/tokens';
import { AppSessionBoundary } from '@/features/account/session-boundary';
import { usePublicAuth } from '@/features/auth/use-public-auth';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
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
        <AppNavigator />
      </AppSessionBoundary>
    </SafeAreaProvider>
  );
}

function AppNavigator({ publicOnly = false }: { publicOnly?: boolean }) {
  const { snapshot } = usePublicAuth();
  // Wait for session restoration before a protected deep link can be discarded.
  if (snapshot.status === 'bootstrapping' || snapshot.status === 'signing_out') {
    return <View style={{ flex: 1, backgroundColor: colors.darkCanvas }} />;
  }
  return (
    <>
      <StatusBar style={publicOnly ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: publicOnly ? colors.darkCanvas : colors.warmCanvas } }}>
        <Stack.Protected guard={publicOnly}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!publicOnly} redirectTo="/(auth)/sign-in">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings/[field]" />
          <Stack.Screen name="quest/new" />
          <Stack.Screen name="quest/[id]" />
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
