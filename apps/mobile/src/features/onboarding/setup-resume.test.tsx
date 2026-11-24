import { render, waitFor } from '@testing-library/react-native';
import { SetupResume } from './setup-resume';
const mockReplace = jest.fn(), mockRead = jest.fn();
const mockScope = { account: { user_id: 'fixture-user' }, isCurrent: () => true };
let mockSettings: object | null | undefined;
jest.mock('expo-router', () => ({ usePathname: () => '/', useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/features/account/app-runtime-context', () => ({ useAppRuntime: () => ({ nativeNamespace: 'fixture' }) }));
jest.mock('@/features/account/identity-query', () => ({ useIdentityQuery: () => ({ data: { user_id: 'fixture-user' } }) }));
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope }) }));
jest.mock('@/features/settings/settings-query', () => ({ useSettingsQuery: () => ({ data: mockSettings === undefined ? undefined : { settings: mockSettings } }) }));
jest.mock('./progress-storage', () => ({ setupRepository: () => ({ read: mockRead }) }));
beforeEach(() => { mockSettings = null; mockRead.mockResolvedValue({ status: 'not_started' }); });
it('starts the questionnaires for a verified account without settings or setup progress', async () => {
  await render(<SetupResume />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/welcome'));
});
it('does not re-onboard an established account or infer missing settings during loading', async () => {
  mockSettings = { revision: 1 };
  await render(<SetupResume />);
  await waitFor(() => expect(mockRead).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
});
it('keeps a completed setup on Home', async () => {
  mockRead.mockResolvedValue({ status: 'found', progress: { step: 'complete' } });
  await render(<SetupResume />);
  await waitFor(() => expect(mockRead).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
});
it('waits for a real settings response before deciding a user is new', async () => {
  mockSettings = undefined;
  await render(<SetupResume />);
  expect(mockRead).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});
