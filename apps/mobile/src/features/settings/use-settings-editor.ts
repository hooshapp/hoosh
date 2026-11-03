import type { SettingsPatch, SettingsView } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import type { EditorState } from '@/features/editors/editor-controls';
import { useSettingsMutation, useSettingsQuery } from './settings-query';

export type SettingsDraftAdapter<D> = {
  draftFor: (settings: SettingsView | null) => D;
  sameDraft: (a: D, b: D) => boolean;
  patch: (draft: D, settings: SettingsView | null) => SettingsPatch;
  saveWhenMissing: (settings: SettingsView | null) => boolean;
};
type Editor<D> = {
  base: SettingsView | null;
  draft: D;
  state: EditorState;
  error?: ApiError;
};
const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();
const serverOnlineSnapshot = () => true;
function failure(error: unknown): { state: EditorState; error?: ApiError } {
  if (!(error instanceof ApiError)) return { state: 'error' };
  if (error.requestMayHaveCommitted) return { state: 'unconfirmed' };
  if (error.kind === 'conflict') return { state: 'conflict' };
  return { state: 'error', error };
}

/** One volatile draft per account generation. Explicit review is required after ambiguous writes. */
export function useSettingsEditor<D>(adapter: SettingsDraftAdapter<D>) {
  const fresh = (base: SettingsView | null): Editor<D> => ({
    base,
    draft: adapter.draftFor(base),
    state: 'ready',
  });
  const dirty = (editor: Editor<D>) =>
    !adapter.sameDraft(editor.draft, adapter.draftFor(editor.base));
  const { scope, availability } = useAccountData();
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, serverOnlineSnapshot);
  const query = useSettingsQuery();
  const [local, setLocal] = useState<Editor<D> | null>(null);
  const [review, setReview] = useState<{ settings: SettingsView | null } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewFailed, setReviewFailed] = useState(false);
  const [savedRevision, setSavedRevision] = useState<number | null>(null);
  const reviewLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // A clean view follows canonical reads. Background reads cannot move a dirty draft's base.
  const editor =
    local && (dirty(local) || local.state !== 'ready')
      ? local
      : query.data
        ? fresh(query.data.settings)
        : local;
  const mutation = useSettingsMutation({
    onSuccess: (response) => {
      if (!mounted.current) return;
      const current = scope?.client.getQueryData<{ settings: SettingsView | null }>(
        scope.key('settings'),
      );
      const canonical =
        current?.settings && current.settings.revision > response.settings.revision
          ? current.settings
          : response.settings;
      setLocal(fresh(canonical));
      setReview(null);
      setSavedRevision(response.settings.revision);
    },
    onError: (error) => {
      if (mounted.current)
        setLocal((current) => (current ? { ...current, ...failure(error) } : current));
    },
  });
  const enabled =
    availability === 'ready' && online && !query.isError && !query.isPaused && !query.isFetching;
  async function checkLatest() {
    if (!scope?.canRun() || !onlineManager.isOnline() || reviewLock.current || mutation.isPending)
      return;
    reviewLock.current = true;
    setReviewing(true);
    setReviewFailed(false);
    const result = await query.refetch();
    scope.commit(() => {
      if (!mounted.current) return;
      if (result.data && !result.isError) setReview(result.data);
      else setReviewFailed(true);
      setReviewing(false);
    });
    reviewLock.current = false;
  }
  function resolveReview(keep: boolean) {
    if (!review || !editor || !enabled) return;
    setLocal(
      keep
        ? { base: review.settings, draft: editor.draft, state: 'ready' }
        : fresh(review.settings),
    );
    setReview(null);
    setReviewFailed(false);
    setSavedRevision(null);
    mutation.reset();
  }
  const navigationDirty = Boolean(
    editor && (dirty(editor) || editor.state === 'unconfirmed' || mutation.isPending),
  );
  const form =
    editor && !query.protocolFailure
      ? {
          draft: editor.draft,
          // Saving an explicit empty selection is allowed on a verified missing row.
          dirty: adapter.saveWhenMissing(editor.base) || dirty(editor),
          navigationDirty,
          error: editor.error,
          state: (mutation.isPending
            ? 'saving'
            : review || reviewing || !enabled || (editor.base?.revision ?? 0) >= 2147483647
              ? 'unavailable'
              : editor.state) as EditorState,
          onChange: (draft: D) => {
            if (mutation.isPending || editor.state === 'saving') return;
            setLocal({
              ...editor,
              draft,
              error: undefined,
              state: ['conflict', 'unconfirmed'].includes(editor.state) ? editor.state : 'ready',
            });
            setSavedRevision(null);
          },
          onSave: () => {
            if (
              !enabled ||
              mutation.isPending ||
              review ||
              reviewing ||
              (!dirty(editor) && !adapter.saveWhenMissing(editor.base)) ||
              !['ready', 'error'].includes(editor.state) ||
              (editor.base?.revision ?? 0) >= 2147483647
            )
              return;
            try {
              const patch = adapter.patch(editor.draft, editor.base);
              setLocal({ ...editor, state: 'saving', error: undefined });
              setSavedRevision(null);
              mutation.submit(patch);
            } catch (error) {
              setLocal({ ...editor, ...failure(error) });
            }
          },
          onDiscard: () => {
            if (mutation.isPending) return;
            setSavedRevision(null);
            if (['conflict', 'unconfirmed'].includes(editor.state)) void checkLatest();
            else {
              setLocal(fresh(editor.base));
              setReview(null);
            }
          },
        }
      : null;
  return {
    query,
    form,
    review,
    reviewing,
    reviewFailed,
    checkLatest,
    resolveReview,
    enabled,
    navigationDirty,
    needsReview: editor?.state === 'conflict' || editor?.state === 'unconfirmed',
    saved:
      enabled &&
      !navigationDirty &&
      savedRevision !== null &&
      query.data?.settings?.revision === savedRevision,
  };
}
