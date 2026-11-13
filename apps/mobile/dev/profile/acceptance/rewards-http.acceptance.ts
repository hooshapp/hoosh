import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { afterAll, expect, test } from 'vitest';
import { createApiClient, type ApiFetch } from '../../../src/infrastructure/api/client';
import { createAccountDataController } from '../../../src/infrastructure/query/account-controller';
import { feedDino, ingestRewards, readFeedReceipt, readWallet } from '../../../src/features/rewards/rewards-api';
const fixture = JSON.parse(process.env.HOOSH_REWARDS_ACCEPTANCE ?? '{}') as {
  marker: string; origin: string; accounts: { user_id: string; token: string }[]; phase: string;
};
const url = new URL(fixture.origin);
if (fixture.marker !== 'RN09D01_HTTP_ACCEPTANCE_ONLY' || url.protocol !== 'http:' || url.hostname !== '127.0.0.1' ||
    !url.port || url.pathname !== '/' || url.username || url.password || url.search || url.hash || !['write', 'restart'].includes(fixture.phase) ||
    fixture.accounts?.length !== 3 || fixture.accounts.some((a) => !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(a.user_id) || !a.token)) throw new Error('Explicit disposable rewards fixture required');
function client(index: number) {
  const identity = fixture.accounts[index];
  const snapshot: AuthSnapshot = { status: 'signed_in', credentialStatus: 'ready', sessionGeneration: 1, user: { user_id: identity.user_id, email: null } };
  const auth: AuthSessionPort = { getSnapshot: () => snapshot, subscribe: () => () => {}, getAccessToken: async () => identity.token, revalidateSession: async () => { throw new Error('No SDK in test'); } };
  let lose = false;
  const writes: string[] = [];
  const fetcher: ApiFetch = async (url, init) => {
    const drop = lose && init?.method === 'PUT'; if (drop) lose = false;
    const response = await fetch(url, init);
    if (init?.method === 'PUT') writes.push('PUT');
    if (drop) { await response.arrayBuffer(); throw new TypeError('Intentionally lost committed response'); }
    return response;
  };
  const api = createApiClient({ baseUrl: fixture.origin, auth, fetcher });
  const controller = createAccountDataController(auth, api), close = controller.subscribe(() => {});
  const scope = () => { const s = controller.getSnapshot().scope; if (!s) throw new Error('Fixture scope absent'); return s; };
  return { scope, close, writes, lose: () => { lose = true; } };
}
const clients = fixture.accounts.map((_, i) => client(i));
afterAll(() => clients.forEach((c) => c.close()));
const ID = '00000000-0000-4000-8000-000000000091', INSTALL = '00000000-0000-4000-8000-000000000092';
const [a, b] = clients;
if (fixture.phase === 'write') {
  test('production HTTP decoder sees account ledger and isolates another owner', async () => {
    expect((await a.scope().read(readWallet)).balance).toBe(50);
    expect((await b.scope().read(readWallet)).balance).toBe(0);
  });
  test('lost Feed response is checked by GET and same-ID replay cannot charge twice', async () => {
    const before = await a.scope().read(readWallet); a.lose();
    await expect(a.scope().write((op) => feedDino(ID, before.revision, op))).rejects.toMatchObject({ requestMayHaveCommitted: true });
    const receipt = await a.scope().read((op) => readFeedReceipt(ID, op));
    expect(receipt.recorded).toBe(true); expect(receipt.wallet.balance).toBe(30);
    expect((await a.scope().write((op) => feedDino(ID, before.revision, op))).wallet.balance).toBe(30);
    expect(a.writes).toHaveLength(2);
    expect((await b.scope().read((op) => readFeedReceipt(ID, op))).recorded).toBe(false);
  });
  test('real native batch contract is durable, replay-safe and account-owned', async () => {
    const now = new Date();
    const body = { installation_id: INSTALL, timezone_id: 'UTC', discarded: 0, events: [{ event_id: ID, sequence: 1,
      occurred_at: now.toISOString(), kind: 'quit' as const, day: now.toISOString().slice(0, 10), encounter_id: INSTALL,
      context: 'initial' as const, exhausted: null, covered: null }] };
    for (let i = 0; i < 2; i++) expect((await a.scope().write((op) => ingestRewards(body, op))).wallet.balance).toBe(35);
    expect((await b.scope().read(readWallet)).balance).toBe(0);
  });
} else {
  test('actual API process restart preserves wallet and Feed receipt without replay', async () => {
    expect((await a.scope().read(readWallet)).balance).toBe(35);
    expect((await a.scope().read((op) => readFeedReceipt(ID, op))).recorded).toBe(true);
    expect((await b.scope().read(readWallet)).balance).toBe(0);
    expect(a.writes).toHaveLength(0);
  });
}
