import { homeExample as figmaHome } from '../shared/ui-samples';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome, type HomeModel } from '@/features/home/home-model';

/** Figma examples only. This module must never enter an Expo route/native consumer graph. */
const scenarios = [
  'Unavailable',
  'Loading',
  'Read errors',
  'Empty recommendations',
  'Figma example',
  'No action handlers',
  'Busy actions',
  'Long content',
  'Mixed availability',
] as const;
type Scenario = (typeof scenarios)[number];
function sample(scenario: Scenario): HomeModel {
  if (scenario === 'Unavailable') return unavailableHome;
  if (scenario === 'Loading' || scenario === 'Read errors') {
    const state = scenario === 'Loading' ? 'loading' : 'error';
    return {
      dino: { state },
      credits: { state },
      weekly: { state },
      streak: { state },
      recommendation: { state },
    };
  }
  if (scenario === 'Empty recommendations')
    return { ...unavailableHome, recommendation: { state: 'empty' } };
  if (scenario === 'Mixed availability')
    return {
      ...figmaHome,
      dino: { state: 'unavailable' },
      credits: { state: 'error' },
      recommendation: { state: 'loading' },
    };
  if (scenario === 'Long content')
    return {
      ...figmaHome,
      weekly: {
        state: 'ready',
        value: {
          hours: 12.5,
          periodLabel: 'This is a deliberately long period label',
          rangeLabel: 'An illustrative date range with extra context',
          sourceLabel: 'Simulated measurement source',
          coverageLabel: 'Coverage is only a layout example',
        },
      },
      recommendation: {
        state: 'ready',
        value: {
          id: 'RN09_LONG_RECOMMENDATION_ONLY',
          title: 'Make a little more time for a wonderfully long activity name',
          description:
            'This translated-length example checks text reflow and scrolling. No account activity, usage pattern or recommendation is inferred.',
          rewardCredits: null,
          restrictionNotice: null,
        },
      },
    };
  return figmaHome;
}
export function HomeSpecimen({ width }: { width: number }) {
  const [scenario, setScenario] = useState<Scenario>('Unavailable');
  const [notice, setNotice] = useState(
    'No account, measurements, credits or restrictions are connected.',
  );
  const interactive = ['Figma example', 'Busy actions', 'Long content'].includes(scenario);
  const action = () =>
    setNotice(
      'Preview action only. No quest accepted, credits changed, feeding saved or apps restricted.',
    );
  return (
    <section data-testid="RN09_HOME_SPECIMEN_ONLY">
      <h2>Home — presentation-only Figma example</h2>
      <p>
        Examples are local and reset on reload. The real app receives unavailable inputs. OS status
        bars and the Router-owned navigation are outside this component specimen.
      </p>
      <label>
        Home example state{' '}
        <select
          value={scenario}
          onChange={(event) => {
            setScenario(event.target.value as Scenario);
            setNotice('Example changed. No account or device data was loaded.');
          }}>
          {scenarios.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <p aria-live="polite">{notice}</p>
      <div data-home-capture style={{ width, background: '#FFF1DD' }}>
        <p style={{ margin: 0, padding: '8px 16px', color: '#625D54', fontSize: 12 }}>
          Simulated Home — no account or device connected.
        </p>
        <div className="phone" data-home-phone style={{ width }}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width, height: 852 },
              insets: { top: 0, right: 0, bottom: 0, left: 0 },
            }}>
            <HomeScreen
              model={sample(scenario)}
              onFeed={interactive ? action : undefined}
              onOpenHistory={interactive ? action : undefined}
              onAcceptRecommendation={interactive ? action : undefined}
              onSkipRecommendation={interactive ? action : undefined}
              feeding={scenario === 'Busy actions'}
              recommendationBusy={scenario === 'Busy actions'}
            />
          </SafeAreaProvider>
        </div>
      </div>
    </section>
  );
}
