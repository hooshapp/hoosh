import { useState } from 'react';
import { router } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { View } from 'react-native';
import { QuestEditor } from '@/features/quests/quest-editor';
import { emptyQuestDraft } from '@/features/quests/quest-draft';
import { LeaveConfirmation } from '@/features/editors/editor-controls';
export default function CreateQuest() {
  const [draft, setDraft] = useState(emptyQuestDraft);
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const [allowLeave, setAllowLeave] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(emptyQuestDraft);
  usePreventRemove(dirty && !allowLeave, ({ repeat }) => setPendingLeave(() => repeat));
  return <View style={{ flex: 1 }}>
    {pendingLeave ? <LeaveConfirmation onKeep={() => setPendingLeave(null)} onDiscard={() => { setAllowLeave(true); pendingLeave(); }} /> : null}
    <QuestEditor mode="create" draft={draft} dirty={dirty} onChange={setDraft}
      onBack={() => { setAllowLeave(true); router.canGoBack() ? router.back() : router.replace('/(tabs)/quests'); }}
      onDiscard={() => setDraft(emptyQuestDraft)} state="unavailable" />
  </View>;
}
