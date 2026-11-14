import { ConnectedHistoryScreen } from '@/features/history/connected-history-screen';
import { HistoryExperience } from '@/features/history/history-experience';
import { unavailableHistory } from '@/features/history/history-model';
import { unavailableHistoryPeriods } from '@/features/history/history-details-model';
import { useRuntime } from '../runtime';
export default function History() {
  const { runtime } = useRuntime();
  return runtime ? (
    <ConnectedHistoryScreen />
  ) : (
    <HistoryExperience
      summary={unavailableHistory}
      periods={unavailableHistoryPeriods}
    />
  );
}
