import { router } from 'expo-router';
import {
  ConnectedHomeScreen,
  UnavailableDeviceProtection,
} from '@/features/home/connected-home-screen';
import { HomeScreen } from '@/features/home/home-screen';
import { unavailableHome } from '@/features/home/home-model';
import { useRuntime } from '../runtime';

export default function Home() {
  const { runtime } = useRuntime();
  return runtime ? (
    <ConnectedHomeScreen
      onOpen={{
        activities: () => router.push('./activities'),
        days: () => router.push('./plan?field=days'),
        hours: () => router.push('./plan?field=hours'),
        sessions: () => router.push('./plan?field=sessions'),
      }}
    />
  ) : (
    <HomeScreen model={unavailableHome} protection={<UnavailableDeviceProtection />} />
  );
}
