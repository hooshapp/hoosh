import { expect, it, vi } from 'vitest';
import type { QuestScheduleVersionView } from '@disconnect/contracts';
import fixture from '../../../../../packages/contracts/fixtures/quest-execution-v1.json';
import { createQuestDeviceClient, decodeDeviceQuest, nativeQuestVersion, questReason, type QuestDevicePort, type QuestDeviceSpec } from './quest-device';
const OWNER = `fixture:${fixture.user_id}`, ID = fixture.quest_id;
const TOKEN = '00000000-0000-4000-8000-000000000009';
const REQUEST = '00000000-0000-4000-8000-000000000010';
function setup() {
  let lastPolicy: QuestDeviceSpec['policy'] = null;
  let revision = 0, spec: QuestDeviceSpec | null = null, cancelled: string[] = [], lose = false;
  const window = { reasonId: questReason(ID, 1, '2026-11-12'), startsAt: Date.parse('2026-11-12T10:00:00Z'), endsAt: Date.parse('2026-11-12T11:00:00Z') };
  function read() {
    const windows = spec?.enabled && !cancelled.includes(window.reasonId) ? [window] : [];
    return { owner: OWNER, questId: ID, observedAt: Date.parse(fixture.observed_at), remoteRevision: spec?.remoteRevision ?? 0,
      policy: lastPolicy, requestId: spec?.requestId ?? null, enabled: spec?.enabled ?? false, versions: spec?.enabled ? spec.versions : [], cancelled, windows,
      native: { schemaVersion: 3, state: windows.length ? 'armed' : 'inactive', installedRevision: revision || null,
        selectionRevision: revision ? 1 : null, selectedAppCount: revision ? 1 : 0, reasonCount: windows.length,
        pendingEventCount: 0, discardedEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: true } };
  }
  const port = {
    interventionOpen: vi.fn(async () => TOKEN), interventionRelease: vi.fn(async () => undefined), interventionReviewAccess: vi.fn(async () => true),
    questRead: vi.fn(async () => read()),
    questApply: vi.fn(async (_owner: string, _token: string, expected: number, value: QuestDeviceSpec & { questId: string }) => {
      if (revision !== expected) throw new Error('fixture conflict');
      revision++; spec = value; if (value.policy) lastPolicy = value.policy; cancelled = [...value.cancelled];
      if (lose) { lose = false; throw new Error('fixture lost response'); }
      return read();
    }),
    questCancel: vi.fn(async (_owner: string, _token: string, expected: number, _quest: string, reason: string) => {
      if (revision !== expected) throw new Error('fixture conflict');
      revision++; cancelled = [...cancelled, reason]; return read();
    }),
  } satisfies QuestDevicePort;
  const body: QuestDeviceSpec = { requestId: REQUEST, remoteRevision: 1, enabled: true, selectionRevision: 1,
    versions: [nativeQuestVersion(fixture.versions[0] as QuestScheduleVersionView)], cancelled: [], policy: { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 60 } };
  return { port, body, read, lose: () => { lose = true; }, client: createQuestDeviceClient(OWNER, ID, port) };
}
it('converts server sub-millisecond boundaries conservatively and keeps schedule metadata only', () => {
  const q = fixture.versions[0] as QuestScheduleVersionView;
  const result = nativeQuestVersion(q);
  expect(result.effectiveFrom).toBe(Date.parse(q.effective_from) + 1);
  expect(JSON.stringify(result)).not.toContain('Read');
  expect(nativeQuestVersion({ ...q, effective_until: '2026-11-12T10:00:00.000001Z' }).effectiveUntil).toBe(Date.parse('2026-11-12T10:00:00Z') + 1);
});
it('uses one owner-bound handle and exact persisted request receipt for Apply', async () => {
  const { client, port, body } = setup();
  expect((await client.read()).enabled).toBe(false);
  const read = await client.apply(0, body);
  expect(read.requestId).toBe(REQUEST); expect(read.native.installedRevision).toBe(1);
  expect(port.interventionRelease).toHaveBeenCalledWith(OWNER, TOKEN);
  expect(port.questApply).toHaveBeenCalledTimes(1);
});
it('does not replay a native write when its response is lost; explicit read recovers intent', async () => {
  const { client, port, body, lose } = setup(); lose();
  await expect(client.apply(0, body)).rejects.toMatchObject({ reason: 'unconfirmed' });
  expect((await client.read()).requestId).toBe(REQUEST);
  expect(port.questApply).toHaveBeenCalledTimes(1);
});
it('confirms reason-specific cancellation and leaves the recurring definition installed', async () => {
  const { client, body } = setup(); await client.apply(0, body);
  const read = await client.cancel(1, 1, '2026-11-12');
  expect(read.enabled).toBe(true);
  expect(read.cancelled).toContain(questReason(ID, 1, '2026-11-12'));
});
it('confirms Stop by exact intent and never equates a saved server definition to device installation', async () => {
  const { client, body } = setup(); await client.apply(0, body);
  const result = await client.apply(1, { ...body, enabled: false, versions: [], requestId: TOKEN });
  expect(result.enabled).toBe(false); expect(result.windows).toEqual([]); expect(result.requestId).toBe(TOKEN);
});
it('releases a handle delivered after disposal and suppresses native dispatch', async () => {
  const { client, body, port } = setup();
  let deliver!: (token: string) => void;
  port.interventionOpen.mockImplementationOnce(() => new Promise((resolve) => { deliver = resolve; }));
  const writing = client.apply(0, body); client.dispose(); deliver(TOKEN);
  await expect(writing).rejects.toMatchObject({ reason: 'closed' });
  expect(port.questApply).not.toHaveBeenCalled(); expect(port.interventionRelease).toHaveBeenCalledWith(OWNER, TOKEN);
});
it('fences results if scope is closed during asynchronous handle release', async () => {
  const { client, body, port } = setup();
  let finish!: () => void;
  port.interventionRelease.mockImplementationOnce(() => new Promise((resolve) => { finish = () => resolve(undefined); }));
  const writing = client.apply(0, body);
  await vi.waitFor(() => expect(port.interventionRelease).toHaveBeenCalled());
  client.dispose(); finish(); await expect(writing).rejects.toMatchObject({ reason: 'closed' });
});
it('redacts native release failures as uncertain outcomes', async () => {
  const { client, body, port } = setup(); port.interventionRelease.mockRejectedValueOnce(new Error('private native detail'));
  await expect(client.apply(0, body)).rejects.toMatchObject({ name: 'DeviceQuestError', reason: 'unconfirmed' });
});
it('cannot create a native client without explicit canonical account/quest scope', () => {
  const { port } = setup();
  expect(() => createQuestDeviceClient('', ID, port)).toThrow();
  expect(() => createQuestDeviceClient(OWNER, ID + '\n', port)).toThrow();
});
it.each([
  { owner: 'other:00000000-0000-4000-8000-000000000001' }, { questId: TOKEN }, { observedAt: -1 },
  { enabled: true }, { remoteRevision: 0.5 }, { requestId: 'not-an-intent' }, { cancelled: ['private.app.name'] },
  { windows: [{ reasonId: 'private.app.name', startsAt: 1, endsAt: 2 }] },
])('rejects malformed or foreign native metadata %j', (patch) => {
  const { read } = setup(); expect(() => decodeDeviceQuest({ ...read(), ...patch }, OWNER, ID)).toThrow();
});
