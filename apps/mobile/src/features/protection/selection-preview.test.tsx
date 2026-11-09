import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { AppSelectionPreview, type PreviewPort } from '../../../dev/native/selection-preview';

function deferred() {
  let resolve!: (value: unknown) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function port(): jest.Mocked<PreviewPort> {
  return {
    previewGetSelection: jest.fn().mockResolvedValue({ selectionRevision: 0, selectedAppCount: 0 }),
    previewPickApps: jest.fn().mockResolvedValue({ selectionRevision: 1, selectedAppCount: 2 }),
    previewRelease: jest.fn().mockResolvedValue(null),
  };
}
const choose = () => screen.getByRole('button', { name: 'Choose apps temporarily' });
afterEach(() => jest.restoreAllMocks());

test('missing native preview is explicit and cannot open a successful stub', async () => {
  await render(<AppSelectionPreview port={null} />);
  expect(choose()).toBeDisabled();
  expect(screen.getByText(/Preview unavailable/)).toBeVisible();
});

test('accepts only count/revision and never renders returned inventory extras', async () => {
  const native = port();
  native.previewGetSelection.mockResolvedValue({ selectionRevision: 2, selectedAppCount: 3, displayNames: ['PRIVATE_APP_NAME'] });
  await render(<AppSelectionPreview port={native} />);
  await waitFor(() => expect(screen.getByText('3 apps temporarily selected')).toBeVisible());
  expect(screen.queryByText('PRIVATE_APP_NAME')).toBeNull();
  await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText('2 apps temporarily selected')).toBeVisible());
  expect(screen.getByText('Temporary revision 1')).toBeVisible();
  expect(screen.getByText('Temporary selection confirmed. Nothing saved or blocked.')).toBeVisible();
});

test('holds one request for the whole native dialog and clears busy after confirm', async () => {
  const native = port(), pending = deferred();
  native.previewPickApps.mockReturnValue(pending.promise);
  await render(<AppSelectionPreview port={native} />);
  await fireEvent.press(choose());
  await fireEvent.press(screen.getByRole('button', { name: 'Loading temporary preview…' }));
  expect(native.previewPickApps).toHaveBeenCalledTimes(1);
  await act(() => pending.resolve({ selectionRevision: 1, selectedAppCount: 4 }));
  await waitFor(() => expect(choose()).toBeEnabled());
  expect(screen.getByText('4 apps temporarily selected')).toBeVisible();
});

test.each([
  ['ERR_SELECTION_CANCELLED', 'Canceled. Temporary selection unchanged.'],
  ['ERR_SELECTION_CHANGED', 'Apps changed. Reopen the preview to review; nothing was confirmed.'],
  ['ERR_UNKNOWN', 'Temporary selection could not be confirmed. Previous selection unchanged.'],
])('normalizes %s without exposing native message or overwriting confirmed state', async (code, notice) => {
  const native = port();
  native.previewGetSelection.mockResolvedValue({ selectionRevision: 1, selectedAppCount: 1 });
  native.previewPickApps.mockRejectedValue({ code, message: 'PRIVATE_NATIVE_DETAIL' });
  await render(<AppSelectionPreview port={native} />);
  await waitFor(() => expect(screen.getByText('1 apps temporarily selected')).toBeVisible());
  await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText(notice)).toBeVisible());
  expect(screen.getByText('1 apps temporarily selected')).toBeVisible();
  expect(screen.queryByText('PRIVATE_NATIVE_DETAIL')).toBeNull();
  expect(choose()).toBeEnabled();
});

test('malformed native confirmation is not accepted as a count or a saved result', async () => {
  const native = port();
  native.previewPickApps.mockResolvedValue({ selectionRevision: 1, selectedAppCount: -1 });
  await render(<AppSelectionPreview port={native} />);
  await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText(/could not be confirmed/)).toBeVisible());
  expect(screen.getByText('0 apps temporarily selected')).toBeVisible();
});

test('late foreground read cannot overwrite a newer explicit confirmation', async () => {
  const native = port(), read = deferred();
  native.previewGetSelection.mockReturnValue(read.promise);
  await render(<AppSelectionPreview port={native} />);
  await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText('2 apps temporarily selected')).toBeVisible());
  await act(() => read.resolve({ selectionRevision: 0, selectedAppCount: 99 }));
  expect(screen.getByText('2 apps temporarily selected')).toBeVisible();
  expect(screen.queryByText('99 apps temporarily selected')).toBeNull();
});

test('unmount releases its owner and remount uses another owner; late dialog settles safely', async () => {
  const native = port(), pending = deferred();
  native.previewPickApps.mockReturnValue(pending.promise);
  const view = await render(<AppSelectionPreview port={native} />);
  await fireEvent.press(choose());
  const owner = native.previewPickApps.mock.calls[0][0];
  await view.unmount();
  await act(async () => { await Promise.resolve(); });
  expect(native.previewRelease).toHaveBeenCalledWith(owner);
  await render(<AppSelectionPreview port={native} />);
  const next = native.previewGetSelection.mock.calls.at(-1)![0];
  expect(next).not.toBe(owner);
  await act(() => pending.resolve({ selectionRevision: 8, selectedAppCount: 77 }));
  expect(screen.queryByText('77 apps temporarily selected')).toBeNull();
});

test('foreground refresh updates temporary summary and removes its listener on unmount', async () => {
  let change: (state: AppStateStatus) => void = () => {};
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, callback) => {
    expect(event).toBe('change'); change = callback; return { remove };
  });
  const native = port();
  native.previewGetSelection.mockResolvedValueOnce({ selectionRevision: 1, selectedAppCount: 2 })
    .mockResolvedValue({ selectionRevision: 0, selectedAppCount: 0 });
  const view = await render(<AppSelectionPreview port={native} />);
  await waitFor(() => expect(screen.getByText('2 apps temporarily selected')).toBeVisible());
  await act(() => change('active'));
  await waitFor(() => expect(screen.getByText('0 apps temporarily selected')).toBeVisible());
  await view.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});
