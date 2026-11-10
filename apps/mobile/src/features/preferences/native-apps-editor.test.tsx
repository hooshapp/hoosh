import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BackHandler } from 'react-native';
import { NativeAppsEditor } from './native-apps-editor';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';
const A = 'qa-development:00000000-0000-4000-8000-000000000001';
const B = 'qa-development:00000000-0000-4000-8000-000000000002';
const ID = '00000000-0000-4000-8000-000000000099';
const empty = { draftId: ID, groupId: 'global', baseRevision: 0, draftVersion: 0, selectedAppCount: 0, savedAppCount: 0, dirty: false };
const staged = { ...empty, draftVersion: 1, selectedAppCount: 2, dirty: true };
const saved = { ...staged, baseRevision: 1, savedAppCount: 2, dirty: false };
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function port(): jest.Mocked<SelectionEditorPort> {
  return {
    selectionBegin: jest.fn().mockResolvedValue(empty),
    selectionPick: jest.fn().mockResolvedValue(staged),
    selectionCommit: jest.fn().mockResolvedValue(saved),
    selectionRelease: jest.fn().mockResolvedValue(null),
  };
}
const choose = () => screen.getByRole('button', { name: 'Choose apps' });
const save = () => screen.getByRole('button', { name: 'Save selected apps' });
async function start(native: SelectionEditorPort | null = port()) {
  const view = await render(<NativeAppsEditor owner={A} port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(screen.queryByText('Loading saved selection…')).toBeNull());
  return view;
}
afterEach(() => jest.restoreAllMocks());

test('staging is not a save; only explicit Save commits owner/draft/version and accepts acknowledgment', async () => {
  const native = port(); await start(native);
  expect(save()).toBeDisabled(); await fireEvent.press(choose());
  await waitFor(() => expect(save()).toBeEnabled());
  expect(native.selectionCommit).not.toHaveBeenCalled();
  expect(screen.getByText('2 apps selected')).toBeVisible();
  await fireEvent.press(save());
  await waitFor(() => expect(screen.getByText('App selection saved on this device. Protection has not changed.')).toBeVisible());
  expect(native.selectionCommit).toHaveBeenCalledWith(A, ID, 1); expect(save()).toBeDisabled();
});

test('Discard releases staged choices and reloads the saved snapshot without writing', async () => {
  const native = port(); await start(native); await fireEvent.press(choose());
  await waitFor(() => expect(save()).toBeEnabled());
  await fireEvent.press(screen.getByRole('button', { name: 'Discard changes' }));
  await waitFor(() => expect(native.selectionBegin).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByText('0 apps selected')).toBeVisible());
  expect(native.selectionRelease).toHaveBeenCalledWith(A, ID); expect(native.selectionCommit).not.toHaveBeenCalled();
});

test('Cancel retains existing editor draft and never accepts a returned inventory message', async () => {
  const native = port(); native.selectionPick.mockRejectedValue({ code: 'ERR_SELECTION_CANCELLED', message: 'PRIVATE_PACKAGE' });
  await start(native); await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText('Picker canceled. Your draft is unchanged.')).toBeVisible());
  expect(screen.queryByText('PRIVATE_PACKAGE')).toBeNull(); expect(save()).toBeDisabled();
});

test.each(['ERR_SELECTION_CONFLICT', 'ERR_SELECTION_DRAFT_CHANGED', 'ERR_SELECTION_DRAFT_EXPIRED'])('%s requires explicit reload, without overwriting the draft', async (code) => {
  const native = port(); native.selectionCommit.mockRejectedValue({ code });
  await start(native); await fireEvent.press(choose()); await waitFor(() => expect(save()).toBeEnabled());
  await fireEvent.press(save());
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reload saved choices' })).toBeVisible());
  expect(choose()).toBeDisabled(); expect(save()).toBeDisabled();
  expect(screen.getByText('2 apps selected')).toBeVisible();
  expect(native.selectionCommit).toHaveBeenCalledTimes(1);
});

test('unconfirmed save cannot be blindly retried; reload can discover a durable success', async () => {
  const native = port(); native.selectionCommit.mockRejectedValue({ code: 'ERR_SELECTION_STORAGE' });
  await start(native); await fireEvent.press(choose()); await waitFor(() => expect(save()).toBeEnabled());
  await fireEvent.press(save());
  await waitFor(() => expect(screen.getByText('Save could not be confirmed. Reload saved choices before trying again.')).toBeVisible());
  expect(save()).toBeDisabled(); native.selectionBegin.mockResolvedValue({ ...saved, draftId: '00000000-0000-4000-8000-000000000098' });
  await fireEvent.press(screen.getByRole('button', { name: 'Reload saved choices' }));
  await waitFor(() => expect(screen.getByText('2 apps selected')).toBeVisible());
  expect(native.selectionCommit).toHaveBeenCalledTimes(1);
});

test('missing native producer is unavailable and retry cannot fabricate a selection', async () => {
  await start(null); expect(choose()).toBeDisabled(); expect(save()).toBeDisabled();
  expect(screen.getByText('App selection is unavailable. Your saved choices have not been changed.')).toBeVisible();
});

