import { uuid } from 'expo';
import { focusManager } from '@tanstack/react-query';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useNativeOwner } from '@/features/protection/native-owner-boundary';
import { createQuestLifecycle } from './quest-lifecycle';

/** Presentation refresh only. Native rules remain independent of React and network. */
export function useQuestLifecycle(
  id: string,
  enabled: boolean,
  visible: boolean,
) {
  const { scope } = useAccountData();
  const owner = useNativeOwner();
  if (!scope) throw new Error('Quest lifecycle needs an account');
  const controller = useMemo(
    () => createQuestLifecycle(scope, id, owner, () => uuid.v4()),
    [scope, id, owner],
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => () => controller.dispose(), [controller]);
  useEffect(() => {
    if (!enabled || !visible) return;
    const read = () => {
      if (focusManager.isFocused()) void controller.refresh();
    };
    read();
    const detach = focusManager.subscribe((focused) => {
      if (focused) read();
    });
    const interval = setInterval(read, 15000);
    return () => {
      detach();
      clearInterval(interval);
    };
  }, [controller, enabled, visible]);
  return { controller, state, owner };
}
