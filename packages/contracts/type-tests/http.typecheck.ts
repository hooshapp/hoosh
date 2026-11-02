/** Compile-only generated-wire handoff. Never imported by the running application. */
import type { ApiErrorEnvelope, AuthIdentity, HealthResponse, MeResponse, ProfileResponse, ProfileView, paths } from '../src';

declare const identity: MeResponse;
const domainIdentity: AuthIdentity = identity;
const wireIdentity: MeResponse = domainIdentity;
const nullableEmail: MeResponse = { user_id: 'synthetic-uuid', email: null };
const health: HealthResponse = { status: 'ok', service: 'disconnect-api' };
void [wireIdentity, nullableEmail, health];

// @ts-expect-error Nullable email is required, never omitted.
const missingEmail: MeResponse = { user_id: 'synthetic-uuid' };
// @ts-expect-error Tokens/internal claims are not public identity fields.
const privateClaim: MeResponse = { user_id: 'synthetic-uuid', email: null, access_token: 'not-a-token' };
const absentProfile: ProfileResponse = { profile: null };
const nullableProfile: ProfileView = {
  user_id: 'synthetic-uuid', display_name: null, revision: 1,
  created_at: '2026-10-28T18:00:00Z', updated_at: '2026-10-28T18:00:00Z',
};
const presentProfile: ProfileResponse = { profile: nullableProfile };
const profileGet: paths['/v1/profile']['get']['responses'][200]['content']['application/json'] = presentProfile;
// @ts-expect-error Absent profile is an explicit null envelope, never omission.
const omittedProfile: ProfileResponse = {};
// @ts-expect-error Nullable display_name is a required property.
const missingName: ProfileView = { user_id: 'id', revision: 1, created_at: 'Z', updated_at: 'Z' };
// @ts-expect-error Only GET is implemented in API-08; PATCH remains API-09.
const futurePatch: NonNullable<paths['/v1/profile']['patch']> = {};
// @ts-expect-error Profile reads accept no owner-selecting body.
const profileBody: NonNullable<paths['/v1/profile']['get']['requestBody']> = { user_id: 'other' };
void [absentProfile, profileGet, omittedProfile, missingName, futurePatch, profileBody];
// @ts-expect-error GET /v1/me has no owner-selecting request body.
const forbiddenBody: NonNullable<paths['/v1/me']['get']['requestBody']> = { user_id: 'another' };
void [missingEmail, privateClaim, forbiddenBody];

export function inspectWireError(error: ApiErrorEnvelope['error']) {
  if (error.code === 'VALIDATION_ERROR') {
    const fields: { field: string; code: string }[] = error.details.fields;
    const retry: false = error.retryable;
    return [fields, retry];
  }
  if (error.code === 'PROFILE_CONFLICT') {
    const revision: number = error.details.current_revision;
    return revision;
  }
  if (error.code === 'AUTH_UNAVAILABLE') {
    const retry: true = error.retryable;
    // @ts-expect-error General/unavailable errors cannot leak arbitrary detail payloads.
    void error.details;
    return retry;
  }
  return error.request_id;
}
