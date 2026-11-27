import { focusManager, onlineManager } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { RecommendationAction } from '@disconnect/contracts';
import type { HomeModel } from '@/features/home/home-model';
import {
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from '@/infrastructure/query/account-data-provider';
import {
  decideRecommendation,
  readRecommendation,
} from './recommendations-api';

const subscribe = (fn: () => void) => onlineManager.subscribe(fn);
const snapshot = () => onlineManager.isOnline();
export function useRecommendations(onAccepted?: (id: string) => void) {
  const { scope, availability } = useAccountData();
  if (!scope) throw new Error('Recommendations require an account');
  const online = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [message, setMessage] = useState('');
  const [review, setReview] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const query = useAccountQuery(['recommendations'], readRecommendation);
  const refetch = query.refetch;
  const refresh = useCallback(async (manual = false) => {
    if (
      !scope.canRun() ||
      !onlineManager.isOnline() ||
      (!manual && !focusManager.isFocused()) ||
      busy.current
    )
      return;
    const result = await refetch();
    scope.commit(() => {
      if (!mounted.current) return;
      if (result.isError || result.isPaused) {
        if (manual) setMessage("Couldn’t check the latest suggestion. Try again.");
      } else {
        setReview(false);
        setClock(Date.now());
        if (manual && !review) setMessage('');
        if (review)
          setMessage(
            result.data?.state === 'accepted'
              ? result.data.accepted_quest_id
                ? 'Your one-time quest is saved. Review its schedule and device protection below.'
                : 'This suggestion was accepted, but its quest is no longer saved. It will not be recreated.'
              : result.data?.state === 'skipped'
                ? 'Your Skip was saved. Your apps and credits have not changed.'
                : 'No saved choice was found. You can review this fresh suggestion.',
          );
      }
    });
  }, [scope, refetch, review]);
  useEffect(() => {
    const detach = focusManager.subscribe((active) => {
      if (active) void refresh();
    });
    const timer = setInterval(() => {
      setClock(Date.now());
      void refresh();
    }, 30000);
    return () => {
      detach();
      clearInterval(timer);
    };
  }, [refresh]);
  const mutation = useAccountMutation({
    execute: async (body: RecommendationAction, op) => {
      await scope.client.cancelQueries({
        queryKey: scope.key('recommendations'),
        exact: true,
      });
      const result = await decideRecommendation(body, op);
      await scope.client.cancelQueries({
        queryKey: scope.key('recommendations'),
        exact: true,
      });
      return result;
    },
    onSuccess: (result) => {
      busy.current = false;
      scope.client.setQueryData(scope.key('recommendations'), result);
      if (result.state === 'accepted')
        void scope.client.invalidateQueries({ queryKey: scope.key('quests') });
      if (!mounted.current) return;
      setReview(false);
      setMessage(
        result.state === 'accepted'
          ? result.accepted_quest_id
            ? 'Saved a one-time quest. Review its time and apply protection next. Credits are earned after completion, not acceptance.'
            : 'This suggestion was accepted, but its quest is no longer saved. It will not be recreated.'
          : 'Suggestion skipped. Your apps and credits have not changed.',
      );
      if (result.accepted_quest_id) onAccepted?.(result.accepted_quest_id);
    },
    onError: () => {
      busy.current = false;
      if (!mounted.current) return;
      setReview(true);
      setMessage(
        'Your choice was not confirmed. Check the latest suggestion before trying again; it may already have been saved.',
      );
    },
  });
  const available =
    availability === 'ready' && online && !query.isError && !query.isPaused;
  const data = available ? query.data : undefined;
  const offer = data?.offer;
  const expired = !!offer && clock >= Date.parse(offer.expires_at);
  const canAct =
    !!offer && !expired && !review && !mutation.isPending && available;
  let recommendation: HomeModel['recommendation'] = { state: 'unavailable' };
  if (available && query.isPending) recommendation = { state: 'loading' };
  else if (query.isError && online) recommendation = { state: 'error' };
  else if (data && !offer) recommendation = { state: 'empty' };
  else if (offer)
    recommendation = {
      state: 'ready',
      value: {
        id: offer.offer_id,
        title: offer.title,
        description: `${offer.duration_minutes} minutes, if it fits your plans. ${offer.source === 'activity_template' ? 'Inspired by your saved activities.' : 'A simple idea for some offline time.'}`,
        rewardCredits: offer.completion_credits,
        restrictionNotice:
          'Accept saves a one-time quest and opens review. You can then apply protection to your selected apps. Earn credits only after finishing and confirming the quest.',
      },
    };
  function choose(action: RecommendationAction['action'], id: string) {
    if (!canAct || busy.current || id !== offer?.offer_id) return;
    busy.current = true;
    setMessage('');
    mutation.submit({ action, offer_id: id });
  }
  return {
    recommendation,
    canRefresh: availability === 'ready' && online && !mutation.isPending,
    data,
    available,
    online,
    message,
    canAct,
    busy: mutation.isPending,
    refreshing: query.isFetching,
    needsRefresh: review || expired || query.isError,
    notice: !online
      ? 'Connect to verify your suggestion and saved choice.'
      : expired
        ? 'This suggestion expired. Check for a fresh idea.'
        : data?.next_offer_at
          ? `A fresh suggestion will be available after ${new Date(data.next_offer_at).toLocaleString()}.`
          : review
            ? 'Review the latest saved choice before continuing.'
            : '',
    refresh: () => {
      void refresh(true);
    },
    accept: (id: string) => choose('accepted', id),
    skip: (id: string) => choose('skipped', id),
  };
}
