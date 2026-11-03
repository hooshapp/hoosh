import type { SettingsView } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import type { EditorState } from '@/features/editors/editor-controls';
import type { ActivityDraft } from '@/features/preferences/preference-editors';
import {
  activityDraft,
  activityPayload,
  sameActivityDraft,
} from '@/features/preferences/activity-model';
import { useSettingsMutation, useSettingsQuery } from './settings-query';

type Editor = {
  base: SettingsView | null;
  draft: ActivityDraft;
  state: EditorState;
  customError?: string;
};
const fresh = (base: SettingsView | null): Editor => ({
  base,
  draft: activityDraft(base?.activities ?? null),
  state: 'ready',
});
const dirty = (editor: Editor) =>
  !sameActivityDraft(editor.draft, activityDraft(editor.base?.activities ?? null));
const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();
const serverOnlineSnapshot = () => true;
function failure(error: unknown): Pick<Editor, 'state' | 'customError'> {
  if (!(error instanceof ApiError)) return { state: 'error' };
  if (error.requestMayHaveCommitted) return { state: 'unconfirmed' };
  if (error.kind === 'conflict') return { state: 'conflict' };
  const issue =
    error.details && 'fields' in error.details
      ? error.details.fields.find((field) => field.field === 'activities.custom_text')?.code
      : undefined;
  const customError =
    issue === 'blank'
      ? 'Enter an activity or deselect Custom.'
      : issue === 'too_long'
        ? 'Use 200 characters or fewer for your custom activity.'
        : issue === 'invalid_text'
          ? 'Remove unsupported characters from your custom activity.'
          : undefined;
  return { state: 'error', customError };
}

/** One volatile draft per account generation. Explicit review is required after ambiguous writes. */
export function useActivitiesEditor() {
  const { scope, availability } = useAccountData();
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, serverOnlineSnapshot);
  const query = useSettingsQuery();
  const [local, setLocal] = useState<Editor | null>(null);
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
          dirty: editor.base === null || dirty(editor),
          navigationDirty,
          customError: editor.customError,
          state: (mutation.isPending
            ? 'saving'
            : review || reviewing || !enabled || (editor.base?.revision ?? 0) >= 2147483647
              ? 'unavailable'
              : editor.state) as EditorState,
          onChange: (draft: ActivityDraft) => {
            if (mutation.isPending || editor.state === 'saving') return;
            setLocal({
              ...editor,
              draft,
              customError: undefined,
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
              (!dirty(editor) && editor.base !== null) ||
              !['ready', 'error'].includes(editor.state) ||
              (editor.base?.revision ?? 0) >= 2147483647
            )
              return;
            try {
              const activities = activityPayload(editor.draft);
              setLocal({ ...editor, state: 'saving', customError: undefined });
              setSavedRevision(null);
              mutation.submit({ expected_revision: editor.base?.revision ?? 0, activities });
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
