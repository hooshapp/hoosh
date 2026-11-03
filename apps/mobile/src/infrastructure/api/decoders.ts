import type {
  AuthIdentity,
  HealthResponse,
  ProfileResponse,
  ProfileSavedResponse,
  ProfileView,
} from '@disconnect/contracts';
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
  return {
    user_id: value.user_id as string,
    email: value.email as string | null,
  };
}

function decodeProfile(value: unknown, { account }: ResponseContext): ProfileView {
  if (
    !isRecord(value) ||
    value.user_id !== account?.user_id ||
    !safeRequestId(value.user_id) ||
    !Number.isSafeInteger(value.revision) ||
    (value.revision as number) < 1 ||
    !(
      value.display_name === null ||
      (typeof value.display_name === 'string' &&
        Array.from(value.display_name).length >= 1 &&
        Array.from(value.display_name).length <= 80 &&
        !/[\u0000\uD800-\uDFFF]/u.test(value.display_name))
    ) ||
    !utcTimestamp(value.created_at) ||
    !utcTimestamp(value.updated_at) ||
    Date.parse(value.updated_at) < Date.parse(value.created_at)
  )
    throw new ApiError('invalid_response');
  return {
    user_id: value.user_id as string,
    revision: value.revision as number,
    display_name: value.display_name as string | null,
    created_at: value.created_at as string,
    updated_at: value.updated_at as string,
  };
}
export function utcTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    !value.startsWith('0000-') &&
    new Date(value).toISOString().slice(0, 19) === value.slice(0, 19)
  );
}
/** Project approved fields only; a missing row is distinct from a row with a null name. */
export function decodeProfileResponse(value: unknown, context: ResponseContext): ProfileResponse {
  if (!isRecord(value) || !Object.hasOwn(value, 'profile')) throw new ApiError('invalid_response');
  return {
    profile: value.profile === null ? null : decodeProfile(value.profile, context),
  };
}
export function decodeProfileSavedResponse(
  value: unknown,
  context: ResponseContext,
): ProfileSavedResponse {
  const response = decodeProfileResponse(value, context);
  if (!response.profile) throw new ApiError('invalid_response');
  return { profile: response.profile };
}
