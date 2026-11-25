import { useLayoutEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { DetailsPanel } from '@/components/ui/details-panel';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { EmptyCard } from '@/components/ui/empty-card';
import { EditorPage, editorStyles } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { useQuestEditor } from './use-quest-editor';
import { QuestAccessFeedback } from './quest-access-feedback';
import { QuestEditor } from './quest-editor';
import { useNativeOwner } from '@/features/protection/native-owner-boundary';
import { useQuestLifecycle } from './use-quest-lifecycle';
import { QuestExecutionPanel } from './quest-execution-panel';
import { useIsFocused } from 'expo-router';
import { useAppRuntime } from '@/features/account/app-runtime-context';

type Props = { questId: string; creating?: boolean; onBack: () => void; initialDraft?: import('./quest-draft').QuestDraft };
export function ManagedQuestEditor(props: Props) {
  const owner = useNativeOwner();
  const runtime = useAppRuntime();
  return owner || runtime ? (
    <LifecycleQuestEditor
      key={owner ? `${owner.owner}:${owner.generation}` : 'unbound'}
      {...props}
    />
  ) : (
    <QuestDefinitionEditor {...props} />
  );
}
function LifecycleQuestEditor(props: Props) {
  const visible = useIsFocused();
  const lifecycle = useQuestLifecycle(props.questId, true, visible);
  return <QuestDefinitionEditor {...props} lifecycle={lifecycle} />;
}
/** Caller must key by owner generation and quest ID; this never creates Auth context. */
function QuestDefinitionEditor({
  questId,
  creating = false,
  onBack,
  lifecycle,
  initialDraft,
}: Props & { lifecycle?: ReturnType<typeof useQuestLifecycle> }) {
  const exit = useRef(onBack);
  const editor = useQuestEditor(questId, creating, () => exit.current(), initialDraft);
  const [scheduleDirty, setScheduleDirty] = useState(false);
  const navigationDirty =
    (editor.form?.navigationDirty ?? false) ||
    scheduleDirty ||
    !!lifecycle?.state.pendingWrite ||
    !!lifecycle?.state.reviewRequired;
  const guard = useRouteDraftGuard(navigationDirty);
  useLayoutEffect(() => {
    exit.current = () => guard.exit(onBack);
  }, [guard, onBack]);
  const back = () => guard.exit(onBack);
  const feedback = (
    <View style={{ gap: 12 }}>
      <QuestAccessFeedback online={editor.online} />
      {editor.saved ? (
        <Text accessibilityLiveRegion="polite">Quest details saved.</Text>
      ) : null}
      {editor.needsReview ? (
        <Text accessibilityRole="alert">
          {editor.form?.state === 'conflict'
            ? 'This quest changed elsewhere.'
            : 'Change not confirmed.'}{' '}
          Check the latest saved quest before trying again.
        </Text>
      ) : null}
      {editor.needsReview || editor.query.isError ? (
        <Button
          label="Check latest quest"
          disabled={editor.checking}
          busy={editor.checking}
          onPress={() => {
            void editor.checkLatest();
          }}
        />
      ) : null}
      {editor.reviewFailed ? (
        <Text accessibilityRole="alert">
          Could not check the saved quest. Your draft is still here.
        </Text>
      ) : null}
      {editor.form?.state === 'error' ? (
        <Text accessibilityRole="alert">
          Quest could not be saved. Check the values and your connection.
        </Text>
      ) : null}
      {editor.review ? (
        <>
          <Text>
            Latest saved quest:{' '}
            {editor.review.quest
              ? `${editor.review.quest.definition.title} · ${editor.review.quest.definition.activity} · ${editor.review.quest.definition.start_local}–${editor.review.quest.definition.end_local}${editor.review.quest.definition.next_day ? ' (next day)' : ''} · ${editor.review.quest.definition.repeat} · ${editor.review.quest.definition.weekdays.join(', ')} · ${editor.review.quest.definition.timezone_id}`
              : 'No saved quest'}
          </Text>
          <Text>
            Compare it with your edits. Keeping edits does not save them.
          </Text>
          <Button
            label="Keep my quest edits"
            disabled={!editor.enabled || !editor.allowKeep}
            onPress={() => editor.resolveReview(true)}
          />
          <Button
            label="Use latest quest"
            disabled={!editor.enabled}
            onPress={() => editor.resolveReview(false)}
          />
        </>
      ) : null}

    </View>
  );
  return (
    <View style={{ flex: 1 }}>
      {guard.confirmation}
      {editor.form ? (
        <QuestEditor
          mode={editor.form.base.quest ? 'edit' : initialDraft ? 'personalize' : 'create'}
          draft={editor.form.draft.quest}
          dirty={editor.form.dirty}
          externalIssue={editor.form.issue}
          navigationDirty={navigationDirty}
          state={lifecycle?.state.pendingWrite ? 'saving' : editor.form.state}
          onChange={(quest) =>
            editor.form?.onChange({ ...editor.form.draft, quest })
          }
          onSave={editor.form.onSave}
          onDeleteQuest={
            editor.form.onDelete && (!lifecycle || lifecycle.owner)
              ? () => {
                  if (!lifecycle) {
                    editor.form?.onDelete?.();
                    return;
                  }
                  void lifecycle.controller.prepareDelete().then((stopped) => {
                    if (stopped) editor.form?.onDelete?.();
                  });
                }
              : undefined
          }
          onDiscard={editor.form.onDiscard}
          onBack={back}
          restrictionNotice="Your quest is saved separately from device protection."
          secondaryContent={
            <DetailsPanel title="Protection options">
              <Field
                label="Quest time zone"
                value={editor.form.draft.timezone}
                editable={editor.form.state !== 'saving' && !lifecycle?.state.pendingWrite}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(timezone) => editor.form?.onChange({ ...editor.form.draft, timezone })}
              />
              {editor.form.base.quest && lifecycle ? (
                <QuestExecutionPanel
                  quest={editor.form.base.quest}
                  definitionDirty={editor.form.dirty || editor.form.state !== 'ready'}
                  lifecycle={lifecycle}
                  onDraftDirtyChange={setScheduleDirty}
                />
              ) : null}
            </DetailsPanel>
          }
          feedback={feedback}
        />
      ) : (
        <EditorPage title="Quest" onBack={back}>
          <EmptyCard
            title={
              editor.missing
                ? 'Quest no longer saved'
                : editor.query.isError || editor.unavailable
                  ? 'Quest unavailable'
                  : 'Loading quest…'
            }
            description={
              editor.missing
                ? 'Return to your quests. A deleted quest needs a new entry.'
                : 'Connect and verify access to load your saved quest.'
            }
          />
          {feedback}
          {editor.query.isError ? (
            <Button
              label="Retry loading quest"
              onPress={() => {
                void editor.query.refetch();
              }}
            />
          ) : null}
          <Text style={editorStyles.body}>
            App interventions have not changed.
          </Text>
        </EditorPage>
      )}
    </View>
  );
}
