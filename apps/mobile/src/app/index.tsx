import ConfirmEmail from '@/app/(auth)/confirm-email';
import { ForgotPassword, ResetPassword } from '@/features/auth/EmailFlows';
import { SocialSignInPending } from '@/features/auth/CallbackScreens';
import { Introduction } from '@/features/intro/Introduction';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { usePublicAuth } from '@/features/auth/use-public-auth';

export default function Index() {
  const { links, runtime, snapshot } = usePublicAuth();
  if (links.pending?.kind === 'signup') return <ConfirmEmail />;
  if (links.pending?.kind === 'oauth') return <SocialSignInPending />;
  if (links.pending?.kind === 'recovery' && links.pending.phase === 'requested') return <ForgotPassword />;
  if (runtime.authLinks?.canResetPassword()) return <ResetPassword />;
  if (snapshot.status === 'signed_out' && !runtime.authLinks?.getLastSignOutResult()) return <Introduction returningTo="/(auth)/sign-in" />;
  return <AuthScreen mode="sign-in" />;
}
