import type {
  ProtectionCapabilities,
  NativeProtectionStatus,
  ProtectionIntegration,
  ProtectionService,
} from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Text, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { DeviceProtection, DeviceProtectionView } from './device-protection';

let mockIntegration: ProtectionIntegration;
jest.mock('@/infrastructure/native/protection-integration', () => ({
  get deviceProtectionIntegration() {
    return mockIntegration;
  },
}));
function setup() {
  let authorization: 'authorized' | 'denied' = 'denied';
  const unsupported = jest.fn(async () => {
    throw new Error('Unsupported');
  });
  const service: ProtectionService = {
    getCapabilities: jest.fn(
      async (): Promise<ProtectionCapabilities> => ({
        platform: 'android',
        mode: 'unsupported',
        selectionUI: 'unavailable',
        supportsUsageThreshold: false,
        supportsScheduledRestriction: false,
        supportsTemporaryAllowance: false,
        supportsAdvanceWarning: false,
        supportsUsageSummary: false,
        notes: [],
      }),
    ),
    getAuthorization: jest.fn(async () => authorization),
    getStatus: jest.fn(
      async (): Promise<NativeProtectionStatus> => ({
        authorization,
        state: authorization === 'denied' ? 'needs_permission' : 'inactive',
        installedRevision: null,
        installedReasonIds: [],
      }),
    ),
    requestAuthorization: jest.fn(async () => authorization),
    pickApps: unsupported,
    getSelectedApps: unsupported,
    applyRules: unsupported,
    cancelReason: unsupported,
    requestTemporaryAllowance: unsupported,
    drainEvents: unsupported,
    acknowledgeEvents: unsupported,
  };
  const integration: ProtectionIntegration = {
    availability: 'connected',
    platform: 'android',
    service,
  };
  return {
    service,
    integration,
    set(value: typeof authorization) {
      authorization = value;
    },
    unsupported,
  };
}
const denied = 'Usage access is not allowed. Granting access does not activate protection.';
const allowed = 'Usage access allowed. App protection is not active.';
const press = async (label: string) => {
  await fireEvent.press(screen.getByRole('button', { name: label }));
};

test('connected read-only adapter never claims active protection, even with allowed usage access', async () => {
  const app = setup();
  app.set('authorized');
  await render(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText(allowed);
  expect(
    screen.getByText(
      'Protection is not implemented in this build. Usage access alone does not activate protection.',
    ),
  ).toBeVisible();
  expect(screen.queryByText('Protection active')).toBeNull();
  expect(app.unsupported).not.toHaveBeenCalled();
});
test('foreground/visibility return re-reads grant and external revocation; hidden evidence is immediately unknown', async () => {
  const app = setup();
  const view = await render(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText(denied);
  await view.rerender(<DeviceProtectionView integration={app.integration} visible={false} />);
  expect(screen.queryByText(denied)).toBeNull();
  expect(screen.getByRole('button', { name: 'Review usage access' })).toBeDisabled();
  app.set('authorized');
  await view.rerender(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText(allowed);
  await view.rerender(<DeviceProtectionView integration={app.integration} visible={false} />);
  app.set('denied');
  await view.rerender(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText(denied);
  expect(app.service.getAuthorization).toHaveBeenCalledTimes(3);
  expect(app.service.requestAuthorization).not.toHaveBeenCalled();
});
test('settings action stays busy, rejects duplicate taps, handles failure and deliberately retries', async () => {
  const app = setup();
  let reject!: (error: unknown) => void;
  jest.mocked(app.service.requestAuthorization).mockImplementationOnce(
    () =>
      new Promise((_yes, no) => {
        reject = no;
      }),
  );
  await render(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText(denied);
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Review usage access' }));
    fireEvent.press(screen.getByRole('button', { name: 'Review usage access' }));
  });
  expect(app.service.requestAuthorization).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Opening usage access…' })).toBeBusy();
  await act(async () => reject(new Error('Private settings exception')));
  await screen.findByText('Usage access settings could not be opened. Try again.');
  expect(screen.queryByText('Private settings exception')).toBeNull();
  await press('Review usage access');
  await waitFor(() => expect(app.service.requestAuthorization).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(screen.queryByText('Usage access settings could not be opened. Try again.')).toBeNull(),
  );
  expect(screen.getByText(denied)).toBeVisible();
});
test('retry reads native evidence without opening permission settings and no API dependency', async () => {
  const app = setup();
  jest.mocked(app.service.getStatus).mockRejectedValueOnce(new Error('Read failed'));
  await render(<DeviceProtectionView integration={app.integration} visible />);
  await screen.findByText('Protection status unknown');
  await press('Check again');
  await screen.findByText(denied);
  expect(app.service.requestAuthorization).not.toHaveBeenCalled();
});
test('late permission completion cannot refresh a replacement integration or an unmounted view', async () => {
  const first = setup();
  const next = setup();
  let resolve!: (value: 'denied') => void;
  jest.mocked(first.service.requestAuthorization).mockImplementationOnce(
    () =>
      new Promise((yes) => {
        resolve = yes;
      }),
  );
  const view = await render(<DeviceProtectionView integration={first.integration} visible />);
  await screen.findByText(denied);
  await press('Review usage access');
  await view.rerender(<DeviceProtectionView integration={next.integration} visible />);
  await screen.findByText(denied);
  await act(async () => resolve('denied'));
  expect(next.service.getStatus).toHaveBeenCalledTimes(1);
  let finish!: (value: 'denied') => void;
  jest.mocked(next.service.requestAuthorization).mockImplementationOnce(
    () =>
      new Promise((yes) => {
        finish = yes;
      }),
  );
  await press('Review usage access');
  await view.unmount();
  await act(async () => finish('denied'));
  expect(next.service.getStatus).toHaveBeenCalledTimes(1);
});
test('absent registry preserves fallback and opens no permission flow', async () => {
  mockIntegration = {
    availability: 'not_connected',
    platform: 'android',
    reason: 'adapter_not_registered',
  };
  await render(<DeviceProtection />);
  expect(screen.getByRole('header', { name: 'Protection unavailable' })).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Review usage access' })).toBeNull();
});
test('real Router focus plus AppState foreground govern reads and clean listeners on unmount', async () => {
  const app = setup();
  mockIntegration = app.integration;
  const original = AppState.currentState;
  Object.defineProperty(AppState, 'currentState', {
    configurable: true,
    writable: true,
    value: 'active',
  });
  const listeners = new Set<(state: AppStateStatus) => void>();
  const remove = jest.fn();
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    const callback = listener as (state: AppStateStatus) => void;
    listeners.add(callback);
    return {
      remove: () => {
        listeners.delete(callback);
        remove();
      },
    };
  });
  try {
    const view = await renderRouter({
      index: () => <DeviceProtection />,
      other: () => <Text>Other route</Text>,
    });
    await screen.findByText(denied);
    await act(async () => {
      AppState.currentState = 'background';
      for (const fn of listeners) fn('background');
    });
    expect(screen.queryByText(denied)).toBeNull();
    app.set('authorized');
    await act(async () => {
      AppState.currentState = 'active';
      for (const fn of listeners) fn('active');
    });
    await screen.findByText(allowed);
    await act(async () => router.push('./other'));
    await screen.findByText('Other route');
    app.set('denied');
    await act(async () => router.back());
    await screen.findByText(denied);
    expect(app.service.requestAuthorization).not.toHaveBeenCalled();
    await view.unmount();
    expect(remove).toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  } finally {
    spy.mockRestore();
    Object.defineProperty(AppState, 'currentState', {
      configurable: true,
      writable: true,
      value: original,
    });
  }
});
