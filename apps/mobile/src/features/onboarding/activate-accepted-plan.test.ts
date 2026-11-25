import { expect, it, vi } from 'vitest';
import type { PlanDraft } from '@disconnect/contracts';
import { activateAcceptedPlan } from './activate-accepted-plan';
import type { WeeklySchedulePort } from '../plans/weekly-schedule';
const owner = 'qa:00000000-0000-4000-8000-000000000001';
const token = '00000000-0000-4000-8000-000000000099';
const draft: PlanDraft = { weekdays: [0, 1], hours: { start_local: '09:00', end_local: '22:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 15 };
function fixture() {
  const state = (enabled: boolean) => ({ observedAt: 1000, native: { state: enabled ? 'armed' : 'inactive', installedRevision: enabled ? 1 : null,
    selectionRevision: enabled ? 3 : null, selectedAppCount: 2, reasonCount: enabled ? 1 : 0, pendingEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: true },
    enabled, spec: enabled ? draft : null, windows: enabled ? [{ reasonId: "weekly_2026-11-24", startsAt: 1000, endsAt: 2000 }] : [], otherInstallation: false });
  let value = state(false);
  const port = { interventionOpen: vi.fn(async () => token), interventionRelease: vi.fn(async () => null),
    selectionBegin: vi.fn(async () => ({ draftId: token, groupId: 'global', baseRevision: 3, draftVersion: 0, selectedAppCount: 2, savedAppCount: 2, dirty: false })),
    selectionRelease: vi.fn(async () => null), scheduleRead: vi.fn(async () => value), schedulePreview: vi.fn(), interventionCancel: vi.fn(),
    scheduleApply: vi.fn(async () => { value = state(true); return value; }),
  } satisfies WeeklySchedulePort;
  return { port, args: { owner, port, draft, selectionRevision: 3, assertCurrent: vi.fn() }, installed: () => { value = state(true); } };
}
it('installs the accepted plan and verifies device readback before completing', async () => {
  const f = fixture(); await activateAcceptedPlan(f.args);
  expect(f.port.scheduleApply).toHaveBeenCalledExactlyOnceWith(owner, token, 0, 1, 3, draft);
  expect(f.port.scheduleRead).toHaveBeenCalledTimes(2);
});
it('a lost onboarding receipt does not reinstall an already matching active plan', async () => {
  const f = fixture(); f.installed(); await activateAcceptedPlan(f.args);
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
it('an uncertain native write does not complete onboarding or retry the write', async () => {
  const f = fixture(); f.port.scheduleApply.mockRejectedValueOnce(new Error('SDK failure'));
  await expect(activateAcceptedPlan(f.args)).rejects.toThrow();
  expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
});
it('a changed target selection cannot silently activate a different app selection', async () => {
  const f = fixture(); await expect(activateAcceptedPlan({ ...f.args, selectionRevision: 2 })).rejects.toThrow();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
it('account changes stop activation before the OS write', async () => {
  const f = fixture(); f.args.assertCurrent.mockImplementationOnce(() => { throw new Error('Account changed'); });
  await expect(activateAcceptedPlan(f.args)).rejects.toThrow();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});

function pendingIOS() {
  const f = fixture(); f.installed();
  const native = { schemaVersion: 4, platform: 'ios', phase: 'pending', enabled: true,
    authorization: 'authorized', activationAvailable: true, installedRevision: 1,
    selectionRevision: 3, selectedAppCount: 2, reasonCount: 1, pendingRequestID: token };
  const recoverPending = vi.fn(async () => undefined);
  const read = f.port.scheduleRead;
  read.mockResolvedValueOnce({ observedAt: 1000, enabled: true, spec: draft,
    windows: [], otherInstallation: false, native } as never);
  return { ...f, recoverPending };
}
it('an explicit Save recovers its durable iOS request before verifying an already matching plan', async () => {
  const f = pendingIOS();
  await activateAcceptedPlan({ ...f.args, recoverPending: f.recoverPending });
  expect(f.recoverPending).toHaveBeenCalledExactlyOnceWith(token);
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
it('a failed native recovery cannot be skipped by installing another request', async () => {
  const f = pendingIOS(); f.recoverPending.mockRejectedValueOnce(new Error('OS failed'));
  await expect(activateAcceptedPlan({ ...f.args, recoverPending: f.recoverPending })).rejects.toThrow();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
it('a pending native request cannot be ignored when recovery is unavailable', async () => {
  const f = pendingIOS();
  await expect(activateAcceptedPlan(f.args)).rejects.toThrow();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
