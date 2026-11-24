import { useEffect } from 'react';
import { Text } from 'react-native';
import { AgeEditor } from '@/features/preferences/preference-editors';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { usePersonalization } from './use-personalization';
import { Button } from '@/components/ui/button';

export function AgePreferenceScreen({ onBack }: { onBack(): void }) {
  const editor = usePersonalization();
  const form = editor.form;
  const guard = useRouteDraftGuard(!!form?.navigationDirty);
  useEffect(() => { if (editor.saved) onBack(); }, [editor.saved, onBack]);
  return <>
    {guard.confirmation}
    <AgeEditor options={Array.from({ length: 63 }, (_, i) => i + 18)} value={form?.draft.age ?? null} onChange={age => { if (form) form.onChange({ ...form.draft, age }); }}
      onBack={() => guard.exit(onBack)} onSave={form?.draft.age ? form.onSave : undefined} dirty={!!form?.dirty && form.draft.age !== null} state={form?.state ?? 'unavailable'} />
    {editor.needsReview ? <><Text>Your preferences changed or the save was not confirmed.</Text><Button label="Check latest preferences" onPress={() => { void editor.checkLatest(); }} />
      {editor.review ? <><Button label="Keep my changes" onPress={() => editor.resolveReview(true)} /><Button label="Use latest preferences" onPress={() => editor.resolveReview(false)} /></> : null}</> : null}
  </>;
}
