import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { colors, fonts } from '@/design/tokens';
import { useAnnouncement } from '@/components/ui/use-announcement';
import { weeklyPlanStatus, type WeeklyPlanRead } from './weekly-plan-status';

export function WeeklyPlanCard({ read, pending, busy, draftChanged, appsChanged, onRefresh, onSettings, onReviewAccess }: {
  read: WeeklyPlanRead; pending: boolean; busy: boolean; draftChanged: boolean; appsChanged: boolean;
  onRefresh?: () => void; onSettings?: () => void; onReviewAccess?: () => void;
}) {
  const model = weeklyPlanStatus(busy ? { phase: 'checking' } : read, pending);
  useAnnouncement(`${model.title}. ${model.message}`);
  return <View testID="weekly-plan-status" style={[styles.card, model.positive && styles.active]}>
    <Text style={styles.label}>ON THIS DEVICE</Text>
    <Text accessibilityRole="header" style={styles.title}>{model.title}</Text>
    <Text accessibilityLiveRegion="polite" style={styles.body}>{model.message}</Text>
    {draftChanged ? <Text style={styles.body}>You have draft changes that are not applied.</Text> : null}
    {appsChanged ? <Text style={styles.body}>Saved app choices changed. Apply the plan to update future scheduled periods.</Text> : null}
    {model.kind === 'permission' && onReviewAccess ? <Button label="Review app access" disabled={busy} onPress={onReviewAccess} /> : null}
    {onRefresh && ['unknown', 'failed', 'unconfirmed'].includes(model.kind) ? <Button label="Refresh device schedule" disabled={busy} onPress={onRefresh} /> : null}
    {onSettings ? <Button label="Manage app schedule" variant="secondary" disabled={busy} onPress={onSettings} /> : null}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.warmOutline, borderRadius: 20, padding: 16, gap: 12, backgroundColor: colors.warmCard },
  active: { borderColor: colors.readableSuccess }, label: { fontFamily: fonts.bold, fontSize: 12, color: colors.muted },
  title: { fontFamily: fonts.bold, fontSize: 20, color: colors.warmForeground }, body: { fontFamily: fonts.regular, fontSize: 14, color: colors.warmForeground },
});
