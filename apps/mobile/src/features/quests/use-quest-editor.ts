import type { QuestResponse } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import type { EditorState } from '@/features/editors/editor-controls';
import {
  questForm,
  definitionFor,
  sameQuestDraft,
  type ManagedQuestDraft,
} from './quest-definition-draft';
import { readQuest } from './quests-api';
import { useQuestMutation, useQuestQuery } from './quests-query';

type Local = { base: QuestResponse; draft: ManagedQuestDraft; state: EditorState };
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
export function useQuestEditor(id: string, creating: boolean, onDeleted: () => void) {
  const { scope, availability } = useAccountData();
  const online = useSyncExternalStore(
    subscribe,
    () => onlineManager.isOnline(),
    () => true,
  );
  const [seed] = useState(() => questForm(null));
  const fresh = (base: QuestResponse): Local => ({
    base,
    draft: base.quest ? questForm(base.quest.definition) : seed,
    state: 'ready',
  });
  const dirty = (value: Local) =>
    !sameQuestDraft(value.draft, value.base.quest ? questForm(value.base.quest.definition) : seed);
  const query = useQuestQuery(id);
  const [local, setLocal] = useState<Local | null>(null),
    [review, setReview] = useState<QuestResponse | null>(null);
  const [checking, setChecking] = useState(false),
    [reviewFailed, setReviewFailed] = useState(false),
    [saved, setSaved] = useState(false);
  const lock = useRef(false),
    mounted = useRef(true),
    deleting = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const editor =
    local && (dirty(local) || local.state !== 'ready')
      ? local
      : query.data
        ? fresh(query.data)
        : local;
  const mutation = useQuestMutation(
    (response, change) => {
      if (!mounted.current) return;
      setReview(null);
      setLocal(fresh(response));
      if (change.kind === 'delete' || !response.quest) onDeleted();
      else setSaved(true);
    },
    (error) => {
      if (!mounted.current) return;
      const state: EditorState =
        error instanceof ApiError && error.requestMayHaveCommitted
          ? 'unconfirmed'
          : error instanceof ApiError && error.kind === 'conflict'
            ? 'conflict'
            : 'error';
      setLocal((current) => (current ? { ...current, state } : current));
    },
  );
  const enabled =
    availability === 'ready' &&
    online &&
    !query.isFetching &&
    !query.isError &&
    !query.isPaused &&
    !checking;
  const editable = !!editor && (!!editor.base.quest || (creating && editor.base.revision === 0));
  const needsReview = editor?.state === 'conflict' || editor?.state === 'unconfirmed';
  async function checkLatest() {
    if (!scope?.canRun() || !onlineManager.isOnline() || lock.current || mutation.isPending) return;
    lock.current = true;
    setChecking(true);
    setReviewFailed(false);
    try {
      const result = await scope.read((op) => readQuest(id, op));
      scope.commit(() => {
        if (!mounted.current) return;
        scope.client.setQueryData(scope.key('quest', id), result);
        if (deleting.current && result.quest === null) {
          void scope.client.invalidateQueries({ queryKey: scope.key('quests') });
          onDeleted();
        } else setReview(result);
      });
    } catch {
      scope.commit(() => {
        if (mounted.current) setReviewFailed(true);
      });
    } finally {
      lock.current = false;
      scope.commit(() => {
        if (mounted.current) setChecking(false);
      });
    }
  }
  function resolveReview(keep: boolean) {
    if (
      !review ||
      !editor ||
      !enabled ||
      (keep && !review.quest && (review.revision > 0 || !creating))
    )
      return;
    setLocal(keep ? { base: review, draft: editor.draft, state: 'ready' } : fresh(review));
    scope?.client.setQueryData(scope.key('quest', id), review);
    setReview(null);
    setSaved(false);
    deleting.current = false;
    mutation.reset();
  }
  let issue: string | null = null;
  if (editor) {
    try {
      definitionFor(editor.draft);
    } catch {
      issue = 'Check the quest name, activity, time, repeat days and time zone.';
    }
  }
  const form =
    editable && editor
      ? {
          issue,
          draft: editor.draft,
          base: editor.base,
          dirty: dirty(editor),
          navigationDirty: dirty(editor) || needsReview || mutation.isPending,
          state: (mutation.isPending
            ? 'saving'
            : !enabled || review || editor.base.revision >= 2147483647
              ? 'unavailable'
              : editor.state) as EditorState,
          onChange: (draft: ManagedQuestDraft) => {
            if (mutation.isPending) return;
            setLocal({ ...editor, draft, state: needsReview ? editor.state : 'ready' });
            setSaved(false);
          },
          onSave: () => {
            if (!enabled || review || needsReview || mutation.isPending || !dirty(editor)) return;
            try {
              const definition = definitionFor(editor.draft);
              setLocal({ ...editor, state: 'saving' });
              setSaved(false);
              deleting.current = false;
              mutation.submit({
                kind: 'save',
                id,
                body: { expected_revision: editor.base.revision, definition },
              });
            } catch {
              setLocal({ ...editor, state: 'error' });
            }
          },
          onDelete:
            enabled && !review && !needsReview && editor.base.quest && !mutation.isPending
              ? () => {
                  deleting.current = true;
                  setLocal({ ...editor, state: 'saving' });
                  setSaved(false);
                  mutation.submit({ kind: 'delete', id, revision: editor.base.revision });
                }
              : undefined,
          onDiscard: () => {
            if (mutation.isPending) return;
            if (needsReview) void checkLatest();
            else {
              setLocal(fresh(editor.base));
              setSaved(false);
            }
          },
        }
      : null;
  return {
    query,
    form,
    review,
    checking,
    checkLatest,
    resolveReview,
    reviewFailed,
    enabled,
    needsReview,
    saved,
    online,
    unavailable: availability !== 'ready' || !online || query.isPaused,
    missing: !!editor && !editable,
    allowKeep: !!review && (!!review.quest || (creating && review.revision === 0)),
  };
}
