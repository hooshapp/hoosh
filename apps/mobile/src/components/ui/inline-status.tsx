import { Platform, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/design/tokens';

import { Button } from './button';
import { ProgressIndicator } from './progress-indicator';
import { useAnnouncement } from './use-announcement';
import { useUiTheme } from './theme';

type StatusBase = { message: string };
export type InlineStatusProps = StatusBase &
  (
    | { state: 'loading' | 'saving'; onRetry?: never; retrying?: never; retryLabel?: never }
    | {
        state: 'error' | 'unavailable';
        onRetry?: () => void;
        retrying?: boolean;
        retryLabel?: string;
      }
  );

/** Notices never masquerade as actions; a retry exists only when a real callback is supplied. */
export function InlineStatus({
  state,
  message,
  onRetry,
  retrying = false,
  retryLabel = 'Try again',
}: InlineStatusProps) {
  const theme = useUiTheme();
  const busy = state === 'loading' || state === 'saving';
  useAnnouncement(message);
  return (
    <View style={styles.container}>
      <View style={styles.message}>
        {busy ? <ProgressIndicator color={theme.foreground} /> : null}
        <Text
          accessibilityRole={state === 'error' ? 'alert' : 'text'}
          {...(Platform.OS === 'web' && state !== 'error' ? { role: 'status' as const } : {})}
          accessibilityLiveRegion="polite"
          aria-live="polite"
          aria-busy={busy}
          accessibilityState={{ busy }}
          style={[styles.text, { color: state === 'error' ? theme.error : theme.muted }]}>
          {message}
        </Text>
      </View>
      {onRetry ? (
        <Button
          label={retryLabel}
          busyLabel="Retrying…"
          variant="secondary"
          busy={retrying}
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  message: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
});
