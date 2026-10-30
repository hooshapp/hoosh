import { EmptyCard } from '@/components/ui/empty-card';
import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome } from '@/features/home/home-model';

export default function Home() {
  return (
    <HomeScreen
      model={unavailableHome}
      protection={
        <EmptyCard
          title="Protection unavailable"
          description="We can’t confirm protection on this device right now."
        />
      }
    />
  );
}
