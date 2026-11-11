import { onlineManager } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { formatTime, weekdays } from '@/features/editors/draft-utils';
import { QuestAccessFeedback } from './quest-access-feedback';
import { QuestsScreen } from './quests-screen';
import { useQuestsQuery } from './quests-query';
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
export function ConnectedQuestsScreen({
  onCreate,
  onOpen,
}: {
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const { availability } = useAccountData();
  const online = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const [pages, setPages] = useState<(string | null)[]>([null]);
  const cursor = pages.at(-1) ?? null,
    query = useQuestsQuery(cursor);
  const available = availability === 'ready' && online && !query.isError && !query.isPaused;
  const data = available ? query.data : undefined;
  return (
    <QuestsScreen
      model={{
        interestSummary: null,
        suggestions: { state: 'unavailable' },
        saved: data
          ? {
              state: 'ready',
              items: data.quests.map((q) => ({
                id: q.quest_id,
                title: q.definition.title,
                statusLabel: 'Saved · not active',
                scheduleLabel: `${formatTime(q.definition.start_local)}–${formatTime(q.definition.end_local)}${q.definition.next_day ? ' (next day)' : ''} · ${q.definition.repeat === 'weekly' ? q.definition.weekdays.map((d) => weekdays[d].slice(0, 3)).join(', ') : q.definition.repeat === 'daily' ? 'Daily' : 'Does not repeat'} · ${q.definition.timezone_id}`,
              })),
            }
          : { state: !available ? (query.isError ? 'error' : 'unavailable') : 'loading' },
      }}
      showSavedEmpty
      savedHeading="Accepted"
      busy={query.isFetching}
      onCreate={available ? onCreate : undefined}
      onOpenSaved={available ? onOpen : undefined}
      onRetry={() => {
        void query.refetch();
      }}
      footer={
        <View style={{ gap: 12 }}>
          <QuestAccessFeedback online={online} />
          {pages.length > 1 ? (
            <Button
              label="Previous quests"
              disabled={query.isFetching}
              onPress={() => setPages((old) => old.slice(0, -1))}
            />
          ) : null}
          {data?.next_cursor ? (
            <Button
              label="More saved quests"
              disabled={query.isFetching}
              onPress={() => setPages((old) => [...old, data.next_cursor])}
            />
          ) : null}
        </View>
      }
    />
  );
}
