import { ConnectedHistoryScreen } from '@/features/history/connected-history-screen';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { HistoryExperience } from '@/features/history/history-experience';
import { unavailableHistory } from '@/features/history/history-model';
import { unavailableHistoryPeriods } from '@/features/history/history-details-model';
export default function History() {
  const account = useOptionalAccountData();
  if (account?.scope) return <ConnectedHistoryScreen />;
  return (
    <HistoryExperience
      summary={unavailableHistory}
      periods={unavailableHistoryPeriods}
    />
  );
}
