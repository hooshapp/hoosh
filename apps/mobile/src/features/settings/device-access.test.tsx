import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { AppState, Platform } from 'react-native';
import DeviceAccess from '@/app/settings/device';
import { IOSSelectionContext } from '@/features/protection/native-owner-boundary';
import type { IOSSelectionDevice } from '@/infrastructure/native/ios-selection-device';
jest.mock('expo-router', () => ({ useIsFocused: () => true, router: { canGoBack: () => false, replace: jest.fn(), push: jest.fn() } }));
it('offers the actual owner-bound iPhone authorization action without requesting access on entry', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  AppState.currentState = 'active';
  const readStatus = jest.fn().mockResolvedValue({ authorization: 'denied', status: { state: 'needs_permission' } });
  const requestAuthorization = jest.fn().mockImplementation(async () => {
    readStatus.mockResolvedValue({ authorization: 'authorized', status: { state: 'inactive' } });
  });
  const device = { owner: 'test-owner', generation: 1, readSelection: jest.fn().mockResolvedValue({ revision: 1, selectedAppCount: 2 }),
    readStatus, requestAuthorization, subscribe: () => () => {} } as unknown as IOSSelectionDevice;
  await render(<IOSSelectionContext.Provider value={device}><DeviceAccess /></IOSSelectionContext.Provider>);
  await screen.findByText('2 apps saved on this device.');
  expect(requestAuthorization).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Choose apps on this device' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Review Screen Time access' }));
  await screen.findByText('Screen Time access allowed.');
  expect(requestAuthorization).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Choose apps on this device' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose apps on this device' }));
  expect(router.push).toHaveBeenCalledWith('/settings/apps');
  jest.restoreAllMocks();
});
