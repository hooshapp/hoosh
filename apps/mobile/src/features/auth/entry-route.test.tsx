import { beforeEach, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { AuthSnapshot } from '@disconnect/contracts';
import type { PendingLink } from './link-flow';
import Index from '../../app/index';

let mockSnapshot: AuthSnapshot = { status: 'signed_out', sessionGeneration: 0 };
let mockPending: Partial<PendingLink> | null = null;
const mockReset = jest.fn<() => boolean>();
jest.mock('./auth-provider', () => ({ useAuth: () => ({ snapshot: mockSnapshot, links: { pending: mockPending }, controller: { canResetPassword: mockReset } }) }));
jest.mock('../intro/Introduction', () => ({ Introduction: () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return <Text>First-launch introduction</Text>;
} }));
jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return <Text>{href}</Text>;
} }));
beforeEach(() => { mockSnapshot = { status: 'signed_out', sessionGeneration: 0 }; mockPending = null; mockReset.mockReturnValue(false); });
it('keeps first launch separate from account state', async () => {
  await render(<Index />); expect(screen.getByText('First-launch introduction')).toBeTruthy();
});
it('resumes confirmation instead of restarting the signup form', async () => {
  mockPending = { kind: 'signup', phase: 'requested' };
  await render(<Index />); expect(screen.getByText('/(auth)/confirm-email')).toBeTruthy();
});
it('never sends a restored recovery session directly to the app', async () => {
  mockSnapshot = { status: 'signed_in', sessionGeneration: 1, user: { user_id: 'a', email: null }, credentialStatus: 'ready' };
  mockPending = { kind: 'recovery', phase: 'recovery' }; mockReset.mockReturnValue(true);
  await render(<Index />); expect(screen.getByText('/(auth)/reset-password')).toBeTruthy();
});
it('requires fresh recovery after an interrupted code exchange', async () => {
  mockPending = { kind: 'recovery', phase: 'consuming' };
  await render(<Index />); expect(screen.getByText('/auth/link-error')).toBeTruthy();
});

it('resumes an interrupted OAuth request on a public cancel screen', async () => {
  mockPending = { kind: 'oauth', provider: 'google', phase: 'requested' };
  await render(<Index />); expect(screen.getByText('/(auth)/social-sign-in')).toBeTruthy();
});
