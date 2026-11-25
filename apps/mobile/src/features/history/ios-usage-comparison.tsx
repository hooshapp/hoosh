import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ComponentType } from 'react';
import { Platform, type ViewProps } from 'react-native';
import { useIOSSelectionDevice } from '@/features/protection/native-owner-boundary';

type ReportProps = ViewProps & { ownerKey: string; compact: boolean; days: number };
const supportsUsageComparison = Platform.OS === 'ios' &&
  requireOptionalNativeModule<{ usageComparisonAvailable?: boolean }>('HooshScreenTime')?.usageComparisonAvailable === true;
let Report: ComponentType<ReportProps> | undefined;

/** The iOS report renders locally. No usage value crosses the native bridge. */
export function useIOSUsageComparison() {
  const device = useIOSSelectionDevice();
  if (!supportsUsageComparison || !device?.productPort) return undefined;
  try {
    Report ??= requireNativeView<ReportProps>('HooshScreenTime', 'UsageComparisonHost');
  } catch {
    return undefined;
  }
  const NativeReport = Report;
  return (compact: boolean, days = 7) => (
    <NativeReport
      key={`${device.owner}:${device.generation}:${days}`}
      ownerKey={device.owner}
      compact={compact}
      days={days}
      style={{ width: '100%', height: compact ? 95 : 132 }}
    />
  );
}
