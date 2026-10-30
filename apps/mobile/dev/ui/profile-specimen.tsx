import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountHeader } from '@/features/account/account-header';
import {
  ProfileForm,
  type ProfileFormState,
  type ProfileNameDraft,
} from '@/features/account/profile-form';
import { Screen } from '@/components/ui/screen';

const exampleName = 'Jordan Rivera';
/** Figma sample lives only here. No Auth, HTTP, database or persistent browser storage. */
export function ProfileSpecimen({ width }: { width: number }) {
  const [baseline, setBaseline] = useState<string | null>(exampleName);
  const [draft, setDraft] = useState<ProfileNameDraft>({ kind: 'text', value: exampleName });
  const [state, setState] = useState<ProfileFormState>({ kind: 'ready' });
  const [notice, setNotice] = useState(
    'No account is connected. Changes last only in this preview.',
  );
  const dirty = draft.kind === 'clear' ? baseline !== null : draft.value !== (baseline ?? '');
  function discard() {
    setDraft({ kind: 'text', value: baseline ?? '' });
    setState({ kind: 'ready' });
    setNotice('Preview draft discarded. No account was changed.');
  }
  return (
    <section data-testid="RN07_PROFILE_SPECIMEN_ONLY">
      <h2>Profile editor — UI-only Figma example</h2>
      <p>
        Jordan Rivera is sample content from Figma, not a signed-in user. Save changes below updates
        this preview only.
      </p>
      <div
        data-profile-preview
        className="phone"
        style={{ width, background: '#FFF1DD', borderRadius: 16, overflow: 'hidden' }}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width, height: 852 },
            insets: { top: 0, right: 0, bottom: 0, left: 0 },
          }}>
          <View>
            <AccountHeader
              identity={{
                user_id: 'a46e48ad-c742-4e18-b57d-2c9a56544944',
                email: 'jord@gmail.com',
              }}
              displayName={baseline}
            />
          </View>
          <Screen
            title="Edit profile"
            subtitle="Preview only — nothing is saved to an account."
            bottomClearance={0}>
            <Text accessibilityLiveRegion="polite">{notice}</Text>
            <ProfileForm
              draft={draft}
              dirty={dirty}
              state={state}
              onDraftChange={(next) => {
                setDraft(next);
                setState((current) =>
                  ['invalid', 'error'].includes(current.kind) ? { kind: 'ready' } : current,
                );
                setNotice('Preview has unsaved changes.');
              }}
              onSave={(next) => {
                const value = next.kind === 'clear' ? null : next.value;
                setBaseline(value);
                setDraft({ kind: 'text', value: value ?? '' });
                setNotice('Preview updated locally. Nothing was saved to an account.');
              }}
              onDiscard={discard}
              onReviewLatest={() => {
                setState({ kind: 'ready' });
                setNotice('Preview review opened. Draft kept; no server was contacted.');
              }}
            />
          </Screen>
        </SafeAreaProvider>
      </div>
      <div
        aria-label="Profile specimen state controls"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        <button onClick={() => setState({ kind: 'saving' })}>Simulate saving</button>
        <button onClick={() => setState({ kind: 'invalid', issue: 'blank' })}>
          Simulate validation error
        </button>
        <button onClick={() => setState({ kind: 'error' })}>Simulate save failure</button>
        <button onClick={() => setState({ kind: 'conflict' })}>Simulate conflict</button>
        <button onClick={() => setState({ kind: 'unconfirmed' })}>Simulate unconfirmed save</button>
        <button onClick={() => setState({ kind: 'unavailable' })}>Simulate unavailable</button>
        <button
          onClick={() => {
            setBaseline(exampleName);
            setDraft({ kind: 'text', value: exampleName });
            setState({ kind: 'ready' });
            setNotice('Figma sample reset. No account is connected.');
          }}>
          Reset profile example
        </button>
      </div>
    </section>
  );
}
