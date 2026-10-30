import type {
  NativeProtectionStatus,
  ProtectionCapabilities,
  ProtectionIntegration,
  ProtectionService,
} from '@disconnect/contracts';

export const capabilities = (
  mode: ProtectionCapabilities['mode'] = 'system_shield',
): ProtectionCapabilities => ({
  platform: 'ios',
  selectionUI: 'native_picker',
  mode,
  supportsUsageThreshold: true,
  supportsScheduledRestriction: true,
  supportsTemporaryAllowance: true,
  supportsAdvanceWarning: false,
  supportsUsageSummary: false,
  notes: ['RN08_TEST_DEVICE_ONLY'],
});
export const status = (overrides: Partial<NativeProtectionStatus> = {}): NativeProtectionStatus =>
  ({
    authorization: 'authorized',
    state: 'active',
    installedRevision: 4,
    installedReasonIds: ['RN08_TEST_DEVICE_ONLY'],
    ...overrides,
  }) as NativeProtectionStatus;
export function connected(service: ProtectionService): ProtectionIntegration {
  return { availability: 'connected', platform: 'ios', service };
}
