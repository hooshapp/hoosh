import { router } from 'expo-router';
import { QuestsScreen } from '@/features/quests/quests-screen';
import { ConnectedQuestsScreen } from '@/features/quests/connected-quests-screen';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { unavailableQuests } from '@/features/quests/quests-model';

export default function Quests() {
  const account = useOptionalAccountData();
  if (account?.scope)
    return (
      <ConnectedQuestsScreen
        key={account.scope.id}
        onCreate={() => router.push('/quest/new')}
        onOpen={(id) => router.push({ pathname: '/quest/[id]', params: { id } })}
      />
    );
  return <QuestsScreen model={unavailableQuests} onCreate={() => router.push('/quest/new')} />;
}
