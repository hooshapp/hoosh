import { requireOptionalNativeModule } from 'expo';
import { createAndroidUsageIntegration, type AndroidUsagePort } from './android-usage-adapter';

/** Stable process-wide identity; lookup performs no permission, rule or account action. */
export const deviceProtectionIntegration = createAndroidUsageIntegration(
  requireOptionalNativeModule<AndroidUsagePort>('HooshUsage'),
);
