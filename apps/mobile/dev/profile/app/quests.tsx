import { router } from 'expo-router';
import { ConnectedQuestsScreen } from '@/features/quests/connected-quests-screen';
import { QuestsScreen } from '@/features/quests/quests-screen';
import { unavailableQuests } from '@/features/quests/quests-model';
import { useRuntime } from '../runtime';
export default function Quests() {
  const { runtime } = useRuntime();
  return runtime ? (
    <ConnectedQuestsScreen
      onCreate={() => router.push({ pathname: './quest', params: { create: 'yes' } })}
      onOpen={(id) => router.push({ pathname: './quest', params: { id } })}
    />
  ) : (
    <QuestsScreen model={unavailableQuests} />
  );
}
