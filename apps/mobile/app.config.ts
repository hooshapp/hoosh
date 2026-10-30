import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Hoosh',
  slug: 'disconnect',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  // Development routing only. Confirm production URL schemes during the iOS audit.
  scheme: 'disconnect-dev',
  web: { output: 'static' },
  ios: { usesAppleSignIn: true },
  plugins: [
    'expo-router',
    'expo-apple-authentication',
    ['expo-splash-screen', { backgroundColor: '#FFF1DD' }],
  ],
  experiments: { typedRoutes: true },
  // Production bundle/package IDs, App Groups, and entitlements belong to the
  // existing native app. Add them only after inspecting that source and signing.
};

export default config;
