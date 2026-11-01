import { historyDetailExample as example, historyMetric as metric } from '../shared/ui-samples';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HistoryDetails } from '@/features/history/history-details';
import type { HistoryPeriod, HistoryDetail } from '@/features/history/history-details-model';
import type { HistoryReading } from '@/features/history/history-model';
export function HistoryDetailSpecimen({ width }: { width: number }) {
  const [page, setPage] = useState('Progress'),
    [period, setPeriod] = useState<HistoryPeriod>('week'),
    [notice, setNotice] = useState(
      'Simulated History only; no measurements or forecast connected.',
    );
  const status = (
    { Unavailable: 'unavailable', Loading: 'loading', 'Read error': 'error' } as const
  )[page as 'Unavailable'];
  const data =
    page === 'Ineligible'
      ? { ...example, eligible: false }
      : page === 'Zero baseline'
        ? { ...example, baseline: metric(0, '0') }
        : page === 'Long text'
          ? {
              ...example,
              narrative: [
                'A deliberately long localized paragraph that explains the supplied comparison and must remain fully readable as text grows or the screen narrows.',
              ],
              savedHours: {
                ...example.savedHours,
                coverage:
                  'An intentionally long measurement coverage description for narrow-screen verification',
              },
            }
          : example;
  const reading: HistoryReading<HistoryDetail> =
    period === 'month'
      ? { state: 'unavailable' }
      : status
        ? { state: status }
        : { state: 'ready', data };
  return (
    <section data-testid="RN09H_HISTORY_ONLY">
      <h2>History details — local presentation</h2>
      <label>
        History detail page{' '}
        <select
          value={page}
          onChange={(e) => {
            setPage(e.target.value);
            setPeriod('week');
          }}>
          {[
            'Progress',
            'Reduction',
            'Unavailable',
            'Loading',
            'Read error',
            'Ineligible',
            'Zero baseline',
            'Long text',
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p role="status">{notice}</p>
      <div className="phone" style={{ width }}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width, height: 852 },
            insets: { top: 0, right: 0, bottom: 0, left: 0 },
          }}>
          <HistoryDetails
            reading={reading}
            period={period}
            onPeriodChange={setPeriod}
            reclaimed={page === 'Reduction'}
            onBack={() => setNotice('Preview back intent only.')}
            onNext={() => setPage('Reduction')}
            onRetry={() => setNotice('Preview retry intent only. No measurements loaded.')}
          />
        </SafeAreaProvider>
      </div>
    </section>
  );
}
