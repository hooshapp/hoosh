import { Text, View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { useUiTheme } from '@/components/ui/theme';
import { fonts } from '@/design/tokens';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { useIdentityQuery } from './identity-query';
import { AccountHeader } from './account-header';
import { ProfileForm } from './profile-form';
import { useProfileEditor } from './use-profile-editor';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useAccountAction } from './use-account-action';

/** Real private consumer: the Auth owner's AccountDataProvider is its only dependency. */
export function ProfileSurface() {
  const identity = useIdentityQuery();
  const editor = useProfileEditor();
  const guard = useRouteDraftGuard(editor.dirty);
  const theme = useUiTheme();
  const { availability, controller } = useAccountData();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const available = availability === 'ready';
  const paused = availability === 'api_paused' || availability === 'recovering';
  return (
    <View>
      {guard.confirmation}
      <AccountHeader
        identity={available ? (identity.data ?? null) : null}
        displayName={available ? editor.displayName : null}
      />
      <View style={styles.body}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.foreground }]}>
          Profile
        </Text>
        {paused ? (
          <>
            <InlineStatus
              state="unavailable"
              message={
                recovery.failed
                  ? 'Account access could not be verified. Try again.'
                  : 'Verify your account access to continue.'
              }
            />
            <Button
              label="Verify account access"
              busyLabel="Verifying…"
              busy={recovery.busy || availability === 'recovering'}
              onPress={recovery.run}
            />
          </>
        ) : null}
        {(editor.query.isError || editor.protocolFailure) && !editor.reviewFailed ? (
          <InlineStatus
            state="error"
            message="Your profile could not be verified. Your changes have not been discarded."
            onRetry={() => {
              void editor.query.refetch();
            }}
            retrying={editor.query.isFetching}
          />
        ) : null}
        {!editor.form && !editor.query.isError && !editor.protocolFailure ? (
          <InlineStatus
            state={editor.query.isPaused || !available ? 'unavailable' : 'loading'}
            message={
              !available
                ? 'Profile information is temporarily unavailable.'
                : editor.query.isPaused
                  ? 'Connect to load your profile.'
                  : 'Loading your profile…'
            }
          />
        ) : null}
        {editor.form ? <ProfileForm {...editor.form} /> : null}
        {editor.reviewing ? (
          <InlineStatus state="loading" message="Checking the latest profile…" />
        ) : null}
        {editor.reviewFailed ? (
          <InlineStatus
            state="error"
            message="The latest profile could not be loaded. Your draft is still here."
            onRetry={() => {
              void editor.checkLatest();
            }}
          />
        ) : null}
        {editor.review ? (
          <View style={styles.review}>
            <Text style={{ color: theme.foreground }}>
              Latest display name: {editor.review.profile?.display_name ?? 'No display name'}
            </Text>
            <Text style={{ color: theme.foreground }}>
              Compare this with your draft, then choose which to keep. Keeping your edits does not
              save them.
            </Text>
            <Button
              label="Keep my edits"
              disabled={!editor.enabled}
              onPress={() => editor.resolveReview(true)}
            />
            <Button
              label="Use latest profile"
              variant="secondary"
              disabled={!editor.enabled}
              onPress={() => editor.resolveReview(false)}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  review: { gap: 12 },
});
