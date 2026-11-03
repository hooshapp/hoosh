import { router } from 'expo-router';
import {
  ConnectedHomeScreen,
  UnavailableDeviceProtection,
} from '@/features/home/connected-home-screen';
import { useOptionalAccountData } from '@/infrastructure/query/account-data-provider';
import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome } from '@/features/home/home-model';

export default function Home() {
  const account = useOptionalAccountData();
  const open = (field: string) => () =>
    router.push({ pathname: '/settings/[field]', params: { field } });
  if (account?.scope)
    return (
      <ConnectedHomeScreen
        onOpen={{
          activities: open('activities'),
          days: open('days'),
          hours: open('hours'),
          sessions: open('sessions'),
        }}
      />
    );
  return <HomeScreen model={unavailableHome} protection={<UnavailableDeviceProtection />} />;
}
