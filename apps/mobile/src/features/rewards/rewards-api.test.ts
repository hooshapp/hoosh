import { describe, expect, it, vi } from 'vitest';
import { decodeRewardBatch, decodeWallet, feedDino, ingestRewards, readFeedReceipt } from './rewards-api';
import { syncRewards } from './reward-sync';
import type { AccountOperation, AccountScope } from '../../infrastructure/query/account-scope';
import type { ProductNativePort } from '../../infrastructure/native/product-ports';
const A = '00000000-0000-4000-8000-000000000001', I = '00000000-0000-4000-8000-000000000002';
const context = { account: { user_id: A, sessionGeneration: 1 } };
const wallet = { user_id: A, revision: 3, balance: 50, health: 50, artwork: 'doingOkay', feed_cost: 20, feed_health: 20,
  streak_days: null, recent_week_complete: false, observed_at: '2026-11-13T12:00:00Z', policy_version: 1 };
const batch = { installation_id: I, timezone_id: 'UTC', discarded: 0, events: [{ event_id: A, sequence: 1, occurred_at: '2026-11-13T12:00:00Z',
  kind: 'quit', day: '2026-11-13', encounter_id: I, context: 'initial', exhausted: null, covered: null }] };
function operation(response: unknown) {
  const request = vi.fn(async (_path, options) => options.decode(response, context));
  return { op: { api: { request }, signal: new AbortController().signal, account: context.account } as unknown as AccountOperation, request };
}
describe('verified reward transport', () => {
  it('accepts server health bands and rejects private-account or incoherent data', () => {
    expect(decodeWallet(wallet, context)).toEqual(wallet);
    for (const patch of [{ user_id: I }, { balance: -1 }, { balance: Number.MAX_SAFE_INTEGER + 1 }, { health: 101 }, { artwork: 'happy' },
      { feed_cost: 0 }, { streak_days: null, recent_week_complete: true }, { observed_at: 'yesterday' }, { policy_version: 2 }]) {
      expect(() => decodeWallet({ ...wallet, ...patch }, context)).toThrow();
    }
  });
  it('rejects raw app identities, bad signal shapes, timezone, duplicate IDs and ordering', () => {
    expect(decodeRewardBatch(batch)).toEqual(batch);
    for (const value of [{ ...batch, app_ids: ['private.app'] }, { ...batch, timezone_id: 'Bad/Zone' }, { ...batch, discarded: true },
      { ...batch, events: [batch.events[0], batch.events[0]] }, { ...batch, events: [{ ...batch.events[0], amount: 500 }] },
      { ...batch, events: [{ ...batch.events[0], covered: true }] }]) expect(() => decodeRewardBatch(value)).toThrow();
  });
  it('requires exact Feed identity, price and receipt shape; sends only expected revision', async () => {
    const { op, request } = operation({ request_id: I, charged_credits: 20, health_added: 20, wallet });
    await feedDino(I, 3, op);
    expect(request).toHaveBeenCalledWith(`/v1/rewards/feed/${I}`, expect.objectContaining({ method: 'PUT', json: { expected_revision: 3 } }));
    await expect(feedDino(A, 3, op)).rejects.toThrow();
    await expect(feedDino(I, 3, operation({ request_id: I, charged_credits: 0, health_added: 20, wallet }).op)).rejects.toThrow();
    await expect(readFeedReceipt(I, operation({ request_id: I, recorded: false, health_added: 20, wallet }).op)).rejects.toThrow();
    await readFeedReceipt(I, operation({ request_id: I, recorded: false, health_added: null, wallet }).op);
  });
  it('rejects wrong-installation and insufficient server acknowledgments', async () => {
    for (const patch of [{ installation_id: A }, { accepted_sequence: 0 }]) await expect(ingestRewards(decodeRewardBatch(batch), operation({ installation_id: I, accepted_sequence: 1, wallet, ...patch }).op)).rejects.toThrow();
  });
});
function setupSync() {
  let alive = true;
  const { op, request } = operation({ installation_id: I, accepted_sequence: 999, wallet });
  const current = () => { if (!alive) throw new Error('account changed'); };
  const scope = { account: context.account, assertCurrent: current, write: async (work: (op: AccountOperation) => unknown) => work(op) } as unknown as AccountScope;
  const port = { interventionOpen: vi.fn(async () => I), interventionRelease: vi.fn(async () => {}),
    rewardsRead: vi.fn().mockResolvedValueOnce(batch).mockResolvedValue({ ...batch, events: [] }), rewardsAck: vi.fn(async () => {}) };
  const binding = { owner: `qa:${A}`, generation: 1, port: port as unknown as ProductNativePort };
  return { scope, binding, port, request, close: () => { alive = false; } };
}
describe('native outbox delivery and account fences', () => {
  it('ACKs only the submitted prefix, even if server has accepted a later sequence', async () => {
    const s = setupSync(); expect(await syncRewards(s.scope, s.binding)).toBe(true);
    expect(s.port.rewardsAck).toHaveBeenCalledWith(`qa:${A}`, I, I, 1);
    expect(s.port.interventionRelease).toHaveBeenCalledOnce();
  });
  it('never ACKs a failed upload and releases the lease', async () => {
    const s = setupSync(); s.request.mockRejectedValueOnce(new Error('offline'));
    await expect(syncRewards(s.scope, s.binding)).rejects.toThrow();
    expect(s.port.rewardsAck).not.toHaveBeenCalled(); expect(s.port.interventionRelease).toHaveBeenCalledOnce();
  });
  it('suppresses late account ACKs after successful server commit', async () => {
    const s = setupSync(); s.request.mockImplementationOnce(async () => { s.close(); return { installation_id: I, accepted_sequence: 1, wallet }; });
    await expect(syncRewards(s.scope, s.binding)).rejects.toThrow(); expect(s.port.rewardsAck).not.toHaveBeenCalled();
    expect(s.port.interventionRelease).toHaveBeenCalledOnce();
  });
  it('releases a handle obtained after scope disposal and rejects owner mismatch before opening', async () => {
    const s = setupSync(); s.port.interventionOpen.mockImplementationOnce(async () => { s.close(); return I; });
    await expect(syncRewards(s.scope, s.binding)).rejects.toThrow(); expect(s.port.interventionRelease).toHaveBeenCalledOnce();
    const t = setupSync(); await expect(syncRewards(t.scope, { ...t.binding, owner: `qa:${I}` })).rejects.toThrow();
    expect(t.port.interventionOpen).not.toHaveBeenCalled();
  });
  it('leaves unsupported native builds truthful without blocking server rewards', async () => {
    const s = setupSync(); expect(await syncRewards(s.scope, null)).toBe(false); expect(s.request).not.toHaveBeenCalled();
  });
});
