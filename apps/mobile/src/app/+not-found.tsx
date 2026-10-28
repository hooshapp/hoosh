import { RouteButton } from '@/components/ui/route-button';
import { Screen } from '@/components/ui/screen';

export default function NotFound() {
  return (
    <Screen title="Page not found" subtitle="This page is not available.">
      <RouteButton href="/" label="Go Home" />
    </Screen>
  );
}
