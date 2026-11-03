import { router, useLocalSearchParams } from 'expo-router';
import { PlanDraftScreen } from '@/features/settings/plan-draft-screen';
import { isPlanField } from '@/features/plans/plan-draft-model';
import { EditorPage } from '@/features/editors/editor-controls';
import { InlineStatus } from '@/components/ui/inline-status';
import { useRuntime } from '../runtime';

export default function Plan() {
  const { runtime } = useRuntime();
  const { field } = useLocalSearchParams<{ field: string }>();
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('./profile');
  };
  return runtime && isPlanField(field) ? (
    <PlanDraftScreen key={field} field={field} onBack={back} />
  ) : (
    <EditorPage title="Plan draft" onBack={back}>
      <InlineStatus
        state="unavailable"
        message="Open the QA account connection and choose a draft field first."
      />
    </EditorPage>
  );
}
