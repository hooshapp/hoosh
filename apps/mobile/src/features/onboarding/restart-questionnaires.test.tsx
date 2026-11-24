import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RestartQuestionnaires } from './restart-questionnaires';
const mockSave = jest.fn(), mockReplace = jest.fn();
let mockSettings: { data?: { settings: { revision: number } }; isError?: boolean; isPaused?: boolean } = { data: { settings: { revision: 7 } } };
const mockScope = { account: { user_id: 'test-owner' }, isCurrent: () => true };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/features/account/app-runtime-context', () => ({ useAppRuntime: () => ({ nativeNamespace: 'test-project' }) }));
jest.mock('@/features/account/identity-query', () => ({ useIdentityQuery: () => ({ data: { user_id: 'test-owner' } }) }));
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope, availability: 'ready' }) }));
jest.mock('@/features/settings/settings-query', () => ({ useSettingsQuery: () => mockSettings }));
jest.mock('./progress-storage', () => ({ setupRepository: () => ({ save: mockSave }) }));
beforeEach(() => { mockSettings = { data: { settings: { revision: 7 } } }; mockSave.mockResolvedValue(undefined); });
it('requires confirmation and replaces only the current account onboarding progress', async () => {
  await render(<RestartQuestionnaires />);
  await fireEvent.press(screen.getByText('Restart questionnaires'));
  expect(mockSave).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Restart questionnaires now'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/welcome'));
  expect(mockSave).toHaveBeenCalledWith(mockScope, { version: 1, step: 'questions', settingsBaseRevision: 7 });
});
it('cancellation leaves progress unchanged', async () => {
  await render(<RestartQuestionnaires />);
  await fireEvent.press(screen.getByText('Restart questionnaires'));
  await fireEvent.press(screen.getByText('Keep my answers'));
  expect(mockSave).not.toHaveBeenCalled();
});
it('does not navigate if progress cannot be saved', async () => {
  mockSave.mockRejectedValueOnce(new Error('Storage unavailable'));
  await render(<RestartQuestionnaires />);
  await fireEvent.press(screen.getByText('Restart questionnaires'));
  await fireEvent.press(screen.getByText('Restart questionnaires now'));
  await screen.findByText(/Questionnaires could not be restarted/);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('allows the signed-in owner to restart local questions when the API is unavailable', async () => {
  mockSettings = { isError: true };
  await render(<RestartQuestionnaires />);
  await fireEvent.press(screen.getByText('Restart questionnaires'));
  await fireEvent.press(screen.getByText('Restart questionnaires now'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/welcome'));
  expect(mockSave).toHaveBeenCalledWith(mockScope, { version: 1, step: 'questions' });
});
