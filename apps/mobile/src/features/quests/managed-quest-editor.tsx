import { useLayoutEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { EmptyCard } from '@/components/ui/empty-card';
import { EditorPage, editorStyles } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { useQuestEditor } from './use-quest-editor';
import { QuestAccessFeedback } from './quest-access-feedback';
import { QuestEditor } from './quest-editor';
/** Caller must key by owner generation and quest ID; this never creates Auth context. */
export function ManagedQuestEditor({
  questId,
  creating = false,
  onBack,
}: {
  questId: string;
  creating?: boolean;
  onBack: () => void;
}) {
  const exit = useRef(onBack);
  const editor = useQuestEditor(questId, creating, () => exit.current());
  const guard = useRouteDraftGuard(editor.form?.navigationDirty ?? false);
  useLayoutEffect(() => {
    exit.current = () => guard.exit(onBack);
  }, [guard, onBack]);
  const back = () => guard.exit(onBack);
  const feedback = (
    <View style={{ gap: 12 }}>
      <QuestAccessFeedback online={editor.online} />
      {editor.saved ? (
        <Text accessibilityLiveRegion="polite">
          Quest saved. App interventions have not changed.
        </Text>
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
          <Text>Compare it with your edits. Keeping edits does not save them.</Text>
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
          mode={editor.form.base.quest ? 'edit' : 'create'}
          draft={editor.form.draft.quest}
          dirty={editor.form.dirty}
          externalIssue={editor.form.issue}
          navigationDirty={editor.form.navigationDirty}
          state={editor.form.state}
          onChange={(quest) => editor.form?.onChange({ ...editor.form.draft, quest })}
          onSave={editor.form.onSave}
          onDeleteQuest={editor.form.onDelete}
          onDiscard={editor.form.onDiscard}
          onBack={back}
          restrictionNotice="Saving keeps these details for later. It does not start app interventions or award credits."
          scheduleContent={
            <Field
              label="Quest time zone"
              hint="For example America/New_York. These are saved time preferences."
              value={editor.form.draft.timezone}
              editable={editor.form.state !== 'saving'}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(timezone) => editor.form?.onChange({ ...editor.form.draft, timezone })}
            />
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
          <Text style={editorStyles.body}>App interventions have not changed.</Text>
        </EditorPage>
      )}
    </View>
  );
}
