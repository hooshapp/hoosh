import type { FeedReceipt, FeedResult, RewardBatch, RewardBatchResult, RewardView } from '@disconnect/contracts';
import { isQuestDate, isQuestId } from '../../domain/quest-values';
import { utcTimestamp } from '../../infrastructure/api/decoders';
import { ApiError, isRecord } from '../../infrastructure/api/errors';
import type { ResponseContext } from '../../infrastructure/api/types';
import type { AccountOperation } from '../../infrastructure/query/account-scope';

const invalid = (): never => { throw new ApiError('invalid_response'); };
const integer = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const keys = (v: Record<string, unknown>, names: string[]) => Object.keys(v).sort().join() === names.sort().join();
export function decodeWallet(v: unknown, context: ResponseContext): RewardView {
  if (!isRecord(v) || !context.account || v.user_id !== context.account.user_id || !integer(v.revision, 0, 2147483647) ||
      !integer(v.balance) || !integer(v.health, 0, 100) || v.policy_version !== 2 || v.feed_cost !== 10 || v.feed_health !== 20 ||
      !(v.streak_days === null || integer(v.streak_days)) || typeof v.recent_week_complete !== 'boolean' || !utcTimestamp(v.observed_at)) return invalid();
  const artwork = v.health <= 25 ? 'needsCare' : v.health <= 50 ? 'feelingLow' : v.health <= 75 ? 'doingOkay' : 'happy';
  if (v.artwork !== artwork || (v.recent_week_complete && (v.streak_days === null || (v.streak_days as number) < 7))) return invalid();
  return { user_id: v.user_id as string, revision: v.revision, balance: v.balance, health: v.health, artwork,
    policy_version: 2, feed_cost: 10, feed_health: 20, streak_days: v.streak_days as number | null,
    recent_week_complete: v.recent_week_complete, observed_at: v.observed_at };
}
/** Validate the complete content-free native envelope before sending any evidence. */
export function decodeRewardBatch(v: unknown): RewardBatch {
  if (!isRecord(v) || !keys(v, ['installation_id', 'timezone_id', 'discarded', 'events']) || !isQuestId(v.installation_id) ||
      !integer(v.discarded) || typeof v.timezone_id !== 'string' || v.timezone_id.length > 128 || !/^[A-Za-z0-9_+/-]+$/.test(v.timezone_id) ||
      !Array.isArray(v.events) || v.events.length > 32) return invalid();
  try { new Intl.DateTimeFormat('en', { timeZone: v.timezone_id }); } catch { return invalid(); }
  const seen = new Set<string>();
  let sequence = 0, at = 0;
  const events = v.events.map((e): RewardBatch['events'][number] => {
    if (!isRecord(e) || !keys(e, ['event_id', 'sequence', 'occurred_at', 'kind', 'day', 'encounter_id', 'context', 'exhausted', 'covered']) ||
        !isQuestId(e.event_id) || seen.has(e.event_id) || !integer(e.sequence, sequence + 1) || !utcTimestamp(e.occurred_at) ||
        Date.parse(e.occurred_at) < at || !isQuestDate(e.day)) return invalid();
    const quit = e.kind === 'quit' && isQuestId(e.encounter_id) && ['initial', 'expired', 'mid_session', 'notification_accept'].includes(e.context as string) && e.exhausted === null && e.covered === null;
    const allowance = e.kind === 'allowance' && e.encounter_id === null && e.context === null && typeof e.exhausted === 'boolean' && e.covered === null;
    const day = e.kind === 'day_closed' && e.encounter_id === null && e.context === null && typeof e.exhausted === 'boolean' && typeof e.covered === 'boolean';
    if (!quit && !allowance && !day) return invalid();
    seen.add(e.event_id); sequence = e.sequence; at = Date.parse(e.occurred_at);
    return { event_id: e.event_id, sequence: e.sequence, occurred_at: e.occurred_at, kind: e.kind as 'quit' | 'allowance' | 'day_closed', day: e.day,
      encounter_id: e.encounter_id as string | null, context: e.context as 'initial' | 'expired' | 'mid_session' | 'notification_accept' | null,
      exhausted: e.exhausted as boolean | null, covered: e.covered as boolean | null };
  });
  return { installation_id: v.installation_id, timezone_id: v.timezone_id, discarded: v.discarded, events };
}
export function readWallet({ api, signal }: AccountOperation) {
  return api.request('/v1/rewards', { signal, decode: decodeWallet });
}
export function ingestRewards(body: RewardBatch, { api, signal }: AccountOperation) {
  if (!body.events.length) throw new ApiError('validation');
  return api.request('/v1/rewards/events', { method: 'PUT', signal, json: body, decode: (v, c): RewardBatchResult => {
    if (!isRecord(v) || v.installation_id !== body.installation_id || !integer(v.accepted_sequence, body.events.at(-1)!.sequence)) return invalid();
    return { installation_id: body.installation_id, accepted_sequence: v.accepted_sequence, wallet: decodeWallet(v.wallet, c) };
  } });
}
export function feedDino(id: string, revision: number, { api, signal }: AccountOperation) {
  if (!isQuestId(id) || !integer(revision, 0, 2147483646)) throw new ApiError('validation');
  return api.request(`/v1/rewards/feed/${id}`, { method: 'PUT', json: { expected_revision: revision }, signal, decode: (v, c): FeedResult => {
    if (!isRecord(v) || v.request_id !== id || ![10, 20].includes(v.charged_credits as number) || !integer(v.health_added, 1, 20)) return invalid();
    return { request_id: id, charged_credits: v.charged_credits as 10 | 20, health_added: v.health_added, wallet: decodeWallet(v.wallet, c) };
  } });
}
export function readFeedReceipt(id: string, { api, signal }: AccountOperation) {
  if (!isQuestId(id)) throw new ApiError('validation');
  return api.request(`/v1/rewards/feed/${id}`, { signal, decode: (v, c): FeedReceipt => {
    if (!isRecord(v) || v.request_id !== id || typeof v.recorded !== 'boolean' ||
        !(v.recorded ? integer(v.health_added, 1, 20) : v.health_added === null)) return invalid();
    return { request_id: id, recorded: v.recorded, health_added: v.health_added as number | null, wallet: decodeWallet(v.wallet, c) };
  } });
}
