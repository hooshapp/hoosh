import { RouteButton } from '@/components/ui/route-button';
import { Screen } from '@/components/ui/screen';

export default function SignUp() {
  return (
    <Screen dark title="Welcome to Disconnect" subtitle="Account creation is not available in this preview.">
      <RouteButton href="/(auth)/sign-in" label="Back to sign-in" />
    </Screen>
  );
}
