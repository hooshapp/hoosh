import { EmptyCard } from '@/components/ui/empty-card';
import { Screen } from '@/components/ui/screen';

export default function History() {
  return (
    <Screen title="Your progress" subtitle="A little more intention, day by day.">
      <EmptyCard title="No progress data yet" description="Activity measurement is not connected in this preview." />
    </Screen>
  );
}
