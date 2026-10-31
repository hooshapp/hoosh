import { HistoryScreen } from '@/features/history/history-screen';
import { unavailableHistory } from '@/features/history/history-model';

export default function History() {
  return <HistoryScreen model={unavailableHistory} />;
}
