import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/design/tokens';

import { usePublicAuth } from './use-public-auth';

export function AuthCallback() {
  const { runtime } = usePublicAuth();
  const router = useRouter();
  const nativeUrl = Linking.useURL();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    const incoming = Platform.OS === 'web' ? window.location.href : nativeUrl;
    if (!incoming) {
      const timer = setTimeout(() => router.replace('/auth/link-error'), 3000);
      return () => clearTimeout(timer);
    }
    started.current = true;
    // Never include the callback URL, code, or provider error in visible errors/logs.
    void (runtime.authLinks?.handleCallback(incoming) ?? Promise.reject())
      .then(path => router.replace(path as Href))
      .catch(() => router.replace('/auth/link-error'));
  }, [nativeUrl, router, runtime]);

  return <Screen dark title="Completing sign-in…">
    <Text accessibilityLiveRegion="polite" style={{ color: colors.white }}>Please wait…</Text>
  </Screen>;
}

export function CallbackFailure() {
  return <LinkNotice title="Unable to use this link" action="Return to app"
    message="This link may be expired, already used, or opened on another device. You can return to the app and try logging in." />;
}

export function SocialSignInPending() {
  return <LinkNotice title="Finish signing in" action="Cancel and return to login"
    message="Complete sign-in in the browser. If it closed or was interrupted, cancel this request and try again." />;
}

function LinkNotice({ title, action, message }: { title: string; action: string; message: string }) {
  const { runtime, links } = usePublicAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return <Screen dark title={title}>
    <Text style={{ color: colors.white }}>{message}</Text>
    {failed && <Text accessibilityRole="alert" style={{ color: colors.white }}>Unable to clear this request. Please retry.</Text>}
    <Button label={action} busy={busy} onPress={async () => {
      setBusy(true);
      setFailed(false);
      try {
        if (links.pending) await runtime.authForms?.cancelLink();
        router.replace(runtime.auth.getSnapshot().status === 'signed_in' ? '/(tabs)' : '/(auth)/sign-in');
      } catch {
        setFailed(true);
      } finally {
        setBusy(false);
      }
    }} />
  </Screen>;
}
