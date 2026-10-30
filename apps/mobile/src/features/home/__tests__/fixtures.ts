import type { HomeModel } from '../home-model';

/** Synthetic presentation fixture; no authentication, measurements or installed restrictions. */
export const homeExample: HomeModel = {
  dino: { state: 'ready', value: { percent: 42, artwork: 'feelingLow', feedCost: 3 } },
  credits: { state: 'ready', value: 19 },
  weekly: {
    state: 'ready',
    value: {
      hours: 1.5,
      periodLabel: 'Test week',
      rangeLabel: 'Test range',
      sourceLabel: 'Synthetic source',
      coverageLabel: 'Synthetic coverage',
    },
  },
  streak: { state: 'ready', value: { days: 1, recentWeekComplete: false } },
  recommendation: {
    state: 'ready',
    value: {
      id: 'RN09_HOME_TEST_ONLY',
      title: 'A short walk',
      description: 'An explicitly supplied presentation example.',
      rewardCredits: 6,
      restrictionNotice: 'Synthetic notice only',
    },
  },
};
