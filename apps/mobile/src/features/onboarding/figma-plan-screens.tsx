import planAsset0 from '../../../assets/onboarding/plan/current/suggestion-imgInstagram.svg';
import planAsset1 from '../../../assets/onboarding/plan/current/suggestion-imgGhost.svg';
import planAsset2 from '../../../assets/onboarding/plan/current/manual-imgDisconnectSettingsIconDistractingApps.svg';
import planAsset3 from '../../../assets/onboarding/plan/current/manual-imgFrame.svg';
import planAsset4 from '../../../assets/onboarding/plan/current/loading-imgDisconnectDinosaur.svg';
import planAsset5 from '../../../assets/onboarding/plan/current/loading-imgGlow.svg';
import planAsset6 from '../../../assets/onboarding/plan/current/loading-imgLoadingTrack.svg';
import planAsset7 from '../../../assets/onboarding/plan/current/loading-imgLoadingProgress.svg';
import planAsset8 from '../../../assets/onboarding/plan/current/loading-imgStar.svg';
import planAsset9 from '../../../assets/onboarding/plan/current/loading-imgSparkle.svg';
import planAsset10 from '../../../assets/onboarding/plan/current/loading-imgProgressTip.svg';
import planAsset11 from '../../../assets/onboarding/plan/current/loading-imgLoadingDots.svg';
import planAsset12 from '../../../assets/onboarding/plan/current/loading-imgStageIndicator.svg';
import planAsset13 from '../../../assets/onboarding/plan/current/loading-imgStageIndicator1.svg';
import planAsset14 from '../../../assets/onboarding/plan/current/complete-imgDisconnectDinosaur.svg';
import planAsset15 from '../../../assets/onboarding/plan/current/complete-imgEllipse.svg';
import planAsset16 from '../../../assets/onboarding/plan/current/complete-imgSparkle.svg';
import planAsset17 from '../../../assets/onboarding/plan/current/complete-imgStar.svg';
import planAsset18 from '../../../assets/onboarding/plan/current/complete-imgSparkleLeft.svg';
import planAsset19 from '../../../assets/onboarding/plan/current/complete-imgEllipse1.svg';
import planAsset20 from '../../../assets/onboarding/plan/current/complete-imgEllipse2.svg';
import planAsset21 from '../../../assets/onboarding/plan/current/complete-imgEllipse3.svg';
import planAsset22 from '../../../assets/onboarding/plan/current/complete-imgEllipse4.svg';
import planAsset23 from '../../../assets/onboarding/plan/current/complete-imgEllipse5.svg';
import planAsset24 from '../../../assets/onboarding/plan/current/complete-imgEllipse6.svg';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignArtwork } from '@/components/ui/design-artwork';
import { UiThemeProvider } from '@/components/ui/theme';
import { colors, fonts } from '@/design/tokens';

