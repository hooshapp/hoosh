import { focusManager, onlineManager } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { HistoryView } from '@disconnect/contracts';
import { isQuestId } from '@/domain/quest-values';
import { useNativeOwner } from '@/features/protection/native-owner-boundary';
import { useAccountAction } from '@/features/account/use-account-action';
import { syncRewards } from '@/features/rewards/reward-sync';
import {
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from '@/infrastructure/query/account-data-provider';
import {
  decodeNativeHistory,
  readHistory,
  saveHistory,
  type NativeHistory,
} from './history-api';
const subscribe = (fn: () => void) => onlineManager.subscribe(fn);
const onlineSnapshot = () => onlineManager.isOnline();
export type HistorySnapshot = {
  view: HistoryView;
  native: NativeHistory['state'] | 'unsupported' | 'error';
  notice: string;
  matching: boolean;
};
/** Native reads and server aggregates share the existing private Query lifetime. */
export function useHistory() {
  const { scope, availability, controller } = useAccountData();
  if (!scope) throw new Error('History requires a private account');
  const binding = useNativeOwner();
  const online = useSyncExternalStore(
    subscribe,
    onlineSnapshot,
    onlineSnapshot,
  );
  const [message, setMessage] = useState('');
  const actionBusy = useRef(false);
  const current = () => {
    scope.assertCurrent();
    if (
      binding &&
      (binding.generation !== scope.account.sessionGeneration ||
        !binding.owner.endsWith(`:${scope.account.user_id}`))
    )
      throw new Error('History owner changed');
  };
  const query = useAccountQuery(
    ['history'],
    async (op): Promise<HistorySnapshot> => {
      let notice = '';
      let native: NativeHistory | null = null;
      let state: HistorySnapshot['native'] = 'unsupported';
      if (binding) {
        current();
        try {
          await syncRewards(scope, binding);
          current();
        } catch {
          notice =
            'Recent turn-offs may still be waiting to sync on this device.';
        }
        if (binding.port.historyRead)
          try {
            native = decodeNativeHistory(
              await binding.port.historyRead(binding.owner),
            );
            current();
            state = native.state;
          } catch {
            state = 'error';
          }
      }
      let view = await readHistory(op);
      current();
      const matching =
        native?.state === 'ready' &&
        native.series.series_id === view.series_id &&
        native.series.timezone_id === view.timezone_id &&
        native.series.selected_count === view.selected_count &&
        native.series.started_on === view.started_on;
      if (matching && native?.state === 'ready') {
        const series = native.series;
        try {
          view = await scope.write((write) =>
            saveHistory({ ...series, expected_revision: view.revision }, write),
          );
          current();
        } catch {
          notice +=
            ' Usage summaries have not synced. Existing stored history may be out of date.';
        }
      }
      return {
        view,
        native: state,
        matching: !!matching,
        notice: notice.trim(),
      };
    },
  );
  const refetch = query.refetch;
  const refresh = useCallback(() => {
    if (
      !actionBusy.current &&
      scope.canRun() &&
      onlineManager.isOnline() &&
      focusManager.isFocused()
    )
      void refetch();
  }, [scope, refetch]);
  useEffect(() => {
    const detach = focusManager.subscribe((active) => {
      if (active) refresh();
    });
    const timer = setInterval(refresh, 60000);
    return () => {
      detach();
      clearInterval(timer);
    };
  }, [refresh]);
  const start = useAccountMutation({
    execute: async (_: void, op) => {
      current();
      if (!binding?.port.historyStart)
        throw new Error('History collector unavailable');
      const previous = await readHistory(op);
      current();
      let token: string | null = null;
      try {
        const opened = await binding.port.interventionOpen(binding.owner);
        if (!isQuestId(opened)) throw new Error('History handle invalid');
        token = opened;
        current();
        const result = await binding.port.historyStart(binding.owner, token);
        current();
        if (result === null) return null;
        const native = decodeNativeHistory(result);
        if (native.state !== 'ready')
          throw new Error('History setup not ready');
        const view = await saveHistory(
          { ...native.series, expected_revision: previous.revision },
          op,
        );
        current();
        return {
          view,
          native: 'ready',
          matching: true,
          notice: '',
        } as HistorySnapshot;
      } finally {
        if (token) await binding.port.interventionRelease(binding.owner, token);
      }
    },
    onSuccess: (result) => {
      actionBusy.current = false;
      if (result) {
        scope.client.setQueryData(scope.key('history'), result);
        setMessage(
          'History started. Comparisons appear only when the baseline and a later period have complete data.',
        );
      }
    },
    onError: () => {
      actionBusy.current = false;
      setMessage(
        'History setup was not confirmed. Check latest History before starting again; nothing changed app protection.',
      );
      refresh();
    },
  });
  // Privacy control is local and must not depend on network/API recovery.
  const stop = useAccountAction(controller, async () => {
    try {
      current();
      if (!binding?.port.historyStop)
        throw new Error('History stop unavailable');
      await scope.client.cancelQueries({
        queryKey: scope.key('history'),
        exact: true,
      });
      current();
      const token = await binding.port.interventionOpen(binding.owner);
      if (!isQuestId(token)) throw new Error('Invalid History handle');
      try {
        current();
        await binding.port.historyStop(binding.owner, token);
        current();
      } finally {
        await binding.port.interventionRelease(binding.owner, token);
      }
      current();
      scope.commit(() => {
        scope.client.setQueryData<HistorySnapshot>(
          scope.key('history'),
          (previous) =>
            previous
              ? { ...previous, native: 'not_started', matching: false }
              : previous,
        );
        setMessage(
          'Collection stopped on this device. Stored account summaries remain until replaced or the account is deleted. App protection is unchanged.',
        );
      });
    } catch {
      scope.commit(() =>
        setMessage(
          'Stopping collection was not confirmed. Check latest History before retrying.',
        ),
      );
    } finally {
      actionBusy.current = false;
      refresh();
    }
  });
  const available =
    availability === 'ready' && online && !query.isError && !query.isPaused;
  return {
    snapshot: available ? query.data : undefined,
    loading: available && query.isPending,
    refreshing: query.isFetching,
    online,
    message,
    refresh,
    busy: start.isPending || stop.busy,
    canStart:
      !!binding?.port.historyStart &&
      availability === 'ready' &&
      online &&
      !start.isPending,
    canStop:
      !!binding?.port.historyStop &&
      query.data?.native !== 'not_started' &&
      query.data?.native !== 'unsupported' &&
      !stop.busy,
    stop() {
      if (actionBusy.current) return;
      actionBusy.current = true;
      stop.run();
    },
    start() {
      if (actionBusy.current) return;
      actionBusy.current = true;
      setMessage('');
      start.submit();
    },
    async reviewUsage() {
      if (!binding?.port.openUsageAccess || actionBusy.current) return;
      actionBusy.current = true;
      try {
        await binding.port.openUsageAccess();
        current();
      } catch {
        scope.commit(() =>
          setMessage('Usage access settings could not be opened.'),
        );
      } finally {
        actionBusy.current = false;
        refresh();
      }
    },
    canReview: !!binding?.port.openUsageAccess,
  };
}
