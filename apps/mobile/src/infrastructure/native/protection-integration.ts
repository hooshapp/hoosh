import type { ProtectionIntegration } from '@disconnect/contracts';
import { Platform } from 'react-native';

/** Metro selects the Android implementation. Anisha owns the future audited iOS registration. */
export const deviceProtectionIntegration: ProtectionIntegration =
  Platform.OS === 'ios'
    ? { availability: 'not_connected', platform: 'ios', reason: 'adapter_not_registered' }
    : {
        availability: 'unsupported',
        platform: Platform.OS === 'web' ? 'web' : 'other',
        reason: 'platform_not_supported',
      };
