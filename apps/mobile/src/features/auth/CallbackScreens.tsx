import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { colors, fonts } from '@/design/tokens';
import { useAuth } from '@/features/auth/auth-provider';

export function AuthCallback() {
  const { controller } = useAuth(); const router = useRouter();
  const incoming = Linking.useURL(); const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    if (!incoming) {
      const timer = setTimeout(() => { started.current = true; router.replace('/auth/link-error' as Href); }, 3000);
      return () => clearTimeout(timer);
    }
    started.current = true;
    void controller.handleCallback(incoming).then(path => router.replace(path as Href)).catch(() => {
      // A dedicated error route removes every callback query/fragment without
      // replacing this screen with itself and accidentally reprocessing the URL.
      router.replace('/auth/link-error' as Href);
    });
  }, [controller, incoming, router]);
  return <Screen dark title="Completing sign-in…">
    <Text accessibilityLiveRegion="polite" style={{ color: colors.white }}>Please wait…</Text>
  </Screen>;
}

export function CallbackFailure() {
  const { controller } = useAuth(); const router = useRouter(); const [error, setError] = useState('');
  return <Screen dark title="Unable to use this link">
    <Text accessibilityRole="alert" style={{ color: colors.white, fontFamily: fonts.regular, fontSize: 16 }}>
      {error || 'Sign-in could not be completed. The request may be expired, canceled, or opened on a different device. Return to the app and try again.'}
    </Text>
    <Pressable accessibilityRole="button" style={{ backgroundColor: colors.action, padding: 16, borderRadius: 7, minHeight: 48 }} onPress={() => {
      void controller.cancelLink().then(() => router.replace(controller.getSnapshot().status === 'signed_in' ? '/(tabs)' : '/(auth)/sign-in')).catch(() => setError('Unable to clear this flow. Please retry.'));
    }}><Text style={{ fontFamily: fonts.bold, color: colors.onAction }}>Return to app</Text></Pressable>
  </Screen>;
}

export function SocialSignInPending() {
  const { controller } = useAuth(); const router = useRouter();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  return <Screen dark title="Finish signing in">
    <Text style={{ color: colors.white, fontFamily: fonts.regular, fontSize: 16 }}>Complete sign-in in the browser. If it was closed or interrupted, cancel this request and try again.</Text>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.white }}>{error}</Text> : null}
    <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy }}
      style={{ backgroundColor: colors.action, padding: 16, borderRadius: 7, minHeight: 48 }} onPress={() => {
        if (busy) return; setBusy(true);
        void controller.cancelLink().then(() => router.replace('/(auth)/sign-in')).catch(() => setError('Unable to clear this request. Please retry.')).finally(() => setBusy(false));
      }}><Text style={{ fontFamily: fonts.bold, color: colors.onAction }}>Cancel and return to login</Text></Pressable>
  </Screen>;
}
