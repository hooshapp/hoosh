import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { AuthScreen } from './AuthScreen';

const mockSocialConfig = { google: false, appleNative: false, appleOAuth: false };
const mockBeginOAuth = jest.fn<(provider: string, origin?: string) => Promise<{ url: string; redirectUrl: string; flowId: string }>>();
const mockHandleCallback = jest.fn<(url: string) => Promise<string>>();
const mockOpenOAuthBrowser = jest.fn<() => Promise<string | null>>();
const mockCancelLink = jest.fn<() => Promise<void>>();
jest.mock('@/infrastructure/auth/social-config', () => ({ get socialConfig() { return mockSocialConfig; } }));
jest.mock('@/infrastructure/auth/oauth-browser', () => ({ openOAuthBrowser: (...args: unknown[]) => mockOpenOAuthBrowser(...args as []) }));
const mockRequestConfirmation = jest.fn<(email: string, origin?: string) => Promise<void>>();
const mockSignUp = jest.fn<(email: string, password: string, name: string, origin?: string) => Promise<void>>();
const mockReplace = jest.fn();
const mockSignIn = jest.fn<(email: string, password: string) => Promise<void>>();
beforeEach(() => { mockSocialConfig.google = false; mockBeginOAuth.mockReset(); mockHandleCallback.mockReset(); mockOpenOAuthBrowser.mockReset(); mockCancelLink.mockReset(); mockSignIn.mockReset(); mockSignIn.mockResolvedValue(undefined); mockSignUp.mockReset(); mockSignUp.mockResolvedValue(undefined); mockRequestConfirmation.mockReset(); mockRequestConfirmation.mockResolvedValue(undefined); });
jest.mock('./auth-provider', () => ({ useAuth: () => ({ snapshot: { status: 'signed_out' }, links: { pending: null }, controller: { beginOAuth: mockBeginOAuth, handleCallback: mockHandleCallback, cancelLink: mockCancelLink, signIn: mockSignIn, requestConfirmation: mockRequestConfirmation, signUp: mockSignUp, getLinkSnapshot: () => ({ pending: { kind: 'signup' } }), getSnapshot: () => ({ status: 'signed_out' }) } }) }));

jest.mock('expo-router', () => ({ Link: ({ children }: PropsWithChildren) => children, useRouter: () => ({ replace: mockReplace }) }));
function Wrapper({ children }: PropsWithChildren) {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, left: 0, bottom: 0, right: 0 } }}>{children}</SafeAreaProvider>;
}
it('shows signup errors and clears them as fields are corrected', async () => {
  await render(<AuthScreen mode="sign-up" />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(screen.getByText('Enter your name.')).toBeTruthy();
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(screen.getByText('Enter your password.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Alex');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'a long password');
  expect(screen.queryByText('Enter your name.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(mockSignUp).toHaveBeenCalledWith('alex@example.test', 'a long password', 'Alex', undefined);
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/confirm-email');
});
it('allows existing short passwords on login and never claims a successful session', async () => {
  await render(<AuthScreen mode="sign-in" />, { wrapper: Wrapper });
  expect(screen.queryByLabelText('Name')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'short');
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  await fireEvent(screen.getByLabelText('Password'), 'submitEditing');
  expect(mockSignIn).toHaveBeenCalledWith('alex@example.test', 'short');
  expect(screen.getByText('New here? Sign up')).toBeTruthy();
});
it('explains the unavailable Google action without starting provider access', async () => {
  await render(<AuthScreen mode="sign-up" />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
  expect(screen.getByRole('button', { name: 'Continue with Google' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText('Google sign-in is not configured yet.')).toBeTruthy();
  expect(screen.getByText('Already have an account? Log in')).toBeTruthy();
});

it('shows generic invalid credentials and permits retry without exposing provider text', async () => {
  mockSignIn.mockRejectedValueOnce({ code: 'invalid_credentials', message: 'sensitive provider detail' });
  await render(<AuthScreen mode="sign-in" />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(screen.getByText('Email or password is incorrect.')).toBeTruthy();
  expect(screen.queryByText('sensitive provider detail')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(mockSignIn).toHaveBeenCalledTimes(2);
});
it('disables inputs and repeated taps while login is pending', async () => {
  let resolve!: () => void;
  mockSignIn.mockImplementationOnce(() => new Promise<void>(r => { resolve = r; }));
  await render(<AuthScreen mode="sign-in" />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Email'), 'alex@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(screen.getByRole('button', { name: 'Log in' }).props.accessibilityState.busy).toBe(true);
  expect(screen.getByLabelText('Email').props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  expect(mockSignIn).toHaveBeenCalledTimes(1);
  await act(async () => resolve());
});

it('offers a real confirmation resend for an unconfirmed account', async () => {
  mockSignIn.mockRejectedValueOnce({ code: 'email_not_confirmed' });
  await render(<AuthScreen mode="sign-in" />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('Email'), 'a@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Resend confirmation email' }));
  expect(mockRequestConfirmation).toHaveBeenCalledWith('a@example.test', undefined);
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/confirm-email');
});

it('routes configured Google access through the browser and matched callback', async () => {
  mockSocialConfig.google = true;
  mockBeginOAuth.mockResolvedValue({ url: 'https://synthetic.supabase.co/auth/v1/authorize', redirectUrl: 'disconnect-dev://auth/callback?flow=synthetic', flowId: 'synthetic' });
  mockOpenOAuthBrowser.mockResolvedValue('disconnect-dev://auth/callback?flow=synthetic&code=synthetic');
  mockHandleCallback.mockResolvedValue('/(tabs)');
  await render(<AuthScreen mode="sign-up" />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
  expect(mockBeginOAuth).toHaveBeenCalledWith('google', undefined);
  expect(mockHandleCallback).toHaveBeenCalledWith('disconnect-dev://auth/callback?flow=synthetic&code=synthetic');
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  expect(mockSignUp).not.toHaveBeenCalled();
});
