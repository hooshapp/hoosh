import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { Button } from './button';
import { UiThemeProvider } from './theme';

describe('Button', () => {
  it('keeps a neutral secondary action enabled when it has a handler', async () => {
    const onPress = jest.fn();
    await render(
      <UiThemeProvider theme="dark">
        <Button label="Back" variant="secondary" onPress={onPress} />
      </UiThemeProvider>,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
    await userEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('prevents another submission until the caller completes the pending action', async () => {
    let finish: () => void = () => {};
    const save = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    function Form() {
      const [busy, setBusy] = useState(false);
      return (
        <Button
          label="Save"
          busyLabel="Saving…"
          busy={busy}
          onPress={() => {
            setBusy(true);
            void save().finally(() => setBusy(false));
          }}
        />
      );
    }
    await render(<Form />);
    await userEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeBusy();
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    await userEvent.press(screen.getByRole('button', { name: 'Saving…' }));
    expect(save).toHaveBeenCalledTimes(1);
    finish();
    expect(await screen.findByRole('button', { name: 'Save' })).toBeEnabled();
    await userEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(save).toHaveBeenCalledTimes(2);
    finish();
    await screen.findByRole('button', { name: 'Save' });
  });

  it('never invokes an explicitly disabled action', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" disabled onPress={onPress} />);
    await userEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
