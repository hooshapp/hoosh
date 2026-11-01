import { questsExample as example } from '../shared/ui-samples';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { QuestsScreen } from '@/features/quests/quests-screen';
import { unavailableQuests, type QuestsModel } from '@/features/quests/quests-model';

const states = [
  'Unavailable',
  'Loading',
  'Read error',
  'Empty',
  'Figma example',
  'No handlers',
  'Busy',
  'Saved example',
  'Long text',
] as const;
type State = (typeof states)[number];
function model(state: State): QuestsModel {
  if (state === 'Unavailable') return unavailableQuests;
  if (state === 'Loading' || state === 'Read error')
    return {
      interestSummary: null,
      suggestions: { state: state === 'Loading' ? 'loading' : 'error' },
      saved: { state: 'unavailable' },
    };
  if (state === 'Empty')
    return {
      interestSummary: null,
      suggestions: { state: 'ready', items: [] },
      saved: { state: 'ready', items: [] },
    };
  if (state === 'Saved example')
    return {
      ...unavailableQuests,
      saved: {
        state: 'ready',
        items: [
          {
            id: 'RN09B_SAVED_ONLY',
            title: 'A separately supplied saved quest',
            scheduleLabel: 'Example schedule',
            statusLabel: 'Example status',
          },
        ],
      },
    };
  if (state === 'Long text' && example.suggestions.state === 'ready')
    return {
      ...example,
      suggestions: {
        state: 'ready',
        items: [
          {
            ...example.suggestions.items[0],
            title: 'A deliberately long activity title that should wrap without losing the actions',
            context: 'A longer translated-length contextual explanation',
            scheduleLabels: [
              'An intentionally long schedule label across several weekdays',
              'A deliberately long time range',
            ],
            restrictionNotice: null,
          },
        ],
      },
    };
  return example;
}
export function QuestsSpecimen({ width }: { width: number }) {
  const [state, setState] = useState<State>('Unavailable');
  const [notice, setNotice] = useState('No quest, account or device connected.');
  const interactive = ['Figma example', 'Busy', 'Long text'].includes(state);
  const action = () =>
    setNotice('Preview intent only. No quest saved, apps restricted or credits awarded.');
  return (
    <section data-testid="RN09B_QUESTS_SPECIMEN_ONLY">
      <h2>Quests — presentation-only Figma example</h2>
      <label>
        Quests example state{' '}
        <select
          value={state}
          onChange={(event) => {
            setState(event.target.value as State);
            setNotice('Example changed; no account/device data loaded.');
          }}>
          {states.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p aria-live="polite">{notice}</p>
      <div data-quests-capture style={{ width, background: '#FFF1DD' }}>
        <p style={{ margin: 0, padding: '8px 16px', fontSize: 12 }}>
          Simulated Quests — no account or device connected.
        </p>
        <div className="phone" data-quests-phone style={{ width }}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width, height: 852 },
              insets: { top: 0, right: 0, bottom: 0, left: 0 },
            }}>
            <QuestsScreen
              model={model(state)}
              onAccept={interactive ? action : undefined}
              onPersonalize={interactive ? action : undefined}
              onCreate={interactive ? action : undefined}
              onRetry={state === 'Read error' ? action : undefined}
              busy={state === 'Busy'}
            />
          </SafeAreaProvider>
        </div>
      </div>
    </section>
  );
}
