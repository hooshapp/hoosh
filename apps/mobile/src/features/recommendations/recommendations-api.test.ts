import { expect, test } from 'vitest';
import { decodeRecommendation } from './recommendations-api';
import { A, ID, offered } from './__tests__/fixture';
const c = { account: { user_id: A, sessionGeneration: 1 } };
test('strict own offer decoding rejects missing context, bad time/source/reward and mismatched states', () => {
  const value = offered();
  expect(decodeRecommendation(value, c)).toEqual(value);
  for (const patch of [
    { user_id: ID },
    { policy_version: 2 },
    { state: 'completed' },
    { accepted_quest_id: ID },
    { next_offer_at: value.observed_at },
    ...[
      { duration_minutes: true },
      { duration_minutes: 31 },
      { completion_credits: 500 },
      { source: 'ai' },
      { timezone_id: 'Bad/Zone' },
      { title: '' },
      { expires_at: value.observed_at },
    ].map((p) => ({ offer: { ...value.offer, ...p } })),
  ])
    expect(() => decodeRecommendation({ ...value, ...patch }, c)).toThrow();
  expect(() => decodeRecommendation(value, { account: null })).toThrow();
});
test('accepted/deleted and skipped receipts are distinct from a current offer', () => {
  const base = {
    ...offered(),
    offer: null,
    next_offer_at: new Date(Date.now() + 86400000).toISOString(),
  };
  expect(
    decodeRecommendation(
      { ...base, state: 'accepted', accepted_quest_id: ID },
      c,
    ).accepted_quest_id,
  ).toBe(ID);
  expect(
    decodeRecommendation(
      { ...base, state: 'accepted', accepted_quest_id: null },
      c,
    ).state,
  ).toBe('accepted');
  expect(decodeRecommendation({ ...base, state: 'skipped' }, c).state).toBe(
    'skipped',
  );
  expect(() =>
    decodeRecommendation(
      { ...base, state: 'skipped', accepted_quest_id: ID },
      c,
    ),
  ).toThrow();
});
