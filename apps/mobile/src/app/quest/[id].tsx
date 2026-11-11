import { ManagedQuestEditor } from '@/features/quests/managed-quest-editor';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { safeRequestId } from '@/infrastructure/api/errors';
import { router, useLocalSearchParams } from 'expo-router';
import { EmptyCard } from '@/components/ui/empty-card';
import { EditorPage } from '@/features/editors/editor-controls';
export default function ExistingQuest() {
  const params = useLocalSearchParams<{ id?: string }>();
  const account = useOptionalAccountData();
  const id = safeRequestId(params.id);
  if (account?.scope && id)
    return (
      <ManagedQuestEditor
        key={`${account.scope.id}:${id}`}
        questId={id}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/quests'))}
      />
    );
  return (
    <EditorPage
      title="Quest"
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/quests'))}
    >
      <EmptyCard
        title="Quest unavailable"
        description="This quest couldn’t be loaded. Return to your quests and try again later."
      />
    </EditorPage>
  );
}
