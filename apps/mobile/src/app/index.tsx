import { Redirect } from 'expo-router';

/** Preview entry point only. Auth/onboarding guards belong to the auth integration. */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