test('picker single flight disables editor writes and discard until settled', async () => {
  const native = port(), pending = deferred(); native.selectionPick.mockReturnValue(pending.promise);
  await start(native); await fireEvent.press(choose());
  const busy = screen.getByRole('button', { name: 'Choosing apps…' });
  await fireEvent.press(busy); expect(native.selectionPick).toHaveBeenCalledTimes(1); expect(save()).toBeDisabled();
  await act(() => pending.resolve(staged)); await waitFor(() => expect(save()).toBeEnabled());
});

test('old owner operations and late begin handles cannot leak into a replacement scope', async () => {
  const native = port(), pending = deferred(); native.selectionBegin.mockReturnValueOnce(pending.promise);
  const view = await render(<NativeAppsEditor owner={A} port={native} onBack={jest.fn()} />);
  await view.rerender(<NativeAppsEditor owner={B} port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(screen.getByText('0 apps selected')).toBeVisible());
  await act(() => pending.resolve({ ...saved, draftId: '00000000-0000-4000-8000-000000000097' }));
  await waitFor(() => expect(native.selectionRelease).toHaveBeenCalledWith(A, '00000000-0000-4000-8000-000000000097'));
  expect(screen.queryByText('2 apps selected')).toBeNull();
});

test('unmount releases exactly the current owner/handle and ignores late picker result', async () => {
  const native = port(), pending = deferred(); native.selectionPick.mockReturnValue(pending.promise);
  const view = await start(native); await fireEvent.press(choose()); await view.unmount();
  await act(() => pending.resolve(staged));
  expect(native.selectionRelease).toHaveBeenCalledWith(A, ID); expect(native.selectionCommit).not.toHaveBeenCalled();
});

test('malformed count or foreign handle is not accepted; no raw inventory is rendered', async () => {
  const native = port(); native.selectionPick.mockResolvedValue({ ...staged, draftId: 'foreign-handle', names: ['PRIVATE_APP'] });
  await start(native); await fireEvent.press(choose());
  await waitFor(() => expect(screen.getByText(/Selection could not be updated/)).toBeVisible());
  expect(screen.queryByText('PRIVATE_APP')).toBeNull(); expect(save()).toBeDisabled();
});

test('hardware Back with a staged draft asks before leaving and removes listener', async () => {
  let back = () => false; const remove = jest.fn(), exit = jest.fn();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, callback) => {
    expect(event).toBe('hardwareBackPress'); back = callback as () => boolean; return { remove };
  });
  const native = port(), view = await render(<NativeAppsEditor owner={A} port={native} onBack={exit} />);
  await waitFor(() => expect(choose()).toBeEnabled()); await fireEvent.press(choose());
  await waitFor(() => expect(save()).toBeEnabled()); await act(() => { expect(back()).toBe(true); });
  expect(exit).not.toHaveBeenCalled(); await fireEvent.press(screen.getByRole('button', { name: 'Keep editing' }));
  expect(save()).toBeEnabled(); await view.unmount(); expect(remove).toHaveBeenCalled();
});

test('valid native inventory extras are stripped rather than retained in the editor', async () => {
  const native = port(); native.selectionPick.mockResolvedValue({ ...staged, displayNames: ['PRIVATE_LABEL'], packages: ['private.package'] });
  await start(native); await fireEvent.press(choose()); await waitFor(() => expect(save()).toBeEnabled());
  expect(screen.queryByText('PRIVATE_LABEL')).toBeNull(); expect(screen.queryByText('private.package')).toBeNull();
});

test.each([
  { ...saved, selectedAppCount: 3, savedAppCount: 3 },
  { ...saved, baseRevision: 8 },
  { ...saved, dirty: true },
])('inconsistent Save acknowledgment requires reload rather than a saved claim', async (invalid) => {
  const native = port(); native.selectionCommit.mockResolvedValue(invalid);
  await start(native); await fireEvent.press(choose()); await waitFor(() => expect(save()).toBeEnabled());
  await fireEvent.press(save()); await waitFor(() => expect(screen.getByRole('button', { name: 'Reload saved choices' })).toBeVisible());
  expect(screen.queryByText('App selection saved on this device. Protection has not changed.')).toBeNull(); expect(save()).toBeDisabled();
});

test('same-owner session generation remounts before a late Save acknowledgment can render', async () => {
  const native = port(), pending = deferred(); native.selectionCommit.mockReturnValue(pending.promise);
  const view = await render(<NativeAppsEditor owner={A} generation={1} port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(choose()).toBeEnabled()); await fireEvent.press(choose()); await waitFor(() => expect(save()).toBeEnabled());
  await fireEvent.press(save());
  await view.rerender(<NativeAppsEditor owner={A} generation={2} port={native} onBack={jest.fn()} />);
  await waitFor(() => expect(screen.getByText('0 apps selected')).toBeVisible());
  await act(() => pending.resolve(saved)); expect(screen.queryByText('2 apps selected')).toBeNull();
  expect(native.selectionRelease).toHaveBeenCalledWith(A, ID);
});
