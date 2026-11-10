import { useEffect, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { LeaveConfirmation, type EditorState } from '@/features/editors/editor-controls';
import { AppsEditor } from './preference-editors';
import { decodeSelectionDraft, type SelectionDraft, type SelectionEditorPort } from '@/infrastructure/native/selection-editor';

type Props = { owner: string; generation?: number; port: SelectionEditorPort | null; onBack: () => void };
/** Key the scope synchronously so a replacement owner never renders the previous draft. */
export function NativeAppsEditor(props: Props) {
  return <ScopedNativeAppsEditor key={`${props.owner}:${props.generation ?? 0}:${Boolean(props.port)}`} {...props} />;
}
function ScopedNativeAppsEditor({ owner, port, onBack }: Props) {
  const [draft, setDraft] = useState<SelectionDraft | null>(null);
  const [state, setState] = useState<EditorState>('unavailable');
  const [choosing, setChoosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [notice, setNotice] = useState('Loading saved selection…');
  const session = useRef<{ active: boolean; owner: string; draft: SelectionDraft | null } | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    const scope = { active: true, owner, draft: null as SelectionDraft | null };
    session.current = scope;
    lock.current = true;
    const release = (value: SelectionDraft) => {
      if (port) void Promise.resolve().then(() => port.selectionRelease(owner, value.draftId)).catch(() => {});
    };
    void Promise.resolve().then(() => {
      if (!scope.active) throw new Error('Closed editor');
      setDraft(null); setLoading(true); setState('unavailable'); setChoosing(false); setLeaving(false);
      return port ? port.selectionBegin(owner) : Promise.reject();
    }).then((value) => {
      const next = decodeSelectionDraft(value);
      if (!scope.active) { release(next); return; }
      scope.draft = next;
      setDraft(next); setState('ready'); setNotice('Saved on this device only. Protection has not changed.');
    }).catch(() => {
      if (scope.active) setNotice('App selection is unavailable. Your saved choices have not been changed.');
    }).finally(() => {
      if (scope.active) { lock.current = false; setLoading(false); }
    });
    return () => {
      scope.active = false;
      if (scope.draft) release(scope.draft);
    };
  }, [owner, port, reload]);
  const blocked = loading || choosing || state === 'saving';
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!blocked) { if (draft?.dirty) setLeaving(true); else onBack(); }
      return true;
    });
    return () => subscription.remove();
  }, [blocked, draft?.dirty, onBack]);
  const run = (kind: 'pick' | 'commit') => {
    const active = session.current;
    if (!port || !active?.active || !active.draft || active.owner !== owner || lock.current) return;
    lock.current = true;
    if (kind === 'pick') setChoosing(true); else setState('saving');
    const previous = active.draft;
    void Promise.resolve().then(() => {
      if (!active.active) throw new Error('Closed editor');
      return kind === 'pick' ? port.selectionPick(owner, previous.draftId, previous.draftVersion)
        : port.selectionCommit(owner, previous.draftId, previous.draftVersion);
    }).then((value) => {
      const next = decodeSelectionDraft(value);
      if (next.draftId !== previous.draftId || next.draftVersion < previous.draftVersion ||
        next.draftVersion > previous.draftVersion + 1 ||
        (kind === 'pick' && (next.baseRevision !== previous.baseRevision || next.savedAppCount !== previous.savedAppCount)) ||
        (kind === 'commit' && (next.dirty || next.draftVersion !== previous.draftVersion ||
          next.selectedAppCount !== previous.selectedAppCount || next.baseRevision < previous.baseRevision ||
          next.baseRevision > previous.baseRevision + 1))) throw new Error('Invalid selection acknowledgment');
      if (!active.active) return;
      active.draft = next;
      setDraft(next); setState('ready');
      setNotice(kind === 'pick' ? 'Your changes are ready to save.' : 'App selection saved on this device. Protection has not changed.');
    }).catch((error: unknown) => {
      if (!active.active) return;
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
      if (code === 'ERR_SELECTION_CANCELLED') {
        setState('ready'); setNotice('Picker canceled. Your draft is unchanged.');
      } else if (code === 'ERR_SELECTION_CONFLICT' || code === 'ERR_SELECTION_DRAFT_CHANGED' || code === 'ERR_SELECTION_DRAFT_EXPIRED') {
        setState('conflict'); setNotice('Selection changed or the draft expired. Discard and reload saved choices before continuing.');
      } else if (kind === 'commit' && code !== 'ERR_SELECTION_CHANGED' && code !== 'ERR_SELECTION_UNAVAILABLE') {
        setState('unconfirmed'); setNotice('Save could not be confirmed. Reload saved choices before trying again.');
      } else {
        setState('error'); setNotice('Selection could not be updated. Your draft is still here; reopen the picker to review available apps.');
      }
    }).finally(() => {
      if (active.active) { lock.current = false; setChoosing(false); }
    });
  };
  const reviewRequired = state === 'conflict' || state === 'unconfirmed';
  return (
    <View style={{ flex: 1 }}>
      {leaving ? <LeaveConfirmation onKeep={() => setLeaving(false)} onDiscard={onBack} /> : null}
      <AppsEditor
        selection={{ kind: 'native', summary: draft ? `${draft.selectedAppCount} apps selected` : null,
          busy: choosing, disabled: reviewRequired || loading, onChoose: draft ? () => run('pick') : undefined }}
        dirty={draft?.dirty ?? false}
        state={state}
        disabled={loading || choosing}
        onBack={onBack}
        onSave={draft ? () => run('commit') : undefined}
        onDiscard={() => { if (!lock.current) setReload((value) => value + 1); }}
        feedback={<>
          <Text accessibilityLiveRegion="polite">{notice}</Text>
          {(reviewRequired || (!draft && !loading)) ? <Button label="Reload saved choices" variant="secondary" disabled={blocked} onPress={() => setReload((value) => value + 1)} /> : null}
        </>}
      />
    </View>
  );
}
