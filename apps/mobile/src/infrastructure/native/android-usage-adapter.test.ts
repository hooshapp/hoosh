import { describe, expect, it, vi } from 'vitest';
import {
  createAndroidUsageIntegration,
  decodeUsageAuthorization,
  decodeUsageCapabilities,
  decodeUsageStatus,
  UsageAccessError,
  type AndroidUsagePort,
} from './android-usage-adapter';

const capabilities = {
  platform: 'android',
  mode: 'unsupported',
  selectionUI: 'unavailable',
  supportsUsageThreshold: false,
  supportsScheduledRestriction: false,
  supportsTemporaryAllowance: false,
  supportsAdvanceWarning: false,
  supportsUsageSummary: false,
};
const status = {
  authorization: 'authorized',
  state: 'inactive',
  installedRevision: null,
  installedReasonIds: [],
};
function port(): AndroidUsagePort {
  return {
    getCapabilities: vi.fn(async () => capabilities),
    getAuthorization: vi.fn(async () => 'denied'),
    getStatus: vi.fn(async () => status),
    openUsageAccess: vi.fn(async () => true),
  };
}
function connected(native = port()) {
  const integration = createAndroidUsageIntegration(native);
  if (integration.availability !== 'connected') throw new Error('Expected connected fixture');
  return { service: integration.service, native };
}
describe('Android read/permission slice', () => {
  it('keeps absent module and incomplete module separate from success', () => {
    expect(createAndroidUsageIntegration(null)).toMatchObject({
      availability: 'not_connected',
      reason: 'adapter_not_registered',
    });
    expect(createAndroidUsageIntegration({} as AndroidUsagePort)).toMatchObject({
      availability: 'not_connected',
      reason: 'initialization_failed',
    });
  });
  it.each(['authorized', 'denied', 'unavailable', 'error'])(
    'reads authoritative %s without activation',
    async (authorization) => {
      const { service, native } = connected();
      vi.mocked(native.getAuthorization).mockResolvedValue(authorization);
      vi.mocked(native.getStatus).mockResolvedValue({
        ...status,
        authorization,
        state: authorization === 'denied' ? 'needs_permission' : 'inactive',
      });
      expect(await service.getAuthorization()).toBe(authorization);
      expect(await service.getStatus()).toMatchObject({
        authorization,
        installedRevision: null,
        installedReasonIds: [],
      });
      expect(await service.getCapabilities()).toMatchObject(capabilities);
      expect(native.openUsageAccess).not.toHaveBeenCalled();
    },
  );
  it.each([null, true, 'granted', 'revoked', {}, 1])(
    'rejects malformed authorization %#',
    (value) => expect(() => decodeUsageAuthorization(value)).toThrow(UsageAccessError),
  );
  it.each([
    null,
    {},
    { ...capabilities, mode: 'overlay' },
    { ...capabilities, selectionUI: 'package_list' },
    ...Object.keys(capabilities)
      .filter((key) => key.startsWith('supports'))
      .map((key) => ({ ...capabilities, [key]: true })),
  ])('rejects unimplemented capability claims %#', (value) =>
    expect(() => decodeUsageCapabilities(value)).toThrow(UsageAccessError),
  );
  it.each([
    null,
    {},
    { ...status, state: 'active', installedRevision: 1 },
    { ...status, installedRevision: 0 },
    { ...status, installedReasonIds: ['unexpected'] },
    { ...status, authorization: 'denied' },
  ])('rejects malformed or installed status %#', (value) =>
    expect(() => decodeUsageStatus(value)).toThrow(UsageAccessError),
  );
  it('does not expose untrusted extra native fields, notes, identifiers or exception text', async () => {
    expect(decodeUsageStatus({ ...status, private: 'hide' })).toEqual(status);
    expect(
      decodeUsageCapabilities({ ...capabilities, notes: ['private native detail'] }).notes,
    ).not.toContain('private native detail');
    const { service, native } = connected();
    vi.mocked(native.getStatus).mockRejectedValue(new Error('Private platform exception'));
    await expect(service.getStatus()).rejects.toMatchObject({
      code: 'unavailable',
      message: 'Usage access could not be verified.',
    });
  });
  it('serializes repeated settings intents and returns the current denial instead of assuming grant', async () => {
    let resolve!: (value: unknown) => void;
    const { service, native } = connected();
    vi.mocked(native.openUsageAccess).mockImplementationOnce(
      () =>
        new Promise((yes) => {
          resolve = yes;
        }),
    );
    const first = service.requestAuthorization();
    const second = service.requestAuthorization();
    expect(second).toBe(first);
    expect(native.openUsageAccess).toHaveBeenCalledTimes(1);
    resolve(true);
    await expect(first).resolves.toBe('denied');
    await service.requestAuthorization();
    expect(native.openUsageAccess).toHaveBeenCalledTimes(2);
  });
  it('safe settings-launch failure settles and permits a deliberate retry', async () => {
    const { service, native } = connected();
    vi.mocked(native.openUsageAccess).mockRejectedValueOnce(new Error('Activity unavailable'));
    await expect(service.requestAuthorization()).rejects.toMatchObject({ code: 'unavailable' });
    await expect(service.requestAuthorization()).resolves.toBe('denied');
    vi.mocked(native.openUsageAccess).mockResolvedValueOnce(false);
    await expect(service.requestAuthorization()).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
  it('every unimplemented selection/rule/allowance/event operation rejects without native writes', async () => {
    const { service, native } = connected();
    const operations = [
      () => service.pickApps(),
      () => service.getSelectedApps(),
      () => service.applyRules([], 1),
      () => service.requestTemporaryAllowance('reason', 5),
      () => service.cancelReason('reason'),
      () => service.drainEvents(1),
      () => service.acknowledgeEvents([]),
    ];
    for (const operation of operations)
      await expect(operation()).rejects.toMatchObject({ code: 'unsupported' });
    for (const method of Object.values(native)) expect(method).not.toHaveBeenCalled();
  });
});
