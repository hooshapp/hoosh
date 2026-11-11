import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { createAuthSession } from '@/infrastructure/auth/session';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
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
    signInWithPassword: jest.fn(async () => { stored = { user: { id: A }, access_token: 'fixture-private' } as Session; emit?.('SIGNED_IN', stored); return { data: { session: stored }, error: null }; }),
    signOut: jest.fn(async () => { stored = null; emit?.('SIGNED_OUT', null); return { error: null }; }),
    startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn(),
  };
  const auth = createAuthSession(sdk as unknown as SupabaseClient['auth']);
  const api = { configuration: { status: 'ready' }, getRecoveryState: () => 'ready' } as unknown as AccountApi;
  const runtime = { auth, sdk: { auth: sdk }, api, controller: createAccountDataController(auth, api) } as unknown as AppRuntime;
  return { runtime, sdk, switch: () => { stored = { user: { id: B }, access_token: 'fixture-other' } as Session; emit?.('SIGNED_IN', stored); } };
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
  await act(() => fixture.runtime.auth.storageFailed());
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
