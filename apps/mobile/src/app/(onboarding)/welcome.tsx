import { Redirect } from 'expo-router';
import { OnboardingQuestions } from '@/features/onboarding/OnboardingQuestions';
import { useAuth } from '@/features/auth/auth-provider';

export default function Welcome() {
  const { snapshot } = useAuth();
  if (snapshot.status !== 'signed_in') return <Redirect href="/(auth)/sign-in" />;
  return <OnboardingQuestions key={snapshot.user.user_id} />;
}
