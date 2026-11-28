import { router } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { IOSDeviceSetup } from '@/features/onboarding/ios-device-setup';
import { DeviceProtection } from '@/features/protection/device-protection';
import { AndroidDeviceAccountReview } from '@/features/protection/android-device-account-review';
import { InstallationReviewPanel } from '@/features/protection/installation-review';
import { useIOSSelectionDevice } from '@/features/protection/native-owner-boundary';
import { useAccountWeeklyPlan } from '@/features/plans/account-weekly-plan';

export default function DeviceAccess() {
  const ios = useIOSSelectionDevice();
  return <Screen title={Platform.OS === 'ios' ? 'Screen Time access' : 'App usage access'}
    subtitle="Choose the apps you want Hoosh to help you manage.">
    <Button label="Back to Settings" variant="secondary" onPress={() => {
      if (router.canGoBack()) router.back(); else router.replace('/(tabs)/settings');
    }} />
    <InstallationReviewPanel>
    {Platform.OS === 'ios' ? ios ? <IOSDeviceSetup key={`${ios.owner}:${ios.generation}`} device={ios} showHeading={false} onChooseApps={() => router.push('/settings/apps')} /> :
      <InlineStatus state="unavailable" message="Screen Time access could not be verified. Check your account connection and try again." /> : <>
        <DeviceProtection />
        {Platform.OS === 'android' ? <><AndroidDeviceAccountReview /><AndroidWeeklyPlanStop /></> : null}
        <Button label="Choose apps on this device" onPress={() => router.push('/settings/apps')} />
      </>}
    </InstallationReviewPanel>
  </Screen>;
}

function AndroidWeeklyPlanStop() {
  const account = useAccountWeeklyPlan();
  if (!account) return null;
  const { plan, claiming } = account;
  const enabled = plan.read.phase === 'ready' && plan.read.installation.enabled;
  if (!enabled && !plan.intent && !plan.notice) return null;
  const busy = plan.busy || claiming;
  return <View style={{ gap: 12 }}>
    {enabled && <Button label="Stop weekly plan" variant="secondary"
      busy={plan.busy} disabled={busy || !!plan.intent} onPress={() => { void plan.stop(); }} />}
    {!!plan.notice && <Text accessibilityLiveRegion="polite">{plan.notice}</Text>}
    {!!plan.intent && !busy && <Button label="Check weekly plan change" variant="secondary"
      onPress={() => { void plan.refresh(); }} />}
  </View>;
}
