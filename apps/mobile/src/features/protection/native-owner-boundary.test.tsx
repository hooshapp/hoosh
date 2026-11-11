import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppRuntimeContext } from '@/features/account/app-runtime-context';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { NativeOwnerBoundary, useNativeOwner } from './native-owner-boundary';
const A = '00000000-0000-4000-8000-000000000001', B = '00000000-0000-4000-8000-000000000002';
let mockIdentity: { user_id: string; email: null } | undefined;
let mockScope = { id: 1, account: { user_id: A, sessionGeneration: 1 } };
const mockEnd = jest.fn(async (..._args: unknown[]) => undefined), mockSelectionEnd = jest.fn(async (..._args: unknown[]) => undefined);
jest.mock('@/infrastructure/native/product-ports', () => ({ productNativePort: {
  interventionEndOwner: (...args: unknown[]) => mockEnd(...args),
  selectionEndOwner: (...args: unknown[]) => mockSelectionEnd(...args),
} }));
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope }) }));
jest.mock('@/features/account/identity-query', () => ({ useIdentityQuery: () => ({ data: mockIdentity }) }));
function Consumer() { const binding = useNativeOwner(); return <Text>{binding?.owner ?? 'No verified device owner'}</Text>; }
function Host() {
  return <AppRuntimeContext.Provider value={{ nativeNamespace: 'fixture' } as AppRuntime}><NativeOwnerBoundary><Consumer /></NativeOwnerBoundary></AppRuntimeContext.Provider>;
}
beforeEach(() => { mockIdentity = undefined; mockScope = { id: 1, account: { user_id: A, sessionGeneration: 1 } }; });
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
