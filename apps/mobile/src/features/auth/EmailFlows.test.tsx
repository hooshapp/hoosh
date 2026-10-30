import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { ConfirmEmail, ForgotPassword, ResetPassword } from './EmailFlows';

const mockReplace = jest.fn();
const mockRequest = jest.fn<(email: string, origin?: string) => Promise<void>>();
const mockUpdate = jest.fn<(password: string) => Promise<void>>();
const mockResend = jest.fn<() => Promise<void>>();
const mockCancel = jest.fn<() => Promise<void>>();
const mockCanReset = jest.fn<() => boolean>();
let mockPending: { kind: string; phase: string; lastSentAt: number } | null = null;
jest.mock('./auth-provider', () => ({ useAuth: () => ({
  controller: { requestRecovery: mockRequest, updatePassword: mockUpdate, resendConfirmation: mockResend, cancelLink: mockCancel, canResetPassword: mockCanReset },
  links: { pending: mockPending }, snapshot: { status: 'signed_in', user: { email: 'a@example.test' } },
}) }));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Link: ({ children }: PropsWithChildren) => <Text>{children}</Text>, useRouter: () => ({ replace: mockReplace }) };
});
function Wrapper({ children }: PropsWithChildren) {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, left: 0, bottom: 0, right: 0 } }}>{children}</SafeAreaProvider>;
}
beforeEach(() => {
  mockReplace.mockReset();
  for (const mock of [mockRequest, mockUpdate, mockResend, mockCancel]) { mock.mockReset(); mock.mockResolvedValue(undefined); }
  mockCanReset.mockReset(); mockCanReset.mockReturnValue(false); mockPending = null;
});
it('requires a valid recovery email and gives a neutral acknowledgment', async () => {
  await render(<ForgotPassword />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy(); expect(mockRequest).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Email'), 'unknown@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(mockRequest).toHaveBeenCalledWith('unknown@example.test', undefined);
  expect(screen.getByText(/If an account exists/)).toBeTruthy();
});
it('does not expose password fields without verified recovery context', async () => {
  await render(<ResetPassword />, { wrapper: Wrapper });
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Update password' })).toBeNull();
  expect(mockUpdate).not.toHaveBeenCalled();
});
it('checks matching new passwords and preserves their bytes when updating', async () => {
  mockCanReset.mockReturnValue(true);
  await render(<ResetPassword />, { wrapper: Wrapper });
  await fireEvent.changeText(screen.getByLabelText('New password'), ' new-password ');
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'different-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  expect(screen.getByText('Passwords do not match.')).toBeTruthy(); expect(mockUpdate).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), ' new-password ');
  await fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  expect(mockUpdate).toHaveBeenCalledWith(' new-password ');
  expect(screen.getByText('Your password was updated. Log in again on this device.')).toBeTruthy();
});
it('keeps resend disabled during the local cooldown', async () => {
  mockPending = { kind: 'signup', phase: 'requested', lastSentAt: Date.now() };
  await render(<ConfirmEmail />, { wrapper: Wrapper });
  const button = screen.getByRole('button', { name: /Resend in/ });
  expect(button.props.accessibilityState.disabled).toBe(true);
  await fireEvent.press(button); expect(mockResend).not.toHaveBeenCalled();
});

it('returns cancellation to recovery after the session controller clears its route gate', async () => {
  mockPending = { kind: 'recovery', phase: 'requested', lastSentAt: Date.now() };
  await render(<ForgotPassword />, { wrapper: Wrapper });
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel reset request' }));
  expect(mockCancel).toHaveBeenCalledTimes(1);
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/forgot-password');
});
