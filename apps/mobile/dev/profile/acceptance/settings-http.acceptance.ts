import type {
  AuthSessionPort,
  AuthSnapshot,
  SettingsPatch,
  SettingsView,
} from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createApiClient, type ApiFetch } from '../../../src/infrastructure/api/client';
import { ApiError } from '../../../src/infrastructure/api/errors';
import { createAccountDataController } from '../../../src/infrastructure/query/account-controller';
import { activityPayload } from '../../../src/features/preferences/activity-model';
import { planDraftInput, planDraftPatch } from '../../../src/features/plans/plan-draft-model';
import { readSettings, saveSettings } from '../../../src/features/settings/settings-api';
import { settingsSummary } from '../../../src/features/settings/settings-summary-model';

const marker = 'RN09L_HTTP_ACCEPTANCE_ONLY';
type Identity = { user_id: string; token: string };
type Fixture = { marker: string; origin: string; phase: 'write' | 'restart'; accounts: Identity[] };
const fixture = JSON.parse(process.env.HOOSH_SETTINGS_ACCEPTANCE ?? '{}') as Fixture;
const origin = new URL(fixture.origin);
if (
  fixture.marker !== marker ||
  origin.hostname !== '127.0.0.1' ||
  origin.protocol !== 'http:' ||
  !origin.port ||
  origin.username ||
  origin.password ||
  origin.pathname !== '/' ||
  origin.search ||
  origin.hash ||
  !['write', 'restart'].includes(fixture.phase) ||
  fixture.accounts?.length !== 3 ||
  !fixture.accounts.every(
    (account) => /^[0-9a-f-]{36}$/.test(account.user_id) && typeof account.token === 'string',
  )
)
  throw new Error('Explicit isolated HTTP acceptance fixture required.');

const [A, B, C] = fixture.accounts;
const finalActivities = {
  selected_activity_ids: ['reading'] as const,
  custom_text: 'RN09L final 🦖',
};
const partialPlan = {
  weekdays: [0, 6],
  hours: { start_local: '23:00', end_local: null, next_day: true },
  timezone_id: 'US/Eastern',
  session_count: null,
  session_minutes: 30,
};
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
/** Test credential port only; the real server verifies ephemeral signed JWTs using its normal verifier. */
function client(identity: Identity) {
  let owner = identity;
  let snapshot: AuthSnapshot = signedIn(identity, 1);
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getAccessToken: async () => owner.token,
    revalidateSession: async () => {
      throw new Error('Test port cannot refresh credentials.');
    },
  };
  const trace: { method: string; status: number }[] = [];
  let drop = false;
  let hold: {
    ready: ReturnType<typeof deferred<void>>;
    release: ReturnType<typeof deferred<void>>;
  } | null = null;
  const fetcher: ApiFetch = async (url, init) => {
    const method = init?.method ?? 'GET';
    const gate = hold;
    hold = null;
    const lose = method === 'PATCH' && drop;
    if (lose) drop = false;
    const response = await fetch(url, init); // Real loopback TCP, never a mocked JSON response.
    trace.push({ method, status: response.status });
    if (gate) {
      gate.ready.resolve();
      await gate.release.promise;
    }
    if (lose) {
      await response.arrayBuffer();
      throw new TypeError('Intentionally lost accepted response.');
    }
    return response;
  };
  const api = createApiClient({ baseUrl: fixture.origin, auth, fetcher });
  const controller = createAccountDataController(auth, api);
  const unsubscribe = controller.subscribe(() => {});
  const scope = () => controller.getSnapshot().scope!;
  return {
    api,
    trace,
    controller,
    scope,
    read: () => scope().read(readSettings),
    write: (patch: SettingsPatch) => scope().write((operation) => saveSettings(patch, operation)),
    switchTo(next: Identity, generation: number) {
      owner = next;
      snapshot = signedIn(next, generation);
      for (const fn of listeners) fn();
    },
    loseNextWrite() {
      drop = true;
    },
    holdNextResponse() {
      const gate = { ready: deferred<void>(), release: deferred<void>() };
      hold = gate;
      return gate;
    },
    close: unsubscribe,
  };
}
function signedIn(identity: Identity, sessionGeneration: number): AuthSnapshot {
  return {
    status: 'signed_in',
    sessionGeneration,
    credentialStatus: 'ready',
    user: { user_id: identity.user_id, email: null },
  };
}
let a: ReturnType<typeof client>;
let b: ReturnType<typeof client>;
let c: ReturnType<typeof client>;
beforeAll(() => {
  a = client(A);
  b = client(B);
  c = client(C);
});
afterAll(() => {
  a?.close();
  b?.close();
  c?.close();
  onlineManager.setOnline(true);
});
async function present(value: ReturnType<typeof client>): Promise<SettingsView> {
  const result = await value.read();
  expect(result.settings).not.toBeNull();
  return result.settings!;
}
function summary(settings: SettingsView) {
  return settingsSummary({
    data: { settings },
    availability: 'ready',
    online: true,
    isError: false,
    isPaused: false,
  });
}

