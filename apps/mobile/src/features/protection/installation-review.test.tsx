import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert, AppState, Platform, Text } from 'react-native';
import { InstallationReviewPanel } from './installation-review';
const mockRead = jest.fn(), mockClaim = jest.fn();
let mockSession: { read: typeof mockRead; claim: typeof mockClaim } | null;
jest.mock('./native-owner-boundary', () => ({ useNativeInstallation: () => mockSession }));
beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  Object.defineProperty(AppState, 'currentState', { configurable: true, writable: true, value: 'active' });
  mockSession = { read: mockRead, claim: mockClaim };
  mockRead.mockResolvedValue({ status: 'other_owner', revision: '5' });
  mockClaim.mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});
afterEach(() => { jest.restoreAllMocks(); });
it('shows neutral review and never stops protection before explicit confirmation', async () => {
  await render(<InstallationReviewPanel />);
  const button = await screen.findByText('Review existing setup');
  await fireEvent.press(button);
  expect(mockClaim).not.toHaveBeenCalled();
  const buttons = jest.mocked(Alert.alert).mock.calls[0][2]!;
  expect(buttons[0].style).toBe('cancel');
  mockRead.mockResolvedValue({ status: 'owned', revision: '7' });
  await act(async () => { buttons[1].onPress?.(); });
  expect(mockClaim).toHaveBeenCalledWith('5');
  expect(await screen.findByText(/Device setup is assigned/)).toBeTruthy();
});
it('refreshes the pending revision after failed Stop and offers explicit retry', async () => {
  await render(<InstallationReviewPanel />);
  await fireEvent.press(await screen.findByText('Review existing setup'));
  mockClaim.mockRejectedValueOnce(new Error('Stop failed'));
  mockRead.mockResolvedValue({ status: 'claim_pending', revision: '6' });
  await act(async () => { jest.mocked(Alert.alert).mock.calls[0][2]![1].onPress?.(); });
  expect(await screen.findByText(/Existing data has been kept/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Review existing setup'));
  await act(async () => { jest.mocked(Alert.alert).mock.calls[1][2]![1].onPress?.(); });
  expect(mockClaim).toHaveBeenLastCalledWith('6');
});
it('does not offer device takeover without a verified native session', async () => {
  mockSession = null;
  await render(<InstallationReviewPanel />);
  expect(mockRead).not.toHaveBeenCalled();
  expect(screen.queryByText('Review existing setup')).toBeNull();
});

it('offers explicit review for an uncertain installation without acknowledging it', async () => {
  mockRead.mockResolvedValue({ status: 'installation_pending', revision: '8' });
  await render(<InstallationReviewPanel />);
  expect(await screen.findByText('Review existing setup')).toBeTruthy();
  expect(mockClaim).not.toHaveBeenCalled();
});

it('mounts access controls only after an explicit claim and owned readback', async () => {
  const mounted = jest.fn();
  function Access() { mounted(); return <Text>Permission controls</Text>; }
  await render(<InstallationReviewPanel><Access /></InstallationReviewPanel>);
  await screen.findByText('Review existing setup');
  expect(mounted).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Review existing setup'));
  expect(mounted).not.toHaveBeenCalled();
  mockRead.mockResolvedValue({ status: 'owned', revision: '7' });
  await act(async () => { jest.mocked(Alert.alert).mock.calls[0][2]![1].onPress?.(); });
  await screen.findByText('Permission controls');
  expect(mockClaim).toHaveBeenCalledWith('5');
});
