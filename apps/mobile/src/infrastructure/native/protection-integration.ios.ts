import type { ProtectionIntegration } from '@disconnect/contracts';
/** Scoped C04 review/mutations exist; policy activation stays gated for device acceptance. */
export const deviceProtectionIntegration: ProtectionIntegration = {
  availability: 'not_connected', platform: 'ios', reason: 'adapter_not_registered',
};
