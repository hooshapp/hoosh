import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import { QuestionnairePermission } from './questionnaire-permission';
const draft = { draftId: '11111111-1111-4111-8111-111111111111', groupId: 'global', baseRevision: 0, draftVersion: 0, selectedAppCount: 0, savedAppCount: 0, dirty: false };
const mockReadUsage = jest.fn(), mockRequest = jest.fn(), mockPick = jest.fn(), mockCommit = jest.fn(), mockReadSelection = jest.fn();
const mockOwner = { owner: 'fixture', port: { selectionBegin: jest.fn(async () => draft), selectionPick: mockPick, selectionCommit: mockCommit, selectionRead: mockReadSelection, selectionRelease: jest.fn(async () => undefined) } };
const mockIntegration = { availability: 'connected', service: { getAuthorization: mockReadUsage, requestAuthorization: mockRequest } };
jest.mock('@/features/protection/native-owner-boundary', () => ({ useIOSSelectionDevice: () => null, useNativeInstallation: () => null, useNativeOwner: () => mockOwner }));
jest.mock('@/infrastructure/native/protection-integration', () => ({ get deviceProtectionIntegration() { return mockIntegration; } }));
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'android'); AppState.currentState = 'active';
  mockReadUsage.mockResolvedValue('authorized');
  mockReadSelection.mockResolvedValue({ owner: 'fixture', revision: 0, selectedAppCount: 0 });
  mockPick.mockResolvedValue({ ...draft, draftVersion: 1, selectedAppCount: 2, dirty: true });
  mockCommit.mockImplementation(async () => { mockReadSelection.mockResolvedValue({ owner: 'fixture', revision: 1, selectedAppCount: 2 }); return { ...draft, baseRevision: 1, draftVersion: 1, selectedAppCount: 2, savedAppCount: 2 }; });
});
afterEach(() => jest.restoreAllMocks());
it('uses Android installed-app transactions directly in the questionnaire without re-requesting approved access', async () => {
  const next = jest.fn();
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={next} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  await screen.findByText('2 apps selected to target on this device.');
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(next).toHaveBeenCalledWith(false, 1, 2);
  expect(mockRequest).not.toHaveBeenCalled();
  expect(mockCommit).toHaveBeenCalledTimes(1);
});
it('reads back Android permission after system settings return instead of assuming it was granted', async () => {
  const subscription = jest.spyOn(AppState, 'addEventListener');
  mockReadUsage.mockResolvedValue('denied'); mockRequest.mockResolvedValue(undefined);
  const next = jest.fn();
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={next} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  expect(next).not.toHaveBeenCalled(); expect(mockPick).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  mockReadUsage.mockResolvedValue('authorized');
  await act(async () => subscription.mock.calls.find(([event]) => event === 'change')?.[1]('active'));
  await screen.findByRole('button', { name: 'Choose apps to target' });
  expect(mockCommit).not.toHaveBeenCalled();

});
it('does not continue or commit when the Android picker is canceled', async () => {
  mockPick.mockRejectedValueOnce({ code: 'ERR_SELECTION_CANCELLED' });
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  expect(mockCommit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
});
