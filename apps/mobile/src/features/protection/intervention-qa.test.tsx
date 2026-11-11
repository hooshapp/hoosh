import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { InterventionQa } from '../../../dev/native/interventions';
import { decodeInterventionStatus, decodeInterventionEventIds, type InterventionCoordinatorPort } from '@/infrastructure/native/intervention-coordinator';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';
const state = { state: 'armed', installedRevision: 3, selectionRevision: 1, selectedAppCount: 1, reasonCount: 2, pendingEventCount: 1, overlayVisible: false, disclosureAccepted: true, serviceConnected: true };
function port(): jest.Mocked<InterventionCoordinatorPort & Pick<SelectionEditorPort, 'selectionBegin' | 'selectionRelease'>> {
  return { interventionOpen: jest.fn().mockResolvedValue('00000000-0000-4000-8000-000000000088'), interventionRelease: jest.fn().mockResolvedValue(null), interventionStatus: jest.fn().mockResolvedValue(state), interventionReviewAccess: jest.fn().mockResolvedValue(false),
    interventionInstall: jest.fn().mockResolvedValue(null), interventionCancel: jest.fn().mockResolvedValue(null), interventionDrain: jest.fn().mockResolvedValue([]),
    interventionAcknowledge: jest.fn().mockResolvedValue(null), interventionEndOwner: jest.fn().mockResolvedValue(null),
    selectionBegin: jest.fn().mockResolvedValue({ draftId: '00000000-0000-4000-8000-000000000099', groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }), selectionRelease: jest.fn().mockResolvedValue(null) };
}
test('absent bridge disables actions and never claims an installation', async () => {
  await render(<InterventionQa port={null} />);
  expect(screen.getByText('Native state unavailable')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Install two-minute test' })).toBeDisabled();
});
test('install uses native saved selection revision, explicit test policy and releases lease', async () => {
  const n = port(); await render(<InterventionQa port={n} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Install two-minute test' })).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Install two-minute test' }));
  await waitFor(() => expect(n.selectionRelease).toHaveBeenCalledTimes(1));
  expect(n.interventionInstall).toHaveBeenCalledWith(expect.any(String), expect.any(String), 3, 4, 1, expect.arrayContaining([expect.objectContaining({ reasonId: 'test-quest' })]), { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 15 });
});
test('uncertain native write masks installation and requires explicit refresh; duplicate taps suppressed', async () => {
  const n = port(); let reject!: (e: Error) => void;
  n.interventionCancel.mockReturnValue(new Promise((_, no) => { reject = no; }));
  await render(<InterventionQa port={n} />); await waitFor(() => expect(screen.getByText(/Native: armed/)).toBeVisible());
  const stop = screen.getByRole('button', { name: 'Stop installed test' }); await fireEvent.press(stop); await fireEvent.press(stop);
  expect(n.interventionCancel).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Working with native test…')).toBeVisible();
  await act(() => reject(new Error('private native detail')));
  await waitFor(() => expect(screen.getByText('Native state unavailable')).toBeVisible());
  expect(screen.queryByText('private native detail')).toBeNull();
});
test('leaving while opening selection lease releases it without issuing a later install', async () => {
  const n = port(); let finish!: (v: unknown) => void;
  n.selectionBegin.mockReturnValue(new Promise((yes) => { finish = yes; }));
  const view = await render(<InterventionQa port={n} />); await waitFor(() => expect(screen.getByText(/Native: armed/)).toBeVisible());
  await fireEvent.press(screen.getByRole('button', { name: 'Install two-minute test' })); await view.unmount();
  await act(() => finish({ draftId: '00000000-0000-4000-8000-000000000099', groupId: 'global', baseRevision: 1, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false }));
  expect(n.interventionInstall).not.toHaveBeenCalled(); expect(n.selectionRelease).toHaveBeenCalledTimes(1);
});
test('reject contradictory status, unsafe numbers and duplicate event ids; strip inventory extras', () => {
  expect(() => decodeInterventionStatus({ ...state, disclosureAccepted: false })).toThrow();
  expect(() => decodeInterventionStatus({ ...state, selectedAppCount: 513 })).toThrow();
  expect(() => decodeInterventionStatus({ ...state, selectedAppCount: 0 })).toThrow();
  expect(decodeInterventionStatus({ ...state, appNames: ['private'] })).toEqual(state);
  const id = '00000000-0000-4000-8000-000000000099';
  expect(() => decodeInterventionEventIds([{ eventId: id }, { eventId: id }])).toThrow();
  expect(decodeInterventionEventIds([{ eventId: id, appNames: ['private'] }])).toEqual([id]);
});
test('revoked access disables installation even before the native binding disconnects', async () => {
  const n = port(); n.interventionStatus.mockResolvedValue({ ...state, state: 'needs_permission' });
  await render(<InterventionQa port={n} />);
  await waitFor(() => expect(screen.getByText(/Native: needs_permission/)).toBeVisible());
  expect(screen.getByRole('button', { name: 'Install two-minute test' })).toBeDisabled();
});
