import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { AccountHeader } from './account-header';
import { ProfileForm, type ProfileFormProps, type ProfileNameDraft } from './profile-form';

function props(overrides: Partial<ProfileFormProps> = {}): ProfileFormProps {
  return {
    draft: { kind: 'text', value: 'Existing name' },
    dirty: true,
    state: { kind: 'ready' },
    onDraftChange: jest.fn(),
    onDiscard: jest.fn(),
    ...overrides,
  };
}
test('requests confirmation focus only for explicit open/close intents and announces its purpose', async () => {
  const focus = jest
    .spyOn(AccessibilityInfo, 'sendAccessibilityEvent')
    .mockImplementation(() => {});
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
  const input = props({ onSave: jest.fn() });
  const view = await render(<ProfileForm {...input} />);
  expect(focus).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Remove display name' }));
  expect(focus).toHaveBeenCalledTimes(1);
  if (Platform.OS === 'ios')
    expect(announce).toHaveBeenLastCalledWith(
      'Remove your display name? This takes effect only after you save.',
      { queue: true },
    );
  await view.rerender(<ProfileForm {...input} state={{ kind: 'error' }} />);
  expect(focus).toHaveBeenCalledTimes(1);
  await userEvent.press(screen.getByRole('button', { name: 'Keep name' }));
  expect(focus).toHaveBeenCalledTimes(2);
  focus.mockRestore();
  announce.mockRestore();
});
test('never enables a pretend save when no persistence callback is supplied', async () => {
  await render(<ProfileForm {...props()} />);
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  expect(screen.queryByText('Jordan Rivera')).toBeNull();
});
test('does not submit an unchanged draft', async () => {
  const onSave = jest.fn();
  await render(<ProfileForm {...props({ dirty: false, onSave })} />);
  await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(onSave).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
});
test.each(['   ', `  ${'𐐀'.repeat(80)}  `, ' A\u030A\tName '])(
  'passes raw draft %j without client normalization or an 80-code-unit cap',
  async (value) => {
    const onChange = jest.fn();
    const onSave = jest.fn();
    const view = await render(<ProfileForm {...props({ onDraftChange: onChange, onSave })} />);
    await fireEvent.changeText(screen.getByLabelText('Display name'), value);
    expect(onChange).toHaveBeenLastCalledWith({ kind: 'text', value });
    expect(screen.getByLabelText('Display name').props.maxLength).toBeUndefined();
    await view.rerender(<ProfileForm {...props({ draft: { kind: 'text', value }, onSave })} />);
    await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledWith({ kind: 'text', value });
  },
);
test('locks mutable controls during the full controlled saving state', async () => {
  const onSave = jest.fn();
  const onDiscard = jest.fn();
  const onDraftChange = jest.fn();
  await render(
    <ProfileForm {...props({ state: { kind: 'saving' }, onSave, onDiscard, onDraftChange })} />,
  );
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(screen.getByLabelText('Display name').props.editable).toBe(false);
  await userEvent.press(screen.getByRole('button', { name: 'Discard changes' }));
  await userEvent.press(screen.getByRole('button', { name: 'Remove display name' }));
  expect(onSave).not.toHaveBeenCalled();
  expect(onDiscard).not.toHaveBeenCalled();
  expect(screen.getByText('Saving your profile…')).toBeOnTheScreen();
});
test('requires explicit clear confirmation and keeps it distinct from blank text', async () => {
  const onSave = jest.fn();
  const changed = jest.fn();
  function Form() {
    const [draft, setDraft] = useState<ProfileNameDraft>({ kind: 'text', value: 'Existing' });
    return (
      <ProfileForm
        {...props({
          draft,
          onSave,
          onDraftChange: (next) => {
            changed(next);
            setDraft(next);
          },
        })}
      />
    );
  }
  await render(<Form />);
  await userEvent.press(screen.getByRole('button', { name: 'Remove display name' }));
  expect(changed).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Keep name' }));
  expect(changed).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Remove display name' }));
  await userEvent.press(screen.getByRole('button', { name: 'Remove name' }));
  expect(changed).toHaveBeenLastCalledWith({ kind: 'clear' });
  expect(screen.getByText('Your display name will be removed when you save.')).toBeOnTheScreen();
  expect(onSave).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(onSave).toHaveBeenLastCalledWith({ kind: 'clear' });
  await fireEvent.changeText(screen.getByLabelText('Display name'), ' ');
  expect(changed).toHaveBeenLastCalledWith({ kind: 'text', value: ' ' });
});
test('discards only on an explicit action and never saves or clears implicitly', async () => {
  const onDiscard = jest.fn();
  const onSave = jest.fn();
  const onDraftChange = jest.fn();
  await render(<ProfileForm {...props({ onDiscard, onSave, onDraftChange })} />);
  await userEvent.press(screen.getByRole('button', { name: 'Discard changes' }));
  expect(onDiscard).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
  expect(onDraftChange).not.toHaveBeenCalled();
});
test('associates approved field validation copy while retaining the controlled draft', async () => {
  await render(<ProfileForm {...props({ state: { kind: 'invalid', issue: 'blank' } })} />);
  expect(screen.getByDisplayValue('Existing name')).toBeOnTheScreen();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Enter a display name, or choose Remove display name.',
  );
});
test.each([
  ['conflict', 'Review latest profile'],
  ['unconfirmed', 'Check latest profile'],
] as const)('preserves draft and blocks blind resubmission in %s state', async (kind, action) => {
  const onSave = jest.fn();
  const review = jest.fn();
  await render(<ProfileForm {...props({ state: { kind }, onSave, onReviewLatest: review })} />);
  expect(screen.getByLabelText('Display name')).toHaveDisplayValue('Existing name');
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  expect(review).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: action }));
  expect(review).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});
test('does not render a nonfunctional reconciliation action without a callback', async () => {
  await render(<ProfileForm {...props({ state: { kind: 'unconfirmed' } })} />);
  expect(screen.queryByRole('button', { name: 'Check latest profile' })).toBeNull();
});
test('retains editable local input when saving is unavailable, with no save action', async () => {
  const onSave = jest.fn();
  const onDraftChange = jest.fn();
  await render(
    <ProfileForm {...props({ state: { kind: 'unavailable' }, onSave, onDraftChange })} />,
  );
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Display name'), 'New draft');
  expect(onDraftChange).toHaveBeenLastCalledWith({ kind: 'text', value: 'New draft' });
  expect(onSave).not.toHaveBeenCalled();
});
test('shows a failure without creating a saved state or losing the draft', async () => {
  await render(<ProfileForm {...props({ state: { kind: 'error' } })} />);
  expect(
    screen.getByText('Your profile could not be saved. Your changes are still here.'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Display name')).toHaveDisplayValue('Existing name');
});
test('shows a supplied canonical profile name while preserving RN-05 neutral fallback', async () => {
  const identity = { user_id: 'a46e48ad-c742-4e18-b57d-2c9a56544944', email: null };
  const view = await render(
    <AccountHeader identity={identity} displayName="Explicit supplied name" />,
  );
  expect(screen.getByText('Explicit supplied name')).toBeOnTheScreen();
  await view.rerender(<AccountHeader identity={identity} displayName={null} />);
  expect(screen.getByText('Your account')).toBeOnTheScreen();
});
