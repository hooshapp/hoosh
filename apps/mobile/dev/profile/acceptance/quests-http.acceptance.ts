import type { AuthSessionPort, AuthSnapshot, QuestDefinition } from '@disconnect/contracts';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createApiClient, type ApiFetch } from '../../../src/infrastructure/api/client';
import { createAccountDataController } from '../../../src/infrastructure/query/account-controller';
import {
  readQuest,
  readQuests,
  saveQuest,
  deleteQuest,
} from '../../../src/features/quests/quests-api';

type Identity = { user_id: string; token: string };
const fixture = JSON.parse(process.env.HOOSH_QUESTS_ACCEPTANCE ?? '{}') as {
  marker: string;
  origin: string;
  accounts: Identity[];
  phase: string;
};
const origin = new URL(fixture.origin);
if (
  fixture.marker !== 'RN09B_HTTP_ACCEPTANCE_ONLY' ||
  origin.hostname !== '127.0.0.1' ||
  origin.protocol !== 'http:' ||
  !origin.port ||
  origin.pathname !== '/' ||
  origin.username ||
  origin.password ||
  origin.search ||
  origin.hash ||
  !['write', 'restart'].includes(fixture.phase) ||
  fixture.accounts?.length !== 3 ||
  !fixture.accounts.every((a) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(a.user_id) && typeof a.token === 'string' && a.token.length > 0)
)
  throw new Error('Explicit isolated quest HTTP fixture required');
const ID = '00000000-0000-4000-8000-000000000010',
  TEMP = '00000000-0000-4000-8000-000000000011';
const definition: QuestDefinition = {
  title: 'A saved quest',
  activity: 'Read',
  start_local: '23:00',
  end_local: '01:00',
  next_day: true,
  repeat: 'weekly',
  weekdays: [0, 2],
  timezone_id: 'UTC',
};
function client(identity: Identity) {
  let owner = identity,
    generation = 1;
  const snapshot = (): AuthSnapshot => ({
    status: 'signed_in',
    credentialStatus: 'ready',
    user: { user_id: owner.user_id, email: null },
    sessionGeneration: generation,
  });
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getAccessToken: async () => owner.token,
    revalidateSession: async () => {
      throw new Error('No Auth SDK in fixture');
    },
  };
  let lose = false;
  const trace: string[] = [];
  const fetcher: ApiFetch = async (url, init) => {
    const drop = lose && init?.method === 'PUT';
    if (drop) lose = false;
    const response = await fetch(url, init);
    trace.push(init?.method ?? 'GET');
    if (drop) {
      await response.arrayBuffer();
      throw new TypeError('Intentionally lost committed response');
    }
    return response;
  };
  const api = createApiClient({ baseUrl: origin.origin, auth, fetcher });
  const controller = createAccountDataController(auth, api),
    unsubscribe = controller.subscribe(() => {});
  const scope = () => {
    const result = controller.getSnapshot().scope;
    if (!result) throw new Error('Missing explicit fixture scope');
    return result;
  };
  return {
    read: (id = ID) => scope().read((op) => readQuest(id, op)),
    page: () => scope().read((op) => readQuests(null, op)),
    write: (id: string, revision: number, value = definition) =>
      scope().write((op) => saveQuest(id, { expected_revision: revision, definition: value }, op)),
    delete: (id: string, revision: number) => scope().write((op) => deleteQuest(id, revision, op)),
    lose: () => {
      lose = true;
    },
    trace,
    change: (value: Identity) => {
      owner = value;
      generation++;
      listeners.forEach((fn) => fn());
    },
    close: unsubscribe,
  };
}
let a: ReturnType<typeof client>, b: ReturnType<typeof client>, c: ReturnType<typeof client>;
beforeAll(() => {
  [a, b, c] = fixture.accounts.map(client);
});
afterAll(() => {
  a.close();
  b.close();
  c.close();
});
if (fixture.phase === 'write') {
  test('saved quest definitions persist through actual HTTP with independent owners', async () => {
    expect(await a.read()).toEqual({ quest: null, revision: 0 });
    expect((await a.write(ID, 0)).quest.definition).toEqual(definition);
    expect((await b.write(ID, 0, { ...definition, title: 'B independent' })).quest.user_id).toBe(
      fixture.accounts[1].user_id,
    );
    expect((await c.page()).quests).toEqual([]);
    expect((await a.page()).quests.map((q) => q.quest_id)).toEqual([ID]);
  });
  test('real edits advance once and stale writes return an own safe conflict', async () => {
    const next = await a.write(ID, 1, { ...definition, title: 'Edited 🦖' });
    expect(next.quest.revision).toBe(2);
    await expect(a.write(ID, 1)).rejects.toMatchObject({
      code: 'QUEST_CONFLICT',
      details: { current_revision: 2 },
    });
    expect((await a.read()).quest?.definition.title).toBe('Edited 🦖');
  });
  test('a truly committed lost response is never retried and explicit read recovers it', async () => {
    a.lose();
    const count = a.trace.filter((m) => m === 'PUT').length;
    await expect(
      a.write(ID, 2, { ...definition, title: 'Final persisted 🦖' }),
    ).rejects.toMatchObject({ kind: 'network', requestMayHaveCommitted: true });
    expect(a.trace.filter((m) => m === 'PUT')).toHaveLength(count + 1);
    const recovered = await a.read();
    expect(recovered.revision).toBe(3);
    expect(recovered.quest?.definition.title).toBe('Final persisted 🦖');
  });
  test('foreign deletion cannot touch a record; own deletion wipes content and fences stale creation', async () => {
    await a.write(TEMP, 0);
    expect(await b.read(TEMP)).toEqual({ quest: null, revision: 0 });
    expect(await b.delete(TEMP, 1)).toEqual({ quest_id: TEMP, revision: 0 });
    expect((await a.read(TEMP)).quest).not.toBeNull();
    expect(await a.delete(TEMP, 1)).toEqual({ quest_id: TEMP, revision: 2 });
    expect(await a.read(TEMP)).toEqual({ quest: null, revision: 2 });
    await expect(a.write(TEMP, 0)).rejects.toMatchObject({
      code: 'QUEST_CONFLICT',
      details: { current_revision: 2 },
    });
    expect(await a.delete(TEMP, 1)).toEqual({ quest_id: TEMP, revision: 2 });
  });
  test('switching fixture owners retires private scope/cache before new reads', async () => {
    a.change(fixture.accounts[1]);
    expect((await a.read()).quest?.definition.title).toBe('B independent');
    a.change(fixture.accounts[0]);
    expect((await a.read()).quest?.definition.title).toBe('Final persisted 🦖');
    expect((await c.page()).quests).toEqual([]);
  });
} else
  test('cold mobile clients read identical quests and tombstones after actual API restart', async () => {
    const own = await a.read();
    expect(own.revision).toBe(3);
    expect(own.quest?.definition.title).toBe('Final persisted 🦖');
    expect(await a.read(TEMP)).toEqual({ quest: null, revision: 2 });
    expect((await a.page()).quests).toHaveLength(1);
    expect((await b.read()).quest?.definition.title).toBe('B independent');
    expect((await c.page()).quests).toEqual([]);
    expect(a.trace.every((m) => m === 'GET')).toBe(true);
  });
