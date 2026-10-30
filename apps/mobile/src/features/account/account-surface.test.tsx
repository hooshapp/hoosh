import type {
  AuthAccountActions,
  AuthSessionPort,
  AuthSnapshot,
  SignOutResult,
} from '@disconnect/contracts';
import { act, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text } from 'react-native';

import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';

import { AccountHeader } from './account-header';
import { AccountSurface } from './account-surface';

const A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
const B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
const identity = (email: string | null = 'fixture@example.test', user_id = A) => ({
  user_id,
  email,
});
const signedIn = (user_id = A, sessionGeneration = 1): AuthSnapshot => ({
  status: 'signed_in',
  sessionGeneration,
  user: identity('sdk-only@example.test', user_id),
  credentialStatus: 'ready',
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup() {
  let snapshot = signedIn();
  let recovery: 'ready' | 'paused' | 'recovering' = 'ready';
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
  const body = jest.fn<Promise<unknown>, []>().mockResolvedValue(identity());
  const request = jest.fn(async (_path, options) =>
    options.decode(await body(), {
      account:
        snapshot.status === 'signed_in'
          ? { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration }
          : null,
    }),
  );
  const recoverSession = jest.fn(async () => {
    recovery = 'ready';
    return identity();
  });
  const api = {
    configuration: { status: 'ready', origin: 'https://api.example', timeoutMs: 15000 },
    getRecoveryState: () => recovery,
    request,
    health: jest.fn(),
    recoverSession,
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    auth,
    body,
    request,
    controller,
    recoverSession,
    set(next: AuthSnapshot) {
      snapshot = next;
      for (const listener of [...listeners]) listener();
    },
    pause() {
      recovery = 'paused';
      for (const listener of [...listeners]) listener();
    },
  };
}
async function mount(app: ReturnType<typeof setup>, actions?: AuthAccountActions) {
  return render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Account closed</Text>}>
      <AccountSurface controller={app.controller} actions={actions} />
    </AccountDataProvider>,
  );
}
afterEach(() => onlineManager.setOnline(true));

