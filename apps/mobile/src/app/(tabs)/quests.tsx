import { EmptyCard } from '@/components/ui/empty-card';
import { Screen } from '@/components/ui/screen';

export default function Quests() {
  return (
    <Screen title="Your Quests" subtitle="Make time for the things you choose.">
      <EmptyCard title="Quests are coming" description="Quest creation and scheduling are not available in this preview." />
    </Screen>
  );
}
