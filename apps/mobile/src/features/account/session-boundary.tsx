import { type ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { QueryLifecycleBoundary } from '@/infrastructure/query/query-lifecycle-boundary';
import { createAppRuntime, type AppRuntime } from '@/infrastructure/auth/runtime';

import { AppRuntimeContext } from './app-runtime-context';
import { NativeOwnerBoundary } from '@/features/protection/native-owner-boundary';

/** Root gate owns no tokens. Replacing the account remounts every private route/form. */
export function AppSessionBoundary({ children, runtime: supplied }: { children: ReactNode; runtime?: AppRuntime }) {
  const [runtime] = useState(() => supplied ?? createAppRuntime());
  const snapshot = useSyncExternalStore(runtime.auth.subscribe, runtime.auth.getSnapshot, runtime.auth.getSnapshot);
  useEffect(() => {
    void runtime.auth.start();
    const foreground = (state: string | null | undefined) => {
      if (state === 'active') runtime.sdk?.auth.startAutoRefresh();
      else runtime.sdk?.auth.stopAutoRefresh();
    };
    foreground(AppState.currentState);
    const listener = AppState.addEventListener('change', foreground);
    return () => { listener.remove(); runtime.sdk?.auth.stopAutoRefresh(); runtime.auth.dispose(); };
  }, [runtime]);
  return (
    <AppRuntimeContext.Provider value={runtime}>
      <QueryLifecycleBoundary>
        {snapshot.status === 'signed_in' ? (
          <AccountDataProvider controller={runtime.controller}><NativeOwnerBoundary>{children}</NativeOwnerBoundary></AccountDataProvider>
        ) : (
          <SessionAccess runtime={runtime} status={snapshot.status} />
        )}
      </QueryLifecycleBoundary>
    </AppRuntimeContext.Provider>
  );
}
function SessionAccess({ runtime, status }: { runtime: AppRuntime; status: string }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const canLogin = status === 'signed_out';
  const current = runtime.auth.getSnapshot();
  const retryableBootstrap = current.status === 'unavailable' && current.reason === 'bootstrap';
  return (
    <Screen title="Account access">
      <View style={{ gap: 16 }}>
        <Text accessibilityRole="header">{canLogin ? 'Welcome back' : status === 'bootstrapping' ? 'Opening your account…' : status === 'signing_out' ? 'Signing out…' : 'Account access unavailable'}</Text>
        {canLogin ? <>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!busy} />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!busy} />
          <Button label="Sign in" busy={busy} disabled={!email.trim() || !password} onPress={() => {
            setBusy(true); setFailed(false);
            void runtime.auth.signIn(email, password).catch(() => setFailed(true)).finally(() => { setBusy(false); setPassword(''); });
          }} />
          {failed ? <Text accessibilityRole="alert">Could not sign in. Check your details and connection.</Text> : null}
        </> : status === 'unavailable' ? <>
          <Text>{retryableBootstrap ? 'Account access could not be restored. Check your connection and try again. Your private information is hidden.' : 'Check this build’s account configuration and secure storage, then try again. Your private information is hidden.'}</Text>
          {retryableBootstrap ? <Button label="Retry account access" busy={busy} onPress={() => {
            setBusy(true); void runtime.auth.retryBootstrap().finally(() => setBusy(false));
          }} /> : null}
          {runtime.sdk ? <>
          <Button label="Clear this device’s session" busy={busy} onPress={() => {
            setBusy(true); setFailed(false);
            void runtime.auth.signOut().catch(() => setFailed(true)).finally(() => setBusy(false));
          }} />
          </> : null}
          {failed ? <Text accessibilityRole="alert">Session could not be cleared. Account access remains locked.</Text> : null}
        </> : null}
      </View>
    </Screen>
  );
}
