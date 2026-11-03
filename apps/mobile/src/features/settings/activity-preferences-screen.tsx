import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { preferenceAssets } from '@/design/preference-assets';
import { useAccountAction } from '@/features/account/use-account-action';
import { EditorPage, editorStyles } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { ActivitiesEditor, type SelectionOption } from '@/features/preferences/preference-editors';
import {
  ACTIVITY_LABELS,
  activityIds,
  activitySummary,
} from '@/features/preferences/activity-model';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useActivitiesEditor } from './use-activities-editor';

const options: readonly SelectionOption[] = activityIds.map((id) => ({
  id,
  label: ACTIVITY_LABELS[id],
  icon: preferenceAssets[id === 'arts_and_crafts' ? 'arts' : id],
}));
/** Auth supplies the provider. This consumer never constructs a session or installs a native plan. */
export function ActivityPreferencesScreen({ onBack }: { onBack: () => void }) {
  const editor = useActivitiesEditor();
  const guard = useRouteDraftGuard(editor.navigationDirty);
  const { availability, controller } = useAccountData();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const paused = availability === 'api_paused' || availability === 'recovering';
  const back = () => guard.exit(onBack);
  const feedback = (
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
          Activities saved.
        </Text>
      ) : null}
      {editor.needsReview && !editor.review && !editor.reviewFailed && !editor.query.isError ? (
        <Button
          label="Check latest preferences"
          disabled={editor.reviewing || paused}
          onPress={() => {
            void editor.checkLatest();
          }}
        />
      ) : null}
      {editor.reviewing ? (
        <InlineStatus state="loading" message="Checking the latest preferences…" />
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
            Latest preferences:{' '}
            {editor.review.settings
              ? (activitySummary(editor.review.settings.activities) ?? 'No activities selected')
              : 'No preferences saved yet'}
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
            label="Use latest preferences"
            variant="secondary"
            disabled={!editor.enabled}
            onPress={() => editor.resolveReview(false)}
          />
        </View>
      ) : null}
    </>
  );
  return (
    <View style={{ flex: 1 }}>
      {guard.confirmation}
      {editor.form ? (
        <ActivitiesEditor {...editor.form} options={options} onBack={back} feedback={feedback} />
      ) : (
        <EditorPage title="Redirect Me To" variant="detail" onBack={back}>
          {feedback}
        </EditorPage>
      )}
    </View>
  );
}
