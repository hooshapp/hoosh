import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { useUiTheme } from '@/components/ui/theme';
import { fonts } from '@/design/tokens';
import { settingsValueLabel } from '@/features/settings/settings-model';
import type { SettingsSummary } from '@/features/settings/settings-summary-model';

const labels = {
  activities: 'Redirect Me To',
  days: 'Draft days',
  hours: 'Draft hours',
  sessions: 'Draft sessions',
} as const;
export type PreferencesNavigation = Partial<Record<keyof SettingsSummary, () => void>>;
/** Uses the existing card/type recipes. This is a saved-preferences summary, not a recommendation. */
export function HomePreferences({
  summary,
  onOpen = {},
  onRetry,
  retrying = false,
  refreshing = false,
  recovery,
}: {
  summary: SettingsSummary;
  onOpen?: PreferencesNavigation;
  onRetry?: () => void;
  retrying?: boolean;
  refreshing?: boolean;
  recovery?: ReactNode;
}) {
  const theme = useUiTheme();
  const values = Object.values(summary);
  const failed = values.some((value) => value.state === 'error');
  const loading = values.some((value) => value.state === 'loading');
  return (
    <View
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.outline }]}
      testID="home-preferences"
    >
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>
        Your preferences
      </Text>
      <Text style={[styles.body, { color: theme.muted }]}>
        Saved plan drafts are not active protection.
      </Text>
      {recovery}
      {failed ? (
        <InlineStatus
          state="error"
          message="Your saved preferences couldn’t be loaded."
          onRetry={onRetry}
          retrying={retrying}
        />
      ) : loading || refreshing ? (
        <InlineStatus
          state="loading"
          message={loading ? 'Loading saved preferences…' : 'Updating saved preferences…'}
        />
      ) : null}
      {(Object.keys(labels) as (keyof SettingsSummary)[]).map((field) => (
        <View key={field} style={styles.row}>
          <Text style={[styles.label, { color: theme.foreground }]}>{labels[field]}</Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            {settingsValueLabel(summary[field])}
          </Text>
          {onOpen[field] ? (
            <Button
              label={
                field === 'activities' ? 'Edit activities' : `Edit ${labels[field].toLowerCase()}`
              }
              variant="secondary"
              onPress={onOpen[field]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 20, gap: 14, borderRadius: 24, borderWidth: 1 },
  title: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  row: { gap: 6 },
});
