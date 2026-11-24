import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button as MockNativeButton } from 'react-native';
import { SetupScreen } from './setup-screen';
const mockRead = jest.fn(), mockSave = jest.fn(), mockReplace = jest.fn();
const mockRepo = { read: mockRead, save: mockSave };
const mockScope = { id: 1, account: { user_id: 'fixture' }, isCurrent: () => true };
const mockSettings = { settings: { revision: 1, activities: { selected_activity_ids: ['reading'], custom_text: null }, plan_draft: null } };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/features/protection/native-owner-boundary', () => ({ useNativeOwner: () => null, useIOSSelectionDevice: () => ({ owner: 'fixture' }) }));
jest.mock('@/features/account/app-runtime-context', () => ({ useAppRuntime: () => ({ nativeNamespace: 'fixture' }) }));
jest.mock('@/features/account/identity-query', () => ({ useIdentityQuery: () => ({ data: { user_id: 'fixture' } }) }));
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope, availability: 'ready' }) }));
jest.mock('@/features/settings/settings-query', () => ({ useSettingsQuery: () => ({ data: mockSettings }) }));
jest.mock('./progress-storage', () => ({ setupRepository: () => mockRepo }));
jest.mock('./setup-draft', () => ({ SetupDraft: ({ reviewActions }: { reviewActions: import('react').ReactNode }) => reviewActions }));
jest.mock('./setup-settings-review', () => ({ SetupSettingsReview: ({ record }: { record: (p: object) => void }) => {
  return <MockNativeButton title="Save test account preferences" onPress={() => record({ version: 1, step: 'permission', questionsCompleted: true })} />;
} }));
beforeEach(() => mockSave.mockResolvedValue(undefined));
it('shows congratulations for an existing iPhone questionnaire permission checkpoint without repeating permission UI', async () => {
  mockRead.mockResolvedValue({ status: 'found', progress: { version: 1, step: 'permission', questionsCompleted: true, questions: { hobbies: ['Reading'] } } });
  await render(<SetupScreen />);
  await screen.findByRole('button', { name: 'Let’s start →' });
  expect(screen.queryByText('Preferences reviewed')).toBeNull();
  expect(screen.queryByText('Choose apps on this device')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Let’s start →' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  expect(mockSave).toHaveBeenCalledWith(mockScope, expect.objectContaining({ step: 'complete' }), undefined);
});
it('saving a reviewed iPhone questionnaire completes setup without routing back into permission review', async () => {
  mockRead.mockResolvedValue({ status: 'found', progress: { version: 1, step: 'review', questionsCompleted: true } });
  await render(<SetupScreen />);
  await fireEvent.press(await screen.findByRole('button', { name: /save test account preferences/i }));
  await screen.findByRole('button', { name: 'Let’s start →' });
  expect(mockSave).toHaveBeenCalledWith(mockScope, expect.objectContaining({ step: 'complete' }), undefined);
  expect(screen.queryByText('Preferences reviewed')).toBeNull();
});
