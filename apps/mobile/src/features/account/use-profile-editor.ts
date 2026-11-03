import type { ProfileView } from '@disconnect/contracts';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { ApiError } from '@/infrastructure/api/errors';
import {
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from '@/infrastructure/query/account-data-provider';
import { readProfile, saveProfile } from './api';
import type { ProfileFormProps, ProfileFormState, ProfileNameDraft } from './profile-form';

type Editor = {
  base: ProfileView | null;
  draft: ProfileNameDraft;
  state: ProfileFormState;
};
const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();
const serverOnlineSnapshot = () => true;
const draftFor = (profile: ProfileView | null): ProfileNameDraft => ({
  kind: 'text',
  value: profile?.display_name ?? '',
});
const dirty = ({ base, draft }: Editor) =>
  draft.kind === 'clear' ? base?.display_name != null : draft.value !== (base?.display_name ?? '');
const fresh = (base: ProfileView | null): Editor => ({
  base,
  draft: draftFor(base),
  state: { kind: 'ready' },
});
function saveError(error: unknown): ProfileFormState {
  if (!(error instanceof ApiError)) return { kind: 'error' };
  if (error.requestMayHaveCommitted) return { kind: 'unconfirmed' };
  if (error.kind === 'conflict') return { kind: 'conflict' };
  const issue =
    error.details && 'fields' in error.details
      ? error.details.fields.find((field) => field.field === 'display_name')?.code
      : undefined;
  if (
    error.kind === 'validation' &&
    (issue === 'blank' || issue === 'too_long' || issue === 'invalid_text')
  )
    return { kind: 'invalid', issue };
  return { kind: 'error' };
}

/** Volatile, account-keyed drafts. Nothing is persisted or automatically replayed. */
export function useProfileEditor() {
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, serverOnlineSnapshot);
  const { scope, availability } = useAccountData();
  const query = useAccountQuery(['profile'], readProfile);
  const [local, setEditor] = useState<Editor | null>(null);
  const [review, setReview] = useState<{ profile: ProfileView | null } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewFailed, setReviewFailed] = useState(false);
  const reviewLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // Quarantine the previous value until an explicitly verified read succeeds.
  // Removing an observed query here would mount a new query and silently retry.
  const protocolFailure =
    query.error instanceof ApiError && query.error.kind === 'invalid_response';
  // Clean views follow the query. Dirty/error drafts retain their original revision.
  const editor =
    local && (dirty(local) || local.state.kind !== 'ready')
      ? local
      : query.data && !protocolFailure
        ? fresh(query.data.profile)
        : local;
  const mutation = useAccountMutation({
    execute: saveProfile,
    onSuccess: (response) => {
      scope?.client.setQueryData(scope.key('profile'), response);
      if (!mounted.current) return;
      setEditor(fresh(response.profile));
      setReview(null);
    },
    onError: (error) => {
      if (mounted.current)
        setEditor((current) => (current ? { ...current, state: saveError(error) } : current));
    },
  });
  const enabled =
    availability === 'ready' &&
    !query.isError &&
    !protocolFailure &&
    !query.isPaused &&
    !query.isFetching &&
    online;
  async function checkLatest() {
    if (
      !scope ||
      !scope.canRun() ||
      !onlineManager.isOnline() ||
      reviewLock.current ||
      mutation.isPending
    )
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
  function resolveReview(keepDraft: boolean) {
    if (!review || !editor || !enabled) return;
    setEditor(
      keepDraft
        ? {
            base: review.profile,
            draft: editor.draft,
            state: { kind: 'ready' },
          }
        : fresh(review.profile),
    );
    setReview(null);
    mutation.reset();
  }
  const form: ProfileFormProps | null =
    editor && !protocolFailure
      ? {
          draft: editor.draft,
          dirty: dirty(editor),
          state: mutation.isPending
            ? { kind: 'saving' }
            : review || reviewing || !enabled
              ? { kind: 'unavailable' }
              : editor.state,
          onDraftChange: (draft) =>
            setEditor((current) =>
              current?.state.kind === 'saving'
                ? current
                : {
                    ...editor,
                    draft,
                    state: ['conflict', 'unconfirmed'].includes(editor.state.kind)
                      ? editor.state
                      : { kind: 'ready' },
                  },
            ),
          onSave: () => {
            if (
              !enabled ||
              !dirty(editor) ||
              !['ready', 'invalid', 'error'].includes(editor.state.kind) ||
              review
            )
              return;
            setEditor({ ...editor, state: { kind: 'saving' } });
            mutation.submit({
              expected_revision: editor.base?.revision ?? 0,
              display_name: editor.draft.kind === 'clear' ? null : editor.draft.value,
            });
          },
          // An uncertain write cannot be dismissed into a blind retry against an obsolete base.
          onDiscard: () => {
            if (['conflict', 'unconfirmed'].includes(editor.state.kind)) void checkLatest();
            else if (!mutation.isPending) setEditor(fresh(editor.base));
          },
          onReviewLatest: () => {
            void checkLatest();
          },
        }
      : null;
  return {
    form,
    query,
    review,
    reviewing,
    reviewFailed,
    protocolFailure,
    displayName: protocolFailure ? null : query.data?.profile?.display_name,
    dirty: Boolean(
      editor && (dirty(editor) || editor.state.kind === 'unconfirmed' || mutation.isPending),
    ),
    checkLatest,
    resolveReview,
    enabled,
  };
}
