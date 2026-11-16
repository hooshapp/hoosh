import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { SessionController } from '@/features/auth/session-controller';
import type { AuthRuntime } from '@/infrastructure/auth/supabase';
import { createAuthSession } from '@/infrastructure/auth/session';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { useAccountData, useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { AppSessionBoundary } from './session-boundary';
import { AppSignOutAction } from './app-runtime-context';

jest.mock('@/infrastructure/auth/runtime', () => ({ createAppRuntime: jest.fn() }));
jest.mock('expo-network', () => ({
  addNetworkStateListener: () => ({ remove: jest.fn() }),
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
}));
const A = '00000000-0000-4000-8000-000000000001', B = '00000000-0000-4000-8000-000000000002';
function setup(initial: string | null = null) {
  let stored = initial ? { user: { id: initial }, access_token: 'fixture-private' } as Session : null;
  let emit: ((event: string, value: Session | null) => void) | undefined;
  const sdk = {
    getSession: jest.fn(async () => ({ data: { session: stored }, error: null })),
    onAuthStateChange: jest.fn((fn) => { emit = fn; return { data: { subscription: { unsubscribe: () => { emit = undefined; } } } }; }),
    refreshSession: jest.fn(async () => ({ data: { session: stored }, error: null })),
    signInWithPassword: jest.fn(async () => { stored = { user: { id: A }, access_token: 'fixture-private', expires_at: Date.now() / 1000 + 3600 } as Session; emit?.('SIGNED_IN', stored); return { data: { session: stored }, error: null }; }),
    signOut: jest.fn(async () => { stored = null; emit?.('SIGNED_OUT', null); return { error: null }; }),
    startAutoRefresh: jest.fn(async () => undefined), stopAutoRefresh: jest.fn(async () => undefined),
  };
  const auth = createAuthSession(sdk as unknown as SupabaseClient['auth']);
  const api = { configuration: { status: 'ready' }, getRecoveryState: () => 'ready' } as unknown as AccountApi;
  const runtime: AppRuntime = {
    auth, api, nativeNamespace: null, canClearSession: true,
    setForeground: (active) => active ? sdk.startAutoRefresh() : sdk.stopAutoRefresh(),
    controller: createAccountDataController(auth, api),
  };
  return { runtime, auth, sdk, switch: () => { stored = { user: { id: B }, access_token: 'fixture-other' } as Session; emit?.('SIGNED_IN', stored); } };
}
function Private() {
  const { scope } = useAccountData();
  return <><Text>Private account {scope?.account.user_id}</Text><AppSignOutAction /></>;
}
it('boots to a password gate and mounts private routes only after SDK sign-in', async () => {
  const { runtime, sdk } = setup();
  await render(<AppSessionBoundary runtime={runtime}><Private /></AppSessionBoundary>);
  await screen.findByText('Welcome back');
  expect(screen.queryByText(/Private account/)).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Email'), 'fixture@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText(`Private account ${A}`);
  expect(sdk.signInWithPassword).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Password')).toBeNull();
});
it('replaces private ownership and removes private views synchronously on sign-out', async () => {
  const fixture = setup(A);
  await render(<AppSessionBoundary runtime={fixture.runtime}><Private /></AppSessionBoundary>);
  await screen.findByText(`Private account ${A}`);
  await act(fixture.switch);
  await screen.findByText(`Private account ${B}`);
  expect(screen.queryByText(`Private account ${A}`)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Sign out of this device' }));
  expect(screen.queryByText(/Private account/)).toBeNull();
  await screen.findByText('Welcome back');
});
it('locks on storage failure, ignoring a later signed-in SDK event', async () => {
  const fixture = setup(A);
  await render(<AppSessionBoundary runtime={fixture.runtime}><Private /></AppSessionBoundary>);
  await screen.findByText(`Private account ${A}`);
  await act(() => fixture.auth.storageFailed());
  await act(fixture.switch);
  await screen.findByText('Account access unavailable');
  expect(screen.queryByText(/Private account/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Clear this device’s session' }));
  await screen.findByText('Welcome back');
});
it('cleans up the SDK lifecycle listener and private controller on unmount', async () => {
  const { runtime, sdk } = setup(A);
  const view = await render(<AppSessionBoundary runtime={runtime}><Private /></AppSessionBoundary>);
  await screen.findByText(`Private account ${A}`);
  await view.unmount();
  await waitFor(() => expect(runtime.controller.getSnapshot().scope).toBeNull());
  expect(sdk.stopAutoRefresh).toHaveBeenCalled();
});
it('keeps bootstrap outages locked and offers deliberate recovery rather than a false signed-out state', async () => {
  const { runtime, sdk } = setup(A);
  sdk.getSession.mockRejectedValueOnce(new Error('fixture provider outage'));
  await render(<AppSessionBoundary runtime={runtime}><Private /></AppSessionBoundary>);
  await screen.findByText('Account access unavailable');
  expect(screen.queryByText(/Private account/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry account access' }));
  await screen.findByText(`Private account ${A}`);
});

it('keeps supplied public content outside private providers and mounts the account scope once', async () => {
  const { runtime, auth, sdk } = setup();
  function Public() {
    const account = useOptionalAccountData();
    return <Text>{account ? 'Unexpected private scope' : 'Public account route'}</Text>;
  }
  await render(<AppSessionBoundary runtime={runtime} publicContent={<Public />}><Private /></AppSessionBoundary>);
  await screen.findByText('Public account route');
  expect(runtime.controller.getSnapshot().scope).toBeNull();
  await act(() => auth.signIn('fixture@example.test', 'fixture-password'));
  await screen.findByText(`Private account ${A}`);
  expect(screen.queryByText('Public account route')).toBeNull();
  expect(sdk.onAuthStateChange).toHaveBeenCalledTimes(1);
});

it('detaches private scope during a recovery flow even when Auth has a session', async () => {
  const { runtime, sdk } = setup(A);
  const content = (holdPrivate: boolean) => (
    <AppSessionBoundary runtime={runtime} holdPrivate={holdPrivate} publicContent={<Text>Recovery route</Text>}>
      <Private />
    </AppSessionBoundary>
  );
  const view = await render(content(false));
  await screen.findByText(`Private account ${A}`);
  const previous = runtime.controller.getSnapshot().scope;
  expect(previous?.isCurrent()).toBe(true);
  await view.rerender(content(true));
  await screen.findByText('Recovery route');
  expect(screen.queryByText(/Private account/)).toBeNull();
  expect(previous?.isCurrent()).toBe(false);
  expect(runtime.controller.getSnapshot().scope).toBeNull();
  expect(sdk.onAuthStateChange).toHaveBeenCalledTimes(1);
});

it('signs in through the baseline form with the landing-page session controller', async () => {
  const { runtime: fallback, sdk } = setup();
  const create = jest.fn(() => ({
    client: { auth: sdk },
    config: { storageKey: 'fixture-session' },
    storage: {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    },
  }) as unknown as AuthRuntime);
  const auth = new SessionController(create);
  const runtime: AppRuntime = {
    ...fallback,
    auth,
    controller: createAccountDataController(auth, fallback.api),
    getPrivateAccessHeld: auth.getPrivateAccessHeld,
    setForeground: auth.setForeground,
  };
  const view = await render(<AppSessionBoundary runtime={runtime}><Private /></AppSessionBoundary>);
  await screen.findByText('Welcome back');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'fixture@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  await screen.findByText(`Private account ${A}`);
  expect(create).toHaveBeenCalledTimes(1);
  expect(sdk.onAuthStateChange).toHaveBeenCalledTimes(1);
  await view.unmount();
});
