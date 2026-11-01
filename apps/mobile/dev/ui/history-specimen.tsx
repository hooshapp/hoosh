import { historyExample as example, historyMetric as metric } from '../shared/ui-samples';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HistoryScreen } from '@/features/history/history-screen';
import { unavailableHistory, type HistoryModel } from '@/features/history/history-model';

const states = [
  'Unavailable',
  'Loading',
  'Read error',
  'Figma example',
  'Zero',
  'Missing evidence',
  'Ineligible comparison',
  'Partial',
  'Long text',
] as const;
type State = (typeof states)[number];
function model(state: State): HistoryModel {
  if (state === 'Unavailable') return unavailableHistory;
  if (state === 'Loading' || state === 'Read error') {
    const reading = {
      state: state === 'Loading' ? 'loading' : 'error',
    } as const;
    return {
      periodLabel: null,
      turnOffs: reading,
      screenTime: reading,
      savedHours: reading,
    };
  }
  if (state === 'Zero')
    return {
      ...unavailableHistory,
      turnOffs: { state: 'ready', data: metric(0, '0') },
    };
  if (state === 'Missing evidence')
    return {
      ...unavailableHistory,
      turnOffs: { state: 'ready', data: { ...metric(51, '51'), coverage: '' } },
    };
  if (state === 'Ineligible comparison' && example.screenTime.state === 'ready')
    return {
      ...example,
      screenTime: {
        state: 'ready',
        data: { ...example.screenTime.data, eligible: false },
      },
    };
  if (state === 'Partial') return { ...example, savedHours: { state: 'error' } };
  if (state === 'Long text')
    return {
      ...example,
      periodLabel: 'A deliberately long localized reporting period',
      turnOffs: {
        state: 'ready',
        data: {
          ...metric(51, '51'),
          period: 'during a deliberately long reporting period',
          coverage: 'A longer coverage description that must wrap and remain readable',
        },
      },
    };
  return example;
}
export function HistorySpecimen({ width }: { width: number }) {
  const [state, setState] = useState<State>('Unavailable');
  const [notice, setNotice] = useState('No measurements or account connected.');
  const action = () =>
    setNotice('Preview navigation intent only. No detail route or measurement loaded.');
  return (
    <section data-testid="RN09C_HISTORY_SPECIMEN_ONLY">
      <h2>History — presentation-only Figma example</h2>
      <label>
        History example state{' '}
        <select
          value={state}
          onChange={(event) => {
            setState(event.target.value as State);
            setNotice('Example changed; no account measurements loaded.');
          }}>
          {states.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p aria-live="polite">{notice}</p>
      <div data-history-capture style={{ width, background: '#FFF1DD' }}>
        <p style={{ margin: 0, padding: '8px 16px', fontSize: 12 }}>
          Simulated History — example stats, no account connected.
        </p>
        <div className="phone" data-history-phone style={{ width }}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width, height: 852 },
              insets: { top: 0, right: 0, bottom: 0, left: 0 },
            }}>
            <HistoryScreen
              model={model(state)}
              onNext={['Figma example', 'Long text'].includes(state) ? action : undefined}
              onRetry={state === 'Read error' ? action : undefined}
            />
          </SafeAreaProvider>
        </div>
      </div>
    </section>
  );
}
