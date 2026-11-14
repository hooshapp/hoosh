import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { afterAll, expect, test } from 'vitest';
import {
  createApiClient,
  type ApiFetch,
} from '../../../src/infrastructure/api/client';
import { createAccountDataController } from '../../../src/infrastructure/query/account-controller';
import {
  readHistory,
  saveHistory,
} from '../../../src/features/history/history-api';
import { historyProjection } from '../../../src/features/history/history-projection';
const fixture = JSON.parse(process.env.HOOSH_HISTORY_ACCEPTANCE ?? '{}') as {
  marker: string;
  origin: string;
  accounts: { user_id: string; token: string }[];
  phase: string;
};
const url = new URL(fixture.origin);
if (
  fixture.marker !== 'RN09_HISTORY_HTTP_ACCEPTANCE_ONLY' ||
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
  throw new Error('Explicit isolated History fixture required');
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
      throw new TypeError('Intentionally lost committed History response');
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
const SERIES = '00000000-0000-4000-8000-000000000072';
function body() {
  const today = new Date().toISOString().slice(0, 10),
    stamp = Date.parse(today);
  const day = (i: number) =>
    new Date(stamp - i * 86400000).toISOString().slice(0, 10);
  return {
    expected_revision: 0,
    series_id: SERIES,
    timezone_id: 'UTC',
    selected_count: 2,
    started_on: day(42),
    source: 'android_usage_events_v1' as const,
    days: Array.from({ length: 42 }, (_, i) => ({
      day: day(42 - i),
      usage_ms: (i < 7 ? 2 : 1) * 3600000,
      coverage: 'reported' as const,
    })),
  };
}
if (fixture.phase === 'write') {
  test('actual client starts empty without fabricating usage or writes', async () => {
    expect((await a.scope().read(readHistory)).week.usage_ms).toBeNull();
    expect(a.writes).toHaveLength(0);
  });
  test('verified aggregate write computes fixed baseline and equivalent periods', async () => {
    const result = await a.scope().write((op) => saveHistory(body(), op));
    expect(result.week.saved_ms).toBe(7 * 3600000);
    expect(result.month.saved_ms).toBe(28 * 3600000);
    expect(historyProjection(result, true).summary.savedHours).toMatchObject({
      state: 'ready',
      data: { value: 7 },
    });
    expect((await b.scope().read(readHistory)).series_id).toBeNull();
  });
  test('lost same-series response reconciles without a new baseline or repeated write', async () => {
    const data = body();
    a.lose();
    await expect(
      a.scope().write((op) => saveHistory(data, op)),
    ).rejects.toMatchObject({ requestMayHaveCommitted: true });
    const before = a.writes.length,
      result = await a.scope().read(readHistory);
    expect(result.series_id).toBe(SERIES);
    expect(result.week.saved_ms).toBe(7 * 3600000);
    expect(a.writes).toHaveLength(before);
  });
  test('a stale replacement cannot overwrite the account series', async () => {
    await expect(
      a
        .scope()
        .write((op) =>
          saveHistory(
            { ...body(), series_id: '00000000-0000-4000-8000-000000000073' },
            op,
          ),
        ),
    ).rejects.toMatchObject({ kind: 'conflict', code: 'HISTORY_CONFLICT' });
    expect((await a.scope().read(readHistory)).series_id).toBe(SERIES);
    expect((await c.scope().read(readHistory)).revision).toBe(0);
  });
} else
  test('actual API process restart retains own baseline/current summaries and isolation', async () => {
    const result = await a.scope().read(readHistory);
    expect(result.series_id).toBe(SERIES);
    expect(result.week.saved_ms).toBe(7 * 3600000);
    expect(result.baseline_reported_days).toBe(7);
    expect((await b.scope().read(readHistory)).revision).toBe(0);
    expect(a.writes).toHaveLength(0);
  });
