import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { focusControl } from '@/components/ui/focus-control';
import { useRef, useState, type ComponentRef, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { questeditorAssets as assets } from '@/design/questeditor-assets';
import { colors, fonts } from '@/design/tokens';
import {
  Choice,
  EditorActions,
  EditorPage,
  TimeControl,
  editorStyles,
  weekdays,
  toggleItem,
  parseTime,
  type EditorState,
} from '@/features/editors/editor-controls';
import { durationLabel, questDraftIssue, questDuration, type QuestDraft } from './quest-draft';

export type QuestEditorProps = {
  mode: 'create' | 'personalize' | 'edit';
  draft: QuestDraft;
  dirty: boolean;
  onChange: (draft: QuestDraft) => void;
  onBack: () => void;
  onDiscard: () => void;
  onSave?: (draft: QuestDraft) => void;
  onCancelQuest?: () => void;
  state?: EditorState;
  interestLabel?: string;
  restrictionNotice?: string;
};
export function QuestEditor({
  mode,
  draft,
  dirty,
  onChange,
  onBack,
  onDiscard,
  onSave,
  onCancelQuest,
  state = 'ready',
  interestLabel,
  restrictionNotice,
}: QuestEditorProps) {
  const [durationText, setDurationText] = useState('');
  const [repeatOpen, setRepeatOpen] = useState(false),
    [durationOpen, setDurationOpen] = useState(false),
    [cancel, setCancel] = useState(false);
  const cancelTrigger = useRef<ComponentRef<typeof Button>>(null);
  const busy = state === 'saving',
    issue = questDraftIssue(draft);
  const change = (patch: Partial<QuestDraft>) => {
    if (!busy) onChange({ ...draft, ...patch });
  };
  return (
    <EditorPage
      title={
        mode === 'create'
          ? 'Custom quest'
          : mode === 'personalize'
            ? 'Personalize quest'
            : 'Edit quest'
      }
      subtitle={
        mode === 'personalize' ? 'Your suggestion, your way. Change any detail.' : undefined
      }
      dirty={dirty}
      busy={busy}
      onBack={onBack}>
      <Card
        header={
          <View style={styles.cardHeading}>
            {interestLabel ? (
              <View style={styles.badge}>
                <DesignArtwork asset={assets.interest} />
                <Text style={styles.badgeText}>{interestLabel}</Text>
              </View>
            ) : null}
            <Text style={styles.header}>Make it your own</Text>
          </View>
        }>
        <DecoratedField
          label="Quest name"
          value={draft.title}
          editable={!busy}
          onChangeText={(title) => change({ title })}
        />
        <DecoratedField
          label="What will you do?"
          value={draft.activity}
          editable={!busy}
          onChangeText={(activity) => change({ activity })}
        />
        {mode === 'personalize' ? (
          <Text style={editorStyles.body}>Try anything — even “10 pushups” counts.</Text>
        ) : null}
      </Card>
      <Card
        header={
          <View style={styles.cardHeading}>
            <DesignArtwork asset={assets.calendar} />
            <Text style={styles.header}>Make time for it</Text>
            {mode === 'personalize' ? <Text style={styles.hint}>Suggested for you</Text> : null}
          </View>
        }>
        <View style={editorStyles.row}>
          <TimeControl
            label="Start time"
            value={draft.start}
            disabled={busy}
            onChange={(start) => change({ start })}
          />
          <TimeControl
            label="End time"
            value={draft.end}
            disabled={busy}
            onChange={(end) => change({ end })}
          />
        </View>
        {draft.nextDay ||
        (parseTime(draft.start) !== null &&
          parseTime(draft.end) !== null &&
          parseTime(draft.end)! <= parseTime(draft.start)!) ? (
          <Choice
            label="Ends the next day"
            checked={draft.nextDay}
            disabled={busy}
            onPress={() => change({ nextDay: !draft.nextDay })}
          />
        ) : null}
        <View style={editorStyles.row}>
          <DesignArtwork asset={assets.timer} />
          <Text style={styles.rowLabel}>Duration</Text>
          <Button
            label={durationLabel(questDuration(draft))}
            accessibilityLabel="Change duration"
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setDurationText(String(questDuration(draft) ?? ''));
              setDurationOpen(!durationOpen);
            }}
            trailingVisual={<DesignArtwork asset={assets.duration} />}
            style={styles.selector}
            labelStyle={styles.selectorText}
          />
        </View>
        {durationOpen ? (
          <Field
            label="Duration in minutes"
            keyboardType="number-pad"
            value={durationText}
            editable={!busy}
            onChangeText={(raw) => {
              setDurationText(raw);
              const start = parseTime(draft.start),
                minutes = Number(raw);
              if (start !== null && /^\d+$/.test(raw) && minutes > 0 && minutes < 1440) {
                const end = start + minutes;
                change({
                  end: `${String(Math.floor((end % 1440) / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`,
                  nextDay: end >= 1440,
                });
              } else change({ end: '' });
            }}
            hint="Changes the end time of this local draft."
          />
        ) : null}
        <View style={editorStyles.row}>
          <Text style={styles.rowLabel}>Repeat</Text>
          <Button
            label={{ none: 'Does not repeat', daily: 'Daily', weekly: 'Weekly' }[draft.repeat]}
            variant="secondary"
            disabled={busy}
            onPress={() => setRepeatOpen(!repeatOpen)}
            trailingVisual={<DesignArtwork asset={assets.repeat} />}
            style={styles.repeat}
            labelStyle={styles.repeatText}
          />
        </View>
        {repeatOpen ? (
          <View style={editorStyles.panel}>
            {(['none', 'daily', 'weekly'] as const).map((value) => (
              <Choice
                key={value}
                radio
                label={{ none: 'Does not repeat', daily: 'Daily', weekly: 'Weekly' }[value]}
                checked={draft.repeat === value}
                disabled={busy}
                onPress={() => {
                  change({ repeat: value });
                  setRepeatOpen(false);
                }}
              />
            ))}
          </View>
        ) : null}
        {draft.repeat === 'weekly' ? (
          <>
            <View style={styles.days}>
              {weekdays.map((day, index) => (
                <Choice
                  key={day}
                  compact
                  label={day.slice(0, 3)}
                  checked={draft.days.includes(index)}
                  disabled={busy}
                  onPress={() => change({ days: toggleItem(draft.days, index) })}
                />
              ))}
            </View>
            <Text style={styles.hint}>
              Every{' '}
              {weekdays
                .filter((_, i) => draft.days.includes(i))
                .map((day) => day.slice(0, 3))
                .join(', ') || 'chosen day'}{' '}
              · {draft.days.length} times a week
            </Text>
          </>
        ) : null}
      </Card>
      {restrictionNotice ? (
        <View style={editorStyles.row}>
          <DesignArtwork asset={assets.lock} />
          <Text style={[styles.hint, { flex: 1 }]}>{restrictionNotice}</Text>
        </View>
      ) : null}
      {dirty && issue ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {issue}
        </Text>
      ) : null}
      <EditorActions
        state={state}
        dirty={dirty}
        valid={!issue}
        onSave={onSave ? () => onSave(draft) : undefined}
        onDiscard={() => {
          setDurationOpen(false);
          onDiscard();
        }}
        saveLabel="Save quest"
      />
      {mode === 'edit' && onCancelQuest ? (
        <Button
          ref={cancelTrigger}
          label="Cancel quest"
          variant="secondary"
          disabled={busy}
          onPress={() => setCancel(true)}
        />
      ) : null}
      {cancel ? (
        <ConfirmationDialog
          title="Cancel this quest?"
          keepLabel="Keep quest"
          discardLabel="Confirm cancellation"
          discardDisabled={busy}
          onKeep={() => {
            setCancel(false);
            focusControl(cancelTrigger.current);
          }}
          onDiscard={() => {
            setCancel(false);
            onCancelQuest?.();
          }}
        />
      ) : null}
    </EditorPage>
  );
}
function DecoratedField(props: React.ComponentProps<typeof Field>) {
  return (
    <View>
      <Field {...props} trailingVisual={<DesignArtwork asset={assets.pencil} />} />
    </View>
  );
}
function Card({ header, children }: PropsWithChildren<{ header: ReactNode }>) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>{header}</View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.warmOutline,
    borderRadius: 24,
    backgroundColor: colors.warmCard,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 42,
    backgroundColor: colors.warmHeader,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  header: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.warmForeground },
  cardBody: { padding: 16, gap: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 12,
    backgroundColor: colors.darkNav,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.warmHeader },
  hint: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.muted },
  rowLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.darkNav, flex: 1 },
  selector: {
    borderWidth: 0,
    borderRadius: 12,
    backgroundColor: '#F0EBE0',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  selectorText: { fontSize: 13, color: colors.darkNav },
  repeat: { borderWidth: 0, minHeight: 44, paddingHorizontal: 4 },
  repeatText: { fontSize: 13, color: colors.readableSuccess },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.error },
});
