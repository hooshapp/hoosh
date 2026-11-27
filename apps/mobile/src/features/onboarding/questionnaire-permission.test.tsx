import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, AppState, Platform } from 'react-native';
import { QuestionnairePermission } from './questionnaire-permission';
const mockRequest = jest.fn(), mockRead = jest.fn(), mockClaim = jest.fn();
const mockPick = jest.fn(), mockCommit = jest.fn();
const draft = { draftId: '11111111-1111-4111-8111-111111111111', groupId: 'global', baseRevision: 2, draftVersion: 0, selectedAppCount: 1, savedAppCount: 1, dirty: false };
const mockSelection = { selectionBegin: jest.fn(async () => draft), selectionPick: mockPick, selectionCommit: mockCommit, selectionRelease: jest.fn(async () => undefined) };
const mockDevice = { owner: 'test-owner', selection: mockSelection, readStatus: mockRead, readSelection: async () => ({ revision: 3, selectedAppCount: 2 }), requestAuthorization: mockRequest };
const mockInstallation = { read: jest.fn(), claim: mockClaim };
jest.mock('@/features/protection/native-owner-boundary', () => ({ useNativeOwner: () => null, useIOSSelectionDevice: () => mockDevice, useNativeInstallation: () => mockInstallation }));
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios'); AppState.currentState = 'active';
  mockPick.mockResolvedValue({ ...draft, draftVersion: 1, selectedAppCount: 2, dirty: true });
  mockCommit.mockResolvedValue({ ...draft, baseRevision: 3, draftVersion: 1, selectedAppCount: 2, savedAppCount: 2 });
  mockInstallation.read.mockResolvedValue({ status: 'owned', revision: '3' });
  mockRead.mockResolvedValue({ authorization: 'denied' }); mockRequest.mockResolvedValue(undefined); mockClaim.mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());
it('requests Family Controls in place only on explicit tap, then continues with native readback', async () => {
  const next = jest.fn();
  await render(<QuestionnairePermission busy={false} onContinue={next} />);
  const button = await screen.findByRole('button', { name: 'Allow Screen Time access' });
  expect(mockRequest).not.toHaveBeenCalled();
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  await fireEvent.press(button);
  await screen.findByText('Access allowed. Choose the apps you want Hoosh to target next.');
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Allow Screen Time access' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Continue to my plan' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose apps to target' }));
  await screen.findByText('2 apps selected to target on this device.');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue to my plan' }));
  expect(next).toHaveBeenCalledWith(false, 3, 2);
});
it('does not request again when access is already allowed', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  await render(<QuestionnairePermission busy={false} onContinue={jest.fn()} />);
  await screen.findByRole('button', { name: 'Continue to my plan' });
  expect(mockRequest).not.toHaveBeenCalled();
});
it('reviews retained setup in place and requires confirmation before claiming it', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockInstallation.read.mockResolvedValue({ status: 'other_owner', revision: '3' });
  await render(<QuestionnairePermission busy={false} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Review existing setup' }));
  expect(mockRequest).not.toHaveBeenCalled(); expect(mockClaim).not.toHaveBeenCalled();
  mockInstallation.read.mockResolvedValue({ status: 'owned', revision: '4' });
  await act(async () => jest.mocked(Alert.alert).mock.calls[0][2]![1].onPress?.());
  expect(mockClaim).toHaveBeenCalledWith('3');
  await screen.findByRole('button', { name: 'Allow Screen Time access' });
  expect(mockRequest).not.toHaveBeenCalled();
});
it('allows deferring denied permission without reporting authorization', async () => {
  const next = jest.fn();
  await render(<QuestionnairePermission busy={false} onContinue={next} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  expect(next).toHaveBeenCalledWith(true); expect(mockRequest).not.toHaveBeenCalled();
});

it('keeps continuation disabled after canceling Apple’s app picker', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  mockPick.mockRejectedValueOnce({ code: 'ERR_SELECTION_CANCELLED' });
  const next = jest.fn();
  await render(<QuestionnairePermission busy={false} onContinue={next} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  expect(mockCommit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Continue to my plan' })).toBeDisabled();
  expect(next).not.toHaveBeenCalled();
});
it('does not treat an empty native choice as targeted apps', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  mockPick.mockResolvedValueOnce({ ...draft, draftVersion: 1, selectedAppCount: 0, dirty: true });
  await render(<QuestionnairePermission busy={false} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  await screen.findByRole('alert');
  expect(mockCommit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Continue to my plan' })).toBeDisabled();
});

it('keeps continuation disabled when saving targets cannot be confirmed', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  mockCommit.mockRejectedValueOnce(new Error('Unknown save outcome'));
  const next = jest.fn();
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={next} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull();
  expect(next).not.toHaveBeenCalled();
});
it('reviews saved targets on the later permission page without requiring another picker visit', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  const next = jest.fn();
  await render(<QuestionnairePermission reviewSavedSelection busy={false} onContinue={next} />);
  await screen.findByText('Screen Time access and your target apps are ready.');
  expect(screen.getByRole('button', { name: 'Continue to my plan' })).toBeEnabled();
  expect(mockPick).not.toHaveBeenCalled();
});

it('new signup uses one target-selection action without a setup-review page or card', async () => {
  const alert = jest.spyOn(Alert, 'alert');
  mockInstallation.read.mockResolvedValue({ status: 'other_owner', revision: 'old-revision' });
  mockClaim.mockImplementationOnce(async () => {
    mockInstallation.read.mockResolvedValue({ status: 'owned', revision: 'new-revision' });
  });
  mockRequest.mockImplementationOnce(async () => { mockRead.mockResolvedValue({ authorization: 'authorized' }); });
  const next = jest.fn();
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={next} />);
  const pick = await screen.findByRole('button', { name: 'Choose apps to target' });
  expect(screen.queryByText('See app activity to help you stay on track')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Review existing setup' })).toBeNull();
  expect(mockClaim).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  await fireEvent.press(pick);
  await screen.findByText('2 apps selected to target on this device.');
  expect(mockClaim).toHaveBeenCalledWith('old-revision');
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(alert).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(next).toHaveBeenCalledWith(false, 3, 2);
});
it('new signup cannot proceed if native authorization remains denied', async () => {
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(mockPick).not.toHaveBeenCalled();
  expect(mockCommit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Not now' })).toBeNull();
});
it('failed device assignment does not open the picker or grant continuation', async () => {
  mockInstallation.read.mockResolvedValue({ status: 'other_owner', revision: '3' });
  mockClaim.mockRejectedValueOnce(new Error('device changed'));
  await render(<QuestionnairePermission selectionQuestion busy={false} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  await screen.findByRole('alert');
  expect(mockRequest).not.toHaveBeenCalled();
  expect(mockPick).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
});

it('lets Back leave a pending picker and ignores a late selection result', async () => {
  mockRead.mockResolvedValue({ authorization: 'authorized' });
  let finish!: (value: typeof draft) => void;
  mockPick.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const back = jest.fn();
  await render(<QuestionnairePermission selectionQuestion busy={false} onBack={back} onContinue={jest.fn()} />);
  await fireEvent.press(await screen.findByRole('button', { name: 'Choose apps to target' }));
  expect(mockPick).toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(back).toHaveBeenCalledTimes(1);
  await act(async () => finish({ ...draft, draftVersion: 1, selectedAppCount: 2, dirty: true }));
  expect(mockCommit).not.toHaveBeenCalled();
});
