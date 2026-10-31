import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { DaysEditor, HoursEditor, SessionsEditor, type HoursDraft, type SessionsDraft } from '@/features/plans/plan-editors';
import type { EditorState } from '@/features/editors/editor-controls';
import { example } from './settings-specimen';
export function PlanEditorSpecimen({ width }: { width: number }) {
  const [page, setPage] = useState('Days'), [days, setDays] = useState<readonly number[]>([0, 1, 2, 3, 4]);
  const [hours, setHours] = useState<HoursDraft>({ start: '09:00', end: '22:00', nextDay: false });
  const [sessions, setSessions] = useState<SessionsDraft>({ count: 2, minutes: 15 });
  const [notice, setNotice] = useState('Source example only; no plan or native rules connected.');
  const action = () => setNotice('Preview intent only. No plan saved, installed or activated.');
  const state: EditorState = ({ Saving: 'saving', 'Save error': 'error', Unavailable: 'unavailable' } as const)[page as 'Saving'] ?? 'ready';
  const actions = { dirty: true, state, onSave: action, onDiscard: action };
  const field = page === 'Hours' ? 'hours' : page === 'Days' || page === 'Long text' ? 'days' : 'sessions';
  const content = field === 'days' ? <DaysEditor days={days} onChange={setDays} {...actions} /> : field === 'hours' ? <HoursEditor draft={hours} onChange={setHours} {...actions} />
    : <SessionsEditor draft={sessions} onChange={setSessions} bounds={page === 'Unavailable' ? undefined : { count: { min: 1, max: 10, step: 1 }, minutes: { min: 5, max: 120, step: 5 } }} {...actions} />;
  return <section data-testid="RN09G_PLAN_ONLY"><h2>Plan editors — local presentation</h2><label>Plan editor page <select value={page} onChange={(e) => setPage(e.target.value)}>{['Days', 'Hours', 'Sessions', 'Saving', 'Save error', 'Unavailable', 'Long text'].map((value) => <option key={value}>{value}</option>)}</select></label><p role="status">{notice}</p>
    <div className="phone" style={{ width }}><SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 852 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
      <SettingsScreen model={page === 'Long text' ? { ...example, days: { state: 'ready', text: 'A deliberately long localized schedule summary that must remain readable' } } : example} onEdit={{ [field]: action }} inlineEditor={{ field, content }} />
    </SafeAreaProvider></div></section>;
}
