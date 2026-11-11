import { uuid } from 'expo';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ManagedQuestEditor } from '@/features/quests/managed-quest-editor';
import { safeRequestId } from '@/infrastructure/api/errors';
import { EmptyCard } from '@/components/ui/empty-card';
import { useRuntime } from '../runtime';
export default function Quest() {
  const { runtime } = useRuntime();
  const params = useLocalSearchParams<{ id?: string; create?: string }>();
  const [fresh] = useState(() => uuid.v4());
  const creating = params.create === 'yes',
    id = creating ? fresh : safeRequestId(params.id);
  return runtime && id ? (
    <ManagedQuestEditor
      key={id}
      questId={id}
      creating={creating}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('./quests'))}
    />
  ) : (
    <EmptyCard title="Quest unavailable" description="Connect the development account first." />
  );
}
