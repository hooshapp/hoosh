import { QuestsScreen } from '@/features/quests/quests-screen';
import { unavailableQuests } from '@/features/quests/quests-model';

export default function Quests() {
  return <QuestsScreen model={unavailableQuests} />;
}
