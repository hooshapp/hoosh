// Public build switches only. Enable after the matching dashboard setup passes.
export const socialConfig = Object.freeze({
  appleNative: process.env.EXPO_PUBLIC_APPLE_NATIVE_ENABLED === 'true',
  appleOAuth: process.env.EXPO_PUBLIC_APPLE_OAUTH_ENABLED === 'true',
  google: process.env.EXPO_PUBLIC_GOOGLE_ENABLED === 'true',
});
