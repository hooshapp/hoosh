import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { QuestEditor } from '@/features/quests/quest-editor';
import { emptyQuestDraft } from '@/features/quests/quest-draft';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
export default function CreateQuest() {
  const [draft, setDraft] = useState(emptyQuestDraft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(emptyQuestDraft);
  const guard = useRouteDraftGuard(dirty);
  return <View style={{ flex: 1 }}>{guard.confirmation}
    <QuestEditor mode="create" draft={draft} dirty={dirty} onChange={setDraft}
      onBack={() => guard.exit(() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/quests'); })}
      onDiscard={() => setDraft(emptyQuestDraft)} state="unavailable" />
  </View>;
}
