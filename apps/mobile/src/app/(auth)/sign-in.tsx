import { RouteButton } from '@/components/ui/route-button';
import { Screen } from '@/components/ui/screen';

export default function SignIn() {
  return (
    <Screen dark title="Welcome back" subtitle="Sign-in is not available in this preview.">
      <RouteButton href="/(auth)/sign-up" label="View sign-up screen" />
      <RouteButton href="/(tabs)" label="Return Home" />
    </Screen>
  );
}
