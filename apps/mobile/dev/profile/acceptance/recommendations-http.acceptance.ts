import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { afterAll, expect, test } from 'vitest';
import {
  createApiClient,
  type ApiFetch,
} from '../../../src/infrastructure/api/client';
import { createAccountDataController } from '../../../src/infrastructure/query/account-controller';
import {
  readRecommendation,
  decideRecommendation,
} from '../../../src/features/recommendations/recommendations-api';
import { readQuest, readQuests } from '../../../src/features/quests/quests-api';
import { readQuestExecution } from '../../../src/features/quests/quest-execution-api';
import { readWallet } from '../../../src/features/rewards/rewards-api';
const fixture = JSON.parse(
  process.env.HOOSH_RECOMMENDATIONS_ACCEPTANCE ?? '{}',
) as {
  marker: string;
  origin: string;
  accounts: { user_id: string; token: string }[];
  phase: string;
};
const url = new URL(fixture.origin);
if (
  fixture.marker !== 'RN09_RECOMMENDATIONS_HTTP_ACCEPTANCE_ONLY' ||
  url.protocol !== 'http:' ||
  url.hostname !== '127.0.0.1' ||
  !url.port ||
  url.pathname !== '/' ||
  url.username ||
  url.password ||
  url.search ||
  url.hash ||
  !['write', 'restart'].includes(fixture.phase) ||
  fixture.accounts?.length !== 3
)
  throw new Error('Explicit isolated Recommendations fixture required');
function account(index: number) {
  const identity = fixture.accounts[index];
  const snapshot: AuthSnapshot = {
    status: 'signed_in',
    credentialStatus: 'ready',
    sessionGeneration: 1,
    user: { user_id: identity.user_id, email: null },
  };
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    getAccessToken: async () => identity.token,
    revalidateSession: async () => {
      throw new Error('No SDK fixture');
    },
  };
  let lose = false;
  const writes: string[] = [];
  const fetcher: ApiFetch = async (url, init) => {
    const drop = lose && init?.method === 'PUT';
    if (drop) lose = false;
    const response = await fetch(url, init);
    if (init?.method === 'PUT') writes.push('PUT');
    if (drop) {
      await response.arrayBuffer();
      throw new TypeError(
        'Intentionally lost committed Recommendations response',
      );
    }
    return response;
  };
  const api = createApiClient({ baseUrl: fixture.origin, auth, fetcher }),
    controller = createAccountDataController(auth, api),
    close = controller.subscribe(() => {});
  const scope = () => {
    const s = controller.getSnapshot().scope;
    if (!s) throw new Error('Missing fixture account');
    return s;
  };
  return {
    scope,
    close,
    writes,
    lose: () => {
      lose = true;
    },
  };
}
const [a, b, c] = fixture.accounts.map((_, i) => account(i));
afterAll(() => [a, b, c].forEach((s) => s.close()));

if (fixture.phase === 'write') {
  test('nonmutating current offer is not an accepted quest or earned credit', async () => {
    const value = await a.scope().read(readRecommendation);
    expect(value.offer?.source).toBe('generic_template');
    expect(
      (await a.scope().read((op) => readQuests(null, op))).quests,
    ).toHaveLength(0);
    expect(a.writes).toHaveLength(0);
  });
  test('Accept creates one replay-safe one-time definition without schedule or reward', async () => {
    const value = await a.scope().read(readRecommendation);
    const body = {
      offer_id: value.offer!.offer_id,
      action: 'accepted' as const,
    };
    const accepted = await a
      .scope()
      .write((op) => decideRecommendation(body, op));
    expect(accepted.accepted_quest_id).toBe(body.offer_id);
    const quest = await a.scope().read((op) => readQuest(body.offer_id, op));
    expect(quest.quest?.definition.repeat).toBe('none');
    expect(
      (await a.scope().read((op) => readQuestExecution(body.offer_id, op)))
        .enabled,
    ).toBe(false);
    expect((await a.scope().read(readWallet)).balance).toBe(0);
    expect(
      (await a.scope().write((op) => decideRecommendation(body, op)))
        .accepted_quest_id,
    ).toBe(body.offer_id);
    expect(
      (await a.scope().read((op) => readQuests(null, op))).quests,
    ).toHaveLength(1);
    expect((await b.scope().read(readRecommendation)).state).toBe('offered');
  });
  test('lost committed Skip recovers through GET, opposite decision stays rejected', async () => {
    const value = await b.scope().read(readRecommendation);
    const body = {
      offer_id: value.offer!.offer_id,
      action: 'skipped' as const,
    };
    b.lose();
    await expect(
      b.scope().write((op) => decideRecommendation(body, op)),
    ).rejects.toMatchObject({ requestMayHaveCommitted: true });
    const count = b.writes.length;
    expect((await b.scope().read(readRecommendation)).state).toBe('skipped');
    expect(b.writes).toHaveLength(count);
    await expect(
      b
        .scope()
        .write((op) =>
          decideRecommendation({ ...body, action: 'accepted' }, op),
        ),
    ).rejects.toMatchObject({ code: 'RECOMMENDATION_CONFLICT' });
    expect(
      (await b.scope().read((op) => readQuests(null, op))).quests,
    ).toHaveLength(0);
  });
  test('foreign or invented offer cannot create a quest for another account', async () => {
    const accepted = await a.scope().read(readRecommendation);
    await expect(
      c
        .scope()
        .write((op) =>
          decideRecommendation(
            { offer_id: accepted.accepted_quest_id!, action: 'accepted' },
            op,
          ),
        ),
    ).rejects.toMatchObject({ code: 'RECOMMENDATION_CONFLICT' });
    expect(
      (await c.scope().read((op) => readQuests(null, op))).quests,
    ).toHaveLength(0);
  });
} else
  test('actual API restart retains accepted/skipped decisions and one-time quest isolation', async () => {
    const accepted = await a.scope().read(readRecommendation);
    expect(accepted.state).toBe('accepted');
    expect(
      (await a.scope().read((op) => readQuest(accepted.accepted_quest_id!, op)))
        .quest?.definition.repeat,
    ).toBe('none');
    expect((await b.scope().read(readRecommendation)).state).toBe('skipped');
    expect((await c.scope().read(readRecommendation)).state).toBe('offered');
    expect(a.writes).toHaveLength(0);
  });
