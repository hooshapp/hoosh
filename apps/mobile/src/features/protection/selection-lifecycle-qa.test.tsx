import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DurableSelectionQa } from '../../../dev/native/durable-selection';
import type { SelectionEditorPort, SelectionOwnerLifecyclePort } from '@/infrastructure/native/selection-editor';
const A = 'qa-development:00000000-0000-4000-8000-000000000001';
const B = 'qa-development:00000000-0000-4000-8000-000000000002';
function port(): jest.Mocked<SelectionEditorPort & SelectionOwnerLifecyclePort> {
  return {
    selectionBegin: jest.fn().mockImplementation(async (owner) => ({
      draftId: '00000000-0000-4000-8000-000000000099', groupId: 'global', baseRevision: 1,
      draftVersion: 0, selectedAppCount: owner === A ? 2 : 0, savedAppCount: owner === A ? 2 : 0, dirty: false,
    })),
    selectionPick: jest.fn(), selectionCommit: jest.fn(), selectionRelease: jest.fn().mockResolvedValue(null),
    selectionEndOwner: jest.fn().mockResolvedValue(null),
  };
}
test('owner switch immediately hides private draft, waits for retention acknowledgment, then opens B', async () => {
  const native = port(); let finish!: (value: unknown) => void;
  native.selectionEndOwner.mockReturnValue(new Promise((yes) => { finish = yes; }));
  await render(<DurableSelectionQa port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(screen.getByText('2 apps selected')).toBeVisible());
  await fireEvent.press(screen.getByRole('button', { name: 'Switch test owner' }));
  expect(screen.queryByText('2 apps selected')).toBeNull();
  expect(screen.getByRole('button', { name: 'Resume test owner' })).toBeDisabled();
  expect(native.selectionEndOwner).toHaveBeenCalledWith(A, false);
  await act(() => finish(null));
  await fireEvent.press(screen.getByRole('button', { name: 'Resume test owner' }));
  await waitFor(() => expect(screen.getByText('0 apps selected')).toBeVisible());
  expect(native.selectionBegin).toHaveBeenLastCalledWith(B);
  expect(screen.queryByText('2 apps selected')).toBeNull();
});
test('failed local erasure keeps Resume disabled and Retry preserves erase intent', async () => {
  const native = port(); await render(<DurableSelectionQa port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(screen.getByText('2 apps selected')).toBeVisible());
  await fireEvent.press(screen.getByRole('button', { name: 'End test owner' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Resume test owner' })).toBeEnabled());
  native.selectionEndOwner.mockRejectedValueOnce(new Error('private native detail'));
  await fireEvent.press(screen.getByRole('button', { name: 'Erase local test selection' }));
  await waitFor(() => expect(screen.getByText(/Local cleanup could not be confirmed/)).toBeVisible());
  expect(screen.getByRole('button', { name: 'Resume test owner' })).toBeDisabled();
  expect(screen.queryByText('private native detail')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry local cleanup' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Resume test owner' })).toBeEnabled());
  expect(native.selectionEndOwner).toHaveBeenLastCalledWith(A, true);
  expect(native.selectionEndOwner.mock.calls).toEqual([[A, false], [A, true], [A, true]]);
});
