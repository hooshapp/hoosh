import { describe, expect, it, vi } from 'vitest';
import { createIOSProductPort } from './ios-product-port';
import { decodeInterventionStatus } from './intervention-coordinator';
import { weeklyPlanStatus } from '../../features/plans/weekly-plan-status';
const userID = '00000000-0000-4000-8000-000000000001';
const token = '00000000-0000-4000-8000-000000000002', owner = `project:${userID}`;
const request = '00000000-0000-4000-8000-000000000003';
const spec = { weekdays: [0], hours: { start_local: '10:00', end_local: '11:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 5 };
const status = { schemaVersion: 4, platform: 'ios', phase: 'gated', enabled: false, authorization: 'authorized', activationAvailable: false,
  installedRevision: null, selectionRevision: null, selectedAppCount: 0, reasonCount: 0, pendingRequestID: null };
function setup() {
  const module = { runtimeRead: vi.fn().mockResolvedValue({ native: status }), runtimeApply: vi.fn().mockResolvedValue({ native: status }), runtimeRecover: vi.fn().mockResolvedValue(undefined) };
  const end = vi.fn().mockResolvedValue(undefined);
  const selection = { selectionBegin: vi.fn(), selectionPick: vi.fn(), selectionCommit: vi.fn(), selectionRelease: vi.fn(),
    selectionRead: vi.fn().mockResolvedValue({ owner, revision: 2, selectedAppCount: 1, needsReselection: false }) };
  const port = createIOSProductPort({ namespace: 'project', userID, token: token.toUpperCase(), module, selection,
    preview: vi.fn(), review: vi.fn(), end, claim: vi.fn(), protectionRead: vi.fn(), requestID: () => request });
  return { port, module, end, selection };
}
describe('scoped iOS C04 bridge', () => {
  it('uses the current verified lease; releasing a write never ends the owner session', async () => {
    const { port, end } = setup();
    expect(await port.interventionOpen(owner)).toBe(token);
    await port.interventionRelease(owner, token);
    expect(end).not.toHaveBeenCalled();
    await expect(port.scheduleRead!(`other:${userID}`)).rejects.toThrow('owner changed');
  });
  it('serializes reviewed weekly and generated quest metadata without app inventory', async () => {
    const { port, module } = setup();
    await port.scheduleApply!(owner, token, 0, 1, 2, spec);
    expect(JSON.parse(module.runtimeApply.mock.calls[0][3])).toEqual({ requestID: request, kind: 'weekly_apply', expectedRevision: 0, selectionRevision: 2, weekly: spec });
    await port.questApply(owner, token, 1, { questId: userID, requestId: request, remoteRevision: 4, enabled: true, selectionRevision: 2,
      versions: [], cancelled: [], policy: { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 300 } });
    expect(JSON.parse(module.runtimeApply.mock.calls[1][3]).quest.questID).toBe(userID);
  });
  it('retains the original request after failure, blocks replacement and recovers explicitly', async () => {
    const { port, module } = setup(); module.runtimeApply.mockRejectedValueOnce(new Error('lost acknowledgment'));
    await expect(port.scheduleApply!(owner, token, 0, 1, 2, spec)).rejects.toThrow();
    await expect(port.scheduleApply!(owner, token, 0, 1, 2, { ...spec, session_count: 3 })).rejects.toThrow('Recover');
    await port.scheduleApply!(owner, token, 0, 1, 2, spec);
    expect(module.runtimeApply.mock.calls[0][3]).toBe(module.runtimeApply.mock.calls[1][3]);
    await port.recover(request);
    expect(module.runtimeRecover).toHaveBeenCalledWith('project', userID, token.toUpperCase(), request);
  });
  it('Stop and cancellation stay reason-scoped and use the current saved revision', async () => {
    const { port, module } = setup();
    await port.interventionCancel!(owner, token, 4, null);
    expect(JSON.parse(module.runtimeApply.mock.calls[0][3])).toMatchObject({ kind: 'weekly_stop', selectionRevision: 2, expectedRevision: 4 });
    await port.questCancel(owner, token, 5, userID, 'q_reason');
    expect(JSON.parse(module.runtimeApply.mock.calls[1][3])).toMatchObject({ kind: 'quest_cancel', questID: userID, reasonID: 'q_reason' });
  });
  it('an explicit fresh read clears a rejected local request when native has no pending operation', async () => {
    const { port, module } = setup(); module.runtimeApply.mockRejectedValueOnce(new Error('rejected'));
    await expect(port.scheduleApply!(owner, token, 0, 1, 2, spec)).rejects.toThrow();
    await port.scheduleRead!(owner);
    await port.scheduleApply!(owner, token, 0, 1, 2, { ...spec, session_count: 4 });
    expect(module.runtimeApply).toHaveBeenCalledTimes(2);
  });
  it('cannot write through an old owner scope' , async () => {
    const { port, module } = setup(); await port.interventionEndOwner(owner, false);
    await expect(port.scheduleRead!(owner)).rejects.toThrow('owner changed');
    expect(module.runtimeRead).not.toHaveBeenCalled();
  });
  it('shows the physical gate and rejects a fabricated verified result', () => {
    const native = decodeInterventionStatus(status);
    expect(native.serviceConnected).toBe(false);
    expect(weeklyPlanStatus({ phase: 'ready', selectionRevision: 0, selectedAppCount: 0,
      installation: { observedAt: 0, native, spec: null, enabled: false, otherInstallation: false, windows: [] } }, false).title).toBe('iPhone testing pending');
    expect(() => decodeInterventionStatus({ ...status, phase: 'verified' })).toThrow();
    expect(() => decodeInterventionStatus({ ...status, selectedAppCount: -1 })).toThrow();
  });
  it('registers evidence transport only when both native methods exist and fences late responses', async () => {
    const s = setup();
    expect(s.port.rewardsRead).toBeUndefined();
    const rewardsRead = vi.fn().mockResolvedValue(null), rewardsAck = vi.fn().mockResolvedValue(undefined);
    const port = createIOSProductPort({ namespace: 'project', userID, token, module: { ...s.module, rewardsRead, rewardsAck },
      selection: s.selection, requestID: () => request, preview: vi.fn(), review: vi.fn(), end: s.end,
      protectionRead: vi.fn(), claim: vi.fn() });
    await port.rewardsRead!(owner);
    expect(rewardsRead).toHaveBeenCalledWith('project', userID, token);
    await port.rewardsAck!(owner, token, request, 32);
    expect(rewardsAck).toHaveBeenCalledWith('project', userID, token, request, 32);
    await expect(port.rewardsRead!(`other:${userID}`)).rejects.toThrow('owner changed');
    await expect(port.rewardsAck!(owner, request, request, 32)).rejects.toThrow('owner changed');
    let release!: (value: unknown) => void;
    rewardsRead.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    const reading = port.rewardsRead!(owner);
    await port.interventionEndOwner(owner, false); release(null);
    await expect(reading).rejects.toThrow('owner changed');
  });

});
