import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { EditorActions, EditorPage, editorStyles } from '@/features/editors/editor-controls';
import { useRouteDraftGuard } from '@/features/editors/use-route-draft-guard';
import { DaysEditor, HoursEditor, SessionsEditor } from '@/features/plans/plan-editors';
import { planDraftInput, type PlanField } from '@/features/plans/plan-draft-model';
import { SettingsEditorFeedback } from './settings-editor-feedback';
import { usePlanDraftEditor } from './use-plan-draft-editor';

const titles: Record<PlanField, string> = {
  days: 'Draft days',
  hours: 'Draft hours',
  sessions: 'Draft sessions',
};
const bounds = { count: { min: 1, max: 1000, step: 1 }, minutes: { min: 1, max: 1440, step: 1 } };
/** A persisted preference draft, never native installation or an onboarding producer. */
export function PlanDraftScreen({ field, onBack }: { field: PlanField; onBack: () => void }) {
  const editor = usePlanDraftEditor(field);
  const guard = useRouteDraftGuard(editor.navigationDirty);
  const form = editor.form;
  const input = form?.draft;
  const details = form?.error?.details;
  const issues = details && 'fields' in details ? details.fields : [];
  const zoneError = issues.some((issue) => issue.field === 'plan_draft.timezone_id')
    ? 'Use a recognized timezone such as America/New_York, or leave it blank.'
    : undefined;
  const actions = form
    ? { dirty: form.dirty, state: form.state, onSave: form.onSave, onDiscard: form.onDiscard }
    : null;
  return (
    <View style={{ flex: 1 }}>
      {guard.confirmation}
      <EditorPage
        title={titles[field]}
        variant="detail"
        dirty={editor.navigationDirty}
        busy={form?.state === 'saving'}
        onBack={() => guard.exit(onBack)}
      >
        <Text accessibilityRole="header" style={editorStyles.body}>
          {!editor.navigationDirty && editor.enabled && editor.query.data?.settings?.plan_draft
            ? 'Saved draft — not active'
            : 'Draft — not active'}
        </Text>
        <Text style={editorStyles.body}>
          Saving these preferences does not activate protection or change an installed plan.
        </Text>
        <SettingsEditorFeedback editor={editor} kind="plan" />
        {issues.some((issue) => issue.field !== 'plan_draft.timezone_id') ? (
          <Text accessibilityRole="alert" style={editorStyles.body}>
            Check the draft values. Days must be unique, entered times must form a valid range, and
            session values must be within the available choices. Your changes are still here.
          </Text>
        ) : null}
        {form && actions ? (
          <>
            {input === null ? (
              <>
                <Text style={editorStyles.body}>
                  The entire saved plan draft will be cleared when you save.
                </Text>
                <Button
                  label="Keep editing draft"
                  variant="secondary"
                  disabled={form.state === 'saving'}
                  onPress={form.onDiscard}
                />
                <EditorActions {...actions} saveLabel="Save cleared draft" />
              </>
            ) : input ? (
              <>
                {field === 'days' ? (
                  <>
                    <Button
                      label="Clear draft days"
                      variant="secondary"
                      disabled={form.state === 'saving' || input.weekdays.length === 0}
                      onPress={() => form.onChange({ ...input, weekdays: [] })}
                    />
                    <DaysEditor
                      {...actions}
                      draftOnly
                      days={input.weekdays}
                      onChange={(weekdays) => form.onChange({ ...input, weekdays })}
                    />
                  </>
                ) : field === 'hours' ? (
                  <>
                    <Field
                      label="Draft timezone (IANA, optional)"
                      hint="For example America/New_York. Leave blank to keep the timezone unset."
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={input.timezone}
                      editable={form.state !== 'saving'}
                      onChangeText={(timezone) => form.onChange({ ...input, timezone })}
                      error={zoneError}
                    />
                    <Button
                      label="Clear draft hours"
                      variant="secondary"
                      disabled={form.state === 'saving' || input.hours === null}
                      onPress={() => form.onChange({ ...input, hours: null })}
                    />
                    <HoursEditor
                      {...actions}
                      draftOnly
                      draft={input.hours ?? { start: '', end: '', nextDay: false }}
                      onChange={(hours) => form.onChange({ ...input, hours })}
                    />
                  </>
                ) : (
                  <SessionsEditor
                    {...actions}
                    draftOnly
                    bounds={bounds}
                    draft={input.sessions}
                    onChange={(sessions) => form.onChange({ ...input, sessions })}
                  />
                )}
                <Button
                  label="Clear entire plan draft"
                  variant="secondary"
                  disabled={
                    form.state === 'saving' || editor.query.data?.settings?.plan_draft == null
                  }
                  onPress={() => form.onChange(null)}
                />
              </>
            ) : null}
            {input === null ? (
              <Button
                label="Start a new draft"
                variant="secondary"
                disabled={form.state === 'saving'}
                onPress={() => form.onChange(planDraftInput(null))}
              />
            ) : null}
          </>
        ) : null}
      </EditorPage>
    </View>
  );
}
