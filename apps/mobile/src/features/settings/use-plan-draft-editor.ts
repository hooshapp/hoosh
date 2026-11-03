import { useSettingsEditor, type SettingsDraftAdapter } from './use-settings-editor';
import {
  planDraftInput,
  planDraftPatch,
  samePlanInput,
  type PlanDraftInput,
  type PlanField,
} from '@/features/plans/plan-draft-model';

export function usePlanDraftEditor(field: PlanField) {
  const adapter: SettingsDraftAdapter<PlanDraftInput> = {
    draftFor: (settings) => planDraftInput(settings?.plan_draft ?? null),
    sameDraft: (a, b) => samePlanInput(field, a, b),
    patch: (draft, settings) => planDraftPatch(field, draft, settings),
    saveWhenMissing: (settings) => settings?.plan_draft == null,
  };
  return useSettingsEditor(adapter);
}
