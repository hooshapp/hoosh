import { expect, it, vi } from 'vitest';
import type { SettingsView } from '@disconnect/contracts';
import type { AccountOperation } from '@/infrastructure/query/account-scope';
import { generateQuestSuggestion, nextQuestSlot } from './quest-generation';

const now = new Date(2026, 10, 27, 16);
const at = (minutes: number) => now.getTime() + minutes * 60_000;

it('fits a short quest before an event and skips overlapping busy windows', () => {
  expect(nextQuestSlot({ calendarChecked: true, windows: [[at(15), at(30)]] }, now))
    .toEqual({ start: at(5), end: at(15), minutes: 10 });
  expect(nextQuestSlot({ calendarChecked: true, windows: [[at(-5), at(30)], [at(20), at(45)]] }, now))
    .toEqual({ start: at(45), end: at(60), minutes: 15 });
  expect(nextQuestSlot({ calendarChecked: true, windows: [[at(0), at(60)]], checkedThrough: at(64) }, now))
    .toBeNull();
});

it('keeps task and event titles free of gym copy and only sends the goal suggestion to AI', async () => {
  const request = vi.fn(async (_path: string) => 'Do a short mobility routine');
  const operation = { api: { request }, signal: new AbortController().signal } as unknown as AccountOperation;
  const settings = { activities: { selected_activity_ids: ['gym'] } } as SettingsView;
  const context = {
    calendarChecked: true, windows: [[at(15), at(30)]], task: 'Private essay',
    event: { startsAt: at(15), title: 'Work meeting' },
  } satisfies Parameters<typeof generateQuestSuggestion>[2];
  const task = await generateQuestSuggestion(operation, settings, context, now);
  const event = await generateQuestSuggestion(operation, settings, context, now, 1);
  expect(task).toMatchObject({
    draft: { title: 'Prepare for “Private essay”', activity: 'Task preparation', start: '16:05', end: '16:15' },
    kind: 'task', usesAI: false,
  });
  expect(event).toMatchObject({
    draft: { title: 'Prepare for “Work meeting”', activity: 'Event preparation', start: '16:05', end: '16:15' },
    kind: 'event', usesAI: false,
  });
  expect(request).not.toHaveBeenCalled();
  const goal = await generateQuestSuggestion(operation, settings, context, now, 2);
  expect(request.mock.calls[0]?.[0]).toContain('quest_minutes=10');
  expect(request.mock.calls[0]?.[0]).toContain('activity=gym');
  expect(JSON.stringify(request.mock.calls)).not.toContain('Private essay');
  expect(goal).toMatchObject({
    draft: { title: 'Do a short mobility routine', activity: 'Gym', repeat: 'none' },
    kind: 'goal', usesAI: true,
  });
});

it('skips event preparation when there is no opening before the event', async () => {
  const request = vi.fn(async () => null);
  const operation = { api: { request }, signal: new AbortController().signal } as unknown as AccountOperation;
  const suggestion = await generateQuestSuggestion(operation, null, {
    calendarChecked: true,
    windows: [[at(8), at(30)]],
    event: { startsAt: at(8), title: 'Work meeting' },
  }, now);
  expect(suggestion).toMatchObject({ kind: 'goal', draft: { start: '16:30' } });
});
