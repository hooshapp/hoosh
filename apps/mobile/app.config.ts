import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Disconnect',
  slug: 'disconnect',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  // Development routing only. Confirm production URL schemes during the iOS audit.
  scheme: 'disconnect-dev',
  web: { output: 'static' },
  plugins: ['expo-router', 'expo-image', ['expo-splash-screen', { backgroundColor: '#FFF1DD' }]],
  experiments: { typedRoutes: true },
  // Isolated Android development identity; production/store identity remains unassigned.
  android: {
    package: 'com.hoosh.disconnect.dev',
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  // Production bundle/package IDs, App Groups, and entitlements belong to the
  // existing native app. Add them only after inspecting that source and signing.
};

export default config;
