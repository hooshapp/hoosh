import { expect, it } from 'vitest';
import { planDraftInput } from '../plans/plan-draft-model';
import { setupActivities, setupPlan, setupTime, starterPlan, reviewSavedSettings } from './setup-model';

it.each([[0, '00:00'], [1439, '23:59'], [-1, undefined], [1440, undefined], [1.5, undefined]])(
  'converts minutes %s inside a single local day',
  (minutes, time) => expect(setupTime(minutes).value).toBe(time),
);

it('maps canonical IDs and preserves raw Unicode before server normalization', () => {
  const raw = `  ${'🦖'.repeat(200)}  `;
  expect(setupActivities(['gym', 'reading', 'arts_and_crafts', 'walking', 'music', 'cooking'], [raw]).value)
    .toEqual({ selected_activity_ids: ['gym', 'reading', 'arts_and_crafts', 'walking', 'music', 'cooking'], custom_text: raw });
  expect(setupActivities([], []).value?.custom_text).toBeNull();
  expect(setupActivities(['Gym'], []).error).toBeDefined();
  for (const custom of [[' '], ['a', 'b'], ['🦖'.repeat(201)], ['a\u0000b']]) {
    expect(setupActivities([], custom).error).toBeDefined();
  }
});

it('uses the reviewed starter and preserves exact saved values in inverse projection', () => {
  const input = starterPlan('America/New_York');
  const result = setupPlan(input);
  expect(result.value).toEqual({
    weekdays: [0, 1, 2, 3, 4], hours: { start_local: '09:00', end_local: '22:00', next_day: false },
    timezone_id: 'America/New_York', session_count: 2, session_minutes: 15,
  });
  if (!result.value) throw new Error(result.error);
  const plan = { ...result.value, weekdays: [0, 6], session_count: null };
  const activities = { selected_activity_ids: ['walking'] as const, custom_text: 'Birdwatching' };
  const view = reviewSavedSettings({
    user_id: 'test', revision: 9, created_at: '', updated_at: '',
    activities: { ...activities, selected_activity_ids: [...activities.selected_activity_ids] },
    plan_draft: plan,
  });
  expect(view.activities).toEqual({ selected: ['walking'], customSelected: true, custom: 'Birdwatching' });
  expect(setupPlan(view.plan).value).toEqual(plan);
});

it('rejects duplicate or out-of-range days, equal times, implicit overnight and invalid zone', () => {
  const input = starterPlan('Europe/Paris');
  for (const invalid of [
    { ...input, weekdays: [0, 0] }, { ...input, weekdays: [7] },
    { ...input, hours: { start: '00:00', end: '00:00', nextDay: false } },
    { ...input, hours: { start: '23:59', end: '00:00', nextDay: false } },
    { ...input, timezone: 'America/Invalid' }, { ...input, timezone: '+0500' },
    { ...input, sessions: { count: 1001, minutes: 1 } },
  ]) expect(setupPlan(invalid).error).toBeDefined();
  expect(setupPlan({ ...input, weekdays: [6, 0], hours: { start: '23:59', end: '00:00', nextDay: true } }).value)
    .toMatchObject({ weekdays: [0, 6], hours: { start_local: '23:59', end_local: '00:00', next_day: true } });
  expect(setupPlan(planDraftInput(null)).value)
    .toEqual({ weekdays: [], hours: null, timezone_id: null, session_count: null, session_minutes: null });
  expect(setupPlan(null).value).toBeNull();
});
