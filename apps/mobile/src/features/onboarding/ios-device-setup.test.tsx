import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { IOSDeviceSetup } from './ios-device-setup';
import type { IOSSelectionDevice } from '@/infrastructure/native/ios-selection-device';
jest.mock('expo-router', () => ({ useIsFocused: () => true }));
const mockRead = jest.fn(), mockStatus = jest.fn(), mockAuthorize = jest.fn();
let invalidate: () => void;
const device = {
  owner: 'fixture:00000000-0000-4000-8000-000000000001', generation: 1,
  readSelection: mockRead, readStatus: mockStatus, requestAuthorization: mockAuthorize,
  subscribe: (listener: () => void) => { invalidate = listener; return () => {}; },
} as unknown as IOSSelectionDevice;
beforeEach(() => {
  Object.defineProperty(AppState, 'currentState', { configurable: true, writable: true, value: 'active' });
  mockRead.mockResolvedValue({ revision: 1, selectedAppCount: 2 });
  mockStatus.mockResolvedValue({ authorization: 'denied', status: { state: 'needs_permission' } });
  mockAuthorize.mockResolvedValue(undefined);
});
it('never requests permission on mount and requires access before choosing apps', async () => {
  await render(<IOSDeviceSetup device={device} />);
  expect(await screen.findByText('2 apps saved on this device.')).toBeTruthy();
  expect(mockAuthorize).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Choose apps on this device' }).props.accessibilityState.disabled).toBe(true);
  mockStatus.mockResolvedValue({ authorization: 'authorized', status: { state: 'inactive' } });
  await fireEvent.press(screen.getByText('Review Screen Time access'));
  expect(mockAuthorize).toHaveBeenCalledTimes(1);
  expect(await screen.findByText('Screen Time access allowed.')).toBeTruthy();
});
it('rechecks native status on invalidation and displays no active-protection claim', async () => {
  mockStatus.mockResolvedValue({ authorization: 'authorized', status: { state: 'inactive' } });
  await render(<IOSDeviceSetup device={device} />);
  expect(await screen.findByText(/Saving apps does not enable protection/)).toBeTruthy();
  mockStatus.mockResolvedValue({ authorization: 'denied', status: { state: 'needs_permission' } });
  await act(async () => { invalidate(); });
  expect(await screen.findByText(/Screen Time access is off/)).toBeTruthy();
});
it('keeps an authorization request failure visible after readback', async () => {
  await render(<IOSDeviceSetup device={device} />);
  await screen.findByText('2 apps saved on this device.');
  mockAuthorize.mockRejectedValueOnce(new Error('entitlement unavailable'));
  await fireEvent.press(screen.getByText('Review Screen Time access'));
  expect(await screen.findByText(/could not be verified/)).toBeTruthy();
});
