import { View } from 'react-native';
import { preferenceAssets } from '@/design/preference-assets';
import { EditorPage } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { ActivitiesEditor, type SelectionOption } from '@/features/preferences/preference-editors';
import { ACTIVITY_LABELS, activityIds } from '@/features/preferences/activity-model';
import { SettingsEditorFeedback } from './settings-editor-feedback';
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
  const back = () => guard.exit(onBack);
  const feedback = <SettingsEditorFeedback editor={editor} kind="activities" />;
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
