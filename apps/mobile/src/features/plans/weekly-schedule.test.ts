import { describe, expect, it, vi } from 'vitest';
import type { PlanDraft } from '@disconnect/contracts';
import { completeSchedule, createWeeklyScheduleClient, decodeScheduleInstallation, decodeScheduleWindows, type WeeklySchedulePort } from './weekly-schedule';
const owner = 'qa-development:00000000-0000-4000-8000-000000000001';
const token = '00000000-0000-4000-8000-000000000099';
const spec: PlanDraft = { weekdays: [0, 2], hours: { start_local: '22:00', end_local: '02:00', next_day: true }, timezone_id: 'America/New_York', session_count: 2, session_minutes: 10 };
const window = { reasonId: 'weekly_2026-11-09', startsAt: 1000, endsAt: 9000 };
const state = (revision: number | null = null, enabled = false, saved: PlanDraft | null = null) => ({
  native: { state: enabled ? 'armed' : 'inactive', installedRevision: revision, selectionRevision: revision === null ? null : 1, selectedAppCount: revision === null ? 0 : 1, reasonCount: enabled ? 1 : 0, pendingEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: true },
  spec: saved, enabled, windows: enabled ? [window] : [], otherInstallation: false,
});
function fixture() {
  let value = state();
  const port = { interventionOpen: vi.fn().mockResolvedValue(token), interventionRelease: vi.fn().mockResolvedValue(null),
    selectionBegin: vi.fn().mockResolvedValue({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }), selectionRelease: vi.fn().mockResolvedValue(null),
    scheduleRead: vi.fn(async () => value), schedulePreview: vi.fn().mockResolvedValue({ windows: [window] }),
    scheduleApply: vi.fn(async (_o, _t, _expected, revision, _selection, input) => { value = state(revision, true, input); return value; }),
    interventionCancel: vi.fn(async (_o, _t, expected) => { value = state(expected + 1, false, value.spec); return null; }),
  } satisfies WeeklySchedulePort;
  return { port, client: createWeeklyScheduleClient(owner, port) };
}
describe('complete weekly plan and explicit installation client', () => {
  it('canonicalizes weekdays and strips extra fields without mutating saved drafts', () => {
    const raw = { ...spec, weekdays: [2, 0], inventory: ['private'] }; const parsed = completeSchedule(raw);
    expect(parsed).toEqual(spec); expect(raw.weekdays).toEqual([2, 0]);
  });
  it.each([
    null, { ...spec, weekdays: [] }, { ...spec, weekdays: [0, 0] }, { ...spec, weekdays: [7] },
    { ...spec, hours: null }, { ...spec, hours: { ...spec.hours, start_local: null } },
    { ...spec, hours: { start_local: '09:00', end_local: '09:00', next_day: false } },
    { ...spec, hours: { ...spec.hours, next_day: false } }, { ...spec, timezone_id: null },
    { ...spec, timezone_id: ' UTC ' }, { ...spec, session_count: 0 }, { ...spec, session_count: 1.5 },
    { ...spec, session_minutes: 1441 }, { ...spec, session_minutes: null },
  ])('rejects incomplete/invalid activation input %j', (value) => expect(() => completeSchedule(value)).toThrow());
  it('preview delegates timezone resolution to native without leasing, saving or installing', async () => {
    const { client, port } = fixture(); expect(await client.preview(spec)).toEqual([window]);
    expect(port.schedulePreview).toHaveBeenCalledExactlyOnceWith(spec);
    expect(port.interventionOpen).not.toHaveBeenCalled(); expect(port.scheduleApply).not.toHaveBeenCalled();
  });
  it('applies complete saved draft using native selection revision, then independently confirms and releases both handles', async () => {
    const { client, port } = fixture(); const next = await client.apply(spec, 0);
    expect(next.enabled).toBe(true); expect(next.native.installedRevision).toBe(1);
    expect(port.scheduleApply).toHaveBeenCalledExactlyOnceWith(owner, token, 0, 1, 1, spec);
    expect(port.scheduleRead).toHaveBeenCalledTimes(1); expect(port.selectionRelease).toHaveBeenCalledWith(owner, token); expect(port.interventionRelease).toHaveBeenCalledWith(owner, token);
  });
  it('stop confirms a new revision, retains settings and never erases selection or allowance history', async () => {
    const { client, port } = fixture(); await client.apply(spec, 0); const next = await client.stop(1);
    expect(next.enabled).toBe(false); expect(next.spec).toEqual(spec); expect(next.native.installedRevision).toBe(2);
    expect(port.interventionCancel).toHaveBeenCalledExactlyOnceWith(owner, token, 1, null);
  });
  it('does not retry an ambiguous committed save; explicit read recovers native result', async () => {
    const { client, port } = fixture(); const normal = port.scheduleApply.getMockImplementation()!;
    port.scheduleApply.mockImplementationOnce(async (...args) => { await normal(...args); throw new Error('private native'); });
    await expect(client.apply(spec, 0)).rejects.toMatchObject({ code: 'unconfirmed' });
    expect(port.scheduleApply).toHaveBeenCalledTimes(1); expect((await client.read()).native.installedRevision).toBe(1);
  });
  it('rejects successful-looking apply when readback differs', async () => {
    const { client, port } = fixture(); port.scheduleRead.mockResolvedValue(state());
    await expect(client.apply(spec, 0)).rejects.toMatchObject({ code: 'unconfirmed' });
    expect(port.selectionRelease).toHaveBeenCalledTimes(1);
  });
  it('fences duplicate pending writes and releases opened lease even if disposed before open completes', async () => {
    const { client, port } = fixture(); let done!: (v: string) => void;
    port.interventionOpen.mockReturnValueOnce(new Promise((resolve) => { done = resolve; }));
    const pending = client.apply(spec, 0); await expect(client.apply(spec, 0)).rejects.toMatchObject({ code: 'busy' });
    client.dispose(); done(token); await expect(pending).rejects.toMatchObject({ code: 'closed' });
    expect(port.scheduleApply).not.toHaveBeenCalled(); expect(port.interventionRelease).toHaveBeenCalledWith(owner, token);
  });
  it('disposal while selection opens releases draft and fences install', async () => {
    const { client, port } = fixture(); let done!: (v: unknown) => void;
    port.selectionBegin.mockReturnValueOnce(new Promise((yes) => { done = yes; }) as never);
    const pending = client.apply(spec, 0); await vi.waitFor(() => expect(port.selectionBegin).toHaveBeenCalledTimes(1));
    client.dispose(); done({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false });
    await expect(pending).rejects.toMatchObject({ code: 'closed' }); expect(port.scheduleApply).not.toHaveBeenCalled(); expect(port.selectionRelease).toHaveBeenCalledTimes(1);
  });
  it('stale or unrelated installation is not canceled', async () => {
    const { client, port } = fixture(); port.scheduleRead.mockResolvedValue({ ...state(2), otherInstallation: true });
    await expect(client.stop(1)).rejects.toMatchObject({ code: 'unconfirmed' }); expect(port.interventionCancel).not.toHaveBeenCalled();
  });
  it('rejects unsafe native previews, duplicates/overlap and contradictory installation metadata', () => {
    expect(() => decodeScheduleWindows([{ ...window, startsAt: NaN }])).toThrow();
    expect(() => decodeScheduleWindows([window, window])).toThrow();
    expect(() => decodeScheduleWindows([window, { ...window, reasonId: 'weekly_2026-11-10', startsAt: 5000 }])).toThrow();
    expect(() => decodeScheduleInstallation({ ...state(), enabled: true })).toThrow();
    expect(() => decodeScheduleInstallation({ ...state(1, true, spec), enabled: false })).toThrow();
  });
  it('releases leases on empty saved selection and refuses invalid revisions before any native write', async () => {
    const { client, port } = fixture(); port.selectionBegin.mockResolvedValue({ draftId: token, groupId: 'global', baseRevision: 0, draftVersion: 0, selectedAppCount: 0, savedAppCount: 0, dirty: false });
    await expect(client.apply(spec, 0)).rejects.toThrow(); expect(port.scheduleApply).not.toHaveBeenCalled(); expect(port.interventionRelease).toHaveBeenCalledTimes(1);
    await expect(client.apply(spec, 2147483647)).rejects.toThrow(); expect(port.interventionOpen).toHaveBeenCalledTimes(1);
  });
  it('cleanup failures remain unconfirmed and never expose native details or retry a committed write', async () => {
    const { client, port } = fixture(); port.interventionRelease.mockRejectedValueOnce(new Error('private bridge token'));
    await expect(client.apply(spec, 0)).rejects.toMatchObject({ code: 'unconfirmed', message: 'The schedule could not be confirmed.' });
    expect(port.scheduleApply).toHaveBeenCalledTimes(1); expect((await client.read()).native.installedRevision).toBe(1);
  });

});