type AssetName = keyof typeof assets;
const assets = {
  instagram: planAsset0,
  snapchat: planAsset1,
  apps: planAsset2,
  back: planAsset3,
  loadingDino: planAsset4,
  loadingGlow: planAsset5,
  loadingTrack: planAsset6,
  loadingProgress: planAsset7,
  loadingStar: planAsset8,
  loadingSparkle: planAsset9,
  loadingTip: planAsset10,
  dots: planAsset11,
  done: planAsset12,
  preparing: planAsset13,
  completeDino: planAsset14,
  completeGlow: planAsset15,
  completeSparkle: planAsset16,
  completeStar: planAsset17,
  completeLeft: planAsset18,
  dot1: planAsset19,
  dot2: planAsset20,
  dot3: planAsset21,
  dot4: planAsset22,
  dot5: planAsset23,
  dot6: planAsset24,
};
export function PlanArt({ name, width, height = width }: { name: AssetName; width: number; height?: number }) {
  return <DesignArtwork asset={{ source: assets[name], width, height }} />;
}
export function PlanAction({ label, onPress, disabled = false, secondary = false, busy = false }: {
  label: string; onPress(): void; disabled?: boolean; secondary?: boolean; busy?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [s.action, secondary && s.secondary, (pressed || disabled || busy) && s.dim]}>
    <Text style={[s.actionText, secondary && s.white]}>{busy ? 'Saving…' : label}</Text>
  </Pressable>;
}
export function PlanFrame({ children, complete = false, manual = false, onSkip, onBack, busy = false }: {
  children: ReactNode; complete?: boolean; manual?: boolean; onSkip?: () => void; onBack?: () => void; busy?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return <UiThemeProvider theme="dark"><KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView accessibilityLabel={manual ? 'Personal plan' : 'Onboarding plan'} keyboardShouldPersistTaps="handled"
      contentContainerStyle={[s.page, { paddingTop: Math.max(insets.top, 44), paddingBottom: Math.max(insets.bottom, 24) }]}>
      {manual ? <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={onBack} style={s.back}>
        <PlanArt name="back" width={16} /><Text style={s.backText}>Back</Text>
      </Pressable> : <>
        <View style={s.topAction}>{onSkip && !complete && <Pressable accessibilityRole="button" disabled={busy}
          onPress={onSkip} style={s.skip}><Text style={s.backText}>Skip</Text></Pressable>}</View>
        <View accessibilityRole="progressbar" accessibilityLabel={`Onboarding step ${complete ? 7 : 6} of 7`}
          accessibilityValue={{ min: 1, max: 7, now: complete ? 7 : 6 }} style={s.progress}>
          {Array.from({ length: 7 }, (_, i) => <View key={i} style={[s.segment, (complete || i < 6) && s.green]} />)}
        </View>
        <Text style={s.count}>{complete ? 7 : 6} of 7</Text>
      </>}
      {children}
    </ScrollView>
  </KeyboardAvoidingView></UiThemeProvider>;
}
export type PlanAppCard = Readonly<{ name: string; icon?: 'instagram' | 'snapchat' | 'apps'; minutes: number | null; detail: string; caption?: string }>;
export function PlanSuggestionScreen({ apps, description, estimate, onAccept, onManual, onSkip, busy = false, error }: {
  apps: readonly PlanAppCard[]; description: string; estimate: { label: string; detail: string };
  onAccept(): void; onManual(): void; onSkip(): void; busy?: boolean; error?: string;
}) {
  return <PlanFrame onSkip={onSkip} busy={busy}>
    <Text accessibilityRole="header" style={s.title}>We created a plan for you</Text>
    <Text style={s.description}>{description}</Text>
    <View style={s.suggestionCards}>{apps.map(app => <View key={app.name} style={s.appCard}>
      <View style={s.row}><View style={s.appIcon}><PlanArt name={app.icon ?? 'apps'} width={20} /></View>
        <View style={s.flex}><Text style={s.appName}>{app.name}</Text><Text style={s.appCaption}>{app.caption ?? (app.minutes === null ? 'Choose apps in device setup' : `${app.minutes} min break`)}</Text></View>
        <View style={s.badge}><Text style={s.badgeText}>{app.minutes === null ? 'DRAFT' : `${app.minutes} MIN`}</Text></View>
      </View><Text style={s.detail}>{app.detail}</Text>
    </View>)}
      <View style={[s.appCard, s.estimate]}><View style={[s.row, s.spread]}><Text style={s.estimateTitle}>Weekly estimate</Text>
        <View style={s.badge}><Text style={s.badgeText}>{estimate.label}</Text></View></View><Text style={s.detail}>{estimate.detail}</Text></View>
    </View>
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    <View style={s.accept}><PlanAction label="Go with suggestion" busy={busy} onPress={onAccept} /></View>
    <Text style={s.adjust}>You can change it later on your own from settings.</Text>
    <View style={s.manualAction}><PlanAction label="Set up on my own" secondary disabled={busy} onPress={onManual} /></View>
  </PlanFrame>;
}
function PositionedArt({ name, x, y, size, height = size }: { name: AssetName; x: number; y: number; size: number; height?: number }) {
  return <View style={{ position: 'absolute', left: x, top: y }}><PlanArt name={name} width={size} height={height} /></View>;
}
export function PlanLoadingScreen({ apps, hobbies, onSkip, busy = false }: { apps: string; hobbies: string; onSkip(): void; busy?: boolean }) {
  return <PlanFrame onSkip={onSkip} busy={busy}>
    <Text accessibilityRole="header" style={s.title}>We are setting up your plan</Text>
    <Text style={s.description}>A little less scrolling. A little more time for what you love.</Text>
    <View style={s.loadingArea}><View style={s.mascot}>
      <PositionedArt name="loadingGlow" x={-16} y={-16} size={208} />
      <PositionedArt name="loadingTrack" x={8} y={8} size={160} />
      <PositionedArt name="loadingProgress" x={18.72} y={8} size={149.28} height={160} />
      <View style={s.loadingDino}><PlanArt name="loadingDino" width={84} /></View>
      <PositionedArt name="loadingStar" x={149} y={20} size={14} />
      <PositionedArt name="loadingSparkle" x={36} y={41} size={10} />
      <PositionedArt name="loadingTip" x={16} y={123} size={8} />
    </View><View style={s.loadingMessage}><Text style={s.loadingLabel}>Putting your plan together</Text><PlanArt name="dots" width={15} height={3} /></View></View>
    <View style={s.stages}>{[
      [apps ? 'Your apps are chosen' : 'App selection is next', apps || 'Choose apps in device setup'],
      ['Your hobbies are chosen', hobbies || 'Choose your activities'],
      ['Preparing your suggestion', 'Making room for what you love'],
    ].map(([label, detail], index) => <View key={label} style={[s.stage, index < 2 && s.stageBorder]}>
      <PlanArt name={index === 2 || (index === 0 && !apps) ? 'preparing' : 'done'} width={28} /><View style={s.flex}>
        <Text style={[s.stageTitle, index === 2 && s.greenText]}>{label}</Text><Text style={s.stageDetail}>{detail}</Text>
      </View></View>)}</View>
    <View style={s.loadingFooter}><Text style={s.loadingFooterTitle}>Your suggestion is up next.</Text><Text style={s.loadingFooterNote}>You can always change your plan later.</Text></View>
  </PlanFrame>;
}
export function PlanCompletionScreen({ hobbies, onFinish, message = 'Your preferences are ready. You can adjust them anytime in Settings.' }: {
  hobbies: readonly string[]; onFinish(): void; message?: string;
}) {
  return <PlanFrame complete><View style={s.celebration}>
    <PositionedArt name="completeGlow" x={4} y={40} size={200} />
    <View style={s.completeDino}><PlanArt name="completeDino" width={60} /><PositionedArt name="completeSparkle" x={6} y={6} size={10} /></View>
    <View style={s.hat}><Text style={s.hatText}>🎉</Text></View>
    <PositionedArt name="dot1" x={27} y={37.16} size={6} /><PositionedArt name="dot2" x={169} y={44.16} size={5} />
    <PositionedArt name="dot3" x={15} y={110.16} size={4} /><PositionedArt name="dot4" x={185} y={102.16} size={6} />
    <PositionedArt name="dot5" x={46} y={132.16} size={3} /><PositionedArt name="dot6" x={159} y={129.16} size={4} />
    <PositionedArt name="completeStar" x={171} y={30.16} size={14} /><PositionedArt name="completeLeft" x={22} y={52.16} size={10} />
    <View style={s.congratulations}><Text style={s.congratulationsText}>CONGRATULATIONS!</Text></View><View style={s.smallRule} />
    </View>
    <Text accessibilityRole="header" style={s.completeTitle}>You’re all set!</Text>
    <Text style={s.completeSubtitle}>Redirect to what you love.</Text>
    <View style={s.chips}>{hobbies.map(hobby => <View key={hobby} style={s.chip}><Text style={s.chipText}>{hobby === 'Gym' ? '🏋️ ' : hobby === 'Reading' ? '📖 ' : ''}{hobby}</Text></View>)}</View>
    <Text style={s.completeNote}>{message}</Text><View style={s.completeRule} />
    <View style={s.finish}><PlanAction label="Let’s start →" onPress={onFinish} /></View>
  </PlanFrame>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas }, page: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  topAction: { height: 32, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 17 }, skip: { minWidth: 44, minHeight: 32, justifyContent: 'center', alignItems: 'flex-end' },
  back: { minHeight: 44, flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start' }, backText: { color: colors.darkOnboardingMuted, fontFamily: fonts.medium, fontSize: 14 },
  progress: { flexDirection: 'row', gap: 4 }, segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)' }, green: { backgroundColor: colors.action },
  count: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 13, color: colors.action, marginTop: 10 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.5, marginTop: 15 },
  description: { color: colors.darkOnboardingMuted, fontFamily: fonts.light, fontSize: 14, lineHeight: 19, letterSpacing: 0.1, marginTop: 10 },
  suggestionCards: { gap: 16, marginTop: 28 }, appCard: { minHeight: 112, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 11, borderWidth: 1, borderColor: colors.darkOutline, borderRadius: 14, backgroundColor: colors.darkCard, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, spread: { justifyContent: 'space-between' }, flex: { flex: 1, minWidth: 0 },
  appIcon: { width: 40, height: 40, backgroundColor: '#313131', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, color: colors.white }, appCaption: { fontFamily: fonts.light, fontSize: 11, lineHeight: 14, marginTop: 2, color: colors.darkOnboardingMuted },
  detail: { fontFamily: fonts.light, fontSize: 12, lineHeight: 16, color: colors.darkOnboardingMuted }, badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.action }, badgeText: { fontFamily: fonts.bold, fontSize: 10, lineHeight: 13, color: colors.actionLabel },
  estimate: { borderColor: colors.action, gap: 10 }, estimateTitle: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 17, color: colors.white },
  accept: { marginTop: 22 }, action: { minHeight: 52, borderRadius: 10, backgroundColor: colors.action, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 }, actionText: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.actionLabel, textAlign: 'center' }, secondary: { backgroundColor: 'rgba(205,205,205,0.4)' }, white: { color: colors.white }, dim: { opacity: 0.5 },
  adjust: { color: colors.darkOnboardingMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 10 }, manualAction: { marginTop: 15 }, error: { color: colors.darkError, fontFamily: fonts.regular, marginTop: 12 },
  loadingArea: { alignItems: 'center', paddingTop: 24, height: 252, gap: 16 }, mascot: { width: 176, height: 176 }, loadingDino: { position: 'absolute', left: 28, top: 28, width: 120, height: 120, borderRadius: 24, backgroundColor: colors.darkCard, alignItems: 'center', justifyContent: 'center' },
  loadingMessage: { flexDirection: 'row', alignItems: 'center', gap: 8 }, loadingLabel: { fontFamily: fonts.medium, color: colors.action, fontSize: 13 },
  stages: { paddingHorizontal: 15, backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.darkOutline, borderRadius: 14 }, stage: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 16 }, stageBorder: { borderBottomWidth: 1, borderColor: colors.darkOutline }, stageTitle: { fontFamily: fonts.medium, fontSize: 13, color: colors.white }, stageDetail: { fontFamily: fonts.light, fontSize: 11, color: colors.darkOnboardingMuted, marginTop: 4 }, greenText: { color: colors.action }, loadingFooter: { marginTop: 'auto', paddingTop: 40, paddingBottom: 24, gap: 8 }, loadingFooterTitle: { fontFamily: fonts.medium, fontSize: 12, color: colors.darkOnboardingMuted, textAlign: 'center' }, loadingFooterNote: { fontFamily: fonts.light, fontSize: 11, color: colors.darkOnboardingMuted, textAlign: 'center' },
  celebration: { width: 208, height: 200, alignSelf: 'center', marginTop: 53.16 }, completeDino: { position: 'absolute', left: 54, top: 20, width: 100, height: 100, backgroundColor: colors.darkCard, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, hat: { position: 'absolute', left: 114, top: 0, width: 20, height: 20, borderRadius: 4, transform: [{ rotate: '-12deg' }], backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }, hatText: { fontSize: 12 }, congratulations: { position: 'absolute', left: 20, top: 136.16, width: 167, height: 28, borderRadius: 14, backgroundColor: colors.action, justifyContent: 'center', alignItems: 'center' }, congratulationsText: { color: colors.actionLabel, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 }, smallRule: { position: 'absolute', left: 54, top: 178.16, width: 100, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  completeTitle: { marginTop: 8, fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, letterSpacing: -0.5, color: colors.white, textAlign: 'center' }, completeSubtitle: { fontFamily: fonts.light, fontSize: 14, lineHeight: 19, letterSpacing: 0.1, color: colors.darkOnboardingMuted, textAlign: 'center', marginTop: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 25 }, chip: { minHeight: 36, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.darkCard, borderColor: 'rgba(51,198,89,0.25)', borderWidth: 1 }, chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.action }, completeNote: { fontFamily: fonts.light, fontSize: 13, lineHeight: 18, letterSpacing: 0.1, color: colors.darkOnboardingMuted, textAlign: 'center', width: '86%', alignSelf: 'center', marginTop: 22, minHeight: 54 }, completeRule: { height: 1, backgroundColor: colors.darkOutline, marginTop: 49 }, finish: { marginTop: 'auto', paddingTop: 30 },
});
