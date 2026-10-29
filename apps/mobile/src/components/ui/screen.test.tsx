import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from './button';
import { EmptyCard } from './empty-card';
import { Field } from './field';
import { Screen } from './screen';

describe('Screen', () => {
  it.each([false, true])('composes readable, ordered form content in dark=%s', async (dark) => {
    await render(
      <Screen title="Account details" subtitle="Edit your name." dark={dark} bottomClearance={0}>
        <Field label="Display name" />
        <EmptyCard
          title="No saved plan"
          description="A saved profile does not activate protection."
        />
        <Button label="Save" onPress={() => {}} />
      </Screen>,
    );
    expect(screen.getByRole('header', { name: 'Account details' })).toBeVisible();
    expect(screen.getByLabelText('Display name')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    // Theme changes must not replace or hide the accessible form controls.
    expect(screen.getByRole('header', { name: 'No saved plan' })).toBeVisible();
  });

  it('reserves caller-supplied footer clearance and the actual bottom safe inset', async () => {
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 320, height: 568 },
          insets: { top: 44, right: 0, bottom: 34, left: 0 },
        }}>
        <Screen title="Account" bottomClearance={90} testID="account-content">
          <Field label="Name" />
        </Screen>
      </SafeAreaProvider>,
    );
    const scroll = screen.getByTestId('account-content');
    expect(scroll.props.contentContainerStyle).toEqual(
      expect.arrayContaining([{ paddingBottom: 148 }]),
    );
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.keyboardDismissMode).toBe(
      Platform.OS === 'ios' ? 'interactive' : 'on-drag',
    );
  });
});
