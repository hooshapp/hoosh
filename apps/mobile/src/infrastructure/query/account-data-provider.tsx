import { QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useRef, useSyncExternalStore } from 'react';

import { type AccountDataController, type AccountDataSnapshot } from './account-controller';
import type { AccountOperation, AccountScope, AccountWork } from './account-scope';

const AccountContext = createContext<AccountDataSnapshot | null>(null);

/** Put private forms/toasts inside children: scope replacement remounts the whole subtree. */
export function AccountDataProvider({
  controller,
  children,
  fallback = null,
}: {
  controller: AccountDataController;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  );
  return (
    <AccountContext.Provider value={snapshot}>
      {snapshot.scope ? (
        <QueryClientProvider key={snapshot.scope.id} client={snapshot.scope.client}>
          {children}
        </QueryClientProvider>
      ) : (
        fallback
      )}
    </AccountContext.Provider>
  );
}
export function useAccountData() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('Account data requires AccountDataProvider.');
  return context;
}
function useScope(): AccountScope {
  const { scope } = useAccountData();
  if (!scope) throw new Error('Private account hooks require a settled account subtree.');
  return scope;
}
/** No prior-account placeholder/initial data or per-screen retry overrides. */
export function useAccountQuery<T>(parts: readonly unknown[], read: AccountWork<T>) {
  const scope = useScope();
  return useQuery(
    {
      queryKey: scope.key(...parts),
      enabled: () => scope.canRun(),
      queryFn: ({ signal }) => scope.read(read, signal),
    },
    scope.client,
  );
}
export type AccountMutationOptions<T, V> = {
  /** Transport only; no form/toast/navigation effects in this async function. */
  execute: (variables: V, operation: AccountOperation) => Promise<T>;
  /** Synchronous effects only; after any external await use scope.commit again. */
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: unknown, variables: V) => void;
};
/** No automatic replay, mutateAsync escape hatch or unguarded per-call callbacks. */
export function useAccountMutation<T, V>(options: AccountMutationOptions<T, V>) {
  const scope = useScope();
  const inFlight = useRef(false);
  const mutation = useMutation(
    {
      mutationFn: (variables: V) =>
        scope.write((operation) => options.execute(variables, operation)),
      retry: false,
      networkMode: 'always',
      onSuccess: (data, variables) => scope.commit(() => options.onSuccess?.(data, variables)),
      onError: (error, variables) => scope.commit(() => options.onError?.(error, variables)),
      onSettled: () => {
        inFlight.current = false;
      },
    },
    scope.client,
  );
  return {
    submit: (variables: V) => {
      if (inFlight.current) return;
      inFlight.current = true;
      mutation.mutate(variables);
    },
    reset: mutation.reset,
    isPending: mutation.isPending,
    data: mutation.data,
    error: mutation.error,
  };
}
