import type { QuestPut, QuestResponse } from '@disconnect/contracts';
import { ApiError } from '@/infrastructure/api/errors';
import {
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from '@/infrastructure/query/account-data-provider';
import { deleteQuest, readQuest, readQuests, saveQuest } from './quests-api';
export function useQuestQuery(id: string) {
  return useAccountQuery(['quest', id], (op) => readQuest(id, op));
}
export function useQuestsQuery(cursor: string | null) {
  return useAccountQuery(['quests', cursor], (op) => readQuests(cursor, op));
}
export type QuestChange =
  | { kind: 'save'; id: string; body: QuestPut }
  | { kind: 'delete'; id: string; revision: number };
export function useQuestMutation(
  onSuccess: (response: QuestResponse, change: QuestChange) => void,
  onError: (error: unknown) => void,
) {
  const { scope } = useAccountData();
  return useAccountMutation<QuestResponse, QuestChange>({
    execute: async (change, op) => {
      if (!scope) throw new ApiError('cancelled');
      await scope.client.cancelQueries({ queryKey: scope.key('quest', change.id) });
      await scope.client.cancelQueries({ queryKey: scope.key('quests') });
      const result =
        change.kind === 'save'
          ? await saveQuest(change.id, change.body, op)
          : await deleteQuest(change.id, change.revision, op);
      const response: QuestResponse =
        'quest' in result
          ? { quest: result.quest, revision: result.quest.revision }
          : { quest: null, revision: result.revision };
      await scope.client.cancelQueries({ queryKey: scope.key('quest', change.id) });
      await scope.client.cancelQueries({ queryKey: scope.key('quests') });
      return response;
    },
    onSuccess: (response, change) => {
      if (!scope) return;
      scope.client.setQueryData<QuestResponse>(scope.key('quest', change.id), (old) =>
        old && response.revision !== 0 && old.revision > response.revision ? old : response,
      );
      void scope.client.invalidateQueries({ queryKey: scope.key('quests') });
      onSuccess(
        scope.client.getQueryData<QuestResponse>(scope.key('quest', change.id)) ?? response,
        change,
      );
    },
    onError,
  });
}
