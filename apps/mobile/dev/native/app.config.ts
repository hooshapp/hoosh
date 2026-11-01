import type { ExpoConfig } from 'expo/config';
/** Separate Expo Go project. No production identity, native regeneration or Auth. */
const config: ExpoConfig = {
  name: 'Disconnect UI QA',
  slug: 'disconnect-native-ui-qa',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
};
export default config;
