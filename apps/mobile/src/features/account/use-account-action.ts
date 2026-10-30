import { useEffect, useRef, useState } from 'react';

import type { AccountDataController } from '@/infrastructure/query/account-controller';
import { useAccountData } from '@/infrastructure/query/account-data-provider';

/** Separate from server mutations: sign-out must work even when API access is paused. */
export function useAccountAction(
  controller: AccountDataController,
  action: () => Promise<unknown>,
) {
  const { scope } = useAccountData();
  const mounted = useRef(false);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function current() {
    return mounted.current && scope !== null && controller.getSnapshot().scope === scope;
  }
  async function run() {
    if (running.current || !current()) return;
    running.current = true;
    setBusy(true);
    setFailed(false);
    try {
      await action();
    } catch {
      if (current()) setFailed(true);
    } finally {
      running.current = false;
      if (current()) setBusy(false);
    }
  }
  return {
    busy,
    failed,
    run: () => {
      void run();
    },
  };
}
