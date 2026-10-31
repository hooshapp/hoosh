import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AgeEditor, ActivitiesEditor, AppsEditor, type ActivityDraft } from '@/features/preferences/preference-editors';
import { EditorPage } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { EmptyCard } from '@/components/ui/empty-card';
export default function PreferenceDetail() {
  const { field } = useLocalSearchParams<{ field: string }>();
  const [age, setAge] = useState<number | null>(null);
  const [activities, setActivities] = useState<ActivityDraft>({ selected: [], customSelected: false, custom: '' });
  const dirty = activities.customSelected || activities.custom !== '';
  const guard = useRouteDraftGuard(dirty);
  const back = () => guard.exit(() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/settings'); });
  const editor = field === 'age' ? <AgeEditor value={age} options={[]} onChange={setAge} onBack={back} dirty={false} state="unavailable" />
    : field === 'activities' ? <ActivitiesEditor draft={activities} options={[]} onChange={setActivities} onBack={back} dirty={dirty} state="unavailable" />
    : field === 'apps' ? <AppsEditor selection={{ kind: 'native', summary: null }} onBack={back} dirty={false} state="unavailable" />
    : <EditorPage title="Settings" onBack={back}><EmptyCard title="Setting unavailable" description="Return to Settings to choose an available option." /></EditorPage>;
  return <View style={{ flex: 1 }}>{guard.confirmation}{editor}</View>;
}
