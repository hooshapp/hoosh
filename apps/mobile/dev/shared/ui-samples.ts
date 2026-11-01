/** Developer-only samples shared by web/native QA. Never import from production routes. */
import type { HomeModel } from '@/features/home/home-model';
import type { QuestsModel } from '@/features/quests/quests-model';
import type { SettingsModel, SettingsValue } from '@/features/settings/settings-model';
import type { HistoryModel, HistoryMetric } from '@/features/history/history-model';
import type { HistoryDetail } from '@/features/history/history-details-model';

export const homeExample: HomeModel = {
  dino: { state: 'ready', value: { percent: 85, artwork: 'happy', feedCost: 10 } },
  credits: { state: 'ready', value: 240 },
  weekly: {
    state: 'ready',
    value: {
      hours: 5,
      periodLabel: 'this week',
      rangeLabel: 'Example week only',
      sourceLabel: 'Figma sample',
      coverageLabel: 'No usage measured',
    },
  },
  streak: { state: 'ready', value: { days: 7, recentWeekComplete: true } },
  recommendation: {
    state: 'ready',
    value: {
      id: 'RN09_FIGMA_RECOMMENDATION_ONLY',
      title: 'Read for 20 minutes',
      description:
        'You usually scroll for 20 mins at this hour. Instead, pick up a book — your Kindle is waiting!',
      rewardCredits: 50,
      restrictionNotice: '🔒 Instagram & TikTok will be locked during quest',
    },
  },
};

export const questsExample: QuestsModel = {
  interestSummary: '✦ Suggested from your Gym & Reading picks',
  saved: { state: 'ready', items: [] },
  suggestions: {
    state: 'ready',
    items: [
      {
        id: 'RN09B_GYM_ONLY',
        categoryLabel: '🏋️ GYM',
        accent: 'dark',
        context: 'Matches your evening schedule',
        title: 'Evening Gym Session',
        scheduleLabels: ['📅 Mon · Wed · Fri', '🕕 6:00 – 8:00 PM'],
        restrictionNotice: '🔒 Selected apps locked during this quest',
      },
      {
        id: 'RN09B_READING_ONLY',
        categoryLabel: '📖 READING',
        accent: 'green',
        context: 'Nudged for your night wind-down',
        title: 'Nightly Reading Session',
        scheduleLabels: ['📅 Every night', '🕙 10:00 – 10:30 PM'],
        restrictionNotice: '🔒 Selected apps locked during this quest',
      },
    ],
  },
};

export const readySetting = (text: string | null): SettingsValue => ({
  state: 'ready',
  text,
});
export const settingsExample: SettingsModel = {
  account: {
    identity: {
      user_id: 'b0bbcfac-c011-46a8-a795-24c7777b6de9',
      email: 'jord@gmail.com',
    },
    displayName: 'Jordan Rivera',
  },
  personalInfo: { age: readySetting('24'), gender: readySetting('Male') },
  apps: readySetting('Instagram, TikTok, YouTube'),
  activities: readySetting('Reading, Exercising, Studying'),
  days: readySetting('Mon – Fri'),
  hours: readySetting('9:00 AM – 10:00 PM'),
  sessions: readySetting('2 sessions/day · 15 min each'),
  calendars: {
    googleCalendar: readySetting('Not connected'),
    appleCalendar: readySetting('Not connected'),
  },
};

export const historyMetric = (
  value: number,
  display: string,
  period = 'this week',
): HistoryMetric => ({
  value,
  display,
  period,
  source: 'Simulated example',
  coverage: 'Example coverage only',
});
export const historyExample: HistoryModel = {
  periodLabel: 'This Week',
  turnOffs: { state: 'ready', data: historyMetric(51, '51') },
  screenTime: {
    state: 'ready',
    data: {
      eligible: true,
      before: historyMetric(750, '12h 30m', 'when you started'),
      now: historyMetric(150, '2h 30m'),
    },
  },
  savedHours: { state: 'ready', data: historyMetric(10, '10') },
};

export const historyDetailExample: HistoryDetail = {
  eligible: true,
  baseline: historyMetric(750, '12h 30m', 'when you started'),
  current: historyMetric(150, '2h 30m'),
  savedHours: historyMetric(10, '10'),
  reduction: historyMetric(80, '80'),
  narrative: [
    'Your weekly screen time is down from 12h 30m to 2h 30m. That’s 10 hours back this week.',
    'Those small pauses are making room for reading, movement, and the people who matter. You’re choosing where your attention goes. Keep going.',
  ],
};
