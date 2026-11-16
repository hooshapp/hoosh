import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAppRuntime } from '@/features/account/app-runtime-context';
import { useIdentityQuery } from '@/features/account/identity-query';
import { useAccountData } from '@/infrastructure/query/account-data-provider';

import { setupRepository } from './progress-storage';

/** A verified private scope may resume once. Leaving setup for Home is deliberate. */
export function SetupResume() {
  const project = useAppRuntime()?.nativeNamespace;
  const { scope } = useAccountData();
  const identity = useIdentityQuery();
  const pathname = usePathname();
  const router = useRouter();
  const checked = useRef(false);
  const verified = scope && !identity.isError && identity.data?.user_id === scope.account.user_id;
  useEffect(() => {
    if (pathname === '/welcome') checked.current = true;
    if (!project || !scope || !verified || pathname !== '/' || checked.current) return;
    let active = true;
    void setupRepository(project).read(scope).then(result => {
      if (!active || !scope.isCurrent()) return;
      checked.current = true;
      if (result.status === 'found' && result.progress.step !== 'complete') {
        router.replace('/(onboarding)/welcome');
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, [pathname, project, router, scope, verified]);
  return null;
}
