import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PlanDraft } from '@disconnect/contracts';
import { WeeklyScheduleSetup } from './weekly-schedule-setup';
import type { WeeklySchedulePort } from './weekly-schedule';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';
const owner = 'qa-development:00000000-0000-4000-8000-000000000001';
const token = '00000000-0000-4000-8000-000000000099';
const saved: PlanDraft = { weekdays: [0], hours: { start_local: '09:00', end_local: '17:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 1 };
const native = (revision: number | null = null, enabled = false) => ({ state: enabled ? 'armed' : 'inactive', installedRevision: revision, selectionRevision: revision === null ? null : 1,
  selectedAppCount: revision === null ? 0 : 1, reasonCount: enabled ? 1 : 0, pendingEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: true });
function setup() {
  let value = { observedAt: 1794214900000, native: native(), spec: null as PlanDraft | null, enabled: false, otherInstallation: false, windows: [] as { reasonId: string; startsAt: number; endsAt: number }[] };
  const port = { scheduleRead: jest.fn(async () => value), schedulePreview: jest.fn().mockResolvedValue({ windows: [{ reasonId: 'weekly_2026-11-09', startsAt: 1794214800000, endsAt: 1794243600000 }] }),
    interventionOpen: jest.fn().mockResolvedValue(token), interventionRelease: jest.fn().mockResolvedValue(null),
    selectionBegin: jest.fn().mockResolvedValue({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }), selectionRelease: jest.fn().mockResolvedValue(null),
    selectionPick: jest.fn(), selectionCommit: jest.fn(),
    scheduleApply: jest.fn(async (_o, _t, _e, r, _s, spec) => { value = { observedAt: 1794214900000, native: native(r, true), spec, enabled: true, otherInstallation: false, windows: [{ reasonId: 'weekly_2026-11-09', startsAt: 1794214800000, endsAt: 1794243600000 }] }; return value; }),
    interventionCancel: jest.fn(async (_o, _t, e) => { value = { ...value, native: native(e + 1), enabled: false, windows: [] }; return null; }),
  } satisfies WeeklySchedulePort & SelectionEditorPort;
  return port;
}
test('missing module and incomplete draft cannot install or request access', async () => {
  await render(<WeeklyScheduleSetup owner={owner} port={null} />);
  expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeDisabled();
  expect(screen.getByText('Weekly installation is unavailable in this build.')).toBeVisible();
});
test('saved plan needs explicit Apply; native preview never installs; update and Stop are independently confirmed', async () => {
  const port = setup(); await render(<WeeklyScheduleSetup owner={owner} port={port} initialPlan={saved} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeEnabled());
  expect(port.scheduleApply).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Preview schedule' }));
  await waitFor(() => expect(screen.getByText('Preview only. No installation changed.')).toBeVisible());
  expect(port.scheduleApply).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Apply weekly plan' }));
  await waitFor(() => expect(screen.getByText('Weekly plan confirmed on this device.')).toBeVisible());
  expect(port.scheduleApply).toHaveBeenCalledWith(owner, token, 0, 1, 1, saved);
  await fireEvent.changeText(screen.getByLabelText('Minutes per session'), '2');
  await fireEvent.press(screen.getByRole('button', { name: 'Update weekly plan' }));
  await waitFor(() => expect(port.scheduleApply).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Stop weekly plan' })).toBeEnabled());
  // Stopping remains available even when a new unsaved draft is incomplete.
  await fireEvent.changeText(screen.getByLabelText('Schedule end (HH:mm)'), '');
  await fireEvent.press(screen.getByRole('button', { name: 'Stop weekly plan' }));
  await waitFor(() => expect(screen.getByText('Stopped on this device. Allowance history is retained.')).toBeVisible());
  expect(port.interventionCancel).toHaveBeenCalledWith(owner, token, 2, null);
});
test('uncertain Apply retains raw draft, blocks another write and requires explicit refresh/review', async () => {
  const port = setup(); port.scheduleApply.mockRejectedValue(new Error('secret native details'));
  await render(<WeeklyScheduleSetup owner={owner} port={port} initialPlan={saved} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeEnabled());
  await fireEvent.changeText(screen.getByLabelText('Minutes per session'), '12');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply weekly plan' }));
  await waitFor(() => expect(screen.getByText('Installation not confirmed')).toBeVisible());
  expect(screen.getByLabelText('Minutes per session')).toHaveDisplayValue('12');
  expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeDisabled();
  expect(screen.queryByText('secret native details')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Refresh installation' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeEnabled());
  expect(screen.getByLabelText('Minutes per session')).toHaveDisplayValue('12');
});
test('cold native read restores installed settings without applying them again', async () => {
  const port = setup(); await port.scheduleApply(owner, token, 0, 1, 1, saved); port.scheduleApply.mockClear();
  await render(<WeeklyScheduleSetup owner={owner} port={port} />);
  await waitFor(() => expect(screen.getByLabelText('Schedule start (HH:mm)')).toHaveDisplayValue('09:00'));
  expect(screen.getByLabelText('Schedule time zone')).toHaveDisplayValue('UTC');
  expect(port.scheduleApply).not.toHaveBeenCalled();
});
test('scope loss while selection opens fences native Apply and releases draft/lease', async () => {
  const port = setup(); let finish!: (v: unknown) => void;
  port.selectionBegin.mockReturnValue(new Promise((yes) => { finish = yes; }) as never);
  const view = await render(<WeeklyScheduleSetup owner={owner} port={port} initialPlan={saved} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Apply weekly plan' })).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Apply weekly plan' }));
  await waitFor(() => expect(port.selectionBegin).toHaveBeenCalledTimes(1)); await view.unmount();
  await act(() => finish({ draftId: token, groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }));
  expect(port.scheduleApply).not.toHaveBeenCalled(); expect(port.selectionRelease).toHaveBeenCalledTimes(1); expect(port.interventionRelease).toHaveBeenCalledTimes(1);
});
