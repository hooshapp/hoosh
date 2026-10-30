import type { ProtectionService } from '@disconnect/contracts';
import { StrictMode } from 'react';
import { act, render, screen, userEvent } from '@testing-library/react-native';
import { AccessibilityInfo, Platform } from 'react-native';

import { capabilities, connected, status } from './__tests__/fixtures';
import { ProtectionStatus } from './protection-status';
import { mapProtectionStatus, type ProtectionRead } from './status-model';
import { PROTECTION_READ_TIMEOUT_MS, useProtectionStatus } from './use-protection-status';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function service(): ProtectionService {
  return {
    getCapabilities: jest.fn(async () => capabilities()),
    getAuthorization: jest.fn(async () => 'authorized' as const),
    getStatus: jest.fn(async () => status()),
    requestAuthorization: jest.fn(),
    pickApps: jest.fn(),
    getSelectedApps: jest.fn(),
    applyRules: jest.fn(),
    requestTemporaryAllowance: jest.fn(),
    cancelReason: jest.fn(),
    drainEvents: jest.fn(),
    acknowledgeEvents: jest.fn(),
  };
}
function Harness({
  integration,
  revision = 4,
  visible = true,
}: {
  integration: ReturnType<typeof connected>;
  revision?: number | null;
  visible?: boolean;
}) {
  const result = useProtectionStatus(integration, revision, visible);
  return (
    <ProtectionStatus
      model={result.model}
      onRetry={integration.availability === 'connected' ? result.refresh : undefined}
    />
  );
}
const read = (): Extract<ProtectionRead, { phase: 'ready' }> => ({
  phase: 'ready',
  capabilities: capabilities(),
  authorization: 'authorized',
  status: status(),
});

