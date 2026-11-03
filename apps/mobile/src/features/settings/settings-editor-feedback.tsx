import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { editorStyles } from '@/features/editors/editor-controls';
import { activitySummary } from '@/features/preferences/activity-model';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useAccountAction } from '@/features/account/use-account-action';
import { planReviewSummary } from '@/features/plans/plan-draft-model';
import type { useSettingsEditor } from './use-settings-editor';

export function SettingsEditorFeedback<D>({
  editor,
  kind,
}: {
  editor: ReturnType<typeof useSettingsEditor<D>>;
  kind: 'activities' | 'plan';
}) {
  const { availability, controller } = useAccountData();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const paused = availability === 'api_paused' || availability === 'recovering';
  return (
    <>
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
      {editor.query.isError && !editor.reviewFailed ? (
        <InlineStatus
          state="error"
          message="Your preferences could not be verified. Your changes have not been discarded."
          onRetry={() => {
            void (editor.needsReview ? editor.checkLatest() : editor.query.refetch());
          }}
          retrying={editor.query.isFetching}
        />
      ) : null}
      {!editor.form && !editor.query.isError ? (
        <InlineStatus
          state={editor.query.isPaused || availability !== 'ready' ? 'unavailable' : 'loading'}
          message={
            availability !== 'ready'
              ? 'Preferences are temporarily unavailable.'
              : editor.query.isPaused
                ? 'Connect to load your preferences.'
                : 'Loading your preferences…'
          }
        />
      ) : null}
      {editor.saved ? (
        <Text accessibilityLiveRegion="polite" style={editorStyles.body}>
          {kind === 'activities'
            ? 'Activities saved.'
            : editor.query.data?.settings?.plan_draft
              ? 'Draft saved.'
              : 'Draft cleared.'}
        </Text>
      ) : null}
      {editor.needsReview && !editor.review && !editor.reviewFailed && !editor.query.isError ? (
        <Button
          label={kind === 'activities' ? 'Check latest preferences' : 'Check latest draft'}
          disabled={editor.reviewing || paused}
          onPress={() => {
            void editor.checkLatest();
          }}
        />
      ) : null}
      {editor.reviewing ? (
        <InlineStatus
          state="loading"
          message={
            kind === 'activities'
              ? 'Checking the latest preferences…'
              : 'Checking the latest draft…'
          }
        />
      ) : null}
      {editor.reviewFailed ? (
        <InlineStatus
          state="error"
          message="The latest preferences could not be loaded. Your draft is still here."
          onRetry={() => {
            void editor.checkLatest();
          }}
        />
      ) : null}
      {editor.review ? (
        <View style={editorStyles.panel}>
          <Text style={editorStyles.body}>
            {kind === 'activities' ? 'Latest preferences: ' : 'Latest draft: '}
            {kind === 'activities'
              ? editor.review.settings
                ? (activitySummary(editor.review.settings.activities) ?? 'No activities selected')
                : 'No preferences saved yet'
              : planReviewSummary(editor.review.settings?.plan_draft ?? null)}
          </Text>
          <Text style={editorStyles.body}>
            Compare these with your draft, then choose which to keep. Keeping your edits does not
            save them.
          </Text>
          <Button
            label="Keep my edits"
            disabled={!editor.enabled}
            onPress={() => editor.resolveReview(true)}
          />
          <Button
            label={kind === 'activities' ? 'Use latest preferences' : 'Use latest draft'}
            variant="secondary"
            disabled={!editor.enabled}
            onPress={() => editor.resolveReview(false)}
          />
        </View>
      ) : null}
    </>
  );
}
