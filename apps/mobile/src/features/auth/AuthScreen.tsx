import { Link, useRouter, type Href } from 'expo-router';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/design/tokens';
import { authErrorMessage } from '@/infrastructure/auth/errors';
import { appleAvailable, requestAppleCredential } from '@/infrastructure/auth/apple';
import { openOAuthBrowser } from '@/infrastructure/auth/oauth-browser';
import { socialConfig } from '@/infrastructure/auth/social-config';
import { AppleButton } from './AppleButton';
import type { SocialProvider } from './link-flow';
import { useAuth } from './auth-provider';
import { type AuthMode, type AuthValues, validateAuthForm } from './validation';

export function AuthScreen({ mode }: { mode: AuthMode }) {
  const signup = mode === 'sign-up';
  const router = useRouter();
  const { controller, snapshot, links } = useAuth();
  const [busy, setBusy] = useState(false);
  const [nativeAppleAvailable, setNativeAppleAvailable] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let live = true;
    if (Platform.OS === 'ios') void appleAvailable().then(value => { if (live) setNativeAppleAvailable(value); }).catch(() => undefined);
    return () => { live = false; };
  }, []);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [values, setValues] = useState<AuthValues>({ name: '', email: '', password: '' });
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState('');
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const errors = attempted ? validateAuthForm(mode, values) : {};
  const appleEnabled = Platform.OS === 'ios' ? socialConfig.appleNative && nativeAppleAvailable : socialConfig.appleOAuth;
  const accountLocked = busy || snapshot.status !== 'signed_out' || !!links?.pending;

  async function socialSignIn(provider: SocialProvider) {
    if (submitting.current || accountLocked || !(provider === 'apple' ? appleEnabled : socialConfig.google)) return;
    submitting.current = true; setBusy(true); setNotice(''); setNeedsConfirmation(false);
    let flowId: string | undefined;
    try {
      if (provider === 'apple' && Platform.OS === 'ios') await controller.signInWithApple(requestAppleCredential);
      else {
        const flow = await controller.beginOAuth(provider, Platform.OS === 'web' ? window.location.origin : undefined);
        flowId = flow.flowId;
        const callback = await openOAuthBrowser(flow.url, flow.redirectUrl);
        if (callback) {
          const path = await controller.handleCallback(callback);
          if (mounted.current) router.replace(path as Href);
        } else if (controller.getLinkSnapshot().pending?.id === flow.flowId) {
          await controller.cancelLink();
          if (mounted.current) setNotice('Sign-in was canceled. You can try again.');
        }
      }
    } catch (error) {
      if (mounted.current) {
        setNotice(authErrorMessage(error));
        // Failed browser exchanges keep their flow gated for explicit cleanup.
        if (flowId && controller.getLinkSnapshot().pending?.id === flowId) router.replace('/auth/link-error' as Href);
      }
    } finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }

  function update(field: keyof AuthValues, value: string) {
    setValues(current => ({ ...current, [field]: value }));
    setNotice('');
    setNeedsConfirmation(false);
  }
  async function submit() {
    if (submitting.current) return;
    setNotice('');
    setAttempted(true);
    const nextErrors = validateAuthForm(mode, values);
    if (nextErrors.name) nameRef.current?.focus();
    else if (nextErrors.email) emailRef.current?.focus();
    else if (nextErrors.password) passwordRef.current?.focus();
    else {
      submitting.current = true; setBusy(true);
      try {
        if (signup) {
          await controller.signUp(values.email, values.password, values.name, Platform.OS === 'web' ? window.location.origin : undefined);
          if (controller.getLinkSnapshot().pending?.kind === 'signup') router.replace('/(auth)/confirm-email' as Href);
          else if (controller.getSnapshot().status !== 'signed_in') setNotice('Check your email for the next step, or log in if you already have an account.');
        } else await controller.signIn(values.email, values.password);
      }
      catch (error) {
        if (mounted.current) {
          setNotice(authErrorMessage(error));
          setNeedsConfirmation(!!error && typeof error === 'object' && 'code' in error && error.code === 'email_not_confirmed');
        }
      }
      finally { submitting.current = false; if (mounted.current) setBusy(false); }
    }
  }

  async function resendForLogin() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setNotice('');
    try {
      await controller.requestConfirmation(values.email, Platform.OS === 'web' ? window.location.origin : undefined);
      if (mounted.current) router.replace('/(auth)/confirm-email' as Href);
    } catch (error) { if (mounted.current) setNotice(authErrorMessage(error)); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[
          styles.scroll, { minHeight: Math.max(height, 852) - insets.top - insets.bottom },
        ]}>
          <View style={[styles.content, { paddingTop: Math.max(24, 84 - insets.top) }]}>
            <View style={styles.brand}>
              <View style={styles.art} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Image source={require('../../../assets/auth/glow.png')} style={styles.glow} />
                <View style={styles.dinoTile}>
                  <Image source={require('../../../assets/auth/sparkle.png')} style={styles.sparkle} />
                  <Image source={require('../../../assets/auth/dinosaur.png')} style={styles.dinosaur} />
                </View>
                <Image source={require('../../../assets/auth/star.png')} style={styles.star} />
              </View>
              <View style={styles.titleRow}>
                <Text accessibilityRole="header" accessibilityLabel={signup ? 'Hoosh sign up' : 'Hoosh login'} style={styles.title}>Hoosh</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>APP</Text></View>
              </View>
              <Text style={styles.tagline}>{signup ? 'redirect' : 'Redirect'} to what you love.</Text>
              <View style={styles.divider} />
            </View>
            <View style={styles.fields}>
              {signup && <View>
                <TextInput editable={!busy} ref={nameRef} accessibilityLabel="Name" autoComplete="name" textContentType="name"
                  placeholder="name..." placeholderTextColor={colors.white} value={values.name}
                  onChangeText={value => update('name', value)} returnKeyType="next" submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  style={[styles.input, styles.firstInput, errors.name && styles.invalid]} />
                {errors.name && <Text accessibilityRole="alert" style={styles.error}>{errors.name}</Text>}
              </View>}
              <View>
                <TextInput editable={!busy} ref={emailRef} accessibilityLabel="Email" autoComplete="email" textContentType="emailAddress"
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  placeholder="email..." placeholderTextColor={colors.white} value={values.email}
                  onChangeText={value => update('email', value)} returnKeyType="next" submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  style={[styles.input, !signup && styles.firstInput, errors.email && styles.invalid]} />
                {errors.email && <Text accessibilityRole="alert" style={styles.error}>{errors.email}</Text>}
              </View>
              <View>
                <TextInput editable={!busy} ref={passwordRef} accessibilityLabel="Password" autoComplete={signup ? 'new-password' : 'current-password'}
                  textContentType={signup ? 'newPassword' : 'password'} secureTextEntry autoCapitalize="none" autoCorrect={false}
                  placeholder="password" placeholderTextColor={colors.white} value={values.password}
                  onChangeText={value => update('password', value)} returnKeyType="done" onSubmitEditing={() => { void submit(); }}
                  style={[styles.input, errors.password && styles.invalid]} />
                {errors.password && <Text accessibilityRole="alert" style={styles.error}>{errors.password}</Text>}
              </View>
            </View>
            <View style={[styles.actions, { paddingTop: signup ? 107 : 125 }]}>
              {snapshot.status === 'unavailable' && <Text accessibilityRole="alert" style={styles.notice}>{snapshot.reason === 'configuration'
                ? 'Authentication setup is incomplete. Please configure the development project.'
                : 'Session access is unavailable. Account screens remain locked until access is restored.'}</Text>}
              {controller.getLastSignOutResult?.()?.remoteRevocation === 'unconfirmed' && <Text accessibilityRole="alert" style={styles.notice}>Signed out on this device. Remote session revocation could not be confirmed.</Text>}
              {needsConfirmation && <Pressable accessibilityRole="button" disabled={busy} style={styles.switchLink} onPress={() => { void resendForLogin(); }}><Text style={styles.switchText}>Resend confirmation email</Text></Pressable>}
              {links?.pending && (links.pending.phase === 'consuming' || links.pending.kind === 'recovery' || links.pending.kind === 'oauth') && <Pressable accessibilityRole="button" disabled={busy} style={styles.switchLink}
                onPress={() => { void controller.cancelLink().catch(error => setNotice(authErrorMessage(error))); }}><Text style={styles.switchText}>Cancel current sign-in request</Text></Pressable>}
              {!signup && <Link href={'/(auth)/forgot-password' as Href} asChild><Pressable accessibilityRole="link" disabled={busy} style={styles.switchLink}><Text style={styles.switchText}>Forgot password?</Text></Pressable></Link>}
              {snapshot.status === 'unavailable' && snapshot.reason !== 'configuration' && <Pressable accessibilityRole="button" style={styles.switchLink}
                onPress={() => { void (snapshot.reason === 'storage' ? controller.signOut().then(() => controller.start()) : controller.start()).catch(() => undefined); }}>
                <Text style={styles.switchText}>Retry session access</Text>
              </Pressable>}
              {notice ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={signup ? 'Create account' : 'Log in'}
                onPress={() => { void submit(); }} disabled={busy} accessibilityState={{ busy, disabled: busy }} style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{busy ? (signup ? 'creating account…' : 'logging in…') : 'continue'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Continue with Google" disabled={accountLocked || !socialConfig.google}
                accessibilityState={{ disabled: accountLocked || !socialConfig.google, busy }}
                accessibilityHint={socialConfig.google ? undefined : 'Google sign-in is not configured for this build.'}
                onPress={() => { void socialSignIn('google'); }} style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}>
                <Image source={require('../../../assets/auth/google.png')} style={styles.googleLogo} />
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>
              {!socialConfig.google && <Text style={styles.providerNote}>Google sign-in is not configured yet.</Text>}
              {(Platform.OS !== 'ios' || nativeAppleAvailable) && <AppleButton disabled={accountLocked || !appleEnabled} onPress={() => { void socialSignIn('apple'); }} />}
              {!appleEnabled && <Text style={styles.providerNote}>{Platform.OS === 'ios' && !nativeAppleAvailable ? 'Apple sign-in is unavailable on this device.' : 'Apple sign-in is not configured yet.'}</Text>}
              <Link href={signup ? '/(auth)/sign-in' : '/(auth)/sign-up'} replace asChild>
                <Pressable accessibilityRole="link" disabled={busy} accessibilityState={{ disabled: busy }} style={styles.switchLink}>
                  <Text style={styles.switchText}>{signup ? 'Already have an account? Log in' : 'New here? Sign up'}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { flexGrow: 1, width: '100%', maxWidth: 440, paddingHorizontal: 24, paddingBottom: 25, alignItems: 'center' },
  brand: { alignItems: 'center', width: '100%' },
  art: { width: 160, height: 100, alignItems: 'center' },
  glow: { position: 'absolute', width: 160, height: 160, top: 4, left: 0 },
  dinoTile: { width: 100, height: 100, borderRadius: 24, backgroundColor: colors.darkCard, alignItems: 'center', justifyContent: 'center' },
  dinosaur: { width: 60, height: 60 },
  sparkle: { position: 'absolute', width: 10, height: 10, top: 6, left: 6 },
  star: { position: 'absolute', width: 14, height: 14, top: 6, left: 141 },
  titleRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 40 },
  title: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 40, letterSpacing: -0.5, color: colors.white },
  badge: { backgroundColor: colors.action, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#111111' },
  tagline: { marginTop: 8, fontFamily: fonts.light, fontSize: 13, lineHeight: 16, letterSpacing: 0.2, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  divider: { width: 100, height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 26 },
  fields: { marginTop: 75, width: '100%', maxWidth: 286, gap: 22 },
  input: { minHeight: 48, borderRadius: 7, paddingHorizontal: 18, paddingVertical: 12, fontFamily: fonts.light, fontSize: 16, color: colors.white, backgroundColor: 'rgba(205,205,205,0.2)' },
  firstInput: { backgroundColor: 'rgba(255,255,255,0.3)' },
  invalid: { borderWidth: 1, borderColor: '#FFB4AB' },
  error: { marginTop: 6, color: '#FFB4AB', fontFamily: fonts.regular, fontSize: 13 },
  actions: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', width: '100%' },
  button: { width: '100%', maxWidth: 244, minHeight: 48, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  primary: { backgroundColor: colors.action },
  primaryText: { color: colors.white, fontFamily: fonts.bold, fontSize: 18 },
  googleButton: { marginTop: 16, flexDirection: 'row', gap: 12, backgroundColor: 'rgba(205,205,205,0.4)' },
  googleLogo: { width: 24, height: 24 },
  googleText: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.white, textAlign: 'center' },
  providerNote: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12, color: colors.darkMuted, textAlign: 'center' },
  switchLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginTop: 8 },
  switchText: { fontFamily: fonts.regular, fontSize: 13, color: colors.darkMuted, textAlign: 'center', textDecorationLine: 'underline' },
  notice: { maxWidth: 286, marginBottom: 16, color: colors.white, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
