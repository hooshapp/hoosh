import type {
  AuthorizationState,
  NativeProtectionStatus,
  ProtectionCapabilities,
  ProtectionIntegration,
  ProtectionService,
} from '@disconnect/contracts';

export type AndroidUsagePort = {
  getCapabilities(): Promise<unknown>;
  getAuthorization(): Promise<unknown>;
  getStatus(): Promise<unknown>;
  openUsageAccess(): Promise<unknown>;
};
export class UsageAccessError extends Error {
  constructor(public readonly code: 'unavailable' | 'invalid_response' | 'unsupported') {
    super(
      code === 'unsupported'
        ? 'This protection operation is not available.'
        : 'Usage access could not be verified.',
    );
    this.name = 'UsageAccessError';
  }
}
const invalid = (): never => {
  throw new UsageAccessError('invalid_response');
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export function decodeUsageAuthorization(value: unknown): AuthorizationState {
  if (value !== 'authorized' && value !== 'denied' && value !== 'unavailable' && value !== 'error')
    return invalid();
  return value;
}
export function decodeUsageCapabilities(value: unknown): ProtectionCapabilities {
  if (
    !record(value) ||
    value.platform !== 'android' ||
    value.mode !== 'unsupported' ||
    value.selectionUI !== 'unavailable' ||
    ![
      'supportsUsageThreshold',
      'supportsScheduledRestriction',
      'supportsTemporaryAllowance',
      'supportsAdvanceWarning',
      'supportsUsageSummary',
    ].every((key) => value[key] === false)
  )
    return invalid();
  return {
    platform: 'android',
    mode: 'unsupported',
    selectionUI: 'unavailable',
    supportsUsageThreshold: false,
    supportsScheduledRestriction: false,
    supportsTemporaryAllowance: false,
    supportsAdvanceWarning: false,
    supportsUsageSummary: false,
    notes: ['Usage access only; protection is not implemented in this build.'],
  };
}
export function decodeUsageStatus(value: unknown): NativeProtectionStatus {
  if (!record(value)) return invalid();
  const authorization = decodeUsageAuthorization(value.authorization);
  if (
    value.installedRevision !== null ||
    !Array.isArray(value.installedReasonIds) ||
    value.installedReasonIds.length !== 0 ||
    value.state !== (authorization === 'denied' ? 'needs_permission' : 'inactive')
  )
    return invalid();
  return {
    authorization,
    state: value.state as 'needs_permission' | 'inactive',
    installedRevision: null,
    installedReasonIds: [],
  };
}
/** Only this measured read/permission slice is supported; never successful write/event stubs. */
export function createAndroidUsageIntegration(
  port: AndroidUsagePort | null,
): ProtectionIntegration {
  if (!port)
    return { availability: 'not_connected', platform: 'android', reason: 'adapter_not_registered' };
  if (
    !['getCapabilities', 'getAuthorization', 'getStatus', 'openUsageAccess'].every(
      (key) => typeof port[key as keyof AndroidUsagePort] === 'function',
    )
  )
    return { availability: 'not_connected', platform: 'android', reason: 'initialization_failed' };
  async function read<T>(call: () => Promise<unknown>, decode: (value: unknown) => T): Promise<T> {
    try {
      return decode(await call());
    } catch (error) {
      throw error instanceof UsageAccessError ? error : new UsageAccessError('unavailable');
    }
  }
  const unsupported = async (): Promise<never> => {
    throw new UsageAccessError('unsupported');
  };
  let permission: Promise<AuthorizationState> | null = null;
  const service: ProtectionService = {
    getCapabilities: () => read(() => port.getCapabilities(), decodeUsageCapabilities),
    getAuthorization: () => read(() => port.getAuthorization(), decodeUsageAuthorization),
    getStatus: () => read(() => port.getStatus(), decodeUsageStatus),
    requestAuthorization: () => {
      if (permission) return permission;
      permission = read(
        () => port.openUsageAccess(),
        (value) => (value === true ? true : invalid()),
      )
        .then(() => service.getAuthorization())
        .finally(() => {
          permission = null;
        });
      // Launch completion is not a grant; foreground return must read fresh evidence.
      return permission;
    },
    pickApps: unsupported,
    getSelectedApps: unsupported,
    applyRules: unsupported,
    requestTemporaryAllowance: unsupported,
    cancelReason: unsupported,
    drainEvents: unsupported,
    acknowledgeEvents: unsupported,
  };
  return { availability: 'connected', platform: 'android', service };
}
