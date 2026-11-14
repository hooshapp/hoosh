import type {
  RecommendationAction,
  RecommendationView,
} from '@disconnect/contracts';
import { isQuestId } from '../../domain/quest-values';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import { ApiError, isRecord } from '../../infrastructure/api/errors';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';

const invalid = (): never => {
  throw new ApiError('invalid_response');
};
const bounded = (value: unknown, max: number): value is string =>
  typeof value === 'string' &&
  value.trim() === value &&
  value.length > 0 &&
  Array.from(value).length <= max &&
  !/[\u0000\uD800-\uDFFF]/u.test(value);

export function decodeRecommendation(
  value: unknown,
  context: ResponseContext,
): RecommendationView {
  if (
    !isRecord(value) ||
    !context.account ||
    value.user_id !== context.account.user_id ||
    value.policy_version !== 1 ||
    !utcTimestamp(value.observed_at) ||
    !['offered', 'accepted', 'skipped'].includes(value.state as string) ||
    !(value.accepted_quest_id === null || isQuestId(value.accepted_quest_id))
  )
    return invalid();
  if (value.state !== 'offered') {
    if (
      value.offer !== null ||
      !utcTimestamp(value.next_offer_at) ||
      (value.state === 'skipped' && value.accepted_quest_id !== null)
    )
      return invalid();
    return {
      user_id: value.user_id as string,
      policy_version: 1,
      observed_at: value.observed_at,
      state: value.state as 'accepted' | 'skipped',
      offer: null,
      accepted_quest_id: value.accepted_quest_id as string | null,
      next_offer_at: value.next_offer_at,
    };
  }
  const offer = value.offer;
  if (
    value.next_offer_at !== null ||
    value.accepted_quest_id !== null ||
    !isRecord(offer) ||
    !isQuestId(offer.offer_id) ||
    !bounded(offer.title, 120) ||
    !bounded(offer.activity, 200) ||
    !Number.isSafeInteger(offer.duration_minutes) ||
    (offer.duration_minutes as number) < 5 ||
    (offer.duration_minutes as number) > 30 ||
    offer.completion_credits !== 50 ||
    !['activity_template', 'generic_template'].includes(
      offer.source as string,
    ) ||
    typeof offer.timezone_id !== 'string' ||
    !/^[A-Za-z0-9_+/-]{1,128}$/.test(offer.timezone_id) ||
    !utcTimestamp(offer.expires_at) ||
    Date.parse(offer.expires_at) <= Date.parse(value.observed_at) ||
    Date.parse(offer.expires_at) - Date.parse(value.observed_at) > 900000
  )
    return invalid();
  try {
    new Intl.DateTimeFormat('en', { timeZone: offer.timezone_id });
  } catch {
    return invalid();
  }
  return {
    user_id: value.user_id as string,
    policy_version: 1,
    observed_at: value.observed_at,
    state: 'offered',
    accepted_quest_id: null,
    next_offer_at: null,
    offer: {
      offer_id: offer.offer_id,
      title: offer.title,
      activity: offer.activity,
      duration_minutes: offer.duration_minutes as number,
      completion_credits: 50,
      source: offer.source as 'activity_template' | 'generic_template',
      timezone_id: offer.timezone_id,
      expires_at: offer.expires_at,
    },
  };
}
export function readRecommendation({ api, signal }: AccountOperation) {
  return api.request('/v1/recommendations/current', {
    signal,
    decode: decodeRecommendation,
  });
}
export function decideRecommendation(
  body: RecommendationAction,
  { api, signal }: AccountOperation,
) {
  return api.request('/v1/recommendations/decision', {
    method: 'PUT',
    signal,
    json: body,
    decode: (value, context) => {
      const result = decodeRecommendation(value, context);
      if (
        result.state !== body.action ||
        (result.accepted_quest_id !== null &&
          result.accepted_quest_id !== body.offer_id)
      )
        return invalid();
      return result;
    },
  });
}
