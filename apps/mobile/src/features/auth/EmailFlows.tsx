import { Link, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { authErrorMessage } from '@/infrastructure/auth/errors';
import { useAuth } from './auth-provider';
import { validateAuthForm } from './validation';

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
function Panel({ title, children }: PropsWithChildren<{ title: string }>) {
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <Screen dark title={title}>{children}</Screen>
  </KeyboardAvoidingView>;
}
function Message({ children }: PropsWithChildren) { return <Text accessibilityLiveRegion="polite" style={styles.text}>{children}</Text>; }
function ErrorMessage({ message }: { message: string }) { return message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null; }

export function ForgotPassword() {
  const { controller, links } = useAuth(); const router = useRouter();
  const [email, setEmail] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(links.pending?.kind === 'recovery'); const pending = useRef(false);
  const request = async () => {
    if (pending.current) return;
    const invalid = validateAuthForm('sign-in', { name: '', email, password: 'unused' }).email;
    if (invalid) { setError(invalid); return; }
    pending.current = true; setBusy(true); setError('');
    try { await controller.requestRecovery(email, Platform.OS === 'web' ? window.location.origin : undefined); setSent(true); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Panel title="Reset your password">
    {sent ? <Message>If an account exists for that email, you’ll receive a password reset link. Open the latest link on this device, in the same browser tab for the web preview.</Message> : <>
      <Message>Enter the email you use for Hoosh.</Message>
      <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} placeholder="email..." placeholderTextColor={colors.darkMuted}
        autoComplete="email" textContentType="emailAddress" keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
        editable={!busy} style={styles.input} returnKeyType="send" onSubmitEditing={() => { void request(); }} />
      <Action label={busy ? 'Requesting link…' : 'Send reset link'} disabled={busy} onPress={() => { void request(); }} />
    </>}
    <ErrorMessage message={error} />
    {links.pending?.kind === 'recovery' && <Action label="Cancel reset request" disabled={busy} onPress={() => {
      void controller.cancelLink().then(() => router.replace('/(auth)/forgot-password')).catch(e => setError(authErrorMessage(e)));
    }} />}
    <Link href="/(auth)/sign-in" replace style={styles.link}>Back to login</Link>
  </Panel>;
}

export function ConfirmEmail() {
  const { controller, links } = useAuth(); const router = useRouter();
  const [now, setNow] = useState(Date.now); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const pending = links.pending;
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = pending ? Math.max(0, Math.ceil((pending.lastSentAt + 60000 - now) / 1000)) : 0;
  const resend = async () => {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await controller.resendConfirmation(); setMessage('Request accepted. Check for the latest email; delivery may take a moment.'); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { lock.current = false; setBusy(false); setNow(Date.now()); }
  };
  return <Panel title="Check your email">
    <Message>{pending?.kind === 'signup' ? 'Check your email for the next step, or log in if you already have an account. A request does not guarantee delivery. Open the latest link on this device, in the same tab for the web preview.' : 'There is no pending confirmation on this device. Return to login or start signup again.'}</Message>
    {message ? <Message>{message}</Message> : null}
    <ErrorMessage message={error} />
    {pending?.kind === 'signup' && pending.phase === 'requested' && <Action label={busy ? 'Requesting email…' : remaining ? `Resend in ${remaining}s` : 'Resend confirmation'} disabled={busy || remaining > 0} onPress={() => { void resend(); }} />}
    <Action label="Return to login" disabled={busy} onPress={() => {
      void controller.cancelLink().then(() => router.replace('/(auth)/sign-in')).catch(e => setError(authErrorMessage(e)));
    }} />
  </Panel>;
}

export function ResetPassword() {
  const { controller, snapshot } = useAuth(); const router = useRouter();
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false); const [done, setDone] = useState(false);
  const authorized = controller.canResetPassword();
  const save = async () => {
    if (lock.current) return;
    if (!authorized) { setError('Request a new reset link on this device.'); return; }
    if (password.length < 8) { setError('Use at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    lock.current = true; setBusy(true); setError('');
    try { await controller.updatePassword(password); setPassword(''); setConfirm(''); setDone(true); }
    catch (e) { setError(authErrorMessage(e)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <Panel title="Choose a new password">
    {!authorized ? <><Message>A verified recovery link is required. Request a new link on this device.</Message><Link href={'/(auth)/forgot-password' as Href} style={styles.link}>Request a reset link</Link></> : done ?
      <Message>Your password was updated. Log in again on this device.</Message> : <>
        <Message>Updating the password for {snapshot.status === 'signed_in' ? snapshot.user.email ?? 'your account' : 'your account'}.</Message>
        <TextInput accessibilityLabel="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} editable={!busy} style={styles.input} placeholder="new password" placeholderTextColor={colors.darkMuted} />
        <TextInput accessibilityLabel="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" autoCapitalize="none" autoCorrect={false} editable={!busy} style={styles.input} placeholder="confirm password" placeholderTextColor={colors.darkMuted} onSubmitEditing={() => { void save(); }} />
        <Action label={busy ? 'Updating password…' : 'Update password'} disabled={busy} onPress={() => { void save(); }} />
      </>}
    <ErrorMessage message={error} />
    <Action label={done ? 'Return to login' : 'Cancel and return to login'} disabled={busy} onPress={() => {
      void controller.cancelLink().then(() => router.replace('/(auth)/sign-in')).catch(e => setError(authErrorMessage(e)));
    }} />
  </Panel>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.darkCanvas },
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.white },
  input: { fontFamily: fonts.regular, fontSize: 16, color: colors.white, backgroundColor: colors.darkCard, minHeight: 48, padding: 14, borderRadius: 7 },
  button: { minHeight: 48, padding: 14, borderRadius: 7, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAction },
  disabled: { opacity: 0.55 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: '#FFB4AB' },
  link: { paddingVertical: 14, fontFamily: fonts.regular, fontSize: 15, color: colors.darkMuted, textDecorationLine: 'underline' },
});
