import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { colors, fonts } from '@/design/tokens';
import { figmaIcons } from './figma-icons';

type Props = {
  stage: 'loading' | 'plan' | 'complete';
  apps: string[];
  hobbies: string[];
  saving: boolean;
  error: string | null;
  onPrepared(): void;
  onAccept(): void;
  onEdit(): void;
  onBack(): void;
  onFinish(): void;
};

/** Figma 52:690, 50:87, 50:89. These are local previews, not native policies. */
export function PlanScreens({ stage, apps, hobbies, saving, error, onPrepared, onAccept, onEdit, onBack, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const complete = stage === 'complete';
  return <View style={s.screen}>
    <View style={[s.container, { paddingTop: Math.max(insets.top, 44), paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={s.topAction}>
        {!complete && <Pressable accessibilityRole="button" onPress={onAccept} style={s.skip}><Text style={s.muted}>Skip</Text></Pressable>}
      </View>
      <View accessibilityRole="progressbar" accessibilityLabel={`Onboarding step ${complete ? 7 : 6} of 7`}
        accessibilityValue={{ min: 1, max: 7, now: complete ? 7 : 6 }} style={s.progress}>
        {Array.from({ length: 7 }, (_, i) => <View key={i} style={[s.segment, (complete || i < 6) && s.active]} />)}
      </View>
      <Text style={s.count}>{complete ? 7 : 6} of 7</Text>
      <ScrollView style={s.scroll} contentContainerStyle={[s.content, complete && s.completeContent]} keyboardShouldPersistTaps="handled">
        {complete ? <>
          <Image accessible={false} source={require('../../../assets/onboarding/plan/questions-congratulations-art.png')} style={s.celebration} resizeMode="contain" />
          <View style={s.congratulations}><Text style={s.congratulationsText}>CONGRATULATIONS!</Text></View>
          <View style={s.divider} />
          <Text accessibilityRole="header" style={s.completeTitle}>You’re all set!</Text>
          <Text style={s.centerCopy}>Redirect to what you love.</Text>
          <View style={s.chips}>{hobbies.map(hobby => <View key={hobby} style={s.chip}><ActivityIcon name={hobby} /><Text style={s.chipText}>{hobby}</Text></View>)}</View>
          <Text style={s.completeNote}>{hobbies.length ? 'Your activities are ready to save on this device.' : 'You can choose your activities later.'} App protection has not been activated.</Text>
          <View style={s.rule} />
        </> : <>
          <Text accessibilityRole="header" style={s.title}>{stage === 'loading' ? 'Preparing your plan preview' : 'We created a plan for you'}</Text>
          <Text style={s.description}>{stage === 'loading' ? 'A little less scrolling. A little more time for what you love.' : `Preview ${apps.length ? apps.join(' and ') : 'your app breaks'} with 10-minute breaks. Make room for ${hobbies.join(' and ') || 'what you love'}.`}</Text>
          {stage === 'loading' ? <>
            <Image accessible={false} source={require('../../../assets/onboarding/plan/questions-plan-loading-art.png')} style={s.loadingArt} resizeMode="contain" />
            <Text style={s.loadingCopy}>Putting your preview together ···</Text>
            <View style={s.stages}>
              <Stage title="Your apps are chosen" detail={apps.join(' · ') || 'No apps chosen'} />
              <Stage title="Your hobbies are chosen" detail={hobbies.join(' · ') || 'No activities chosen'} />
              <Stage title="Preparing your suggestion" detail="Making room for what you love" last />
            </View>
            <Text style={s.reassurance}>Your suggestion is up next.</Text>
            <Text style={s.centerCopy}>A local preview, ready for you to review.</Text>
            <Action label="View my plan" onPress={onPrepared} />
          </> : <>
            <View style={s.cards}>
              {apps.length === 0 && <View style={s.card}><Text style={s.cardTitle}>No apps chosen yet</Text><Text style={s.detail}>Choose your apps to preview a suggestion.</Text></View>}
              {apps.map((app, i) => <View key={app} style={s.card}>
                <View style={s.row}><AppIcon name={app} /><View style={s.cardName}><Text style={s.cardTitle}>{app}</Text><Text style={s.detail}>10 min break</Text></View><Text style={s.badge}>10 MIN</Text></View>
                <Text style={s.detail}>Replace one 10-minute scroll session each day, so you can keep more time for {hobbies[i % Math.max(hobbies.length, 1)] || 'what you love'}.</Text>
              </View>)}
              <View style={[s.card, s.estimate]}>
                <View style={s.row}><Text style={[s.cardTitle, s.cardName]}>Weekly estimate</Text><Text style={s.badge}>{apps.length * 70} MIN</Text></View>
                <Text style={s.detail}>Illustration only: replacing one 10-minute scroll session per selected app each day. This is not measured time saved.</Text>
              </View>
            </View>
            <Action label="Go with suggestion" onPress={onAccept} />
            <Text style={s.reassurance}>Preview only. No restrictions will be applied.</Text>
            <Action label="Set up on my own" onPress={onEdit} secondary />
            <Text style={s.reassurance}>Choose your days, hours, app sessions and apps.</Text>
            <Pressable accessibilityRole="button" onPress={onBack} style={s.back}><Text style={s.centerCopy}>Back</Text></Pressable>
          </>}
        </>}
        {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      </ScrollView>
      {complete && <Action label={saving ? 'Saving…' : error ? 'Try again →' : 'Let’s start →'} disabled={saving} onPress={onFinish} />}
    </View>
  </View>;
}

function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress(): void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.action, secondary && s.secondary, (disabled || pressed) && s.pressed]}><Text style={[s.actionText, secondary && s.secondaryText]}>{label}</Text></Pressable>;
}
function Stage({ title, detail, last = false }: { title: string; detail: string; last?: boolean }) {
  return <View style={[s.stage, !last && s.stageBorder]}><Text style={s.check}>{last ? '◌' : '✓'}</Text><View style={s.cardName}><Text style={[s.stageTitle, last && s.green]}>{title}</Text><Text style={s.detail}>{detail}</Text></View></View>;
}
function ActivityIcon({ name }: { name: string }) {
  const icons: Record<string, string> = { Gym: 'hobby-gym', Reading: 'hobby-book', 'Arts & crafts': 'hobby-arts', Walking: 'hobby-walk', Music: 'hobby-music', Cooking: 'hobby-cooking' };
  const icon = figmaIcons[icons[name] as keyof typeof figmaIcons];
  return icon ? <SvgXml xml={icon} width={14} height={14} /> : null;
}
function AppIcon({ name }: { name: string }) {
  const icons: Record<string, string> = { Instagram: 'app-camera', Snapchat: 'app-ghost', TikTok: 'app-play', YouTube: 'app-play', X: 'app-bird' };
  const xml = figmaIcons[icons[name] as keyof typeof figmaIcons];
  return <View style={s.appIcon}>{xml ? <SvgXml xml={xml} width={20} height={20} /> : <Text style={s.chipText}>R</Text>}</View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas },
  container: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  topAction: { height: 32, alignItems: 'flex-end' },
  skip: { minHeight: 32, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  muted: { color: colors.darkMuted, fontFamily: fonts.regular, fontSize: 13 },
  progress: { flexDirection: 'row', gap: 4 }, segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#363636' }, active: { backgroundColor: colors.action },
  count: { color: colors.action, fontFamily: fonts.regular, fontSize: 10, marginTop: 10 },
  scroll: { flex: 1 }, content: { paddingTop: 20, paddingBottom: 20 },
  title: { fontFamily: fonts.bold, color: colors.white, fontSize: 26, lineHeight: 34 },
  description: { color: colors.darkMuted, fontFamily: fonts.light, fontSize: 14, lineHeight: 19, marginTop: 10, marginBottom: 24 },
  cards: { gap: 16, marginBottom: 24 }, card: { backgroundColor: colors.darkCard, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#393939', gap: 12, minHeight: 112 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, cardName: { flex: 1, minWidth: 0 }, cardTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  detail: { fontFamily: fonts.light, fontSize: 12, lineHeight: 16, color: colors.darkMuted },
  badge: { fontFamily: fonts.bold, fontSize: 10, color: '#111111', backgroundColor: colors.action, borderRadius: 15, paddingHorizontal: 10, paddingVertical: 7, overflow: 'hidden' },
  appIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#313131', justifyContent: 'center', alignItems: 'center' }, estimate: { borderColor: colors.action },
  action: { minHeight: 52, borderRadius: 10, backgroundColor: colors.action, padding: 14, justifyContent: 'center', alignItems: 'center' }, actionText: { fontFamily: fonts.bold, color: '#111111', fontSize: 16, textAlign: 'center' },
  secondary: { backgroundColor: '#666666' }, secondaryText: { color: colors.white }, pressed: { opacity: 0.65 }, back: { minHeight: 44, justifyContent: 'center' },
  reassurance: { color: colors.darkMuted, fontFamily: fonts.light, textAlign: 'center', fontSize: 11, lineHeight: 16, marginVertical: 12 }, centerCopy: { color: colors.darkMuted, fontFamily: fonts.light, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  loadingArt: { width: 213, height: 210, alignSelf: 'center', marginTop: 2 }, loadingCopy: { color: colors.action, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginVertical: 20 },
  stages: { backgroundColor: colors.darkCard, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#393939' }, stage: { flexDirection: 'row', gap: 14, alignItems: 'center', minHeight: 67, paddingVertical: 12 }, stageBorder: { borderBottomWidth: 1, borderBottomColor: '#393939' }, stageTitle: { color: colors.white, fontFamily: fonts.medium, fontSize: 12 }, check: { color: colors.action, fontSize: 20 }, green: { color: colors.action },
  completeContent: { alignItems: 'center', paddingTop: 40 }, celebration: { width: 214, height: 150 }, congratulations: { backgroundColor: colors.action, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 8 }, congratulationsText: { color: '#111111', fontFamily: fonts.bold, fontSize: 10 }, divider: { width: 100, height: 1, backgroundColor: '#363636', marginTop: 14, marginBottom: 32 },
  completeTitle: { color: colors.white, fontFamily: fonts.bold, fontSize: 32, textAlign: 'center', marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 24 }, chip: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%', backgroundColor: colors.darkCard, borderWidth: 1, borderColor: '#33583c', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14 }, chipText: { color: colors.action, fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 }, completeNote: { color: colors.darkMuted, fontFamily: fonts.light, fontSize: 14, textAlign: 'center', lineHeight: 19, marginTop: 24, maxWidth: 290, width: '100%' }, rule: { height: 1, width: '100%', backgroundColor: '#303030', marginTop: 44 }, error: { color: '#FFB9B9', fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, marginVertical: 16, textAlign: 'center' },
});
