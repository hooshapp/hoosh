import type { QuestDraft } from './quest-draft';
import type { QuestSuggestion } from './quests-model';

/** Figma's editable proposals, never measured activity or an installed schedule. */
export const questTemplates = {
  gym: {
    title: 'Evening Gym Session', activity: 'Gym workout', start: '18:00', end: '20:00',
    nextDay: false, repeat: 'weekly', days: [0, 2, 4],
  },
  reading: {
    title: 'Nightly Reading Session', activity: 'Reading', start: '22:00', end: '22:30',
    nextDay: false, repeat: 'daily', days: [],
  },
} as const satisfies Record<string, QuestDraft>;
export type QuestTemplateId = keyof typeof questTemplates;
export function questTemplate(id: unknown): QuestDraft | undefined {
  return id === 'gym' || id === 'reading' ? questTemplates[id] : undefined;
}
export function suggestedQuests(interests: readonly string[], savedTitles: readonly string[]): QuestSuggestion[] {
  return (Object.keys(questTemplates) as QuestTemplateId[])
    .filter(id => interests.includes(id) && !savedTitles.includes(questTemplates[id].title))
    .map(id => ({
      id, title: questTemplates[id].title,
      categoryLabel: id === 'gym' ? '🏋️ GYM' : '📖 READING',
      accent: id === 'gym' ? 'dark' : 'green',
      context: 'Suggested from your interests',
      scheduleLabels: id === 'gym' ? ['📅 Mon · Wed · Fri', '🕕 6:00 – 8:00 PM'] : ['📅 Every night', '🕙 10:00 – 10:30 PM'],
      restrictionNotice: null,
    }));
}
