import { onlineManager } from '@tanstack/react-query';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { formatTime, weekdays } from '@/features/editors/draft-utils';
import { QuestAccessFeedback } from './quest-access-feedback';
import { QuestsScreen } from './quests-screen';
import { useQuestsQuery, useQuestMutation } from './quests-query';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { activitySummary } from '@/features/preferences/activity-model';
import { suggestedQuests, questTemplate } from './quest-suggestions';
import { questForm, definitionFor } from './quest-definition-draft';
import { uuid } from 'expo';
import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { ManagedQuestEditor } from './managed-quest-editor';
import { decodeQuestContext, emptyQuestContext, generateQuestSuggestion } from './quest-generation';
import type { QuestDraft } from './quest-draft';
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
export function ConnectedQuestsScreen({
  onCreate,
  onOpen,
}: {
  onCreate: (template?: string) => void;
  onOpen: (id: string) => void;
}) {
  const { availability, scope } = useAccountData();
  const ios = useIOSSelectionDevice();
  const native = useNativeOwner();
  const online = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const settings = useSettingsQuery();
  const acceptLock = useRef(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [failedAccept, setFailedAccept] = useState(false);
  const mutation = useQuestMutation((response) => {
    acceptLock.current = false;
    setAccepting(null);
    if (response.quest) onOpen(response.quest.quest_id);
  }, () => setFailedAccept(true));
  const [pages, setPages] = useState<(string | null)[]>([null]);
  const cursor = pages.at(-1) ?? null,
    query = useQuestsQuery(cursor);
  const available = availability === 'ready' && online && !query.isError && !query.isPaused;
  const data = available ? query.data : undefined;
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Awaited<ReturnType<typeof generateQuestSuggestion>>>(null);
  const [generationMessage, setGenerationMessage] = useState('');
  const [reviewing, setReviewing] = useState<{ id: string; draft: QuestDraft } | null>(null);
  const generationLock = useRef(false);
  const suggestionTurn = useRef(0);
  async function generate() {
    const savedSettings = settings.data;
    if (!scope?.canRun() || generationLock.current || !savedSettings) return;
    generationLock.current = true;
    setGenerating(true);
    setGenerationMessage('');
    setGenerated(null);
    try {
      const context = await (ios?.questPlanningContext?.() ??
        (native && native.port.questPlanningContext?.(native.owner)))?.then(decodeQuestContext).catch(() => emptyQuestContext);
      const planning = context ?? emptyQuestContext;
      const suggestion = await scope.read(operation => generateQuestSuggestion(operation,
        savedSettings.settings, planning, new Date(), suggestionTurn.current));
      if (!scope.isCurrent()) return;
      if (suggestion) {
        setGenerated(suggestion);
        suggestionTurn.current += 1;
      }
      else setGenerationMessage(context?.calendarChecked
        ? 'No five-minute opening found in the next three hours today.'
        : 'There isn’t enough time left today for a suggested quest.');
    } catch {
      if (scope.isCurrent()) setGenerationMessage('Couldn’t create a suggestion. Try again.');
    } finally {
      generationLock.current = false;
      if (scope.isCurrent()) setGenerating(false);
    }
  }
  if (reviewing) {
    return <ManagedQuestEditor questId={reviewing.id} creating initialDraft={reviewing.draft}
      onBack={() => setReviewing(null)} />;
  }
  return (
    <QuestsScreen
      model={{
        interestSummary: generated?.kind === 'task' ? '✦ Based on an unfinished task or reminder'
          : generated?.kind === 'event' ? '✦ Based on an upcoming calendar event'
            : settings.data?.settings?.activities ? `✦ Suggested from your ${activitySummary(settings.data.settings.activities) ?? 'interests'}` : null,
        suggestions: available && settings.data ? { state: 'ready', items: suggestedQuests(settings.data.settings?.activities?.selected_activity_ids ?? [], data?.quests.map(q => q.definition.title) ?? []) } : { state: settings.isError ? 'error' : settings.isPending ? 'loading' : 'unavailable' },
        saved: data
          ? {
              state: 'ready',
              items: data.quests.map((q) => ({
                id: q.quest_id,
                title: q.definition.title,
                statusLabel: 'Saved quest',
                activityLabel: q.definition.activity,
                scheduleLabels: [
                  `📅 ${q.definition.repeat === 'weekly' ? q.definition.weekdays.map((d) => weekdays[d].slice(0, 3)).join(' · ') : q.definition.repeat === 'daily' ? 'Every day' : 'Does not repeat'}`,
                  `🕒 ${formatTime(q.definition.start_local)}–${formatTime(q.definition.end_local)}${q.definition.next_day ? ' (next day)' : ''}`,
                ],
                scheduleLabel: `${formatTime(q.definition.start_local)}–${formatTime(q.definition.end_local)}${q.definition.next_day ? ' (next day)' : ''} · ${q.definition.repeat === 'weekly' ? q.definition.weekdays.map((d) => weekdays[d].slice(0, 3)).join(', ') : q.definition.repeat === 'daily' ? 'Daily' : 'Does not repeat'} · ${q.definition.timezone_id}`,
              })),
            }
          : { state: !available ? (query.isError ? 'error' : 'unavailable') : 'loading' },
      }}
      showSavedEmpty
      suggestionAction={<View style={{ gap: 10 }}>
        <Button label="Generate suggestions" busy={generating} busyLabel="Generating…"
          disabled={!online || availability !== 'ready' || !settings.data}
          onPress={() => { void generate(); }} />
        {generationMessage ? <Text accessibilityLiveRegion="polite">{generationMessage}</Text> : null}
        {generated ? <>
          <Text accessibilityRole="header">{generated.draft.title}</Text>
          <Text>{formatTime(generated.draft.start)}–{formatTime(generated.draft.end)} today · {
            generated.calendarChecked ? 'Checked against connected timed events' : 'Suggested time'
          }</Text>
          {generated.kind === 'goal' && !generated.usesAI ? <Text>Quick suggestion from Hoosh</Text> : null}
          <Button label="Review suggested quest" variant="secondary" onPress={() => {
            if (generated.startsAt <= Date.now()) {
              setGenerated(null);
              setGenerationMessage('That time has passed. Generate a new suggestion.');
            } else {
              setReviewing({ id: uuid.v4(), draft: generated.draft });
            }
          }} />
        </> : null}
      </View>}
      savedHeading="Accepted"
      busy={query.isFetching || mutation.isPending}
      onCreate={available ? () => onCreate() : undefined}
      onPersonalize={available ? (id) => onCreate(id) : undefined}
      onAccept={available && !accepting ? (templateId) => {
        const draft = questTemplate(templateId);
        if (!draft || acceptLock.current) return;
        acceptLock.current = true;
        const id = uuid.v4();
        setAccepting(id);
        setFailedAccept(false);
        mutation.submit({ kind: 'save', id, body: { expected_revision: 0, definition: definitionFor({ ...questForm(null), quest: draft }) } });
      } : undefined}
      onOpenSaved={available ? onOpen : undefined}
      onRetry={() => {
        void query.refetch();
        void settings.refetch();
      }}
      footer={
        <View style={{ gap: 12 }}>
          <QuestAccessFeedback online={online} />
          {failedAccept && accepting ? <>
            <Text>Could not confirm the saved quest. Check it before accepting again.</Text>
            <Button label="Check accepted quest" onPress={() => onOpen(accepting)} />
          </> : null}
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
