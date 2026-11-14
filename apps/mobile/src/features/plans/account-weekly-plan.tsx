import { onlineManager } from '@tanstack/react-query';
import type { SettingsResponse } from '@disconnect/contracts';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { decodeInterventionStatus } from '@/infrastructure/native/intervention-coordinator';
import {
  useNativeOwner,
  type NativeOwner,
} from '@/features/protection/native-owner-boundary';
import { useSettingsSummary } from '@/features/settings/use-settings-summary';
import { useWeeklyPlan, type WeeklyPlanPort } from './use-weekly-plan';

/** Older bridges keep their other features; partial weekly support must stay unavailable. */
export function weeklyPort(owner: NativeOwner): WeeklyPlanPort | null {
  const port = owner.port;
  return typeof port.scheduleRead === 'function' &&
    typeof port.schedulePreview === 'function' &&
    typeof port.scheduleApply === 'function' &&
    typeof port.interventionCancel === 'function'
    ? (port as WeeklyPlanPort)
    : null;
}
type Plan = ReturnType<typeof useWeeklyPlan>;
type AccountPlan = Readonly<{
  plan: Plan;
  draftAvailable: boolean;
  claiming: boolean;
  claimMessage: string;
  claim: () => void;
}>;
const AccountPlanContext = createContext<AccountPlan | null>(null);
export const useAccountWeeklyPlan = () => useContext(AccountPlanContext);

/** Exactly one account/native controller above the normal Router's tabs and editors. */
export function AccountWeeklyPlanBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const owner = useNativeOwner();
  return owner ? (
    <ScopedAccountPlan key={`${owner.owner}:${owner.generation}`} owner={owner}>
      {children}
    </ScopedAccountPlan>
  ) : (
    <AccountPlanContext.Provider value={null}>
      {children}
    </AccountPlanContext.Provider>
  );
}
function ScopedAccountPlan({
  owner,
  children,
}: {
  owner: NativeOwner;
  children: ReactNode;
}) {
  const { scope, controller } = useAccountData();
  const { query, availability, online } = useSettingsSummary();
  const draftAvailable =
    availability === 'ready' &&
    online &&
    !!query.data &&
    !query.isError &&
    !query.isPaused &&
    !query.isFetching;
  const port = weeklyPort(owner);
  // Never install a stale cached draft or silently fall back to the installed spec.
  const plan = useWeeklyPlan(owner.owner, port, undefined, true, {
    draft: draftAvailable ? (query.data?.settings?.plan_draft ?? null) : null,
    available: draftAvailable,
    getCurrentDraft: () => {
      // Query observers notify in batches. A tap immediately after editor Save must
      // read the canonical receipt, even before this provider has re-rendered.
      const current = scope?.client.getQueryState<SettingsResponse>(
        scope.key('settings'),
      );
      if (
        !scope?.canRun() ||
        controller.getSnapshot().availability !== 'ready' ||
        !onlineManager.isOnline() ||
        current?.status !== 'success' ||
        current.fetchStatus !== 'idle' ||
        !current.data
      )
        throw new Error('Saved draft is unavailable');
      return current.data.settings?.plan_draft ?? null;
    },
  });
  const [claiming, setClaiming] = useState(false),
    [claimMessage, setClaimMessage] = useState('');
  const lifecycle = useRef({ active: true, claiming: false });
  useEffect(() => {
    const lifetime = lifecycle.current;
    lifetime.active = true;
    return () => {
      lifetime.active = false;
    };
  }, []);
  const claim = () => {
    const lifetime = lifecycle.current;
    if (
      !lifetime.active ||
      lifetime.claiming ||
      plan.busy ||
      !scope?.canRun() ||
      (plan.read.phase !== 'error' && plan.read.phase !== 'ready')
    )
      return;
    lifetime.claiming = true;
    setClaiming(true);
    setClaimMessage('');
    const current = () => {
      scope.assertCurrent();
      if (!lifetime.active) throw new Error('Closed device owner');
    };
    void (async () => {
      let token: string | null = null;
      try {
        const value = await owner.port.interventionOpen(owner.owner);
        if (
          typeof value !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
            value,
          )
        )
          throw new Error('Invalid device handle');
        token = value;
        current();
        decodeInterventionStatus(
          await owner.port.interventionClaimOwner(owner.owner, token, true),
        );
        current();
      } finally {
        if (token) await owner.port.interventionRelease(owner.owner, token);
      }
      current();
      setClaimMessage(
        'This account can manage this device. Previous account rules are stopped; no schedule has resumed.',
      );
      await plan.refresh();
    })()
      .catch(() => {
        if (lifetime.active)
          setClaimMessage(
            'Device account change could not be confirmed. Refresh and review before continuing.',
          );
      })
      .finally(() => {
        lifetime.claiming = false;
        if (lifetime.active) setClaiming(false);
      });
  };
  return (
    <AccountPlanContext.Provider
      value={{ plan, draftAvailable, claiming, claimMessage, claim }}
    >
      {children}
    </AccountPlanContext.Provider>
  );
}
