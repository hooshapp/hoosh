import type { ProtectionIntegration } from '@disconnect/contracts';
/** Native selection/authorization exists; full policy enforcement is a C04 gate. */
export const deviceProtectionIntegration: ProtectionIntegration = {
  availability: 'not_connected', platform: 'ios', reason: 'adapter_not_registered',
};
