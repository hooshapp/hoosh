import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppRuntimeContext } from '@/features/account/app-runtime-context';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { NativeOwnerBoundary, useNativeOwner } from './native-owner-boundary';
const A = '00000000-0000-4000-8000-000000000001', B = '00000000-0000-4000-8000-000000000002';
let mockIdentity: { user_id: string; email: null } | undefined;
let mockScope = { id: 1, account: { user_id: A, sessionGeneration: 1 } };
let mockLifecycleEnabled = false;
let mockGlobalPortEnabled = true;
const mockDevice = jest.fn();
const mockBeginSession = jest.fn(), mockEndSession = jest.fn(async (_token: string) => undefined);
jest.mock('@/infrastructure/native/native-owner-session', () => ({
  get nativeOwnerSession() { return mockLifecycleEnabled ? { begin: mockBeginSession, end: mockEndSession, device: mockDevice } : null; },
}));
const mockEnd = jest.fn(async (..._args: unknown[]) => undefined), mockSelectionEnd = jest.fn(async (..._args: unknown[]) => undefined);
const mockProductPort = {
  interventionEndOwner: (...args: unknown[]) => mockEnd(...args),
  selectionEndOwner: (...args: unknown[]) => mockSelectionEnd(...args),
};
jest.mock('@/infrastructure/native/product-ports', () => ({
  get productNativePort() { return mockGlobalPortEnabled ? mockProductPort : null; },
}));
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope }) }));
jest.mock('@/features/account/identity-query', () => ({ useIdentityQuery: () => ({ data: mockIdentity }) }));
function Consumer() { const binding = useNativeOwner(); return <Text>{binding?.owner ?? 'No verified device owner'}</Text>; }
function Host() {
  return <AppRuntimeContext.Provider value={{ nativeNamespace: 'fixture' } as AppRuntime}><NativeOwnerBoundary><Consumer /></NativeOwnerBoundary></AppRuntimeContext.Provider>;
}
beforeEach(() => { mockGlobalPortEnabled = true; mockDevice.mockReturnValue(null); mockLifecycleEnabled = false; mockIdentity = undefined; mockScope = { id: 1, account: { user_id: A, sessionGeneration: 1 } }; });
it('never binds native state from SDK subject alone or a mismatched API identity', async () => {
  const view = await render(<Host />);
  expect(screen.getByText('No verified device owner')).toBeTruthy();
  mockIdentity = { user_id: B, email: null }; await view.rerender(<Host />);
  expect(screen.getByText('No verified device owner')).toBeTruthy();
  mockIdentity = { user_id: A, email: null }; await view.rerender(<Host />);
  expect(screen.getByText(`fixture:${A}`)).toBeTruthy();
});
it('retires only old account handles/drafts without erasing installed restrictions', async () => {
  mockIdentity = { user_id: A, email: null };
  const view = await render(<Host />);
  mockScope = { id: 2, account: { user_id: B, sessionGeneration: 2 } };
  await view.rerender(<Host />);
  expect(screen.getByText('No verified device owner')).toBeTruthy();
  await act(async () => {});
  expect(mockEnd).toHaveBeenCalledWith(`fixture:${A}`, false);
  expect(mockSelectionEnd).toHaveBeenCalledWith(`fixture:${A}`, false);
  expect(mockEnd).not.toHaveBeenCalledWith(`fixture:${B}`, true);
});
it('preserves the local binding on routine same-account query updates', async () => {
  mockIdentity = { user_id: A, email: null };
  const view = await render(<Host />);
  mockIdentity = { user_id: A, email: null };
  await view.rerender(<Host />);
  expect(mockEnd).not.toHaveBeenCalled();
  expect(screen.getByText(`fixture:${A}`)).toBeTruthy();
});
it('fences same-account session replacement and retires on unmount', async () => {
  mockIdentity = { user_id: A, email: null };
  const view = await render(<Host />);
  mockScope = { id: 2, account: { user_id: A, sessionGeneration: 2 } };
  await view.rerender(<Host />);
  expect(mockEnd).toHaveBeenCalledWith(`fixture:${A}`, false);
  await view.unmount();
  expect(mockEnd).toHaveBeenCalledTimes(2);
});

it('begins iOS lifecycle only after verified identity and ends the exact lease', async () => {
  mockLifecycleEnabled = true;
  mockBeginSession.mockResolvedValue('lease-a');
  const view = await render(<Host />);
  expect(mockBeginSession).not.toHaveBeenCalled();
  mockIdentity = { user_id: A, email: null };
  await view.rerender(<Host />);
  await act(async () => {});
  expect(mockBeginSession).toHaveBeenCalledWith('fixture', A);
  await view.unmount();
  expect(mockEndSession).toHaveBeenCalledWith('lease-a');
});
it('retires a lease that resolves after its account boundary unmounts', async () => {
  mockLifecycleEnabled = true;
  mockIdentity = { user_id: A, email: null };
  let resolve!: (token: string) => void;
  mockBeginSession.mockImplementation(() => new Promise<string>(done => { resolve = done; }));
  const view = await render(<Host />);
  await view.unmount();
  await act(async () => { resolve('late-lease'); });
  expect(mockEndSession).toHaveBeenCalledWith('late-lease');
});

it('binds the scoped iOS C04 port only after the existing verified lease resolves', async () => {
  mockGlobalPortEnabled = false; mockLifecycleEnabled = true;
  mockIdentity = { user_id: A, email: null };
  mockBeginSession.mockResolvedValue('ios-lease');
  mockDevice.mockReturnValue({ owner: `fixture:${A}`, generation: 1, productPort: { interventionEndOwner: jest.fn().mockResolvedValue(undefined), selectionEndOwner: jest.fn().mockResolvedValue(undefined) } });
  await render(<Host />);
  await act(async () => {});
  expect(mockDevice).toHaveBeenCalledWith('fixture', A, 'ios-lease', 1);
  expect(screen.getByText(`fixture:${A}`)).toBeTruthy();
});
