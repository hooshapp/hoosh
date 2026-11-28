import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/button';
import { colors, fonts } from '@/design/tokens';
import { useIOSSelectionDevice, useNativeInstallation, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { AndroidDeviceAccountReview } from '@/features/protection/android-device-account-review';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';
import { deviceProtectionIntegration } from '@/infrastructure/native/protection-integration';
import { decodeSavedSelection, decodeSelectionDraft } from '@/infrastructure/native/selection-editor';
import type { InstallationReview } from '@/infrastructure/native/native-owner-session';

/** Requests the existing native Family Controls bridge directly from onboarding. */
export function QuestionnairePermission({ busy: saving, onContinue, onBack, selectionQuestion = false, reviewSavedSelection = false }: {
  busy: boolean; selectionQuestion?: boolean; reviewSavedSelection?: boolean; onBack?(): void; onContinue(deferred: boolean, selectionRevision?: number, selectedAppCount?: number): void;
}) {
  const iosDevice = useIOSSelectionDevice();
  const androidOwner = useNativeOwner();
  const planRead = useAccountWeeklyPlan()?.plan.read;
  const needsAndroidClaim = Platform.OS === 'android' && planRead?.phase === 'error' && planRead.otherAccount;
  const device = useMemo(() => Platform.OS === 'ios' ? iosDevice : androidOwner && deviceProtectionIntegration.availability === 'connected' ? {
    owner: androidOwner.owner, selection: androidOwner.port,
    readSelection: async () => decodeSavedSelection(await androidOwner.port.selectionRead(androidOwner.owner), androidOwner.owner),
    readStatus: async () => ({ authorization: deviceProtectionIntegration.availability === 'connected' ? await deviceProtectionIntegration.service.getAuthorization() : 'unavailable' }),
  } : null, [iosDevice, androidOwner]);
  const installation = useNativeInstallation();
  const [state, setState] = useState<{ authorized: boolean; count?: number; revision?: number; review?: InstallationReview }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [selectionReviewed, setSelectionReviewed] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const active = useRef(true), lock = useRef(false), readID = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const refresh = useCallback(async () => {
    if (!active.current) return;
    const id = ++readID.current;
    try {
      if (Platform.OS === 'ios') {
        if (!device || !installation) return;
        const review = await installation.read();
        if (!active.current || id !== readID.current) return;
        if (review.status !== 'owned') { setState({ authorized: false, review }); return; }
        const [status, selection] = await Promise.all([device.readStatus(), device.readSelection()]);
        if (active.current && id === readID.current) { setState({ authorized: status.authorization === 'authorized', revision: selection.revision, count: selection.needsReselection ? 0 : selection.selectedAppCount, review }); setError(false); }
      } else if (deviceProtectionIntegration.availability === 'connected') {
        const authorization = await deviceProtectionIntegration.service.getAuthorization();
        const selection = device ? await device.readSelection() : null;
        if (active.current && id === readID.current) { setState({ authorized: authorization === 'authorized', revision: selection?.revision, count: selection?.needsReselection ? 0 : selection?.selectedAppCount }); setError(false); }
      }
    } catch { if (active.current && id === readID.current) setError(true); }
  }, [device, installation]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', value => {
      if (value === 'active') void refresh();
      else readID.current++;
    });
    return () => subscription.remove();
  }, [refresh]);
  async function request() {
    if (lock.current || saving || AppState.currentState !== 'active' || state?.authorized) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      if (Platform.OS === 'ios') {
        if (!device || !installation || state?.review?.status !== 'owned') throw new Error('Review required');
        await iosDevice!.requestAuthorization();
      } else if (deviceProtectionIntegration.availability === 'connected') {
        await deviceProtectionIntegration.service.requestAuthorization();
      } else throw new Error('Native permission unavailable');
      await refresh();
    } catch { if (active.current) setError(true); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  }
  async function chooseApps() {
    if (!device || lock.current || saving || AppState.currentState !== 'active' || (!selectionQuestion && (!state?.authorized || (Platform.OS === 'ios' && state.review?.status !== 'owned')))) return;
    lock.current = true; setBusy(true); setSelectionError(false); setSelectionReviewed(false);
    let draftID: string | undefined;
    try {
      if (selectionQuestion) {
        // The explicit target-selection action prepares this account; never claim on mount.
        if (Platform.OS === 'ios') {
          if (!installation || !iosDevice) throw new Error('Native setup unavailable');
          const review = await installation.read();
          if (!active.current) return;
          if (review.status !== 'owned') await installation.claim(review.revision);
          if (!active.current || (await installation.read()).status !== 'owned') throw new Error('Account setup unconfirmed');
        }
        const before = await device.readStatus();
        if (!active.current) return;
        if (before.authorization !== 'authorized') {
          if (Platform.OS === 'ios') await iosDevice!.requestAuthorization();
          else if (deviceProtectionIntegration.availability === 'connected') await deviceProtectionIntegration.service.requestAuthorization();
          else throw new Error('Native access unavailable');
        }
        if (!active.current) return;
        const status = await device.readStatus();
        await refresh();
        if (!active.current || status.authorization !== 'authorized') return;
      }
      const draft = decodeSelectionDraft(await device.selection.selectionBegin(device.owner));
      draftID = draft.draftId;
      if (!active.current) return;
      const picked = decodeSelectionDraft(await device.selection.selectionPick(device.owner, draft.draftId, draft.draftVersion));
      if (!active.current) return;
      if (picked.draftId !== draft.draftId || picked.baseRevision !== draft.baseRevision ||
        picked.draftVersion < draft.draftVersion || picked.draftVersion > draft.draftVersion + 1 ||
        picked.savedAppCount !== draft.savedAppCount || !picked.selectedAppCount) throw new Error('Review apps');
      const committed = decodeSelectionDraft(await device.selection.selectionCommit(device.owner, picked.draftId, picked.draftVersion));
      if (!active.current) return;
      if (committed.draftId !== picked.draftId || committed.dirty || committed.draftVersion !== picked.draftVersion ||
        committed.selectedAppCount !== picked.selectedAppCount || committed.baseRevision < picked.baseRevision ||
        committed.baseRevision > picked.baseRevision + 1) throw new Error('Unconfirmed selection');
      const [status, saved] = await Promise.all([device.readStatus(), device.readSelection()]);
      if (!active.current) return;
      if (status.authorization !== 'authorized' || saved.needsReselection || saved.selectedAppCount !== committed.selectedAppCount || saved.revision !== committed.baseRevision) throw new Error('Unconfirmed selection');
      setState(current => ({ ...current, authorized: true, count: saved.selectedAppCount, revision: saved.revision }));
      setSelectionReviewed(true);
    } catch (error: unknown) {
      if (active.current) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
        if (code !== 'ERR_SELECTION_CANCELLED') setSelectionError(true);
      }
    } finally {
      if (draftID) void device.selection.selectionRelease(device.owner, draftID).catch(() => undefined);
      lock.current = false; if (active.current) setBusy(false);
    }
  }
  function prepare() {
    if (!installation || !state?.review || lock.current || saving) return;
    const revision = state.review.revision;
    Alert.alert('Review existing Hoosh setup', 'This stops existing Hoosh protection on this device and prepares setup for this account. Previous account history stays private. No new protection starts automatically.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop and reconfigure', style: 'destructive', onPress: () => {
        if (lock.current || !active.current) return;
        lock.current = true; setBusy(true); setError(false);
        void installation.claim(revision).then(refresh).catch(() => { if (active.current) setError(true); })
          .finally(() => { lock.current = false; if (active.current) setBusy(false); });
      } },
    ]);
  }
  const targetsReady = selectionReviewed || (reviewSavedSelection && !!state?.count);
  const supported = Platform.OS === 'ios' ? !!device && !!installation : !!device && deviceProtectionIntegration.availability === 'connected';
  const needsReview = Platform.OS === 'ios' && state?.review && state.review.status !== 'owned';
  if (selectionQuestion) return <View style={styles.selectionStep}>
    <Text style={styles.intro}>Allow {Platform.OS === 'ios' ? 'Screen Time' : 'Usage'} access when asked, then choose the apps you want to spend less time on.</Text>
    {Platform.OS === 'android' ? <AndroidDeviceAccountReview /> : null}
    {needsReview ? <Text style={styles.footnote}>Choosing apps replaces the previous Hoosh setup on this device. Account history stays private.</Text> : null}
    <Button label={targetsReady ? 'Change targeted apps' : 'Choose apps to target'} busy={busy} disabled={saving || !supported || !state || !!needsAndroidClaim}
      onPress={() => { void chooseApps(); }} />
    {targetsReady ? <Text accessibilityLiveRegion="polite" style={styles.footnote}>{state?.count} apps selected to target on this device.</Text> : null}
    {(error || selectionError) ? <Text accessibilityRole="alert" style={styles.error}>Allow access and choose at least one app to continue. Your selection has not been confirmed.</Text> : null}
    {!supported ? <Text accessibilityRole="alert" style={styles.error}>App selection is unavailable in this build.</Text> : null}
    <View style={styles.selectionActions}>
      <Button label="Next →" busy={saving} disabled={busy || !state?.authorized || !targetsReady || !state.count || !!needsAndroidClaim}
        onPress={() => onContinue(false, state?.revision, state?.count)} />
      {onBack ? <Button label="Back" variant="secondary" disabled={saving || busy} onPress={onBack} /> : null}
    </View>
  </View>;
  return <>
      <Image source={require('../../../assets/onboarding/permission/glow.svg')} contentFit="contain" style={styles.glow} accessible={false} />
    <Text style={styles.intro}>{selectionQuestion ? 'Choose the apps you want to spend less time on. These will be the target apps on this device.' : 'A little awareness goes a long way. Let’s help you take back your time.'}</Text>
    <View style={styles.card}>
      <View style={styles.art}>
        <Image source={require('../../../assets/onboarding/permission/sparkle.svg')} style={styles.sparkle} accessible={false} />
        <Image source={require('../../../assets/onboarding/permission/dinosaur.svg')} contentFit="contain" style={styles.dino} accessible={false} />
      </View>
      <Text style={styles.title}>See app activity to help you stay on track</Text>
      <Text style={styles.description}>{Platform.OS === 'ios'
        ? 'Allow Screen Time access to help manage the apps you choose. Your app selection stays on this device.'
        : 'Allow Usage Access to estimate activity for your selected apps. This permission does not block apps.'}</Text>
      <Text accessibilityLiveRegion="polite" style={styles.notice}>{state?.authorized ? Platform.OS === 'ios' ? (targetsReady ? 'Screen Time access and your target apps are ready.' : 'Access allowed. Choose the apps you want Hoosh to target next.') : 'Access allowed. You’re ready to continue.' : needsReview
        ? 'This device has an existing Hoosh setup. Review it before granting access for this account.'
        : supported ? 'You’ll review the system permission request next.' : 'Device access is unavailable in this build. You can continue and set it up later.'}</Text>
    </View>
    <View style={styles.footer}>
    <Text style={styles.footnote}>Permission does not start protection. You’ll review your plan before applying it.</Text>
    {error ? <><Text accessibilityRole="alert" style={styles.error}>Access could not be confirmed. Try again, or continue without access.</Text><Button label="Check access again" variant="secondary" disabled={saving || busy} onPress={() => { void refresh(); }} /></> : null}
    {state?.authorized ? <>
      {(selectionQuestion || Platform.OS === 'ios') && <>
        <Button label={targetsReady ? 'Change targeted apps' : 'Choose apps to target'} busy={busy} disabled={saving} onPress={() => { void chooseApps(); }} />
        <Text accessibilityLiveRegion="polite" style={styles.footnote}>{targetsReady ? `${state.count} apps selected to target on this device.` : Platform.OS === 'ios' ? 'Select your target apps in Apple’s picker. These choices will be used for your plan’s device targeting.' : 'Choose installed apps to target. These choices will be used for your plan’s device targeting.'}</Text>
        {selectionError && <Text accessibilityRole="alert" style={styles.error}>App selection was not confirmed. Choose at least one app and try again.</Text>}
      </>}
      <Button label={selectionQuestion ? 'Next →' : 'Continue to my plan'} busy={saving} disabled={busy || ((selectionQuestion || Platform.OS === 'ios') && (!targetsReady || !state.count))} onPress={() => onContinue(false, state.revision, state.count)} />
    </> : <>
      <Button label={needsReview ? 'Review existing setup' : Platform.OS === 'ios' ? 'Allow Screen Time access' : 'Allow Usage Access'} busy={busy} disabled={saving || !supported || !state} onPress={() => { if (needsReview) prepare(); else void request(); }} />

    </>}
    <View style={styles.actions}>
      {!selectionQuestion && (!state?.authorized || (Platform.OS === 'ios' && !targetsReady)) && <View style={styles.action}><Button label="Not now" variant="secondary" disabled={saving || busy} onPress={() => onContinue(true)} /></View>}
      {onBack && <View style={styles.action}><Button label="Back" variant="secondary" disabled={saving || busy} onPress={onBack} /></View>}
    </View>
    </View>
  </>;
}
const styles = StyleSheet.create({
  selectionStep: { flex: 1, gap: 24 },
  selectionActions: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 16, gap: 16 },
  actions: { flexDirection: 'row', gap: 18 }, action: { flex: 1 },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', marginTop: 26, paddingTop: 12, gap: 16 },
  card: { marginTop: 30, minHeight: 360, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: colors.darkCard, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', gap: 20, overflow: 'hidden' },
  intro: { color: colors.darkMuted, fontFamily: fonts.light, fontSize: 14, lineHeight: 19 },
  glow: { position: 'absolute', alignSelf: 'center', width: 160, height: 160, top: -74 },
  art: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#313131', alignItems: 'center', justifyContent: 'center' },
  dino: { width: 60, height: 60 }, sparkle: { position: 'absolute', top: 6, left: 6, width: 10, height: 10 },
  title: { color: colors.white, fontFamily: fonts.bold, fontSize: 16, lineHeight: 21, textAlign: 'center' },
  description: { color: 'rgba(255,255,255,0.68)', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  notice: { backgroundColor: '#313131', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.white, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  footnote: { color: colors.darkMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  error: { color: '#F6C663', fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
