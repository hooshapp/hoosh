import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '../api/errors';

/** HTTP alone owns 401 recovery; Query adds at most one transient read retry. */
export function retryRead(failureCount: number, error: unknown, canRun: () => boolean) {
  if (failureCount >= 1 || !canRun() || !(error instanceof ApiError) || !error.retryable)
    return false;
  if (error.status !== undefined && error.status >= 400 && ![429, 503].includes(error.status))
    return false;
  return (
    error.kind === 'network' ||
    error.kind === 'timeout' ||
    error.status === 503 ||
    (error.status === 429 && error.retryAfterMs !== undefined && error.retryAfterMs <= 60_000)
  );
}
export function readRetryDelay(_attempt: number, error: unknown) {
  return error instanceof ApiError && error.status === 429 ? (error.retryAfterMs ?? 1000) : 1000;
}
export function createAccountQueryClient(canRun: () => boolean) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Scope disposal owns retention. Avoid detached observers scheduling GC timers
        // after synchronous private-cache teardown and before React unmounts them.
        gcTime: Infinity,
        retry: (count, error) => retryRead(count, error, canRun),
        retryDelay: readRetryDelay,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      // Writes must fail offline rather than queue until a later account is active.
      mutations: { retry: false, networkMode: 'always', gcTime: 0 },
    },
  });
}