describe('protection summary presentation', () => {
  it('announces current status changes once on iOS without duplicating the checking notice or moving focus', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibilityWithOptions');
    const focus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent');
    const checking = {
      kind: 'checking',
      title: 'Checking protection',
      message: 'Reading the current device status…',
      tone: 'neutral',
    } as const;
    const view = await render(<ProtectionStatus model={checking} />);
    await view.rerender(<ProtectionStatus model={{ ...checking }} />);
    expect(announce).toHaveBeenCalledTimes(Platform.OS === 'ios' ? 1 : 0);
    await view.rerender(
      <ProtectionStatus
        model={{
          kind: 'permission',
          title: 'Permission needed',
          message: 'Review device access.',
          tone: 'attention',
        }}
      />,
    );
    if (Platform.OS === 'ios')
      expect(announce).toHaveBeenLastCalledWith('Permission needed. Review device access.', {
        queue: true,
      });
    expect(focus).not.toHaveBeenCalled();
    announce.mockRestore();
    focus.mockRestore();
  });
  it('never renders a working permission/setup/retry action without the matching callback', async () => {
    const native = service();
    const integration = connected(native);
    const model = mapProtectionStatus(integration, 4, { ...read(), authorization: 'denied' });
    await render(<ProtectionStatus model={model} />);
    expect(screen.getByText('Permission needed')).toBeOnTheScreen();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(native.requestAuthorization).not.toHaveBeenCalled();
  });
  it.each([
    ['permissions', 'Review permissions'],
    ['retry', 'Check again'],
    ['setup', 'Review protection setup'],
  ] as const)('delegates %s exactly to the supplied owner callback', async (action, label) => {
    const handler = jest.fn();
    await render(
      <ProtectionStatus
        model={{
          kind: 'unknown',
          title: 'Status example',
          message: 'Example status.',
          tone: 'neutral',
          action,
        }}
        onReviewPermissions={action === 'permissions' ? handler : undefined}
        onRetry={action === 'retry' ? handler : undefined}
        onSetup={action === 'setup' ? handler : undefined}
      />,
    );
    expect(handler).not.toHaveBeenCalled();
    await userEvent.press(screen.getByRole('button', { name: label }));
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it('locks an owner action for its controlled pending state', async () => {
    const handler = jest.fn();
    await render(
      <ProtectionStatus
        model={{
          kind: 'permission',
          title: 'Permission needed',
          message: 'Review access.',
          tone: 'attention',
          action: 'permissions',
        }}
        onReviewPermissions={handler}
        busy
      />,
    );
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    await userEvent.press(screen.getByRole('button', { name: 'Working…' }));
    expect(handler).not.toHaveBeenCalled();
  });
  it('keeps notification-only reminders distinct from blocking and hides native diagnostics', async () => {
    const evidence = read();
    evidence.capabilities.mode = 'notification_only';
    const model = mapProtectionStatus(connected(service()), 4, evidence);
    await render(<ProtectionStatus model={model} />);
    expect(screen.getByText('Reminders active')).toBeOnTheScreen();
    expect(
      screen.getByText('Reminders are active for this plan. App access is not blocked.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Protection active')).toBeNull();
    expect(screen.queryByText('RN08_TEST_DEVICE_ONLY')).toBeNull();
  });
});
describe('bounded read-only protection consumer', () => {
  it('reads native evidence and never requests permission, installs, cancels or drains events', async () => {
    const native = service();
    await render(<Harness integration={connected(native)} />);
    expect(await screen.findByText('Protection active')).toBeOnTheScreen();
    expect(native.getCapabilities).toHaveBeenCalledTimes(1);
    expect(native.getAuthorization).toHaveBeenCalledTimes(1);
    expect(native.getStatus).toHaveBeenCalledTimes(1);
    for (const action of [
      'requestAuthorization',
      'pickApps',
      'getSelectedApps',
      'applyRules',
      'requestTemporaryAllowance',
      'cancelReason',
      'drainEvents',
      'acknowledgeEvents',
    ] as const)
      expect(native[action]).not.toHaveBeenCalled();
  });
  it('handles development strict remount effects without duplicate native dispatch', async () => {
    const native = service();
    await render(
      <StrictMode>
        <Harness integration={connected(native)} />
      </StrictMode>,
    );
    await screen.findByText('Protection active');
    expect(native.getStatus).toHaveBeenCalledTimes(1);
  });
  it('does not read or invent protection for an absent adapter', async () => {
    await render(
      <Harness
        integration={{
          availability: 'not_connected',
          platform: 'android',
          reason: 'adapter_not_registered',
        }}
      />,
    );
    expect(screen.getByText('Protection status unavailable')).toBeOnTheScreen();
    expect(screen.queryByText('Protection active')).toBeNull();
  });
  it('immediately drops an earlier active claim when the integration is replaced and ignores late old reads', async () => {
    const old = service();
    const gate = deferred<ReturnType<typeof status>>();
    jest.mocked(old.getStatus).mockReturnValue(gate.promise);
    const view = await render(<Harness integration={connected(old)} />);
    const next = service();
    jest.mocked(next.getAuthorization).mockResolvedValue('revoked');
    await view.rerender(<Harness integration={connected(next)} />);
    await screen.findByText('Permission needed');
    await act(() => gate.resolve(status()));
    expect(screen.queryByText('Protection active')).toBeNull();
  });
  it('invalidates active evidence across visibility changes and performs a fresh read on return', async () => {
    const native = service();
    const integration = connected(native);
    const view = await render(<Harness integration={integration} />);
    await screen.findByText('Protection active');
    await view.rerender(<Harness integration={integration} visible={false} />);
    expect(screen.getByText('Protection status unknown')).toBeOnTheScreen();
    expect(native.getStatus).toHaveBeenCalledTimes(1);
    const gate = deferred<ReturnType<typeof status>>();
    jest.mocked(native.getStatus).mockReturnValue(gate.promise);
    await view.rerender(<Harness integration={integration} visible />);
    expect(screen.getByText('Checking protection')).toBeOnTheScreen();
    expect(screen.queryByText('Protection active')).toBeNull();
    await act(() => gate.resolve(status({ authorization: 'revoked', state: 'needs_permission' })));
    await screen.findByText('Permission needed');
    expect(native.getStatus).toHaveBeenCalledTimes(2);
  });
  it('does not accept the old revision as confirmation of a newly saved desired plan', async () => {
    const native = service();
    const integration = connected(native);
    const view = await render(<Harness integration={integration} />);
    await screen.findByText('Protection active');
    await view.rerender(<Harness integration={integration} revision={5} />);
    expect(await screen.findByText('Plan update not confirmed')).toBeOnTheScreen();
    expect(screen.queryByText('Protection active')).toBeNull();
  });
  it('supports a deliberate retry after failure without displaying raw native error content', async () => {
    const native = service();
    jest.mocked(native.getStatus).mockRejectedValueOnce(new Error('RAW_NATIVE_SECRET'));
    await render(<Harness integration={connected(native)} />);
    await screen.findByText('Protection status unknown');
    expect(screen.queryByText('RAW_NATIVE_SECRET')).toBeNull();
    await userEvent.press(screen.getByRole('button', { name: 'Check again' }));
    await screen.findByText('Protection active');
    expect(native.getStatus).toHaveBeenCalledTimes(2);
  });
  it('cleans up pending reads on unmount and ignores later success/rejection', async () => {
    const native = service();
    const gate = deferred<ReturnType<typeof status>>();
    jest.mocked(native.getStatus).mockReturnValue(gate.promise);
    const view = await render(<Harness integration={connected(native)} />);
    await view.unmount();
    await act(() => gate.reject(new Error('late')));
    expect(native.cancelReason).not.toHaveBeenCalled();
  });
  it('bounds a never-resolving bridge read and rejects late active results', async () => {
    jest.useFakeTimers();
    const timeouts = jest.spyOn(globalThis, 'setTimeout');
    const cleared = jest.spyOn(globalThis, 'clearTimeout');
    try {
      const native = service();
      const gate = deferred<ReturnType<typeof status>>();
      jest.mocked(native.getStatus).mockReturnValue(gate.promise);
      const view = await render(<Harness integration={connected(native)} />);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(PROTECTION_READ_TIMEOUT_MS);
      });
      expect(screen.getByText('Protection status unknown')).toBeOnTheScreen();
      await act(() => gate.resolve(status()));
      expect(screen.queryByText('Protection active')).toBeNull();
      const index = timeouts.mock.calls.findIndex((call) => call[1] === PROTECTION_READ_TIMEOUT_MS);
      expect(index).toBeGreaterThanOrEqual(0);
      const budgetTimer = timeouts.mock.results[index].value;
      await view.unmount();
      expect(cleared).toHaveBeenCalledWith(budgetTimer);
    } finally {
      timeouts.mockRestore();
      cleared.mockRestore();
      jest.useRealTimers();
    }
  });
  it('rejects overdue native success after suspension even before the timeout callback runs', async () => {
    jest.useFakeTimers();
    try {
      const native = service();
      const gate = deferred<ReturnType<typeof status>>();
      jest.mocked(native.getStatus).mockReturnValue(gate.promise);
      const view = await render(<Harness integration={connected(native)} />);
      await act(() => {
        jest.setSystemTime(Date.now() + PROTECTION_READ_TIMEOUT_MS + 1);
      });
      await act(() => gate.resolve(status()));
      expect(screen.getByText('Protection status unknown')).toBeOnTheScreen();
      expect(screen.queryByText('Protection active')).toBeNull();
      await view.unmount();
    } finally {
      jest.useRealTimers();
    }
  });
  it('discards a pending status read when the native owner becomes disconnected', async () => {
    const native = service();
    const gate = deferred<ReturnType<typeof status>>();
    jest.mocked(native.getStatus).mockReturnValue(gate.promise);
    const view = await render(<Harness integration={connected(native)} />);
    await view.rerender(
      <Harness
        integration={{
          availability: 'not_connected',
          platform: 'ios',
          reason: 'initialization_failed',
        }}
      />,
    );
    await act(() => gate.resolve(status()));
    expect(screen.getByText('Protection status unavailable')).toBeOnTheScreen();
  });
});
