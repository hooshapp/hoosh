import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { useAnnouncement } from '@/components/ui/use-announcement';
import { useUiTheme } from '@/components/ui/theme';
import { colors, fonts } from '@/design/tokens';

import type { ProtectionStatusModel } from './status-model';

type Props = {
  model: ProtectionStatusModel;
  onRetry?: () => void;
  onReviewPermissions?: () => void;
  onSetup?: () => void;
  busy?: boolean;
};
/** Image-free engineering status summary; native owners supply any real action. */
export function ProtectionStatus({
  model,
  onRetry,
  onReviewPermissions,
  onSetup,
  busy = false,
}: Props) {
  const theme = useUiTheme();
  // Checking already announces through InlineStatus; do not queue it twice on iOS.
  useAnnouncement(model.kind === 'checking' ? undefined : `${model.title}. ${model.message}`);
  const action =
    model.action === 'retry'
      ? onRetry
      : model.action === 'permissions'
        ? onReviewPermissions
        : model.action === 'setup'
          ? onSetup
          : undefined;
  const label =
    model.action === 'retry'
      ? 'Check again'
      : model.action === 'permissions'
        ? 'Review permissions'
        : 'Review protection setup';
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: model.tone === 'positive' ? colors.success : theme.outline,
        },
      ]}>
      <Text style={[styles.label, { color: theme.muted }]}>DEVICE PROTECTION</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>
        {model.title}
      </Text>
      {model.kind === 'checking' ? (
        <InlineStatus state="loading" message={model.message} />
      ) : (
        <Text
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={[styles.message, { color: theme.muted }]}>
          {model.message}
        </Text>
      )}
      {action ? (
        <Button
          label={label}
          busyLabel="Working…"
          variant="secondary"
          busy={busy}
          onPress={action}
        />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 24, padding: 16, gap: 12 },
  label: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 18, letterSpacing: 0.7 },
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27 },
  message: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
