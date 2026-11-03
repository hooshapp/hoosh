import type { ActivityPreferences } from '@disconnect/contracts';
import { ApiError } from '../../infrastructure/api/errors';
import type { ActivityDraft } from './preference-editors';

export type ActivityId = ActivityPreferences['selected_activity_ids'][number];
/** Source choices, not defaults, usage measurements or recommendations. */
export const ACTIVITY_LABELS = {
  gym: 'Gym',
  reading: 'Reading',
  arts_and_crafts: 'Arts and crafts',
  walking: 'Walking',
  music: 'Music',
  cooking: 'Cooking',
} as const satisfies Record<ActivityId, string>;
export const activityIds = Object.keys(ACTIVITY_LABELS) as ActivityId[];
export function isActivityId(value: unknown): value is ActivityId {
  return typeof value === 'string' && Object.hasOwn(ACTIVITY_LABELS, value);
}
export function activityDraft(value: ActivityPreferences | null): ActivityDraft {
  return {
    selected: value?.selected_activity_ids ?? [],
    customSelected: value?.custom_text != null,
    custom: value?.custom_text ?? '',
  };
}
export function activityPayload(draft: ActivityDraft): ActivityPreferences {
  if (
    draft.selected.length > 6 ||
    new Set(draft.selected).size !== draft.selected.length ||
    !draft.selected.every(isActivityId)
  )
    throw new ApiError('validation', {
      details: { fields: [{ field: 'activities.selected_activity_ids', code: 'invalid_choice' }] },
    });
  // Never trim or turn blank text into null. Deselecting Custom is explicit clear intent.
  return {
    selected_activity_ids: [...draft.selected],
    custom_text: draft.customSelected ? draft.custom : null,
  };
}
export function sameActivityDraft(a: ActivityDraft, b: ActivityDraft): boolean {
  return (
    a.customSelected === b.customSelected &&
    a.custom === b.custom &&
    a.selected.length === b.selected.length &&
    a.selected.every((id, i) => id === b.selected[i])
  );
}
export function activitySummary(value: ActivityPreferences): string | null {
  const labels: string[] = value.selected_activity_ids.map((id) => ACTIVITY_LABELS[id]);
  if (value.custom_text !== null) labels.push(`Custom: ${value.custom_text}`);
  return labels.length ? labels.join(', ') : null;
}
