import {
  activityDraft,
  activityPayload,
  sameActivityDraft,
} from '@/features/preferences/activity-model';
import type { ActivityDraft } from '@/features/preferences/preference-editors';
import { useSettingsEditor, type SettingsDraftAdapter } from './use-settings-editor';

const adapter: SettingsDraftAdapter<ActivityDraft> = {
  draftFor: (settings) => activityDraft(settings?.activities ?? null),
  sameDraft: sameActivityDraft,
  patch: (draft, settings) => ({
    expected_revision: settings?.revision ?? 0,
    activities: activityPayload(draft),
  }),
  saveWhenMissing: (settings) => settings === null,
};
export function useActivitiesEditor() {
  const editor = useSettingsEditor(adapter);
  const details = editor.form?.error?.details;
  const issue =
    details && 'fields' in details
      ? details.fields.find((field) => field.field === 'activities.custom_text')?.code
      : undefined;
  const customError =
    issue === 'blank'
      ? 'Enter an activity or deselect Custom.'
      : issue === 'too_long'
        ? 'Use 200 characters or fewer for your custom activity.'
        : issue === 'invalid_text'
          ? 'Remove unsupported characters from your custom activity.'
          : undefined;
  return { ...editor, form: editor.form ? { ...editor.form, customError } : null };
}
