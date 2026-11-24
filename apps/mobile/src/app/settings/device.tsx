import { router } from 'expo-router';
import { Platform } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { IOSDeviceSetup } from '@/features/onboarding/ios-device-setup';
import { DeviceProtection } from '@/features/protection/device-protection';
import { InstallationReviewPanel } from '@/features/protection/installation-review';
import { useIOSSelectionDevice } from '@/features/protection/native-owner-boundary';

export default function DeviceAccess() {
  const ios = useIOSSelectionDevice();
  return <Screen title={Platform.OS === 'ios' ? 'Screen Time access' : 'App usage access'}
    subtitle="Choose the apps you want Hoosh to help you manage.">
    <Button label="Back to Settings" variant="secondary" onPress={() => {
      if (router.canGoBack()) router.back(); else router.replace('/(tabs)/settings');
    }} />
    <InstallationReviewPanel>
    {Platform.OS === 'ios' ? ios ? <IOSDeviceSetup key={`${ios.owner}:${ios.generation}`} device={ios} showHeading={false} onChooseApps={() => router.push('/settings/apps')} /> :
      <InlineStatus state="unavailable" message="Screen Time access could not be verified. Check your account connection and try again." /> : <><DeviceProtection /><Button label="Choose apps on this device" onPress={() => router.push('/settings/apps')} /></>}
    </InstallationReviewPanel>
  </Screen>;
}
