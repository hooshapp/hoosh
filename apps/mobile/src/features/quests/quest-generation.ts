import type { SettingsView } from '@disconnect/contracts';
import type { AccountOperation } from '@/infrastructure/query/account-scope';
import { ApiError, isRecord } from '../../infrastructure/api/errors';
import { emptyQuestDraft, type QuestDraft } from './quest-draft';

const minute = 60_000;
const activities: Record<string, [label: string, action: string]> = {
  gym: ['Gym', 'Do a short mobility routine'],
  reading: ['Reading', 'Read a few pages'],
  walking: ['Walking', 'Take a short walk'],
  arts_and_crafts: ['Arts and crafts', 'Sketch a small study'],
  music: ['Music', 'Practice one passage slowly'],
  cooking: ['Cooking', 'Prep one part of your next meal'],
};

export type QuestPlanningContext = {
  windows: [number, number][];
  calendarChecked: boolean;
  checkedThrough?: number;
  task?: string;
  event?: { startsAt: number; title: string };
};
export const emptyQuestContext: QuestPlanningContext = { windows: [], calendarChecked: false };

export function decodeQuestContext(value: unknown): QuestPlanningContext {
  if (!isRecord(value) || !Array.isArray(value.windows) || typeof value.calendarChecked !== 'boolean') {
    return emptyQuestContext;
  }
  const windows: [number, number][] = [];
  for (const pair of value.windows) {
    if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite) || pair[0] >= pair[1]) {
      return emptyQuestContext;
    }
    windows.push([pair[0], pair[1]]);
  }
  const event = value.event;
  return {
    windows,
    calendarChecked: value.calendarChecked,
    checkedThrough: typeof value.checkedThrough === 'number' && Number.isFinite(value.checkedThrough)
      ? value.checkedThrough : undefined,
    task: typeof value.task === 'string' && value.task.trim() ? value.task.trim() : undefined,
    event: isRecord(event) && typeof event.startsAt === 'number' && Number.isFinite(event.startsAt) &&
      typeof event.title === 'string' && event.title.trim()
      ? { startsAt: event.startsAt, title: event.title.trim() } : undefined,
  };
}

export function nextQuestSlot(context: QuestPlanningContext, now: Date, desired = 15, before = Infinity) {
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 0, 0);
  const limit = Math.min(todayEnd.getTime(), now.getTime() + 180 * minute, context.checkedThrough ?? Infinity, before);
  let start = Math.ceil((now.getTime() + 5 * minute) / minute) * minute;
  const windows = [...context.windows].sort(([a], [b]) => a - b);
  for (const [busyStart, busyEnd] of [...windows, [limit, limit]]) {
    if (busyEnd <= start) continue;
    const gap = Math.floor((Math.min(limit, busyStart) - start) / minute);
    const minutes = [desired, 10, 5].find(length => length <= gap);
    if (minutes) return { start, end: start + minutes * minute, minutes };
    start = Math.ceil(busyEnd / minute) * minute;
    if (start >= limit) break;
  }
  return null;
}

function localTime(ms: number) {
  const date = new Date(ms);
  return [date.getHours(), date.getMinutes()].map(part => String(part).padStart(2, '0')).join(':');
}

export async function generateQuestSuggestion(
  operation: AccountOperation,
  settings: SettingsView | null,
  context: QuestPlanningContext,
  now = new Date(),
  turn = 0,
) {
  const taskSlot = context.task && nextQuestSlot(context, now, 10);
  const eventSlot = context.event && context.event.startsAt <= now.getTime() + 180 * minute &&
    nextQuestSlot(context, now, 10, context.event.startsAt);
  const choices = [
    ...(taskSlot && context.task ? [{ kind: 'task' as const, slot: taskSlot, title: context.task }] : []),
    ...(eventSlot && context.event ? [{ kind: 'event' as const, slot: eventSlot, title: context.event.title }] : []),
    { kind: 'goal' as const, slot: nextQuestSlot(context, now) },
  ];
  const choice = choices[turn % choices.length];
  const slot = choice.slot;
  if (!slot) return null;
  const base = {
    ...emptyQuestDraft,
    start: localTime(slot.start),
    end: localTime(slot.end),
  };
  if (choice.kind !== 'goal') {
    const activity = choice.kind === 'task' ? 'Task preparation' : 'Event preparation';
    const title = `Prepare for “${Array.from(choice.title).slice(0, 100).join('')}”`;
    return { draft: { ...base, title, activity }, startsAt: slot.start,
      calendarChecked: context.calendarChecked, kind: choice.kind, usesAI: false };
  }
  const goal = settings?.activities.selected_activity_ids.find(id => Object.hasOwn(activities, id)) ?? 'general';
  const known = Object.hasOwn(activities, goal) ? activities[goal] : undefined;
  const custom = settings?.activities.custom_text?.trim();
  const activity = known?.[0] ?? custom ?? 'Offline break';
  const params = new URLSearchParams({
    activity: goal, tone: settings?.personalization?.nudge_tone ?? 'Supportive',
    quest_minutes: String(slot.minutes),
  });
  const generated = await operation.api.request(`/v1/recommendations/nudge-copy?${params}`, {
    signal: operation.signal,
    decode(value) {
      if (value === null) return null;
      if (!isRecord(value) || typeof value.quest_title !== 'string' ||
        !value.quest_title.trim() || Array.from(value.quest_title).length > 65 ||
        /[\x00-\x1f\x7f\u2028\u2029]/u.test(value.quest_title)) {
        throw new ApiError('invalid_response');
      }
      return value.quest_title.trim().replace(/[.!?]+$/, '');
    },
  }).catch(() => null);
  const title = known ? generated || known[1] : custom ? `Take one small step toward ${custom}` : generated || 'Take a short offline break';
  const draft: QuestDraft = {
    ...base,
    title: Array.from(title).slice(0, 120).join(''),
    activity: Array.from(activity).slice(0, 200).join(''),
  };
  return { draft, startsAt: slot.start, calendarChecked: context.calendarChecked,
    kind: choice.kind, usesAI: !!generated && (!!known || !custom) };
}
