import { describe, expect, it } from 'vitest';
import { decodeIOSDeviceStatus } from './ios-device-status';
const owner = 'fixture:00000000-0000-4000-8000-000000000001';
const valid = () => ({ schemaVersion: 1, owner, platform: 'ios', mode: 'system_shield', selectionUI: 'native_picker',
  authorization: 'authorized', state: 'inactive', installedRevision: null, installedReasonIds: [],
  supportsScheduledRestriction: false, supportsTemporaryAllowance: false, supportsUsageThreshold: false,
  supportsAdvanceWarning: false, supportsUsageSummary: false });
describe('selection-only iOS status', () => {
  it('projects only supported capabilities and drops inventory extras', () => {
    const result = decodeIOSDeviceStatus({ ...valid(), applications: ['private'] }, owner);
    expect(result.capabilities.platform).toBe('ios');
    expect(result.capabilities.supportsScheduledRestriction).toBe(false);
    expect(JSON.stringify(result)).not.toContain('private');
  });
  it.each([
    { owner: 'different' }, { platform: 'android' }, { state: 'active' }, { installedRevision: 1 },
    { installedReasonIds: ['old'] }, { supportsScheduledRestriction: true }, { authorization: 'denied' },
    { schemaVersion: 2 }, { mode: 'overlay' }, { selectionUI: 'package_list' }, { state: 'needs_permission' },
  ])('rejects incompatible or overstated status %j', patch => {
    expect(() => decodeIOSDeviceStatus({ ...valid(), ...patch }, owner)).toThrow();
  });
  it('accepts actual permission denial without claiming installation', () => {
    expect(decodeIOSDeviceStatus({ ...valid(), authorization: 'denied', state: 'needs_permission' }, owner).authorization).toBe('denied');
  });
});
