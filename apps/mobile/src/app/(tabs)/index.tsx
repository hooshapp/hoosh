import { EmptyCard } from '@/components/ui/empty-card';
import { Screen } from '@/components/ui/screen';

export default function Home() {
  return (
    <Screen title="Disconnect" subtitle="Less scrolling. More you.">
      <EmptyCard
        title="Protection is not connected"
        description="This preview does not restrict apps. Protection setup will be available in a later build."
      />
      <EmptyCard
        title="Make room for what you love"
        description="Your activities and recommendations will appear here after setup is connected."
      />
    </Screen>
  );
}
