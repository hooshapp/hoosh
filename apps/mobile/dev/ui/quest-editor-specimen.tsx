import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QuestEditor } from '@/features/quests/quest-editor';
import { emptyQuestDraft, type QuestDraft } from '@/features/quests/quest-draft';
import type { EditorState } from '@/features/editors/editor-controls';
const sample: QuestDraft = { title: 'Evening Gym Session', activity: 'Gym workout', start: '18:00', end: '20:00', nextDay: false, repeat: 'weekly', days: [0, 2, 4] };
const states = ['Personalize', 'Custom', 'Blank', 'Edit', 'Saving', 'Save error', 'Conflict', 'Unconfirmed', 'Unavailable', 'Long text'] as const;
export function QuestEditorSpecimen({ width }: { width: number }) {
  const [state, setState] = useState<string>('Personalize');
  const [draft, setDraft] = useState(sample);
  const [notice, setNotice] = useState('Local draft only; no quest saved or restrictions installed.');
  const status: EditorState = ({ Saving: 'saving', 'Save error': 'error', Conflict: 'conflict', Unconfirmed: 'unconfirmed', Unavailable: 'unavailable' } as const)[state as 'Saving'] ?? 'ready';
  return <section data-testid="RN09E_EDITOR_ONLY"><h2>Quest editor — local presentation</h2>
    <label>Quest editor state <select value={state} onChange={(event) => { const value = event.target.value; setState(value); setDraft(value === 'Blank' ? emptyQuestDraft : value === 'Long text' ? { ...sample, title: 'An intentionally long quest title for a narrow screen and larger fonts' } : sample); }}>{states.map((value) => <option key={value}>{value}</option>)}</select></label>
    <p role="status">{notice}</p><div className="phone" data-quest-editor-phone style={{ width }}><SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 852 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
      <QuestEditor key={state} mode={state === 'Custom' || state === 'Blank' ? 'create' : state === 'Edit' ? 'edit' : 'personalize'} draft={draft} dirty
        onChange={setDraft} onBack={() => setNotice('Preview exit only. Nothing saved.')} onDiscard={() => setDraft(sample)}
        onSave={() => setNotice('Preview save intent only. No quest saved, apps locked or credits awarded.')} onCancelQuest={() => setNotice('Preview cancellation intent only. No saved quest changed.')}
        interestLabel={state === 'Blank' ? undefined : 'GYM'} restrictionNotice={state === 'Blank' ? undefined : 'Example only: selected apps stay locked during your quest.'} state={status} />
    </SafeAreaProvider></div></section>;
}
