import { AccessibilityInfo, Keyboard } from 'react-native';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { ConfirmationDialog } from './confirmation-dialog';

test('Android Back/request-close keeps the draft and never confirms a destructive action', async () => {
  const keep = jest.fn(),
    discard = jest.fn();
  await render(
    <ConfirmationDialog
      title="Discard unsaved changes?"
      keepLabel="Keep editing"
      discardLabel="Discard and leave"
      onKeep={keep}
      onDiscard={discard}
    />,
  );
  await fireEvent(screen.getByTestId('editor-confirmation'), 'requestClose');
  expect(keep).toHaveBeenCalledTimes(1);
  expect(discard).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Discard and leave' }));
  expect(discard).toHaveBeenCalledTimes(1);
});

test('focus is requested only after the modal is shown and the keyboard is dismissed', async () => {
  const focus = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
  const keyboard = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  await render(
    <ConfirmationDialog
      title="Cancel this quest?"
      keepLabel="Keep quest"
      discardLabel="Confirm cancellation"
      onKeep={jest.fn()}
      onDiscard={jest.fn()}
    />,
  );
  expect(focus).not.toHaveBeenCalled();
  await fireEvent(screen.getByTestId('editor-confirmation'), 'show');
  expect(keyboard).toHaveBeenCalledTimes(1);
  expect(focus).toHaveBeenCalledTimes(1);
  focus.mockRestore();
  keyboard.mockRestore();
});

test('a pending action cannot be confirmed again while keeping remains available', async () => {
  const keep = jest.fn(),
    discard = jest.fn();
  await render(
    <ConfirmationDialog
      title="Cancel this quest?"
      keepLabel="Keep quest"
      discardLabel="Confirm cancellation"
      onKeep={keep}
      onDiscard={discard}
      discardDisabled
    />,
  );
  const confirm = screen.getByRole('button', { name: 'Confirm cancellation' });
  expect(confirm).toBeDisabled();
  await fireEvent.press(confirm);
  expect(discard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep quest' }));
  expect(keep).toHaveBeenCalledTimes(1);
});
