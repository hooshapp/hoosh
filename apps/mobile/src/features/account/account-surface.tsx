import type { AuthAccountActions } from '@disconnect/contracts';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineStatus } from '@/components/ui/inline-status';
import { colors } from '@/design/tokens';
import { ApiError } from '@/infrastructure/api/errors';
import type {
  AccountAvailability,
  AccountDataController,
} from '@/infrastructure/query/account-controller';
import { useAccountData } from '@/infrastructure/query/account-data-provider';

import { AccountHeader } from './account-header';
import { useIdentityQuery } from './identity-query';
import { useAccountAction } from './use-account-action';

/** Mount only within the same controller's private AccountDataProvider subtree. */
export function AccountSurface({
  controller,
  actions,
}: {
  controller: AccountDataController;
  actions?: AuthAccountActions;
}) {
  const { availability } = useAccountData();
  const query = useIdentityQuery();
  const recovery = useAccountAction(controller, () => controller.recoverSession());
  const paused = availability === 'api_paused' || availability === 'recovering';
  const ready = availability === 'ready';
  const identity = paused ? undefined : query.data;
  const hasStatus =
    paused || !ready || query.isPaused || query.isError || query.isFetching || actions;
  return (
    <View style={styles.region}>
      {identity ? <AccountHeader identity={identity} /> : null}
      {hasStatus ? (
        <View style={styles.status}>
          <IdentityStatus availability={availability} query={query} recovery={recovery} />
          {paused ? (
            <Button
              label="Verify account access"
              busyLabel="Verifying…"
              variant="secondary"
              busy={recovery.busy || availability === 'recovering'}
              onPress={recovery.run}
            />
          ) : null}
          {actions ? <SignOutAction controller={controller} actions={actions} /> : null}
        </View>
      ) : null}
    </View>
  );
}
function IdentityStatus({
  availability,
  query,
  recovery,
}: {
  availability: AccountAvailability;
  query: ReturnType<typeof useIdentityQuery>;
  recovery: ReturnType<typeof useAccountAction>;
}) {
  if (availability === 'api_paused' || availability === 'recovering')
    return (
      <InlineStatus
        state={recovery.busy || availability === 'recovering' ? 'loading' : 'unavailable'}
        message={
          recovery.failed
            ? 'Account access could not be verified. Try again.'
            : 'Verify your account access to continue.'
        }
      />
    );
  if (availability !== 'ready')
    return (
      <InlineStatus state="unavailable" message="Account information is temporarily unavailable." />
    );
  if (query.isPaused)
    return (
      <InlineStatus
        state="unavailable"
        message={
          query.data
            ? 'You’re offline. Showing previously loaded account information.'
            : 'You’re offline. Account information will load when connected.'
        }
      />
    );
  if (query.isError) {
    const invalid = query.error instanceof ApiError && query.error.kind === 'invalid_response';
    return (
      <InlineStatus
        state="error"
        message={
          invalid
            ? 'Account information could not be verified.'
            : query.data
              ? 'Account information could not be refreshed. Showing the last loaded details.'
              : 'Account information could not be loaded.'
        }
        onRetry={() => {
          void query.refetch();
        }}
        retrying={query.isFetching}
      />
    );
  }
  if (query.isFetching)
    return (
      <InlineStatus
        state="loading"
        message={query.data ? 'Refreshing account information…' : 'Loading account information…'}
      />
    );
  return null;
}
function SignOutAction({
  controller,
  actions,
}: {
  controller: AccountDataController;
  actions: AuthAccountActions;
}) {
  const signOut = useAccountAction(controller, () => actions.signOut());
  return (
    <View style={styles.actions}>
      <Button
        label="Sign out"
        busyLabel="Signing out…"
        variant="secondary"
        busy={signOut.busy}
        onPress={signOut.run}
      />
      {signOut.failed ? (
        <InlineStatus state="error" message="Sign-out could not be completed. Try again." />
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  region: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  status: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  actions: { gap: 12 },
});
