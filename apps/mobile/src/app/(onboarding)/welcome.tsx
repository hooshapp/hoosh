import { RouteButton } from '@/components/ui/route-button';
import { Screen } from '@/components/ui/screen';

export default function Welcome() {
  return (
    <Screen dark title="Redirect to what you love." subtitle="Onboarding and protection setup are being built. Nothing is saved or activated in this preview.">
      <RouteButton href="/(tabs)" label="Return Home" />
    </Screen>
  );
}