if (fixture.phase === 'write')
  describe('production mobile client to FastAPI/PostgreSQL', () => {
    test('verified absence, explicit empty preferences and two-user isolation cross the actual wire', async () => {
      for (const value of [a, b, c]) expect(await value.read()).toEqual({ settings: null });
      const saved = await a.write({
        expected_revision: 0,
        activities: activityPayload({ selected: [], customSelected: false, custom: '' }),
      });
      expect(saved.settings).toMatchObject({
        revision: 1,
        user_id: A.user_id,
        activities: { selected_activity_ids: [], custom_text: null },
        plan_draft: null,
      });
      await b.write({
        expected_revision: 0,
        activities: { selected_activity_ids: ['music'], custom_text: 'B isolated' },
      });
      expect((await present(a)).activities.custom_text).toBeNull();
      expect((await present(b)).activities.custom_text).toBe('B isolated');
      expect(await c.read()).toEqual({ settings: null });
    });
    test('authoritative nested validation and partial nullable plan fields survive request/response decoding', async () => {
      const before = await present(a);
      await expect(
        a.write({
          expected_revision: before.revision,
          activities: { selected_activity_ids: [], custom_text: ' \u0085 ' },
        }),
      ).rejects.toMatchObject({
        kind: 'validation',
        details: { fields: [{ field: 'activities.custom_text', code: 'blank' }] },
        requestMayHaveCommitted: false,
      });
      const invalidZone = planDraftPatch(
        'hours',
        { ...planDraftInput(null), timezone: ' Bad/Zone ' },
        before,
      );
      await expect(a.write(invalidZone)).rejects.toMatchObject({
        kind: 'validation',
        details: { fields: [{ field: 'plan_draft.timezone_id', code: 'invalid_timezone' }] },
        requestMayHaveCommitted: false,
      });
      expect(await present(a)).toEqual(before);
      const saved = await a.write({ expected_revision: before.revision, plan_draft: partialPlan });
      expect(saved.settings.plan_draft).toEqual(partialPlan);
      expect(saved.settings.activities).toEqual(before.activities);
      expect((await a.read()).settings).toEqual(saved.settings);
      expect(summary(saved.settings).hours).toEqual({
        state: 'ready',
        text: 'Draft: 23:00–end not set (next day); US/Eastern',
      });
    });
    test('real concurrent section writes have one conflict; explicit latest-base retry preserves the winner', async () => {
      const before = await present(a);
      const draft = { ...planDraftInput(before.plan_draft), weekdays: [1, 3] };
      const patches: SettingsPatch[] = [
        {
          expected_revision: before.revision,
          activities: {
            selected_activity_ids: ['walking'],
            custom_text: '\u001c Canonical 🦖 \u0085',
          },
        },
        planDraftPatch('days', draft, before),
      ];
      const results = await Promise.allSettled(patches.map((patch) => a.write(patch)));
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const loser = results.findIndex((result) => result.status === 'rejected');
      expect((results[loser] as PromiseRejectedResult).reason).toMatchObject({
        kind: 'conflict',
        code: 'SETTINGS_CONFLICT',
        requestMayHaveCommitted: false,
      });
      const latest = await present(a);
      expect(latest.revision).toBe(before.revision + 1);
      // Explicit review is simulated here; real keep/use-latest UI is covered by component tests.
      await a.write(
        loser === 1
          ? planDraftPatch('days', draft, latest)
          : { ...patches[0], expected_revision: latest.revision },
      );
      const merged = await present(a);
      expect(merged.revision).toBe(before.revision + 2);
      expect(merged.activities).toEqual({
        selected_activity_ids: ['walking'],
        custom_text: 'Canonical 🦖',
      });
      expect(merged.plan_draft).toEqual({ ...partialPlan, weekdays: [1, 3] });
    });
    test('a real committed save with its response lost is uncertain and requires a GET without replay', async () => {
      const before = await present(a);
      const writes = a.trace.filter((entry) => entry.method === 'PATCH').length;
      a.loseNextWrite();
      await expect(
        a.write({
          expected_revision: before.revision,
          activities: { selected_activity_ids: ['gym'], custom_text: 'After lost response' },
        }),
      ).rejects.toMatchObject({ kind: 'network', requestMayHaveCommitted: true });
      const latest = await present(a);
      expect(latest.revision).toBe(before.revision + 1);
      expect(latest.activities.custom_text).toBe('After lost response');
      expect(a.trace.filter((entry) => entry.method === 'PATCH')).toHaveLength(writes + 1);
    });
    test('A-to-B and same-user generation changes suppress old actual HTTP read/cache effects', async () => {
      for (const next of [B, A]) {
        const oldScope = a.scope();
        const gate = a.holdNextResponse();
        const pending = oldScope.read(readSettings);
        // Attach the rejection assertion before retiring the scope.
        const rejected = expect(pending).rejects.toBeInstanceOf(ApiError);
        await gate.ready.promise;
        a.switchTo(next, oldScope.account.sessionGeneration + 1);
        gate.release.resolve();
        await rejected;
        let delivered = false;
        oldScope.commit(() => {
          delivered = true;
        });
        expect(delivered).toBe(false);
        expect(oldScope.client.getQueryCache().getAll()).toHaveLength(0);
        expect((await present(a)).user_id).toBe(next.user_id);
      }
      // Same UUID, different generation must retire exactly as an account change does.
      const old = a.scope();
      const gate = a.holdNextResponse();
      const rejected = expect(old.read(readSettings)).rejects.toBeInstanceOf(ApiError);
      await gate.ready.promise;
      a.switchTo(A, old.account.sessionGeneration + 1);
      gate.release.resolve();
      await rejected;
      expect(old.isCurrent()).toBe(false);
      expect((await present(a)).user_id).toBe(A.user_id);
    });
    test('offline writes are not dispatched, queued or replayed when connectivity returns', async () => {
      const before = await present(a);
      const dispatched = a.trace.length;
      onlineManager.setOnline(false);
      try {
        await expect(
          a.write({ expected_revision: before.revision, plan_draft: null }),
        ).rejects.toMatchObject({ kind: 'network', requestMayHaveCommitted: false });
      } finally {
        onlineManager.setOnline(true);
      }
      expect(a.trace).toHaveLength(dispatched);
      expect(await present(a)).toEqual(before);
    });
    test('explicit clears preserve omitted sections and final canonical sentinel is saved for a cold restart', async () => {
      const before = await present(a);
      const empty = await a.write({
        expected_revision: before.revision,
        activities: activityPayload({
          selected: [],
          customSelected: false,
          custom: 'Inactive raw input',
        }),
      });
      expect(empty.settings.activities).toEqual({ selected_activity_ids: [], custom_text: null });
      expect(empty.settings.plan_draft).toEqual(before.plan_draft);
      const clear = await a.write({ expected_revision: empty.settings.revision, plan_draft: null });
      expect(clear.settings.plan_draft).toBeNull();
      expect(clear.settings.activities).toEqual(empty.settings.activities);
      const saved = await a.write({
        expected_revision: clear.settings.revision,
        activities: {
          ...finalActivities,
          selected_activity_ids: [...finalActivities.selected_activity_ids],
        },
      });
      const final = await a.write({
        expected_revision: saved.settings.revision,
        plan_draft: partialPlan,
      });
      expect(final.settings.revision).toBe(9);
      expect(final.settings.activities).toEqual(finalActivities);
      expect(final.settings.plan_draft).toEqual(partialPlan);
      expect(await c.read()).toEqual({ settings: null });
      expect((await present(b)).activities.custom_text).toBe('B isolated');
    });
  });
else
  test('cold mobile clients recover the same canonical data after the actual API process restarts', async () => {
    const recovered = await present(a);
    expect(recovered.revision).toBe(9);
    expect(recovered.activities).toEqual(finalActivities);
    expect(recovered.plan_draft).toEqual(partialPlan);
    expect(summary(recovered).activities).toEqual({
      state: 'ready',
      text: 'Reading, Custom: RN09L final 🦖',
    });
    expect((await present(b)).activities.custom_text).toBe('B isolated');
    expect(await c.read()).toEqual({ settings: null });
    expect(a.trace.every((entry) => entry.method === 'GET')).toBe(true);
  });
