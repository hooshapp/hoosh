import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ApiError } from '../api/errors';
import { createAccountDataController } from './account-controller';
import {
  AccountDataProvider,
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from './account-data-provider';
import type { AccountApi, AccountOperation } from './account-scope';

const A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
const B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
const signedIn = (user_id = A, sessionGeneration = 1): AuthSnapshot => ({
  status: 'signed_in',
  user: { user_id, email: null },
  credentialStatus: 'ready',
  sessionGeneration,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
function setup(initial = signedIn()) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
  };
  // Test-only transport port, never an app Auth producer or release fixture.
  const api = {
    configuration: { status: 'ready', origin: 'https://api.example', timeoutMs: 15000 },
    getRecoveryState: () => 'ready',
    request: jest.fn(),
    health: jest.fn(),
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    controller,
    listeners,
    set(next: AuthSnapshot) {
      snapshot = next;
      for (const listener of [...listeners]) listener();
    },
  };
}
function Status() {
  const { availability } = useAccountData();
  return <Text>{availability}</Text>;
}
function PrivateForm() {
  const [draft, setDraft] = useState('');
  return <TextInput accessibilityLabel="Private draft" value={draft} onChangeText={setDraft} />;
}

test.each([signedIn(B), signedIn(A, 2)])(
  'remounts private forms on ownership change %j',
  async (next) => {
    const app = setup();
    await render(
      <AccountDataProvider controller={app.controller}>
        <PrivateForm />
      </AccountDataProvider>,
    );
    await userEvent.type(screen.getByLabelText('Private draft'), 'A private draft');
    expect(screen.getByLabelText('Private draft')).toHaveDisplayValue('A private draft');
    await act(() => app.set(next));
    expect(screen.getByLabelText('Private draft')).toHaveDisplayValue('');
  },
);
test('retains same-account draft and data with an explicit unavailable state during refresh', async () => {
  const app = setup();
  await render(
    <AccountDataProvider controller={app.controller}>
      <PrivateForm />
      <Status />
    </AccountDataProvider>,
  );
  await userEvent.type(screen.getByLabelText('Private draft'), 'unsaved');
  await act(() =>
    app.set({
      ...(signedIn() as Extract<AuthSnapshot, { status: 'signed_in' }>),
      credentialStatus: 'refreshing',
    }),
  );
  expect(screen.getByText('auth_unavailable')).toBeOnTheScreen();
  expect(screen.getByLabelText('Private draft')).toHaveDisplayValue('unsaved');
  await act(() => app.set(signedIn()));
  expect(screen.getByText('ready')).toBeOnTheScreen();
  expect(screen.getByLabelText('Private draft')).toHaveDisplayValue('unsaved');
});
test('shows only the supplied fallback until signed in and tears down at sign-out intent', async () => {
  const app = setup({ status: 'bootstrapping', sessionGeneration: 0 });
  await render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Account locked</Text>}>
      <PrivateForm />
    </AccountDataProvider>,
  );
  expect(screen.queryByLabelText('Private draft')).toBeNull();
  await act(() => app.set(signedIn()));
  expect(screen.getByLabelText('Private draft')).toBeOnTheScreen();
  await act(() => app.set({ status: 'signing_out', sessionGeneration: 2 }));
  expect(screen.queryByLabelText('Private draft')).toBeNull();
  expect(screen.getByText('Account locked')).toBeOnTheScreen();
});
test('deduplicates mounted query consumers and renders only the new account response', async () => {
  const app = setup();
  const old = deferred<string>();
  const read = jest.fn((operation: AccountOperation) =>
    operation.account.user_id === A ? old.promise : Promise.resolve('B identity'),
  );
  function Identity() {
    const query = useAccountQuery(['identity'], read);
    return <Text>{query.data ?? 'Loading'}</Text>;
  }
  await render(
    <AccountDataProvider controller={app.controller}>
      <View>
        <Identity />
        <Identity />
      </View>
    </AccountDataProvider>,
  );
  await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
  await act(() => app.set(signedIn(B)));
  await waitFor(() => expect(screen.getAllByText('B identity')).toHaveLength(2));
  await act(() => old.resolve('A private identity'));
  expect(screen.queryByText('A private identity')).toBeNull();
  expect(read).toHaveBeenCalledTimes(2);
});
test.each(['resolve', 'reject'] as const)(
  'suppresses old mutation UI callbacks after account change (%s)',
  async (result) => {
    const app = setup();
    const operation = deferred<string>();
    const success = jest.fn();
    const error = jest.fn();
    const execute = jest.fn(async () => {
      const value = await operation.promise;
      if (result === 'reject') throw new ApiError('network');
      return value;
    });
    function Form() {
      const mutation = useAccountMutation({ execute, onSuccess: success, onError: error });
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save"
          onPress={() => mutation.submit(undefined)}>
          <Text>Save</Text>
        </Pressable>
      );
    }
    await render(
      <AccountDataProvider controller={app.controller}>
        <Form />
      </AccountDataProvider>,
    );
    await userEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(execute).toHaveBeenCalledTimes(1);
    await act(() => app.set(signedIn(B)));
    await act(() => operation.resolve('A saved'));
    expect(success).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  },
);
test('delivers a current-account mutation result once and cleans subscriptions on remount', async () => {
  const app = setup();
  const success = jest.fn();
  function Form() {
    const mutation = useAccountMutation({ execute: async () => 'saved', onSuccess: success });
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save"
        onPress={() => mutation.submit(undefined)}>
        <Text>Save</Text>
      </Pressable>
    );
  }
  const tree = () => (
    <AccountDataProvider controller={app.controller}>
      <Form />
    </AccountDataProvider>
  );
  const view = await render(tree());
  expect(app.listeners.size).toBe(1);
  await userEvent.press(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(success).toHaveBeenCalledTimes(1));
  const old = app.controller.getSnapshot().scope!;
  await view.unmount();
  expect(app.listeners.size).toBe(0);
  expect(old.client.getMutationCache().getAll()).toHaveLength(0);
  await render(tree());
  expect(app.listeners.size).toBe(1);
  expect(app.controller.getSnapshot().scope).not.toBe(old);
});

test('rejects same-turn duplicate submissions and delivers current-account failures once', async () => {
  const app = setup();
  const operation = deferred<string>();
  const error = jest.fn();
  const execute = jest.fn(async () => {
    await operation.promise;
    throw new ApiError('conflict', { status: 409 });
  });
  function Form() {
    const mutation = useAccountMutation({ execute, onError: error });
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Save"
        onPress={() => {
          mutation.submit(undefined);
          mutation.submit(undefined);
        }}>
        <Text>Save</Text>
      </Pressable>
    );
  }
  await render(
    <AccountDataProvider controller={app.controller}>
      <Form />
    </AccountDataProvider>,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Save' }));
  expect(execute).toHaveBeenCalledTimes(1);
  await act(() => operation.resolve('done'));
  await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
});
