import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { LINK_MAX_AGE } from '@/features/auth/link-flow';
import { usePublicAuth } from '@/features/auth/use-public-auth';
import { authErrorMessage } from '@/infrastructure/auth/errors';

export default function ConfirmEmail() {
  const router = useRouter();
  const { runtime, snapshot, links } = usePublicAuth();
  const actions = runtime.authForms;
  const pending = links.pending;
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const working = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (snapshot.status === 'bootstrapping') return null;
  if (!actions || pending?.kind !== 'signup') return <AuthScreen mode="sign-in" />;

  const remaining = Math.max(0, Math.ceil((pending.lastSentAt + 60000 - now) / 1000));
  const expired = now - pending.createdAt >= LINK_MAX_AGE;
  async function perform(work: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setNotice('');
    try {
      await work();
    } catch (error) {
      setNotice(authErrorMessage(error));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <Screen dark title="Check your email">
      <Text style={styles.copy}>If an account can be confirmed at that address, look for a confirmation email and check Spam too. Open the latest link on this device, in this same browser tab if you are using the web app.</Text>
      {expired && <Text style={styles.copy}>This request expired. Return to log in to start again.</Text>}
      {notice && <Text style={styles.copy} accessibilityRole="alert">{notice}</Text>}
      <Button
        label={remaining ? `Resend in ${remaining}s` : 'Resend confirmation email'}
        busy={busy}
        disabled={expired || remaining > 0 || pending.phase !== 'requested' || snapshot.status !== 'signed_out'}
        onPress={() => { void perform(async () => {
          await actions.resendConfirmation();
          setNotice('Check your email for the next step.');
        }); }}
      />
      <Button variant="secondary" label="Return to log in" busy={busy}
        onPress={() => { void perform(async () => {
          await actions.cancelLink();
          router.replace('/(auth)/sign-in');
        }); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  copy: { color: colors.white, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
});
