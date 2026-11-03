import { router } from 'expo-router';
import { ActivityPreferencesScreen } from '@/features/settings/activity-preferences-screen';
import { EditorPage } from '@/features/editors/editor-controls';
import { InlineStatus } from '@/components/ui/inline-status';
import { useRuntime } from '../runtime';

export default function Activities() {
  const { runtime } = useRuntime();
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('./profile');
  };
  return runtime ? (
    <ActivityPreferencesScreen onBack={back} />
  ) : (
    <EditorPage title="Redirect Me To" onBack={back}>
      <InlineStatus state="unavailable" message="Open the QA account connection first." />
    </EditorPage>
  );
}
