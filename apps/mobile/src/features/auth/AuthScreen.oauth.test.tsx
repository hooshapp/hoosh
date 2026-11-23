import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { AuthScreen } from './AuthScreen';

const mockCancel = jest.fn();
const mockHandle = jest.fn();
const mockOpen = jest.fn();
const mockReplace = jest.fn();
const mockBegin = jest.fn();
const mockPending = { id: 'synthetic-oauth-flow', kind: 'oauth', phase: 'requested' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/infrastructure/auth/oauth-browser', () => ({ openOAuthBrowser: (...args: unknown[]) => mockOpen(...args) }));
jest.mock('@/infrastructure/auth/social-config', () => ({ socialConfig: { google: true, appleOAuth: true, appleNative: false } }));
jest.mock('./use-public-auth', () => ({
  usePublicAuth: () => ({
    snapshot: { status: 'signed_out' }, links: { pending: null },
    runtime: {
      authForms: { getLinkSnapshot: () => ({ pending: mockPending }), cancelLink: mockCancel },
      authLinks: { beginOAuth: mockBegin, handleCallback: mockHandle, getLastSignOutResult: () => null },
    },
  }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockBegin.mockResolvedValue({ url: 'https://example.test/authorize', redirectUrl: 'disconnect-dev://auth/callback?flow=synthetic-oauth-flow', flowId: mockPending.id });
  mockOpen.mockResolvedValue(null);
  mockCancel.mockResolvedValue(undefined);
});

test('browser dismissal preserves the Android callback request until explicit cancellation', async () => {
  await render(<AuthScreen mode="sign-in" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
  if (Platform.OS === 'android') {
    await screen.findByText('Finish signing in in the browser, or cancel this request and try again.');
    expect(mockCancel).not.toHaveBeenCalled();
  } else {
    await waitFor(() => expect(mockCancel).toHaveBeenCalledTimes(1));
  }
  expect(mockHandle).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('a successful browser return is validated and follows the session destination', async () => {
  const callback = 'disconnect-dev://auth/callback?flow=synthetic-oauth-flow&code=synthetic-code';
  mockOpen.mockResolvedValue(callback);
  mockHandle.mockResolvedValue('/(tabs)');
  await render(<AuthScreen mode="sign-in" />);
  await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  expect(mockHandle).toHaveBeenCalledWith(callback);
  expect(mockCancel).not.toHaveBeenCalled();
});
