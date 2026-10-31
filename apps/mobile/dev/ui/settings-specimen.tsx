import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsScreen } from '@/features/settings/settings-screen';
import {
  unavailableSettings,
  type SettingsModel,
  type SettingsValue,
  type SettingsField,
} from '@/features/settings/settings-model';
import type { ProfileNameDraft } from '@/features/account/profile-form';

const ready = (text: string | null): SettingsValue => ({
  state: 'ready',
  text,
});
export const example: SettingsModel = {
  account: {
    identity: {
      user_id: 'b0bbcfac-c011-46a8-a795-24c7777b6de9',
      email: 'jord@gmail.com',
    },
    displayName: 'Jordan Rivera',
  },
  personalInfo: { age: ready('24'), gender: ready('Male') },
  apps: ready('Instagram, TikTok, YouTube'),
  activities: ready('Reading, Exercising, Studying'),
  days: ready('Mon – Fri'),
  hours: ready('9:00 AM – 10:00 PM'),
  sessions: ready('2 sessions/day · 15 min each'),
  calendars: {
    googleCalendar: ready('Not connected'),
    appleCalendar: ready('Not connected'),
  },
};
const states = [
  'Unavailable',
  'Figma example',
  'Read only',
  'Loading',
  'Read error',
  'Empty values',
  'Partial',
  'Profile form',
  'Long text',
] as const;
type State = (typeof states)[number];
function model(state: State): SettingsModel {
  if (state === 'Unavailable') return unavailableSettings;
  if (state === 'Loading' || state === 'Read error') {
    const value = { state: state === 'Loading' ? 'loading' : 'error' } as const;
    return {
      ...example,
      apps: value,
      activities: value,
      days: value,
      hours: value,
      sessions: value,
    };
  }
  if (state === 'Empty values')
    return {
      ...example,
      apps: ready(null),
      activities: ready(null),
      days: ready(null),
      hours: ready(null),
      sessions: ready(null),
    };
  if (state === 'Partial')
    return {
      ...example,
      apps: { state: 'error' },
      hours: { state: 'unavailable' },
    };
  if (state === 'Long text')
    return {
      ...example,
      account: {
        ...example.account!,
        displayName:
          'A deliberately long account display name that remains readable on narrow devices',
      },
      apps: ready(
        'An intentionally long localized description of selected distracting applications',
      ),
      activities: ready(
        'An intentionally long localized list of activities that remains entirely readable',
      ),
    };
  return example;
}
export function SettingsSpecimen({ width }: { width: number }) {
  const [state, setState] = useState<State>('Unavailable');
  const [draft, setDraft] = useState<ProfileNameDraft>({
    kind: 'text',
    value: 'Jordan Rivera',
  });
  const [notice, setNotice] = useState(
    'No account, plan or native permissions connected.',
  );
  const action = () =>
    setNotice(
      'Preview intent only. No account saved, plan installed, picker or calendar connected.',
    );
  const editable = ['Figma example', 'Long text', 'Empty values'].includes(
    state,
  );
  const onEdit: Partial<Record<SettingsField, () => void>> | undefined =
    editable
      ? {
          age: action,
          gender: action,
          apps: action,
          activities: action,
          days: action,
          hours: action,
          sessions: action,
          googleCalendar: action,
          appleCalendar: action,
        }
      : undefined;
  return (
    <section data-testid="RN09D_SETTINGS_SPECIMEN_ONLY">
      <h2>Settings — presentation-only Figma example</h2>
      <label>
        Settings example state{' '}
        <select
          value={state}
          onChange={(event) => {
            setState(event.target.value as State);
            setNotice('Example changed; no account data loaded.');
          }}
        >
          {states.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <p aria-live="polite">{notice}</p>
      <div data-settings-capture style={{ width, background: '#FFF1DD' }}>
        <p style={{ margin: 0, padding: '8px 16px', fontSize: 12 }}>
          Simulated Settings — sample identity, no account connected.
        </p>
        <div className="phone" data-settings-phone style={{ width }}>
          <SafeAreaProvider
            initialMetrics={{
              frame: { x: 0, y: 0, width, height: 852 },
              insets: { top: 0, right: 0, bottom: 0, left: 0 },
            }}
          >
            <SettingsScreen
              model={model(state)}
              onEdit={onEdit}
              onRetry={state === 'Read error' ? action : undefined}
              profileForm={
                state === 'Profile form'
                  ? {
                      draft,
                      dirty:
                        draft.kind === 'clear' ||
                        draft.value !== 'Jordan Rivera',
                      state: { kind: 'ready' },
                      onDraftChange: setDraft,
                      onSave: action,
                      onDiscard: () =>
                        setDraft({ kind: 'text', value: 'Jordan Rivera' }),
                    }
                  : undefined
              }
            />
          </SafeAreaProvider>
        </div>
      </div>
    </section>
  );
}
