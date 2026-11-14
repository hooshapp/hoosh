import type { RecommendationView } from '@disconnect/contracts';
export const A = '00000000-0000-4000-8000-000000000001';
export const ID = '00000000-0000-4000-8000-000000000002';
export function offered(now = Date.now()): RecommendationView {
  return {
    user_id: A,
    policy_version: 1,
    observed_at: new Date(now).toISOString(),
    state: 'offered',
    accepted_quest_id: null,
    next_offer_at: null,
    offer: {
      offer_id: ID,
      title: 'Read for a little while',
      activity: 'Reading',
      duration_minutes: 20,
      completion_credits: 50,
      source: 'activity_template',
      timezone_id: 'UTC',
      expires_at: new Date(now + 600000).toISOString(),
    },
  };
}
