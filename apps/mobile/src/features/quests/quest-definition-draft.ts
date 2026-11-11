import type { QuestDefinition } from '@disconnect/contracts';
import { emptyQuestDraft, type QuestDraft } from './quest-draft';
import { questDefinition } from './quests-api';
export type ManagedQuestDraft = { quest: QuestDraft; timezone: string };
export function questForm(value: QuestDefinition | null): ManagedQuestDraft {
  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    /* Explicit field must be supplied when unavailable. */
  }
  return value
    ? {
        quest: {
          title: value.title,
          activity: value.activity,
          start: value.start_local,
          end: value.end_local,
          nextDay: value.next_day,
          repeat: value.repeat,
          days: [...value.weekdays],
        },
        timezone: value.timezone_id,
      }
    : { quest: { ...emptyQuestDraft }, timezone: zone };
}
export function definitionFor(draft: ManagedQuestDraft): QuestDefinition {
  const q = draft.quest;
  return questDefinition(
    {
      title: q.title,
      activity: q.activity,
      start_local: q.start,
      end_local: q.end,
      next_day: q.nextDay,
      repeat: q.repeat,
      weekdays: q.repeat === 'weekly' ? q.days : [],
      timezone_id: draft.timezone,
    },
    false,
  );
}
export const sameQuestDraft = (a: ManagedQuestDraft, b: ManagedQuestDraft) =>
  JSON.stringify(a) === JSON.stringify(b);
