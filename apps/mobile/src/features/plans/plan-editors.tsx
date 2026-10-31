import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { preferenceAssets as assets } from '@/design/preference-assets';
import { planeditorAssets } from '@/design/planeditor-assets';
import { colors, fonts } from '@/design/tokens';
import {
  Choice,
  EditorActions,
  TimeControl,
  editorStyles,
  weekdays,
  toggleItem,
  type EditorState,
} from '@/features/editors/editor-controls';
import { parseTime } from '@/features/editors/draft-utils';
import { TimeRangeControl, minutesTime } from './time-range-control';
export type PlanActions = {
  dirty: boolean;
  state?: EditorState;
  onSave?: () => void;
  onDiscard?: () => void;
};
function Actions({
  label,
  valid = true,
  ...props
}: PlanActions & { label: string; valid?: boolean }) {
  return (
    <EditorActions
      {...props}
      state={props.state ?? 'ready'}
      saveLabel={label}
      valid={valid}
      checkAsset={assets.save}
    />
  );
}
export function DaysEditor({
  days,
  onChange,
  ...actions
}: PlanActions & { days: readonly number[]; onChange: (days: readonly number[]) => void }) {
  return (
    <View style={editorStyles.panel}>
      <Text style={editorStyles.body}>Choose the days you want nudges.</Text>
      <View style={editorStyles.row}>
        {[
          ['Weekdays', [0, 1, 2, 3, 4]],
          ['Weekends', [5, 6]],
          ['All days', [0, 1, 2, 3, 4, 5, 6]],
        ].map(([label, preset]) => (
          <Button
            key={String(label)}
            label={String(label)}
            variant="secondary"
            disabled={actions.state === 'saving'}
            onPress={() => onChange(preset as number[])}
            style={styles.preset}
            labelStyle={styles.small}
          />
        ))}
      </View>
      {weekdays.map((day, i) => (
        <Choice
          key={day}
          label={day}
          checked={days.includes(i)}
          indicator={assets.checked}
          disabled={actions.state === 'saving'}
          onPress={() => onChange(toggleItem(days, i))}
        />
      ))}
      <Actions
        {...actions}
        label="Save days"
        valid={days.every((i) => Number.isInteger(i) && i >= 0 && i <= 6)}
      />
    </View>
  );
}
export type HoursDraft = Readonly<{ start: string; end: string; nextDay: boolean }>;
export function HoursEditor({
  draft,
  onChange,
  ...actions
}: PlanActions & { draft: HoursDraft; onChange: (draft: HoursDraft) => void }) {
  const start = parseTime(draft.start),
    end = parseTime(draft.end);
  const valid = start !== null && end !== null && (draft.nextDay ? end < start : end > start);
  return (
    <View style={editorStyles.panel}>
      <Text style={editorStyles.body}>
        Choose the time range for nudges. Move either handle or edit the times.
      </Text>
      <View style={editorStyles.row}>
        <TimeControl
          label="Start time"
          value={draft.start}
          disabled={actions.state === 'saving'}
          onChange={(start) => onChange({ ...draft, start })}
        />
        <TimeControl
          label="End time"
          value={draft.end}
          disabled={actions.state === 'saving'}
          onChange={(end) => onChange({ ...draft, end })}
        />
      </View>
      {start !== null && end !== null ? (
        <TimeRangeControl
          start={start}
          end={end}
          disabled={actions.state === 'saving'}
          onChange={(start, end) =>
            onChange({ ...draft, start: minutesTime(start), end: minutesTime(end) })
          }
        />
      ) : null}
      <View style={styles.endpoints}>
        <Text style={styles.endpoint}>12:00 AM</Text>
        <Text style={styles.endpoint}>12:00 PM</Text>
        <Text style={styles.endpoint}>11:59 PM</Text>
      </View>
      {draft.nextDay || (start !== null && end !== null && end <= start) ? (
        <Choice
          label="Ends the next day"
          checked={draft.nextDay}
          disabled={actions.state === 'saving'}
          onPress={() => onChange({ ...draft, nextDay: !draft.nextDay })}
        />
      ) : null}
      {!valid ? (
        <Text accessibilityRole="alert" style={styles.error}>
          Choose a valid range. Confirm the next day for an overnight range.
        </Text>
      ) : null}
      <Actions {...actions} label="Save hours" valid={valid} />
    </View>
  );
}
export type NumberBounds = Readonly<{ min: number; max: number; step: number }>;
export type SessionsDraft = Readonly<{ count: number | null; minutes: number | null }>;
function validBounds(bounds?: NumberBounds): bounds is NumberBounds {
  return Boolean(
    bounds &&
    [bounds.min, bounds.max, bounds.step].every(Number.isSafeInteger) &&
    bounds.min >= 0 &&
    bounds.max >= bounds.min &&
    bounds.step > 0,
  );
}
function within(value: number | null, bounds?: NumberBounds): boolean {
  return (
    value !== null &&
    validBounds(bounds) &&
    Number.isSafeInteger(value) &&
    value >= bounds.min &&
    value <= bounds.max
  );
}
export function SessionsEditor({
  draft,
  bounds,
  onChange,
  ...actions
}: PlanActions & {
  draft: SessionsDraft;
  bounds?: { count: NumberBounds; minutes: NumberBounds };
  onChange: (draft: SessionsDraft) => void;
}) {
  const valid = within(draft.count, bounds?.count) && within(draft.minutes, bounds?.minutes);
  return (
    <View style={editorStyles.panel}>
      <Text style={editorStyles.body}>Plan a little time for your apps, on your terms.</Text>
      <Stepper
        label="Sessions per day"
        value={draft.count}
        bounds={bounds?.count}
        disabled={actions.state === 'saving'}
        onChange={(count) => onChange({ ...draft, count })}
      />
      <Stepper
        label="Minutes per session"
        value={draft.minutes}
        bounds={bounds?.minutes}
        disabled={actions.state === 'saving'}
        onChange={(minutes) => onChange({ ...draft, minutes })}
      />
      {draft.count !== null &&
      draft.minutes !== null &&
      valid &&
      Number.isSafeInteger(draft.count * draft.minutes) ? (
        <Text style={styles.total}>
          {draft.count * draft.minutes} min of planned app time each day
        </Text>
      ) : null}
      {!bounds ? (
        <Text style={editorStyles.body}>Session choices aren’t available yet.</Text>
      ) : null}
      <Actions {...actions} label="Save sessions" valid={valid} />
    </View>
  );
}
function Stepper({
  label,
  value,
  bounds,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  bounds?: NumberBounds;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const knownBounds = validBounds(bounds);
  return (
    <View style={styles.stepper}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.buttons}>
        <Button
          label=""
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          variant="secondary"
          leadingVisual={<DesignArtwork asset={planeditorAssets.minus} />}
          style={styles.stepButton}
          disabled={disabled || !knownBounds || value === null || value <= bounds.min}
          onPress={() => {
            if (knownBounds && value !== null) onChange(Math.max(bounds.min, value - bounds.step));
          }}
        />
        <Text style={styles.value}>{value ?? '—'}</Text>
        <Button
          label=""
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          variant="secondary"
          leadingVisual={<DesignArtwork asset={planeditorAssets.plus} />}
          style={styles.stepButton}
          disabled={disabled || !knownBounds || (value !== null && value >= bounds.max)}
          onPress={() => {
            if (knownBounds)
              onChange(Math.min(bounds.max, value === null ? bounds.min : value + bounds.step));
          }}
        />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  preset: { flexGrow: 1, minHeight: 44, paddingHorizontal: 8, borderRadius: 8 },
  small: { fontSize: 12, lineHeight: 17 },
  endpoints: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
  endpoint: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  error: { fontFamily: fonts.regular, fontSize: 12, color: colors.error },
  stepper: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, minHeight: 54 },
  controlLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.darkCanvas,
    flex: 1,
    minWidth: 100,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    padding: 4,
  },
  stepButton: {
    width: 44,
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
    gap: 0,
    borderWidth: 0,
    borderRadius: 7,
    backgroundColor: '#E8F8ED',
  },
  value: {
    minWidth: 24,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 19,
    color: colors.darkCanvas,
  },
  total: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0FAF4',
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.readableSuccess,
  },
});
