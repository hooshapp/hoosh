import { EmptyCard } from '@/components/ui/empty-card';
import { RouteButton } from '@/components/ui/route-button';
import { Screen } from '@/components/ui/screen';

export default function Settings() {
  return (
    <Screen title="Settings" subtitle="Your account, activities, and plan.">
      <EmptyCard title="Development preview" description="Accounts and saved plans are not connected yet. You can explore the screen placeholders below." />
      <RouteButton href="/(auth)/sign-in" label="View sign-in screen" />
      <RouteButton href="/(onboarding)/welcome" label="View onboarding screen" />
    </Screen>
  );
}
