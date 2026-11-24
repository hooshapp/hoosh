import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { Text } from 'react-native';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ConnectedHomeScreen } from '@/features/home/connected-home-screen';
const A = '00000000-0000-4000-8000-000000000001', B = '00000000-0000-4000-8000-000000000002';
function setup(balance = 50, health = 50) {
  let snapshot: AuthSnapshot = { status: 'signed_in', credentialStatus: 'ready', sessionGeneration: 1, user: { user_id: A, email: null } };
  let wallet = { user_id: A, revision: 1, balance, health, artwork: 'feelingLow', feed_cost: 10, feed_health: 20, streak_days: null,
    recent_week_complete: false, observed_at: '2026-11-13T12:00:00Z', policy_version: 2 };
  if (health === 100) wallet.artwork = 'happy';
  let lose = false, failRead = false, reject = false;
  const receipts = new Map();
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = { getSnapshot: () => snapshot, subscribe: (fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, getAccessToken: jest.fn(), revalidateSession: jest.fn() };
  const request = jest.fn(async (path, options) => {
    const account = snapshot.status === 'signed_in' ? { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration } : null;
    const id = path.split('/').at(-1);
    let value: unknown = path === '/v1/settings' ? { settings: null } : path === '/v1/me' ? { user_id: account?.user_id, email: null } : { profile: null };
    if (path === '/v1/rewards') {
      if (failRead) throw new ApiError('forbidden');
      value = { ...wallet, user_id: account?.user_id, balance: account?.user_id === A ? wallet.balance : 0 };
    }
    if (path.startsWith('/v1/rewards/feed/')) {
      if (options.method === 'PUT') {
        if (reject || options.json.expected_revision !== wallet.revision) throw new ApiError('conflict', { code: 'REWARD_CONFLICT', details: { current_revision: wallet.revision } });
        wallet = { ...wallet, balance: wallet.balance - 10, health: wallet.health + 20, artwork: wallet.health + 20 <= 75 ? 'doingOkay' : 'happy', revision: wallet.revision + 1 };
        const receipt = { request_id: id, health_added: 20, wallet };
        receipts.set(id, receipt); value = { ...receipt, charged_credits: 10 };
        if (lose) { lose = false; throw new ApiError('network', { requestMayHaveCommitted: true }); }
      } else value = receipts.has(id) ? { ...receipts.get(id), recorded: true } : { request_id: id, recorded: false, health_added: null, wallet };
    }
    return options.decode(value, { account });
  });
  const api = { configuration: { status: 'ready' }, getRecoveryState: () => 'ready', request, recoverSession: jest.fn() } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return { request, controller, set(next: AuthSnapshot) { snapshot = next; listeners.forEach((fn) => fn()); },
    lose: () => { lose = true; }, fail: () => { failRead = true; }, reject: () => { reject = true; }, wallet: () => wallet,
    ui: () => <AccountDataProvider controller={controller} fallback={<Text>Signed out</Text>}><ConnectedHomeScreen /></AccountDataProvider> };
}
const press = async (name: string) => act(async () => fireEvent.press(screen.getByRole('button', { name })));
afterEach(() => onlineManager.setOnline(true));
test('real Home shows verified balance/artwork and Feed updates only after server acknowledgment', async () => {
  const s = setup(); await render(s.ui());
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('50'));
  expect(screen.getByLabelText('Dino health 50%')).toBeTruthy();
  expect(screen.getByTestId('home-streak')).toHaveTextContent('Current streakNot available yet');
  await press('Feed Dino for 10 credits');
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('40'));
  expect(screen.getByLabelText('Dino health 70%')).toBeTruthy();
  expect(s.request.mock.calls.filter(([, o]) => o.method === 'PUT')).toHaveLength(1);

});
test('lost response blocks another Feed and reconciles by read without automatic spending', async () => {
  const s = setup(); s.lose(); await render(s.ui());
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('50'));
  await press('Feed Dino for 10 credits');
  await waitFor(() => expect(screen.getByText(/Feed was not confirmed/)).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Feed Dino for 10 credits' })).toBeDisabled();
  await press('Check last Feed');
  await waitFor(() => expect(screen.getByText(/Last Feed confirmed/)).toBeTruthy());
  expect(s.wallet().balance).toBe(40);
  expect(s.request.mock.calls.filter(([, o]) => o.method === 'PUT')).toHaveLength(1);

});
test.each([[0, 50], [50, 100]])('no funds/full health disables Feed without dispatching (%s,%s)', async (balance, health) => {
  const s = setup(balance, health); await render(s.ui());
  await waitFor(() => expect(screen.getByLabelText(`Dino health ${health}%`)).toBeTruthy());
  expect(screen.getByRole('button', { name: 'Feed Dino for 10 credits' })).toBeDisabled();
  expect(s.request.mock.calls.some(([, o]) => o.method === 'PUT')).toBe(false);
});
test('offline/error masks cached wallet and account replacement never inherits its balance', async () => {
  const s = setup(); await render(s.ui());
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('50'));
  await act(async () => onlineManager.setOnline(false));
  expect(screen.getByTestId('home-credit-value')).toHaveTextContent('—');
  await act(async () => { s.set({ status: 'signed_in', credentialStatus: 'ready', sessionGeneration: 2, user: { user_id: B, email: null } }); onlineManager.setOnline(true); });
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('0'));
  s.fail(); await act(async () => { focusManager.setFocused(false); }); await act(async () => { focusManager.setFocused(true); });
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('—'));

});
test('conflict does not optimistically spend or retry and requires wallet refresh', async () => {
  const s = setup(); s.reject(); await render(s.ui());
  await waitFor(() => expect(screen.getByTestId('home-credit-value')).toHaveTextContent('50'));
  await press('Feed Dino for 10 credits');
  await waitFor(() => expect(screen.getByText(/Feed was not charged/)).toBeTruthy());
  expect(s.wallet().balance).toBe(50);
  expect(s.request.mock.calls.filter(([, o]) => o.method === 'PUT')).toHaveLength(1);

});
