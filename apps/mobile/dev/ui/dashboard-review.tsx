import { useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from '@/features/home/home-screen';
import { QuestsScreen } from '@/features/quests/quests-screen';
import { HistoryScreen } from '@/features/history/history-screen';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { DetailsPanel } from '@/components/ui/details-panel';
import { SettingsRow } from '@/features/settings/settings-row';
import { settingsAssets } from '@/design/settings-assets';
import { homeExample, questsExample, historyExample, settingsExample } from '../shared/ui-samples';

/** Isolated synthetic visual review. Never imported by production routes. */
export function DashboardReview({ width }: { width: number }) {
  const [page, setPage] = useState('Home');
  const [notice, setNotice] = useState('');
  return <main><h1>Hoosh dashboard layout review</h1>
    <p>Figma sample data only. This preview does not sign in, request permissions or install protection.</p>
    <nav aria-label="Preview pages">{['Home', 'Quests', 'History', 'Settings'].map(tab => <button key={tab} aria-pressed={tab === page} onClick={() => { setPage(tab); setNotice(''); }}>{tab}</button>)}</nav>
    <p role="status">{notice}</p>
    <div className="phone" style={{ width }}>
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 852 }, insets: { top: 62, right: 0, bottom: 34, left: 0 } }}>
        {page === 'Home' ? <HomeScreen model={homeExample} bottomClearance={0} onFeed={() => setNotice('Preview only: no credits spent.')} onAcceptRecommendation={() => setNotice('Preview only: no quest activated.')} onSkipRecommendation={() => setNotice('Preview only: suggestion skipped.')}
 /> :
        page === 'Quests' ? <QuestsScreen model={questsExample} onCreate={() => setNotice('Preview only: create a custom quest.')} onPersonalize={() => setNotice('Preview only: personalize quest.')} onAccept={() => setNotice('Preview only: no quest activated.')} /> :
        page === 'History' ? <HistoryScreen model={historyExample}
          controls={<DetailsPanel title="History settings" description="Sources, selected apps and collection"><Text>Figma sample only. No usage has been measured.</Text></DetailsPanel>} /> :
        <SettingsScreen model={settingsExample} bottomClearance={0}
          toneContent={<SettingsRow label="Nudge Tone" value={{ state: 'ready', text: 'Supportive' }} icon={settingsAssets.info} iconID="preview-tone" onPress={() => setNotice('Preview only. Installed app offers Supportive, Direct, Playful and Intense tones.')} />}
          deviceContent={<SettingsRow label="Screen Time access" value={{ state: 'ready', text: 'Permissions and selected apps' }} icon={settingsAssets.apps} iconID="preview-device-access" onView={() => setNotice('In the installed app this opens Screen Time access, then the native app picker.')} />}
          planContent={<DetailsPanel title="Manage device schedule" description="Review and apply your saved plan"><Text>Preview only. Your device schedule is unchanged.</Text></DetailsPanel>}
 />}
      </SafeAreaProvider>
    </div>
  </main>;
}
