import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { AppState, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { QueryLifecycleBoundary } from '@/infrastructure/query/query-lifecycle-boundary';
import {
  createAppRuntime,
  type AppRuntime,
} from '@/infrastructure/auth/runtime';

import { AppRuntimeContext } from './app-runtime-context';
import { AccountWeeklyPlanBoundary } from '@/features/plans/account-weekly-plan';
import { NativeOwnerBoundary } from '@/features/protection/native-owner-boundary';

/** Root gate owns no tokens. Replacing the account remounts every private route/form. */
export function AppSessionBoundary({
  children,
  runtime: supplied,
  publicContent,
  holdPrivate = false,
}: {
  children: ReactNode;
  runtime?: AppRuntime;
  publicContent?: ReactNode;
  /** A pending auth recovery flow can keep private providers detached. */
  holdPrivate?: boolean;
}) {
  const [runtime] = useState(() => supplied ?? createAppRuntime());
  useEffect(() => {
    void runtime.auth.start();
    const foreground = (state: string | null | undefined) => {
      runtime.setForeground(state === 'active');
    };
    foreground(AppState.currentState);
    const listener = AppState.addEventListener('change', foreground);
    return () => {
      listener.remove();
      runtime.setForeground(false);
      runtime.auth.dispose();
    };
  }, [runtime]);
  return (
    <AppRuntimeContext.Provider value={runtime}>
      <SessionContent runtime={runtime} publicContent={publicContent} holdPrivate={holdPrivate}>
        {children}
      </SessionContent>
    </AppRuntimeContext.Provider>
  );
}

function SessionContent({ runtime, children, publicContent, holdPrivate }: {
  runtime: AppRuntime;
  children: ReactNode;
  publicContent?: ReactNode;
  holdPrivate: boolean;
}) {
  const snapshot = useSyncExternalStore(
    runtime.auth.subscribe,
    runtime.auth.getSnapshot,
    runtime.auth.getSnapshot,
  );
  const accessHeld = useSyncExternalStore(
    runtime.auth.subscribe,
    runtime.getPrivateAccessHeld ?? privateAccessOpen,
    privateAccessOpen,
  );
  const privateHeld = holdPrivate || accessHeld;
  return (
    <QueryLifecycleBoundary>
      {snapshot.status === 'signed_in' && !privateHeld ? (
        <AccountDataProvider controller={runtime.controller}>
          <NativeOwnerBoundary>
            <AccountWeeklyPlanBoundary>{children}</AccountWeeklyPlanBoundary>
          </NativeOwnerBoundary>
        </AccountDataProvider>
      ) : publicContent === undefined ? (
        <SessionAccess
          runtime={runtime}
          status={snapshot.status}
          recoveryHeld={snapshot.status === 'signed_in' && privateHeld}
        />
      ) : publicContent}
    </QueryLifecycleBoundary>
  );
}
const privateAccessOpen = () => false;

function SessionAccess({
  runtime,
  status,
  recoveryHeld,
}: {
  runtime: AppRuntime;
  status: string;
  recoveryHeld: boolean;
}) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false),
    [failed, setFailed] = useState(false);
  const canLogin = status === 'signed_out';
  const current = runtime.auth.getSnapshot();
  const retryableBootstrap =
    current.status === 'unavailable' && current.reason === 'bootstrap';
  return (
    <Screen title="Account access">
      <View style={{ gap: 16 }}>
        <Text accessibilityRole="header">
          {canLogin
            ? 'Welcome back'
            : status === 'bootstrapping'
              ? 'Opening your account…'
              : status === 'signing_out'
                ? 'Signing out…'
                : 'Account access unavailable'}
        </Text>
        {canLogin ? (
          <>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              editable={!busy}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!busy}
            />
            <Button
              label="Sign in"
              busy={busy}
              disabled={!email.trim() || !password}
              onPress={() => {
                setBusy(true);
                setFailed(false);
                void runtime.auth
                  .signIn(email, password)
                  .catch(() => setFailed(true))
                  .finally(() => {
                    setBusy(false);
                    setPassword('');
                  });
              }}
            />
            {failed ? (
              <Text accessibilityRole="alert">
                Could not sign in. Check your details and connection.
              </Text>
            ) : null}
          </>
        ) : status === 'unavailable' || recoveryHeld ? (
          <>
            <Text>
              {recoveryHeld
                ? 'Clear this device’s session to return to sign in.'
                : retryableBootstrap
                ? 'Account access could not be restored. Check your connection and try again. Your private information is hidden.'
                : 'Check this build’s account configuration and secure storage, then try again. Your private information is hidden.'}
            </Text>
            {retryableBootstrap ? (
              <Button
                label="Retry account access"
                busy={busy}
                onPress={() => {
                  setBusy(true);
                  void runtime.auth
                    .retryBootstrap()
                    .finally(() => setBusy(false));
                }}
              />
            ) : null}
            {runtime.canClearSession ? (
              <>
                <Button
                  label="Clear this device’s session"
                  busy={busy}
                  onPress={() => {
                    setBusy(true);
                    setFailed(false);
                    void runtime.auth
                      .signOut()
                      .catch(() => setFailed(true))
                      .finally(() => setBusy(false));
                  }}
                />
              </>
            ) : null}
            {failed ? (
              <Text accessibilityRole="alert">
                Session could not be cleared. Account access remains locked.
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
