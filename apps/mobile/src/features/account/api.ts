import { decodeIdentity } from '../../infrastructure/api/decoders';
import type { AccountOperation } from '../../infrastructure/query/account-scope';

/** Existing canonical identity projection; API-05 supplies generated wire types later. */
export function readIdentity({ api, signal }: AccountOperation) {
  return api.request('/v1/me', { signal, decode: decodeIdentity });
}