test('loads only backend-verified identity', async () => {
  const app = setup();
  const response = deferred<unknown>();
  app.body.mockReturnValue(response.promise);
  await mount(app);
  expect(screen.getByText('Loading account information…')).toBeOnTheScreen();
  expect(screen.queryByText('sdk-only@example.test')).toBeNull();
  await act(() => response.resolve(identity()));
  expect(await screen.findByText('fixture@example.test')).toBeOnTheScreen();
  expect(screen.getByText('Your account')).toBeOnTheScreen();
  expect(app.request).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Jordan Rivera')).toBeNull();
  expect(screen.queryByText('Protected')).toBeNull();
});
test('renders a neutral label for nullable email without inferring a profile name', async () => {
  const app = setup();
  app.body.mockResolvedValue(identity(null));
  await mount(app);
  expect(await screen.findByText('Signed-in account')).toBeOnTheScreen();
  expect(screen.queryByText('sdk-only@example.test')).toBeNull();
});
test('renders email changes from a background read, retaining old data only while refreshing', async () => {
  const app = setup();
  await mount(app);
  await screen.findByText('fixture@example.test');
  const response = deferred<unknown>();
  app.body.mockReturnValue(response.promise);
  let refresh!: Promise<void>;
  await act(() => {
    refresh = app.controller.getSnapshot().scope!.client.refetchQueries();
  });
  expect(await screen.findByText('Refreshing account information…')).toBeOnTheScreen();
  expect(screen.getByText('fixture@example.test')).toBeOnTheScreen();
  await act(async () => {
    response.resolve(identity('changed@example.test'));
    await refresh;
  });
  expect(await screen.findByText('changed@example.test')).toBeOnTheScreen();
  expect(screen.queryByText('fixture@example.test')).toBeNull();
});
test('retains same-user data with an honest notice after a background service failure', async () => {
  const app = setup();
  await mount(app);
  await screen.findByText('fixture@example.test');
  app.body.mockRejectedValue(new ApiError('unavailable', { status: 500, retryable: false }));
  await act(() => app.controller.getSnapshot().scope!.client.refetchQueries());
  expect(
    await screen.findByText(
      'Account information could not be refreshed. Showing the last loaded details.',
    ),
  ).toBeOnTheScreen();
  expect(screen.getByText('fixture@example.test')).toBeOnTheScreen();
  expect(app.auth.revalidateSession).not.toHaveBeenCalled();
});
test('shows a first-load error with an actual retry action', async () => {
  const app = setup();
  app.body.mockRejectedValue(new ApiError('forbidden', { status: 403 }));
  await mount(app);
  await screen.findByText('Account information could not be loaded.');
  app.body.mockResolvedValue(identity());
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('fixture@example.test')).toBeOnTheScreen();
});
test('suppresses a mismatched response and clears the previous identity from cache', async () => {
  const app = setup();
  await mount(app);
  await screen.findByText('fixture@example.test');
  const scope = app.controller.getSnapshot().scope!;
  app.body.mockResolvedValue(identity('wrong-owner@example.test', B));
  await act(() => scope.client.refetchQueries());
  expect(await screen.findByText('Account information could not be verified.')).toBeOnTheScreen();
  expect(screen.queryByText('wrong-owner@example.test')).toBeNull();
  expect(screen.queryByText('fixture@example.test')).toBeNull();
  expect(scope.client.getQueryData(scope.key('identity'))).toBeUndefined();
  app.body.mockResolvedValue(identity());
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('fixture@example.test')).toBeOnTheScreen();
});
test('explicit recovery uses the controller and never runs from passive rendering', async () => {
  const app = setup();
  app.pause();
  await mount(app);
  expect(app.recoverSession).not.toHaveBeenCalled();
  expect(app.request).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Verify account access' }));
  await screen.findByText('fixture@example.test');
  expect(app.recoverSession).toHaveBeenCalledTimes(1);
});
test('recovery failures use safe fixed copy and can be retried deliberately', async () => {
  const app = setup();
  app.pause();
  app.recoverSession.mockRejectedValue(new Error('RAW_SDK_SECRET'));
  await mount(app);
  await userEvent.press(screen.getByRole('button', { name: 'Verify account access' }));
  expect(
    await screen.findByText('Account access could not be verified. Try again.'),
  ).toBeOnTheScreen();
  expect(screen.queryByText('RAW_SDK_SECRET')).toBeNull();
  expect(app.recoverSession).toHaveBeenCalledTimes(1);
});
test('keeps a same-user cached email with explicit unavailable messaging during credential recovery', async () => {
  const app = setup();
  await mount(app);
  await screen.findByText('fixture@example.test');
  await act(() =>
    app.set({
      ...(signedIn() as Extract<AuthSnapshot, { status: 'signed_in' }>),
      credentialStatus: 'unavailable',
    }),
  );
  expect(screen.getByText('Account information is temporarily unavailable.')).toBeOnTheScreen();
  expect(screen.getByText('fixture@example.test')).toBeOnTheScreen();
});
test('shows honest offline state and starts no request until reconnect', async () => {
  onlineManager.setOnline(false);
  const app = setup();
  await mount(app);
  expect(
    screen.getByText('You’re offline. Account information will load when connected.'),
  ).toBeOnTheScreen();
  expect(app.request).not.toHaveBeenCalled();
  await act(() => onlineManager.setOnline(true));
  expect(await screen.findByText('fixture@example.test')).toBeOnTheScreen();
});
test('never displays A’s delayed email after B signs in', async () => {
  const app = setup();
  const old = deferred<unknown>();
  app.body.mockReturnValueOnce(old.promise);
  await mount(app);
  await waitFor(() => expect(app.request).toHaveBeenCalledTimes(1));
  app.body.mockResolvedValue(identity('b@example.test', B));
  await act(() => app.set(signedIn(B, 2)));
  await screen.findByText('b@example.test');
  await act(() => old.resolve(identity('a-late@example.test')));
  expect(screen.queryByText('a-late@example.test')).toBeNull();
  expect(screen.getByText('b@example.test')).toBeOnTheScreen();
});
test('delegates one sign-out while API recovery is paused and clears at sign-out intent', async () => {
  const app = setup();
  app.pause();
  const result = deferred<SignOutResult>();
  const signOut = jest.fn(() => result.promise);
  await mount(app, { signOut });
  await userEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByRole('button', { name: 'Signing out…' })).toBeDisabled();
  await userEvent.press(screen.getByRole('button', { name: 'Signing out…' }));
  expect(signOut).toHaveBeenCalledTimes(1);
  await act(() => app.set({ status: 'signing_out', sessionGeneration: 2 }));
  expect(screen.getByText('Account closed')).toBeOnTheScreen();
  await act(() => result.reject(new Error('RAW_SIGNOUT_SECRET')));
  expect(screen.queryByText('RAW_SIGNOUT_SECRET')).toBeNull();
  expect(app.request).not.toHaveBeenCalled();
});
test('retains same-owner UI and offers a safe error when sign-out rejects before ownership changes', async () => {
  const app = setup();
  const signOut = jest.fn().mockRejectedValue(new Error('RAW_SIGNOUT_SECRET'));
  await mount(app, { signOut });
  await screen.findByText('fixture@example.test');
  await userEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  expect(await screen.findByText('Sign-out could not be completed. Try again.')).toBeOnTheScreen();
  expect(screen.queryByText('RAW_SIGNOUT_SECRET')).toBeNull();
  expect(screen.getByText('fixture@example.test')).toBeOnTheScreen();
});
test('has no sign-out control without the owner’s real account-actions port', async () => {
  const app = setup();
  await mount(app);
  await screen.findByText('fixture@example.test');
  expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
});
test('standalone header renders long Unicode email as text without exposing UUID', async () => {
  const email = `${'verylong'.repeat(12)}+ü@example.test`;
  await render(<AccountHeader identity={identity(email)} />);
  expect(screen.getByText(email)).toBeOnTheScreen();
  expect(screen.queryByText(A)).toBeNull();
});

test('sign-out intent unmounts a pending identity read before a late response arrives', async () => {
  const app = setup();
  const response = deferred<unknown>();
  app.body.mockReturnValue(response.promise);
  const signOut = jest.fn(async (): Promise<SignOutResult> => {
    app.set({ status: 'signing_out', sessionGeneration: 2 });
    return { localSessionCleared: true, remoteRevocation: 'unconfirmed' };
  });
  await mount(app, { signOut });
  await waitFor(() => expect(app.request).toHaveBeenCalledTimes(1));
  const signal = app.request.mock.calls[0][1].signal as AbortSignal;
  await userEvent.press(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByText('Account closed')).toBeOnTheScreen();
  expect(signal.aborted).toBe(true);
  await act(() => response.resolve(identity('late@example.test')));
  expect(screen.queryByText('late@example.test')).toBeNull();
  expect(signOut).toHaveBeenCalledTimes(1);
});
