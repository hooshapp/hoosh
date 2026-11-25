import { useEffect } from 'react';
import { View } from 'react-native';
import { DaysEditor, HoursEditor, SessionsEditor } from '@/features/plans/plan-editors';
import type { PlanField } from '@/features/plans/plan-draft-model';
import { usePlanDraftEditor } from './use-plan-draft-editor';
import { SettingsEditorFeedback } from './settings-editor-feedback';

export function InlinePlanPreference({ field, onDone, onDirty }: { field: PlanField; onDone(): void; onDirty(dirty: boolean): void }) {
  const editor = usePlanDraftEditor(field);
  const form = editor.form;
  useEffect(() => { onDirty(!!form?.navigationDirty); return () => onDirty(false); }, [form?.navigationDirty, onDirty]);
  useEffect(() => { if (editor.saved) onDone(); }, [editor.saved, onDone]);
  const draft = form?.draft;
  const actions = { dirty: !!form?.dirty, state: form?.state ?? 'unavailable' as const, onSave: form?.onSave, onDiscard: form?.onDiscard };
  return <View style={{ gap: 10 }}>
    {draft && form ? field === 'days' ? <DaysEditor days={draft.weekdays} onChange={weekdays => form.onChange({ ...draft, weekdays })} {...actions} />
      : field === 'hours' ? <HoursEditor draft={draft.hours ?? { start: '', end: '', nextDay: false }} onChange={hours => form.onChange({ ...draft, hours })} {...actions} />
      : <SessionsEditor draft={draft.sessions} onChange={sessions => form.onChange({ ...draft, sessions })} bounds={{ count: { min: 1, max: 1000, step: 1 }, minutes: { min: 1, max: 1440, step: 1 } }} {...actions} /> : null}
    <SettingsEditorFeedback editor={editor} kind="plan" />
  </View>;
}
