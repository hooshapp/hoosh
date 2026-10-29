import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { createRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, TextInput } from 'react-native';

import { Field } from './field';
import { UiThemeProvider } from './theme';

describe('Field', () => {
  it('keeps its label visible and preserves the raw draft including Unicode and spaces', async () => {
    function Form() {
      const [value, setValue] = useState('');
      return (
        <Field label="Display name" placeholder="Your name" value={value} onChangeText={setValue} />
      );
    }
    await render(<Form />);
    await userEvent.paste(screen.getByLabelText('Display name'), '  e\u0301 🦕  ');
    expect(screen.getByLabelText('Display name')).toHaveDisplayValue('  e\u0301 🦕  ');
    expect(screen.getByText('Display name')).toBeVisible();
  });

  it('associates a new error with the field and queues an iOS announcement once', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    const view = await render(<Field label="Email" hint="Use your account email." />);
    await view.rerender(
      <Field label="Email" hint="Use your account email." error="Enter a valid email." />,
    );
    expect(screen.getByLabelText(/^Email[. ]+Enter a valid email\.$/)).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email.');
    if (Platform.OS === 'ios') {
      expect(announce).toHaveBeenCalledWith('Email. Enter a valid email.', { queue: true });
    } else {
      expect(announce).not.toHaveBeenCalled();
    }
    const calls = announce.mock.calls.length;
    await view.rerender(
      <Field label="Email" hint="Use your account email." error="Enter a valid email." />,
    );
    expect(announce).toHaveBeenCalledTimes(calls);
    await view.rerender(<Field label="Email" />);
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
    announce.mockRestore();
  });

  it('forwards refs and editing options and preserves caller focus handlers', async () => {
    const ref = createRef<ComponentRef<typeof TextInput>>();
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <UiThemeProvider theme="dark">
        <Field
          ref={ref}
          label="Password"
          secureTextEntry
          autoComplete="current-password"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </UiThemeProvider>,
    );
    const input = screen.getByLabelText('Password');
    expect(ref.current?.focus).toEqual(expect.any(Function));
    expect(input).toHaveProp('secureTextEntry', true);
    expect(input).toHaveProp('autoComplete', 'current-password');
    await fireEvent(input, 'focus', { nativeEvent: {} });
    await fireEvent(input, 'blur', { nativeEvent: {} });
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('exposes read-only state without accepting edits', async () => {
    const onChangeText = jest.fn();
    await render(
      <Field label="Name" value="Jordan" editable={false} onChangeText={onChangeText} />,
    );
    expect(screen.getByLabelText('Name')).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Name'), 'Other');
    expect(onChangeText).not.toHaveBeenCalled();
  });
});
