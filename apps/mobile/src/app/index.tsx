import { Redirect, type Href } from 'expo-router';
import { Introduction } from '@/features/intro/Introduction';
import { useAuth } from '@/features/auth/auth-provider';

export default function Index() {
  const { snapshot, links, controller } = useAuth();
  if (links.pending?.phase === 'consuming') return <Redirect href={'/auth/link-error' as Href} />;
  if (links.pending?.kind === 'oauth') return <Redirect href={'/(auth)/social-sign-in' as Href} />;
  if (links.pending?.kind === 'recovery') {
    return <Redirect href={(controller.canResetPassword() || snapshot.status === 'signed_in'
      ? '/(auth)/reset-password' : '/(auth)/forgot-password') as Href} />;
  }
  if (links.pending?.kind === 'signup') return <Redirect href={'/(auth)/confirm-email' as Href} />;
  if (snapshot.status === 'signed_in') return <Redirect href="/(tabs)" />;
  return <Introduction />;
}
