import { Redirect } from 'expo-router';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { AppSignOutAction, useAppRuntime } from '@/features/account/app-runtime-context';
import { useIdentityQuery } from '@/features/account/identity-query';
import { useAccountData, useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { Screen } from '@/components/ui/screen';
import { colors } from '@/design/tokens';
import type { OnboardingProgressRead } from './progress-repository';
import { setupRepository } from './progress-storage';

/** Guard the actual tab layout, not a root pathname notification after Home has rendered. */
export function SetupEntryGate({ children }: PropsWithChildren) {
  const account = useOptionalAccountData();
  // Isolated, unsigned component previews have no private runtime or account.
  if (!account?.scope) return <>{children}</>;
  return <PrivateSetupEntry key={account.scope.id}>{children}</PrivateSetupEntry>;
}
function PrivateSetupEntry({ children }: PropsWithChildren) {
  const project = useAppRuntime()?.nativeNamespace;
  const { scope, availability } = useAccountData();
  const identity = useIdentityQuery();
  const settings = useSettingsQuery();
  const [progress, setProgress] = useState<OnboardingProgressRead | null>(null);
  const [attempt, setAttempt] = useState(0);
  const verified = scope && !identity.isError && identity.data?.user_id === scope.account.user_id;
  useEffect(() => {
    if (!project || !scope || !verified) return;
    let active = true;
    void setupRepository(project).read(scope).then(value => {
      if (active && scope.isCurrent()) setProgress(value);
    }).catch(() => { if (active && scope.isCurrent()) setProgress({ status: 'read_failed' }); });
    return () => { active = false; };
  }, [project, scope, verified, attempt]);
  const failed = !project || availability !== 'ready' || identity.isError || settings.isError || settings.isPaused || progress?.status === 'read_failed' || progress?.status === 'incompatible';
  if (failed) return <Screen dark title="Completing sign-in…">
    <InlineStatus state="unavailable" message="Hoosh couldn’t verify your saved setup. Connect and try again." />
    <Button label="Try again" onPress={() => { setAttempt(value => value + 1); void identity.refetch(); void settings.refetch(); }} />
    <AppSignOutAction />
  </Screen>;
  if (!verified || !settings.data || !progress) return <View testID="setup-entry-loading" accessibilityLabel="Checking your saved setup" style={{ flex: 1, backgroundColor: colors.darkCanvas }} />;
  const skipped = scope.client.getQueryData(scope.key('setup-resume-dismissed')) === true;
  const required = (progress.status === 'found' && progress.progress.step !== 'complete') ||
    (progress.status === 'not_started' && settings.data.settings === null);
  if (required && !skipped) return <Redirect href="/(onboarding)/welcome" />;
  return <>{children}</>;
}
