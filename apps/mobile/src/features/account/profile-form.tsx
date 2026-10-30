import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { InlineStatus } from '@/components/ui/inline-status';
import { fonts } from '@/design/tokens';
import { useUiTheme } from '@/components/ui/theme';

/** Presentation intent, not an HTTP DTO. Only an explicit clear intent may become null. */
export type ProfileNameDraft = { kind: 'text'; value: string } | { kind: 'clear' };
export type ProfileFormState =
  | { kind: 'ready' | 'saving' | 'unavailable' | 'error' | 'conflict' | 'unconfirmed' }
  | { kind: 'invalid'; issue: 'blank' | 'too_long' | 'invalid_text' };
export type ProfileFormProps = {
  draft: ProfileNameDraft;
  dirty: boolean;
  state: ProfileFormState;
  onDraftChange: (draft: ProfileNameDraft) => void;
  onSave?: (draft: ProfileNameDraft) => void;
  onDiscard: () => void;
  onReviewLatest?: () => void;
};
const fieldErrors = {
  blank: 'Enter a display name, or choose Remove display name.',
  too_long: 'Use a shorter display name.',
  invalid_text: 'This name contains unsupported characters.',
} as const;

/** Controlled UI only: host owns canonical data, dirty state, validation and all persistence. */
export function ProfileForm({
  draft,
  dirty,
  state,
  onDraftChange,
  onSave,
  onDiscard,
  onReviewLatest,
}: ProfileFormProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const theme = useUiTheme();
  const busy = state.kind === 'saving';
  const blocked = busy || ['unavailable', 'conflict', 'unconfirmed'].includes(state.kind);
  const canSave = dirty && Boolean(onSave) && !blocked;
  return (
    <View style={styles.form}>
      <Field
        label="Display name"
        value={draft.kind === 'text' ? draft.value : ''}
        editable={!busy}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        hint={
          draft.kind === 'clear'
            ? 'Your display name will be removed when you save.'
            : 'Choose the name you want to display.'
        }
        error={state.kind === 'invalid' ? fieldErrors[state.issue] : undefined}
        onChangeText={(value) => {
          if (busy) return;
          setConfirmClear(false);
          onDraftChange({ kind: 'text', value });
        }}
      />
      {dirty ? (
        <Text style={[styles.note, { color: theme.muted }]}>You have unsaved changes.</Text>
      ) : null}
      <ProfileFeedback state={state} onReviewLatest={onReviewLatest} />
      <Button
        label="Save changes"
        busyLabel="Saving…"
        busy={busy}
        disabled={!canSave}
        onPress={() => {
          if (canSave) onSave?.(draft);
        }}
      />
      <Button
        label="Discard changes"
        variant="secondary"
        disabled={!dirty || busy}
        onPress={() => {
          setConfirmClear(false);
          onDiscard();
        }}
      />
      {confirmClear ? (
        <View style={styles.confirmation}>
          <Text accessibilityRole="alert" style={[styles.note, { color: theme.foreground }]}>
            Remove your display name? This takes effect only after you save.
          </Text>
          <Button
            label="Remove name"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setConfirmClear(false);
              onDraftChange({ kind: 'clear' });
            }}
          />
          <Button
            label="Keep name"
            variant="secondary"
            disabled={busy}
            onPress={() => setConfirmClear(false)}
          />
        </View>
      ) : (
        <Button
          label="Remove display name"
          variant="secondary"
          disabled={busy || draft.kind === 'clear'}
          onPress={() => setConfirmClear(true)}
        />
      )}
    </View>
  );
}
function ProfileFeedback({
  state,
  onReviewLatest,
}: {
  state: ProfileFormState;
  onReviewLatest?: () => void;
}) {
  switch (state.kind) {
    case 'saving':
      return <InlineStatus state="saving" message="Saving your profile…" />;
    case 'unavailable':
      return (
        <InlineStatus
          state="unavailable"
          message="Profile saving is unavailable. Your changes have not been saved."
        />
      );
    case 'error':
      return (
        <InlineStatus
          state="error"
          message="Your profile could not be saved. Your changes are still here."
        />
      );
    case 'conflict':
      return (
        <InlineStatus
          state="error"
          message="Your profile changed elsewhere. Review the latest profile before saving."
          onRetry={onReviewLatest}
          retryLabel="Review latest profile"
        />
      );
    case 'unconfirmed':
      return (
        <InlineStatus
          state="error"
          message="We couldn’t confirm whether your changes were saved. Check the latest profile before trying again."
          onRetry={onReviewLatest}
          retryLabel="Check latest profile"
        />
      );
    default:
      return null;
  }
}
const styles = StyleSheet.create({
  form: { gap: 16 },
  note: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  confirmation: { gap: 12 },
});
