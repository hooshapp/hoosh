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
import { Platform, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/design/tokens';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { AuthGate } from '@/features/auth/AuthGate';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return <>
    {Platform.OS === 'web' && <><title>Hoosh</title><meta name="application-name" content="Hoosh" /></>}
    <AppRoot />
  </>;
}

function AppRoot() {
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
        <Text>Unable to load Hoosh. Please restart the app.</Text>
      </View>
    );
  }
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider><RootNavigation /></AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
  const { snapshot, links } = useAuth();
  const linkGate = links.processing || links.pending !== null;
  if (snapshot.status === 'bootstrapping' || snapshot.status === 'signing_out') {
    return <AuthGate signingOut={snapshot.status === 'signing_out'} />;
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.warmCanvas } }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="auth/callback" />
    <Stack.Screen name="auth/link-error" />
    <Stack.Protected guard={snapshot.status !== 'signed_in' || linkGate}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
    </Stack.Protected>
    <Stack.Protected guard={snapshot.status === 'signed_in' && !linkGate} redirectTo="/(auth)/sign-in">
      <Stack.Screen name="(tabs)" />
    </Stack.Protected>
  </Stack>;
}
