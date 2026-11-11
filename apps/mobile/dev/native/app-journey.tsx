import { requireOptionalNativeModule } from 'expo';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeeklyPlanJourney } from '@/features/plans/weekly-plan-journey';
import type { WeeklyPlanPort } from '@/features/plans/use-weekly-plan';

const OWNER = 'qa-development:00000000-0000-4000-8000-000000000001';
/** Explicit development entry only. Never imported by production routes or Auth providers. */
export function AppJourneyQa({ onExit }: { onExit: () => void }) {
  const value = Platform.OS === 'android' ? requireOptionalNativeModule<Partial<WeeklyPlanPort>>('HooshUsage') : null;
  const methods: (keyof WeeklyPlanPort)[] = ['scheduleRead', 'schedulePreview', 'scheduleApply', 'interventionOpen', 'interventionRelease', 'interventionCancel', 'interventionReviewAccess', 'selectionBegin', 'selectionPick', 'selectionCommit', 'selectionRelease'];
  const port = value && methods.every((key) => typeof value[key] === 'function') ? value as WeeklyPlanPort : null;
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, paddingTop: insets.top }}>
    <Text>RN09_APP_JOURNEY_QA_ONLY · Local development preview. Real device schedule; account and rewards unavailable.</Text>
    <WeeklyPlanJourney owner={OWNER} port={port} onExit={onExit} />
  </View>;
}
