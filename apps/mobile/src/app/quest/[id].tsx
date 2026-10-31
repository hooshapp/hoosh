import { router } from 'expo-router';
import { EmptyCard } from '@/components/ui/empty-card';
import { EditorPage } from '@/features/editors/editor-controls';
export default function ExistingQuest() {
  return <EditorPage title="Quest" onBack={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/quests')}>
    <EmptyCard title="Quest unavailable" description="This quest couldn’t be loaded. Return to your quests and try again later." />
  </EditorPage>;
}
