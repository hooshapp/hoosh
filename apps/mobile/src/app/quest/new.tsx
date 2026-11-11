import { uuid } from 'expo';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { ManagedQuestEditor } from '@/features/quests/managed-quest-editor';
import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { QuestEditor } from '@/features/quests/quest-editor';
import { emptyQuestDraft } from '@/features/quests/quest-draft';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
const back = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)/quests');
};
export default function CreateQuest() {
  const account = useOptionalAccountData();
  return account?.scope ? <NewManagedQuest key={account.scope.id} /> : <CreateQuestPreview />;
}
function NewManagedQuest() {
  const [id] = useState(() => uuid.v4());
  return <ManagedQuestEditor questId={id} creating onBack={back} />;
}
function CreateQuestPreview() {
  const [draft, setDraft] = useState(emptyQuestDraft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(emptyQuestDraft);
  const guard = useRouteDraftGuard(dirty);
  return (
    <View style={{ flex: 1 }}>
      {guard.confirmation}
      <QuestEditor
        mode="create"
        draft={draft}
        dirty={dirty}
        onChange={setDraft}
        onBack={() =>
          guard.exit(() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/quests');
          })
        }
        onDiscard={() => setDraft(emptyQuestDraft)}
        state="unavailable"
      />
    </View>
  );
}
