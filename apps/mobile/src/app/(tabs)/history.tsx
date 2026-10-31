import { HistoryExperience } from '@/features/history/history-experience';
import { unavailableHistory } from '@/features/history/history-model';
import { unavailableHistoryPeriods } from '@/features/history/history-details-model';
export default function History() {
  return <HistoryExperience summary={unavailableHistory} periods={unavailableHistoryPeriods} />;
}
