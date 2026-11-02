import { Redirect, type Href } from 'expo-router';
import { Introduction } from '@/features/intro/Introduction';
import { useAuth } from '@/features/auth/auth-provider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { questionCompleteKey } from '@/features/onboarding/draft';

export default function Index() {
  const { snapshot, links, controller } = useAuth();
  const [onboardingDone,setOnboardingDone]=useState<{accountId:string;done:boolean}|null>(null);
  const accountId = snapshot.status === 'signed_in' ? snapshot.user.user_id : null;
  useEffect(()=>{if(!accountId)return;let alive=true;void AsyncStorage.getItem(questionCompleteKey(accountId)).then(v=>{if(alive)setOnboardingDone({accountId,done:v==='1'})}).catch(()=>{if(alive)setOnboardingDone({accountId,done:false})});return()=>{alive=false}},[accountId]);
  if (links.pending?.phase === 'consuming') return <Redirect href={'/auth/link-error' as Href} />;
  if (links.pending?.kind === 'oauth') return <Redirect href={'/(auth)/social-sign-in' as Href} />;
  if (links.pending?.kind === 'recovery') {
    return <Redirect href={(controller.canResetPassword() || snapshot.status === 'signed_in'
      ? '/(auth)/reset-password' : '/(auth)/forgot-password') as Href} />;
  }
  if (links.pending?.kind === 'signup') return <Redirect href={'/(auth)/confirm-email' as Href} />;
  if (snapshot.status === 'signed_in') return onboardingDone?.accountId!==accountId?null:<Redirect href={onboardingDone.done?'/(tabs)':'/(onboarding)/welcome'} />;
  return <Introduction />;
}
