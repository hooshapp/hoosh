import { example as settingsExample } from './settings-specimen';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AgeEditor, ActivitiesEditor, AppsEditor, GenderEditor, type ActivityDraft, type SelectionOption } from '@/features/preferences/preference-editors';
import { SettingsScreen } from '@/features/settings/settings-screen';
import { preferenceAssets as assets } from '@/design/preference-assets';
const activityOptions: readonly SelectionOption[] = ['Gym', 'Reading', 'Arts and crafts', 'Walking', 'Music', 'Cooking'].map((label, i) => ({ id: label, label, icon: [assets.gym, assets.reading, assets.arts, assets.walking, assets.music, assets.cooking][i] }));
const apps: readonly SelectionOption[] = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'WhatsApp', 'Spotify'].map((label, i) => ({ id: label, label, icon: [assets.instagram, assets.tiktok, assets.youtube, assets.snapchat, assets.whatsapp, assets.spotify][i], background: ['#CF3489', '#151515', '#F12B31', '#F7E300', '#23B963', '#181818'][i] }));
const genderOptions = ['Men', 'Women', 'Other'].map((label) => ({ id: label, label }));
export function PreferenceSpecimen({ width }: { width: number }) {
  const [screen, setScreen] = useState('Activities'), [age, setAge] = useState<number | null>(24), [gender, setGender] = useState<string | null>('Men');
  const [activity, setActivity] = useState<ActivityDraft>({ selected: ['Gym', 'Reading'], customSelected: true, custom: 'Studying' });
  const [selected, setSelected] = useState<readonly string[]>(['Instagram', 'TikTok', 'YouTube']);
  const [notice, setNotice] = useState('Example choices only; no account or device connected.');
  const action = () => setNotice('Preview intent only. No account preferences saved or native apps selected.');
  const actions = { dirty: true, onSave: action, onDiscard: action };
  return <section data-testid="RN09F_PREFERENCES_ONLY"><h2>Preference editors — local presentation</h2>
    <label>Preference page <select value={screen} onChange={(e) => setScreen(e.target.value)}>{['Activities', 'Age', 'Apps', 'Native unavailable', 'Gender', 'Long text'].map((label) => <option key={label}>{label}</option>)}</select></label><p role="status">{notice}</p>
    <div className="phone" data-preference-phone style={{ width }}><SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 852 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
      {screen === 'Age' ? <AgeEditor value={age} options={[21, 22, 23, 24, 25, 26, 27]} onChange={setAge} onBack={action} {...actions} />
      : screen === 'Apps' ? <AppsEditor selection={{ kind: 'catalog', options: apps, selected, sourceLabel: 'Example list · no phone usage data connected', onChange: setSelected }} onBack={action} {...actions} />
      : screen === 'Native unavailable' ? <AppsEditor selection={{ kind: 'native', summary: null }} onBack={action} dirty={false} state="unavailable" />
      : screen === 'Gender' ? <SettingsScreen model={{ ...settingsExample, personalInfo: { age: { state: 'ready', text: String(age) }, gender: { state: 'ready', text: gender } } }} onEdit={{ gender: action }} inlineEditor={{ field: 'gender', content: <GenderEditor value={gender} options={genderOptions} onChange={setGender} {...actions} /> }} />
      : <ActivitiesEditor draft={activity} options={screen === 'Long text' ? activityOptions.map((option) => ({ ...option, label: option.label + ' — an intentionally long localized activity label' })) : activityOptions} onChange={setActivity} onBack={action} {...actions} />}
    </SafeAreaProvider></div></section>;
}
