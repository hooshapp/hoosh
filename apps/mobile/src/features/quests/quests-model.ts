/** Local display shapes, not a recurrence/persistence/enforcement contract. */
export type QuestSuggestion = Readonly<{
  id: string;
  categoryLabel: string;
  accent: 'dark' | 'green';
  context: string;
  title: string;
  scheduleLabels: readonly string[];
  restrictionNotice: string | null;
}>;
export type SavedQuest = Readonly<{
  id: string;
  title: string;
  scheduleLabel: string;
  statusLabel: string;
}>;
export type QuestCollection<T> =
  | Readonly<{ state: 'ready'; items: readonly T[] }>
  | Readonly<{ state: 'loading' | 'unavailable' | 'error' }>;
export type QuestsModel = Readonly<{
  interestSummary: string | null;
  suggestions: QuestCollection<QuestSuggestion>;
  saved: QuestCollection<SavedQuest>;
}>;
export const unavailableQuests: QuestsModel = {
  interestSummary: null,
  suggestions: { state: 'unavailable' },
  saved: { state: 'unavailable' },
};
