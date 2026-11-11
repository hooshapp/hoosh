import { requireOptionalNativeModule } from 'expo';
import { Platform, Text, View } from 'react-native';
import { WeeklyScheduleSetup } from '@/features/plans/weekly-schedule-setup';
import type { WeeklySchedulePort } from '@/features/plans/weekly-schedule';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';
const OWNER = 'qa-development:00000000-0000-4000-8000-000000000001';
type Port = WeeklySchedulePort & SelectionEditorPort;
export function WeeklyScheduleQa() {
  const value = Platform.OS === 'android' ? requireOptionalNativeModule<Partial<Port>>('HooshUsage') : null;
  const methods: (keyof Port)[] = ['scheduleRead', 'schedulePreview', 'scheduleApply', 'interventionOpen', 'interventionRelease', 'interventionCancel', 'selectionBegin', 'selectionPick', 'selectionCommit', 'selectionRelease'];
  const port = value && methods.every((key) => typeof value[key] === 'function') ? value as Port : null;
  return <View style={{ flex: 1 }}><Text>RN08_WEEKLY_SCHEDULE_QA_ONLY · explicit local test owner A. Review intervention access in Android interventions. No Auth or API changes.</Text><WeeklyScheduleSetup owner={OWNER} port={port} /></View>;
}
