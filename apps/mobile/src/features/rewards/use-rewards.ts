import { uuid } from 'expo';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { RewardView } from '@disconnect/contracts';
import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData, useAccountMutation, useAccountQuery } from '@/infrastructure/query/account-data-provider';
import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { feedDino, readFeedReceipt, readWallet } from './rewards-api';
import { syncRewards } from './reward-sync';

const getOnline = () => onlineManager.isOnline();
const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);

/** Query and mutation lifetime follows the existing verified private account boundary. */
export function useRewards() {
  const { scope, availability } = useAccountData();
  if (!scope) throw new Error('Rewards need a private account');
  const binding = useNativeOwner();
  const ios = useIOSSelectionDevice();
  const online = useSyncExternalStore(subscribeOnline, getOnline, getOnline);
  const [message, setMessage] = useState('');
  const [syncNotice, setSyncNotice] = useState('');
  // Keep an uncertain command across Home remounts, within this disposable account cache.
  const pendingKey = scope.key('reward-feed-pending');
  const [pending, setPending] = useState<string | null>(() => scope.client.getQueryData(pendingKey) ?? null);
  const busy = useRef(false);
  const rememberPending = (id: string | null) => {
    scope.client.setQueryData(pendingKey, id); setPending(id);
  };
  const query = useAccountQuery(['rewards'], async (op) => {
    let notice = '';
    try {
      const supported = await syncRewards(scope, binding);
      if (!supported) notice = 'Device reward sync is not available on this build. Quest credits and Feed still work.';
    } catch { notice = 'Device rewards have not synced. They remain on this device for retry; app protection works independently.'; }
    const result = await readWallet(op);
    scope.commit(() => setSyncNotice(notice));
    return result;
  });
  const refetch = query.refetch;
  const refresh = useCallback(() => {
    if (!busy.current && scope.canRun() && onlineManager.isOnline() && focusManager.isFocused()) {
      void refetch({ cancelRefetch: false });
    }
  }, [scope, refetch]);
  useEffect(() => {
    const detach = focusManager.subscribe((focused) => { if (focused) refresh(); });
    const detachDevice = ios?.subscribe(refresh);
    const interval = setInterval(refresh, 30000);
    return () => { detach(); detachDevice?.(); clearInterval(interval); };
  }, [ios, refresh]);
  useEffect(() => {
    if (binding) refresh();
  }, [binding, refresh]);
  const accept = (wallet: RewardView) => scope.client.setQueryData(scope.key('rewards'), wallet);
  const feed = useAccountMutation({
    execute: async ({ id, revision }: { id: string; revision: number }, op) => {
      await scope.client.cancelQueries({ queryKey: scope.key('rewards') });
      scope.assertCurrent();
      return feedDino(id, revision, op);
    },
    onSuccess: (result) => {
      accept(result.wallet); rememberPending(null);
      setMessage(`Dino gained ${result.health_added} health. ${result.charged_credits} credits used.`); busy.current = false;
    },
    onError: (error) => {
      busy.current = false;
      const uncertain = !(error instanceof ApiError) || error.requestMayHaveCommitted || ['network', 'timeout', 'invalid_response', 'cancelled'].includes(error.kind);
      if (uncertain) setMessage('Feed was not confirmed. Check the last Feed before trying another.');
      else { rememberPending(null); setMessage('Feed was not charged. Refresh your wallet before trying again.'); }
      void scope.client.invalidateQueries({ queryKey: scope.key('rewards') });
    },
  });
  const receipt = useAccountMutation({
    execute: (id: string, op) => readFeedReceipt(id, op),
    onSuccess: (result) => {
      accept(result.wallet); rememberPending(null); busy.current = false;
      setMessage(result.recorded ? `Last Feed confirmed. Dino gained ${result.health_added} health.` : 'No Feed was recorded. Review the latest balance before choosing Feed again.');
    },
    onError: () => { busy.current = false; setMessage('Could not check the last Feed. Connect and try checking again.'); },
  });
  const available = availability === 'ready' && online && !query.isError;
  const wallet = available ? query.data : undefined;
  const warningAt = wallet?.health_warning_at;
  const lowHealth = !!wallet && wallet.health <= 25;
  useEffect(() => {
    if (scope.isCurrent() && binding && warningAt) {
      void binding.port.dinoHealthWarning?.(binding.owner, Date.parse(warningAt), lowHealth)
        .catch(() => undefined);
    }
  }, [binding, lowHealth, scope, warningAt]);
  const feeding = feed.isPending || receipt.isPending;
  return {
    wallet, loading: query.isPending && available, refreshing: query.isFetching,
    message, syncNotice: wallet ? syncNotice : '', pending,
    unavailable: !online ? 'Connect to verify credits and Dino health.' : 'Your rewards are temporarily unavailable.',
    refresh,
    feeding,
    canCheck: !!pending && !feeding && availability === 'ready' && online,
    canFeed: !!wallet && !feeding && !pending && wallet.balance >= wallet.feed_cost && wallet.health < 100 && wallet.revision < 2147483647,
    feed() {
      if (!wallet || feeding || pending || busy.current || wallet.balance < wallet.feed_cost || wallet.health >= 100) return;
      busy.current = true; const id = uuid.v4(); rememberPending(id); setMessage('');
      feed.submit({ id, revision: wallet.revision });
    },
    checkFeed() { if (pending && !busy.current && availability === 'ready' && online) { busy.current = true; receipt.submit(pending); } },
  };
}
