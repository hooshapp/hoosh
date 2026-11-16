import ConfirmEmail from '@/app/(auth)/confirm-email';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { usePublicAuth } from '@/features/auth/use-public-auth';

export default function Index() {
  const { links } = usePublicAuth();
  return links.pending?.kind === 'signup' ? <ConfirmEmail /> : <AuthScreen mode="sign-in" />;
}
