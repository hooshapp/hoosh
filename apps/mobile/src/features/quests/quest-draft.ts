import { parseTime } from '@/features/editors/draft-utils';
/** Raw local form, deliberately not an API, recurrence, timezone or restriction contract. */
export type QuestDraft = Readonly<{
  title: string; activity: string; start: string; end: string; nextDay: boolean;
  repeat: 'none' | 'daily' | 'weekly'; days: readonly number[];
}>;
export const emptyQuestDraft: QuestDraft = { title: '', activity: '', start: '', end: '', nextDay: false, repeat: 'none', days: [] };
export function questDuration(draft: QuestDraft): number | null {
  const start = parseTime(draft.start), end = parseTime(draft.end);
  if (start === null || end === null) return null;
  const duration = end - start + (draft.nextDay ? 1440 : 0);
  return duration > 0 && duration < 1440 ? duration : null;
}
export function questDraftIssue(draft: QuestDraft): string | null {
  if (!draft.title.trim() || !draft.activity.trim()) return 'Enter a quest name and activity.';
  if (questDuration(draft) === null) return 'Choose valid start and end times. Confirm the next day for an overnight quest.';
  if (draft.repeat === 'weekly' && !draft.days.length) return 'Choose at least one repeat day.';
  return null;
}
export function durationLabel(minutes: number | null): string {
  if (minutes === null) return 'Choose times';
  const hours = Math.floor(minutes / 60), remainder = minutes % 60;
  return [hours ? `${hours} ${hours === 1 ? 'hour' : 'hours'}` : '', remainder ? `${remainder} min` : ''].filter(Boolean).join(' ');
}
