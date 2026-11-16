import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { useUiTheme } from '@/components/ui/theme';
import { fonts } from '@/design/tokens';
import { LeaveConfirmation } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { useIdentityQuery } from './identity-query';
import { AccountHeader } from './account-header';
import { ProfileForm } from './profile-form';
import { useProfileEditor } from './use-profile-editor';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useAppRuntime } from './app-runtime-context';
import type { SignupNameDraft } from './signup-name-handoff';
import { useAccountAction } from './use-account-action';

/** Real private consumer: the Auth owner's AccountDataProvider is its only dependency. */
export function ProfileSurface({ onProfileSaved, onBackToSetup, recordingSetup }: {
  onProfileSaved?: (revision: number) => void;
  onBackToSetup?: () => void;
  recordingSetup?: boolean;
}) {
  const identity = useIdentityQuery();
  const { availability, controller, scope } = useAccountData();
  const handoff = useAppRuntime()?.signupNameHandoff;
  const [leaving, setLeaving] = useState(false);
  const [signupDraft, setSignupDraft] = useState<SignupNameDraft | null>(null);
  const [clearingDraft, setClearingDraft] = useState(false);
  const [draftClearFailed, setDraftClearFailed] = useState(false);
  const verified = scope && !identity.isError && identity.data?.user_id === scope.account.user_id;
  useEffect(() => {
    if (!scope || !verified || !handoff) return;
    let active = true;
    void handoff.read(scope).then(draft => {
      if (active && scope.isCurrent()) setSignupDraft(draft);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [handoff, scope, verified]);

  async function clearSignupDraft(id: string) {
    if (!scope || !handoff || !verified || clearingDraft || !scope.isCurrent()) return;
    setClearingDraft(true);
    setDraftClearFailed(false);
    try {
      await handoff.clear(scope, id);
      if (scope.isCurrent()) setSignupDraft(current => current?.id === id ? null : current);
    } catch {
      if (scope.isCurrent()) setDraftClearFailed(true);
    } finally {
      if (scope.isCurrent()) setClearingDraft(false);
    }
  }

  const editor = useProfileEditor(id => { void clearSignupDraft(id); }, onProfileSaved);
  const guard = useRouteDraftGuard(editor.dirty);
  const theme = useUiTheme();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const available = availability === 'ready';
  const paused = availability === 'api_paused' || availability === 'recovering';
  return (
    <View>
      {guard.confirmation}
      {leaving && onBackToSetup && (
        <LeaveConfirmation onKeep={() => setLeaving(false)} onDiscard={onBackToSetup} />
      )}
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
        {verified && available && signupDraft && editor.form ? (
          <View style={styles.review}>
            <Text style={{ color: theme.foreground }}>Name from signup: {signupDraft.displayName}</Text>
            <Text style={{ color: theme.foreground }}>Use it in the editor to review and save it to your profile.</Text>
            <Button label="Use signup name" disabled={!editor.enabled || editor.dirty || clearingDraft}
              onPress={() => editor.adoptSignupName(signupDraft)} />
            <Button label="Discard signup name" variant="secondary" disabled={editor.dirty || clearingDraft}
              onPress={() => { void clearSignupDraft(signupDraft.id); }} />
            {draftClearFailed && <InlineStatus state="error" message="The signup name could not be removed. Try again." />}
          </View>
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
        {onBackToSetup && (
          <Button label="Back to plan review" variant="secondary"
            disabled={recordingSetup || editor.form?.state.kind === 'saving'}
            onPress={() => {
              if (editor.dirty) setLeaving(true);
              else onBackToSetup();
            }} />
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  body: { padding: 20, gap: 16 },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  review: { gap: 12 },
});
