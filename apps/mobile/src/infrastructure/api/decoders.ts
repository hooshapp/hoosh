import type { AuthIdentity, HealthResponse } from '@disconnect/contracts';
import { ApiError, isRecord, safeRequestId } from './errors';
import type { ResponseContext } from './types';

export function decodeHealth(value: unknown): HealthResponse {
  if (!isRecord(value) || value.status !== 'ok' || value.service !== 'disconnect-api')
    throw new ApiError('invalid_response');
  return { status: 'ok', service: 'disconnect-api' };
}
/** Verified wire-to-domain projection; API-05 types do not replace runtime validation. */
export function decodeIdentity(value: unknown, { account }: ResponseContext): AuthIdentity {
  if (
    !isRecord(value) ||
    !safeRequestId(value.user_id) ||
    value.user_id !== account?.user_id ||
    !(value.email === null || typeof value.email === 'string')
  )
    throw new ApiError('invalid_response');
  return { user_id: value.user_id as string, email: value.email as string | null };
}
