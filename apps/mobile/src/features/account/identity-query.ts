import { useEffect } from 'react';

import { ApiError } from '@/infrastructure/api/errors';
import { useAccountData, useAccountQuery } from '@/infrastructure/query/account-data-provider';

import { readIdentity } from './api';

export function useIdentityQuery() {
  const { scope } = useAccountData();
  const query = useAccountQuery(['identity'], readIdentity);
  const protocolFailure =
    query.error instanceof ApiError && query.error.kind === 'invalid_response';
  useEffect(() => {
    // A malformed or different-owner response invalidates even the prior identity.
    // Remove without reset/invalidate: neither should start a protocol-error retry loop.
    if (scope && protocolFailure)
      scope.client.removeQueries({ queryKey: scope.key('identity'), exact: true });
  }, [scope, protocolFailure]);
  return { ...query, data: protocolFailure ? undefined : query.data };
}
