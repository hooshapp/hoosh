import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyCard } from '@/components/ui/empty-card';
import { Field } from '@/components/ui/field';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';

import './styles.css';
import { ProtectionSpecimen } from './protection-specimen';
import { HomeSpecimen } from './home-specimen';
import { PreferenceSpecimen } from './preference-specimen';
import { QuestEditorSpecimen } from './quest-editor-specimen';
import { SettingsSpecimen } from './settings-specimen';
import { HistorySpecimen } from './history-specimen';
import { QuestsSpecimen } from './quests-specimen';
import { ProfileSpecimen } from './profile-specimen';
import { AccountSpecimen } from './account-specimen';
import { AssetGallery } from './asset-gallery';

function Specimen({ dark, width }: { dark: boolean; width: number }) {
  const [name, setName] = useState('Evening reading');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<'unavailable' | 'error' | 'loading'>('unavailable');
  return (
    <section aria-label={dark ? 'Dark specimen' : 'Warm specimen'}>
      <h2>{dark ? 'Dark auth / planning recipe' : 'Warm everyday recipe'}</h2>
      <div className="phone" style={{ width }}>
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width, height: 852 },
            insets: { top: 0, right: 0, bottom: 0, left: 0 },
          }}>
          <Screen
            title="Account details"
            subtitle="RN-01 component specimen. No account or data is connected."
            dark={dark}
            bottomClearance={0}>
            <Field
              label="Display name"
              value={name}
              onChangeText={setName}
              error={error}
              hint="A persistent label stays visible while editing."
            />
            <Field label="Email" placeholder="email/username..." keyboardType="email-address" />
            <Button
              label="Next →"
              busyLabel="Saving…"
              busy={saving}
              onPress={() => setSaving(true)}
            />
            <Button label="Back" variant="secondary" onPress={() => setSaving(false)} />
            {saving ? <InlineStatus state="saving" message="Saving specimen state…" /> : null}
            {state === 'error' ? (
              <InlineStatus
                state="error"
                message="Could not load the specimen."
                onRetry={() => setState('loading')}
              />
            ) : state === 'loading' ? (
              <InlineStatus state="loading" message="Loading specimen state…" />
            ) : (
              <InlineStatus
                state="unavailable"
                message="No service is connected to this preview."
              />
            )}
            <EmptyCard
              title="No saved profile"
              description="An empty result is different from an unavailable service. Nothing here installs protection."
            />
            <Button
              label="Show validation error"
              variant="secondary"
              onPress={() => setError('Enter a value for this specimen.')}
            />
            <Button
              label="Show retryable error"
              variant="secondary"
              onPress={() => setState('error')}
            />
            <Button
              label="Reset specimen"
              variant="secondary"
              onPress={() => {
                setSaving(false);
                setError(undefined);
                setState('unavailable');
              }}
            />
            <Button label="Disabled action" disabled onPress={() => {}} />
            <View style={{ height: 8 }} />
          </Screen>
        </SafeAreaProvider>
      </div>
    </section>
  );
}

const width = new URLSearchParams(window.location.search).get('width') === '320' ? 320 : 393;
const largeText = new URLSearchParams(window.location.search).get('largeText') === '1';
const root = document.getElementById('root');
if (!root) throw new Error('Missing specimen root');
createRoot(root).render(
  <main data-testid="disconnect-ui-specimens" className={largeText ? 'large-text' : undefined}>
    <h1>Disconnect — shared UI specimens</h1>
    <p>
      Developer-only entry. Use <a href="?width=393">393 px</a>, <a href="?width=320">320 px</a>, or{' '}
      <a href="?width=320&amp;largeText=1">large-text stress</a>. These controls change local
      presentation only.
    </p>
    <div className="specimens">
      <Specimen width={width} dark={false} />
      <Specimen width={width} dark />
    </div>
    <AssetGallery />
    <AccountSpecimen width={width} />
    <ProfileSpecimen width={width} />
    <ProtectionSpecimen width={width} />
    <HomeSpecimen width={width} />
    <QuestsSpecimen width={width} />
    <HistorySpecimen width={width} />
    <SettingsSpecimen width={width} />
    <QuestEditorSpecimen width={width} />
    <PreferenceSpecimen width={width} />
  </main>,
);
