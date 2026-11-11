import { act, render, screen } from '@testing-library/react-native';
import { focusManager } from '@tanstack/react-query';
import type { NativeOwner } from './native-owner-boundary';
import { InstalledDeviceProtection } from './installed-device-protection';

jest.mock('expo-router', () => ({ useIsFocused: () => true }));
const A = 'fixture:00000000-0000-4000-8000-000000000001';
function value(state = 'active') {
  return {
    schemaVersion: 3,
    authorization: 'authorized',
    capabilities: {
      platform: 'android',
      selectionUI: 'unavailable',
      mode: 'overlay',
      supportsUsageThreshold: false,
      supportsScheduledRestriction: true,
      supportsTemporaryAllowance: true,
      supportsAdvanceWarning: false,
      supportsUsageSummary: false,
    },
    status: {
      authorization: 'authorized',
      state,
      installedRevision: 3,
      installedReasonIds: ['q_fixture'],
    },
  };
}
function owner(read: jest.Mock) {
  return {
    owner: A,
    generation: 1,
    port: {
      interventionProtectionRead: read,
      interventionReviewAccess: jest.fn(async () => true),
    },
  } as unknown as NativeOwner;
}
afterEach(() => {
  focusManager.setFocused(true);
});
it('uses installed active native evidence rather than the legacy usage-only inactive message', async () => {
  await render(
    <InstalledDeviceProtection owner={owner(jest.fn(async () => value()))} />,
  );
  expect(await screen.findByText('App interventions active')).toBeVisible();
  expect(
    screen.queryByText('Usage access allowed. App protection is not active.'),
  ).toBeNull();
});
it('distinguishes future installed reasons from an active intervention', async () => {
  await render(
    <InstalledDeviceProtection
      owner={owner(jest.fn(async () => value('inactive')))}
    />,
  );
  expect(await screen.findByText('Protection scheduled')).toBeVisible();
  expect(screen.queryByText('App interventions active')).toBeNull();
});
it('masks status on background and suppresses a late read until foreground rechecks', async () => {
  let resolve!: (v: unknown) => void;
  const read = jest.fn(
    () =>
      new Promise((yes) => {
        resolve = yes;
      }),
  );
  await render(<InstalledDeviceProtection owner={owner(read)} />);
  await act(() => focusManager.setFocused(false));
  await act(() => resolve(value()));
  expect(screen.queryByText('App interventions active')).toBeNull();
  expect(screen.getByText('Protection status unknown')).toBeVisible();
  await act(() => focusManager.setFocused(true));
  await act(() => resolve(value()));
  expect(await screen.findByText('App interventions active')).toBeVisible();
});
