import type { PlanDraft } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { WeeklyPlanJourney } from './weekly-plan-journey';
import type { WeeklyPlanPort } from './use-weekly-plan';
const A = 'qa-development:00000000-0000-4000-8000-000000000001';
const B = 'qa-development:00000000-0000-4000-8000-000000000002';
const token = '00000000-0000-4000-8000-000000000099';
const saved: PlanDraft = { weekdays: [2], hours: { start_local: '09:00', end_local: '17:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 1 };
const WALL = 1794398400000;
const originalState = AppState.currentState;
let listeners: Set<(state: AppStateStatus) => void>;
beforeEach(() => {
  AppState.currentState = 'active'; listeners = new Set();
  jest.spyOn(AppState, 'addEventListener').mockImplementation(((event: string, callback: (state: AppStateStatus) => void) => {
    if (event === 'change') listeners.add(callback);
    return { remove: () => listeners.delete(callback) };
  }) as typeof AppState.addEventListener);
});
afterEach(() => { AppState.currentState = originalState; jest.restoreAllMocks(); jest.useRealTimers(); });
async function state(value: AppStateStatus) { await act(() => { AppState.currentState = value; listeners.forEach((notify) => notify(value)); }); }
async function press(name: string | RegExp) { await fireEvent.press(screen.getByRole('button', { name })); }
function fixture(installed = false) {
  let revision: number | null = installed ? 1 : null, spec: PlanDraft | null = installed ? saved : null;
  let enabled = installed, permission = true, now = WALL, start = WALL - 1000, end = WALL + 60000;
  const snapshot = () => ({ observedAt: now, enabled, spec, otherInstallation: false,
    native: { state: !permission ? 'needs_permission' : enabled ? 'armed' : 'inactive', installedRevision: revision, selectionRevision: revision ? 1 : null,
      selectedAppCount: revision ? 1 : 0, reasonCount: enabled ? 1 : 0, pendingEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: permission },
    windows: enabled ? [{ reasonId: 'weekly_2026-11-11', startsAt: start, endsAt: end }] : [] });
  const port = { scheduleRead: jest.fn(async () => snapshot()), schedulePreview: jest.fn(async () => ({ windows: [{ reasonId: 'weekly_2026-11-11', startsAt: start, endsAt: end }] })),
    scheduleApply: jest.fn(async (_owner, _token, expected, next, _selection, value) => { if (expected !== (revision ?? 0)) throw Error('conflict'); revision = next; spec = value; enabled = true; return snapshot(); }),
    interventionCancel: jest.fn(async (_owner, _token, expected) => { if (expected !== revision) throw Error('conflict'); revision = expected + 1; enabled = false; return null; }),
    interventionOpen: jest.fn().mockResolvedValue(token), interventionRelease: jest.fn().mockResolvedValue(null), interventionReviewAccess: jest.fn().mockResolvedValue(true),
    selectionBegin: jest.fn().mockResolvedValue({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }), selectionRelease: jest.fn().mockResolvedValue(null), selectionPick: jest.fn(), selectionCommit: jest.fn(),
  } satisfies WeeklyPlanPort;
  return { port, snapshot, permission: (v: boolean) => { permission = v; }, clock: (v: number) => { now = v; }, windows: (a: number, b: number) => { start = a; end = b; } };
}
test('missing module never claims an active schedule or calls Auth', async () => {
  await render(<WeeklyPlanJourney owner={A} port={null} />);
  expect(screen.getByText('App schedule unavailable')).toBeVisible(); await press('Settings');
  expect(screen.getByRole('button', { name: 'Apply plan' })).toBeDisabled();
});
test('existing inline editors stage drafts; explicit Preview/Apply updates real Home facts; Stop retains settings', async () => {
  const f = fixture(); await render(<WeeklyPlanJourney owner={A} port={f.port} initialPlan={saved} />);
  await screen.findByText('No weekly plan applied'); await press('Manage app schedule');
  await press(/^Draft days\./); await fireEvent.press(screen.getByRole('checkbox', { name: 'Thursday' })); await press('Use days');
  expect(f.port.scheduleApply).not.toHaveBeenCalled(); await press('Preview plan');
  await screen.findByText('Preview only. Your device schedule is unchanged.'); expect(f.port.scheduleApply).not.toHaveBeenCalled();
  await press('Apply plan'); await screen.findByText('Plan applied to this device.');
  expect(f.port.scheduleApply).toHaveBeenCalledWith(A, token, 0, 1, 1, { ...saved, weekdays: [2, 3] });
  await press('Home'); expect(screen.getByText('App interventions active')).toBeVisible();
  await press('Settings'); await press('Stop plan'); await screen.findByText('Schedule stopped. Settings and allowance history retained.');
  await press('Home'); expect(screen.getByText('App schedule stopped')).toBeVisible();
  expect(f.port.interventionCancel).toHaveBeenCalledWith(A, token, 1, null);
});
test('unfinished editor navigation needs a discard choice; staged drafts survive Home/Settings navigation', async () => {
  const f = fixture(); await render(<WeeklyPlanJourney owner={A} port={f.port} initialPlan={saved} />); await screen.findByText('No weekly plan applied');
  await press('Settings'); await press(/^Draft days\./); await fireEvent.press(screen.getByRole('checkbox', { name: 'Thursday' }));
  await press('Home'); expect(screen.getByText('Discard unfinished editor changes?')).toBeVisible(); await press('Keep editing');
  await press('Use days'); await press('Home'); expect(screen.getByText('You have draft changes that are not applied.')).toBeVisible();
  await press('Settings'); expect(screen.getByRole('button', { name: /^Draft days\. Wednesday, Thursday/ })).toBeVisible();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
test('uncertain committed Apply is never retried; explicit read recovers and Home masks old positive claims', async () => {
  const f = fixture(); const normal = f.port.scheduleApply.getMockImplementation()!;
  f.port.scheduleApply.mockImplementationOnce(async (...args) => { await normal(...args); throw Error('private native details'); });
  await render(<WeeklyPlanJourney owner={A} port={f.port} initialPlan={saved} />); await screen.findByText('No weekly plan applied'); await press('Settings'); await press('Apply plan');
  await screen.findByText('Plan change not confirmed'); expect(screen.queryByText('App interventions active')).toBeNull(); expect(screen.queryByText('private native details')).toBeNull();
  await press('Home'); expect(screen.getByText('Plan change not confirmed')).toBeVisible(); await press('Refresh device schedule');
  await screen.findByText('App interventions active'); expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
});
test('foreground revocation masks active status and restores a pending raw hours edit without overwriting', async () => {
  const f = fixture(true); await render(<WeeklyPlanJourney owner={A} port={f.port} />); await screen.findByText('App interventions active');
  await press('Settings'); await press(/^Draft hours\./); await fireEvent.changeText(screen.getByLabelText('Plan time zone'), 'America/New_York');
  await state('background'); expect(screen.queryByText('App interventions active')).toBeNull(); f.permission(false); await state('active');
  await screen.findByText('App access needed'); expect(screen.getByLabelText('Plan time zone')).toHaveDisplayValue('America/New_York');
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
test('native observation boundary refresh changes scheduled to active without relying on JS wall clock', async () => {
  jest.useFakeTimers(); const f = fixture(true); f.windows(WALL + 1000, WALL + 60000);
  await render(<WeeklyPlanJourney owner={A} port={f.port} />); await screen.findByText('App schedule ready');
  f.clock(WALL + 1000); await act(async () => { await jest.advanceTimersByTimeAsync(1000); });
  await screen.findByText('App interventions active'); expect(f.port.scheduleApply).not.toHaveBeenCalled();
});
test('owner replacement fences pending Apply and never renders the prior owner draft', async () => {
  const f = fixture(); let finish!: (v: unknown) => void;
  const view = await render(<WeeklyPlanJourney owner={A} port={f.port} initialPlan={saved} />); await screen.findByText('No weekly plan applied'); await press('Settings');
  f.port.selectionBegin.mockReturnValueOnce(new Promise((yes) => { finish = yes; }) as never);
  await press('Apply plan'); await waitFor(() => expect(f.port.selectionBegin).toHaveBeenCalledTimes(2));
  await view.rerender(<WeeklyPlanJourney owner={B} port={f.port} />);
  await act(() => finish({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }));
  await screen.findByText('No weekly plan applied'); expect(f.port.scheduleApply).not.toHaveBeenCalled();
  await press('Settings'); expect(screen.getByRole('button', { name: 'Apply plan' })).toBeDisabled();
});


test('foreground return during an outstanding read queues a fresh read rather than leaving checking stuck', async () => {
  const f = fixture(true); let finish!: (v: unknown) => void;
  f.port.scheduleRead.mockReturnValueOnce(new Promise((yes) => { finish = yes; }) as never);
  await render(<WeeklyPlanJourney owner={A} port={f.port} />);
  await waitFor(() => expect(f.port.scheduleRead).toHaveBeenCalledTimes(1));
  await state('background'); await state('active');
  await act(() => finish(f.snapshot()));
  await screen.findByText('App interventions active'); expect(f.port.scheduleRead).toHaveBeenCalledTimes(2);
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});

test('Close confirms abandoning a staged draft without canceling an installed schedule', async () => {
  const f = fixture(true), exit = jest.fn();
  await render(<WeeklyPlanJourney owner={A} port={f.port} onExit={exit} />); await screen.findByText('App interventions active');
  await press('Settings'); await press(/^Draft days\./); await fireEvent.press(screen.getByRole('checkbox', { name: 'Thursday' })); await press('Use days');
  await press('Close app preview'); expect(exit).not.toHaveBeenCalled();
  await press('Leave without applying'); expect(exit).toHaveBeenCalledTimes(1); expect(f.port.interventionCancel).not.toHaveBeenCalled();
});
