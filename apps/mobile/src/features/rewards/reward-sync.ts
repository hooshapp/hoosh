import { isQuestId } from '../../domain/quest-values';
import type { ProductNativePort } from '../../infrastructure/native/product-ports';
import type { AccountScope } from '../../infrastructure/query/account-scope';
import { decodeRewardBatch, ingestRewards } from './rewards-api';

export type RewardBinding = Readonly<{ owner: string; generation: number; port: ProductNativePort }>;
const activeSyncs = new WeakMap<AccountScope, { binding: RewardBinding; promise: Promise<boolean> }>();
/** Retry-safe evidence transport only. This never grants permissions or installs protection. */
export async function syncRewards(scope: AccountScope, binding: RewardBinding | null) {
  if (!binding?.port.rewardsRead || !binding.port.rewardsAck) return false;
  const active = activeSyncs.get(scope);
  if (active?.binding === binding) return active.promise;
  if (active) await active.promise.catch(() => undefined);
  const replacement = activeSyncs.get(scope);
  if (replacement) return syncRewards(scope, binding);
  const promise = drainRewards(scope, binding);
  activeSyncs.set(scope, { binding, promise });
  try {
    return await promise;
  } finally {
    if (activeSyncs.get(scope)?.promise === promise) activeSyncs.delete(scope);
  }
}
async function drainRewards(scope: AccountScope, binding: RewardBinding) {
  const { owner, port } = binding;
  const current = () => {
    scope.assertCurrent();
    if (binding.generation !== scope.account.sessionGeneration || !owner.endsWith(`:${scope.account.user_id}`)) throw new Error('Reward owner changed');
  };
  current();
  let token: string | null = null;
  try {
    const opened = await port.interventionOpen(owner);
    if (!isQuestId(opened)) throw new Error('Unverified native handle');
    token = opened; current();
    // The durable outbox is bounded to 256. ACK only each submitted prefix.
    for (let i = 0; i < 8; i++) {
      const raw = await port.rewardsRead!(owner); current();
      if (raw === null) return true;
      const batch = decodeRewardBatch(raw);
      if (!batch.events.length) return true;
      const result = await scope.write((op) => ingestRewards(batch, op)); current();
      if (batch.events.some(event => event.context === 'notification_accept' && event.kind === 'quit')) {
        void scope.client.invalidateQueries({ queryKey: scope.key('quests') });
      }
      await port.rewardsAck!(owner, token, result.installation_id, batch.events.at(-1)!.sequence); current();
    }
    return true;
  } finally {
    if (token) await port.interventionRelease(owner, token);
  }
}
