import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ComponentType } from 'react';
import { Platform, useWindowDimensions, type ViewProps } from 'react-native';
import { useIOSSelectionDevice } from '@/features/protection/native-owner-boundary';

type HistoryPage = "summary" | "progress" | "reclaimed";
type ReportProps = ViewProps & { ownerKey: string; compact: boolean; days: number; page: HistoryPage };
const supportsUsageComparison = Platform.OS === 'ios' &&
  requireOptionalNativeModule<{ usageComparisonAvailable?: boolean }>('HooshScreenTime')?.usageComparisonAvailable === true;
let Report: ComponentType<ReportProps> | undefined;

/** The iOS report renders locally. No usage value crosses the native bridge. */
export function useIOSUsageComparison() {
  const device = useIOSSelectionDevice();
  const { fontScale, width } = useWindowDimensions();
  if (!supportsUsageComparison || !device?.productPort) return undefined;
  try {
    Report ??= requireNativeView<ReportProps>('HooshScreenTime', 'UsageComparisonHost');
  } catch {
    return undefined;
  }
  const NativeReport = Report;
  return (compact: boolean, days = 7, page: HistoryPage = "summary") => (
    <NativeReport
      key={`${device.owner}:${device.generation}:${days}:${page}`}
      ownerKey={device.owner}
      compact={compact}
      days={days}
      page={page}
      style={{ width: '100%', height: compact ? 95 : Math.ceil((page === "reclaimed" ? 260 + width * 0.4 : page === "progress" ? 270 : 240) * Math.max(1, fontScale)) }}
    />
  );
}
