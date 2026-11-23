import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AuthCallback } from './CallbackScreens';

let mockIncoming: string | null;
const mockReplace = jest.fn();
const mockHandle = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('expo-linking', () => ({
  // A warm native intent is the authoritative current link. The async launch-URL
  // hook can still resolve to an earlier callback and must not be used here.
  useLinkingURL: () => mockIncoming,
  useURL: () => { throw new Error('Do not consume the stale async launch URL.'); },
}));
jest.mock('./use-public-auth', () => ({
  usePublicAuth: () => ({ runtime: { authLinks: { handleCallback: mockHandle } } }),
}));
beforeEach(() => {
  mockIncoming = 'disconnect-dev://auth/callback?flow=synthetic-current-flow&code=synthetic-code';
  mockReplace.mockReset(); mockHandle.mockReset();
});

test('uses the current warm native callback and follows its recovery destination once', async () => {
  mockHandle.mockResolvedValue('/(auth)/reset-password');
  const view = await render(<AuthCallback />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/reset-password'));
  expect(mockHandle).toHaveBeenCalledWith(mockIncoming);
  await view.rerender(<AuthCallback />);
  expect(mockHandle).toHaveBeenCalledTimes(1);
});

test('waits for a current link and routes OAuth success without leaking callback contents', async () => {
  mockIncoming = null;
  mockHandle.mockResolvedValue('/(tabs)');
  const view = await render(<AuthCallback />);
  expect(mockHandle).not.toHaveBeenCalled();
  mockIncoming = 'disconnect-dev://auth/callback?flow=synthetic-oauth-flow&code=synthetic-secret';
  await view.rerender(<AuthCallback />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  expect(screen.queryByText(/synthetic-secret/)).toBeNull();
});

test('fails closed on rejected exchange and never renders provider details', async () => {
  mockHandle.mockRejectedValue(new Error('synthetic-private-provider-detail'));
  await render(<AuthCallback />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/link-error'));
  expect(screen.queryByText(/synthetic-private-provider-detail/)).toBeNull();
  expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)');
});

test('times out a missing callback without attempting an exchange', async () => {
  jest.useFakeTimers();
  try {
    mockIncoming = null; await render(<AuthCallback />);
    await act(async () => { jest.advanceTimersByTime(3000); });
    expect(mockHandle).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/auth/link-error');
  } finally { jest.useRealTimers(); }
});
