/** Compile-only generated-wire handoff. Never imported by the running application. */
import type { ApiErrorEnvelope, AuthIdentity, HealthResponse, MeResponse, ProfilePatch, ProfileResponse, ProfileSavedResponse, ProfileView, paths } from '../src';

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
const saveBody: ProfilePatch = { expected_revision: 0, display_name: null };
const rawPaddedBody: ProfilePatch = { expected_revision: 1, display_name: '  raw draft  ' };
const saved: ProfileSavedResponse = { profile: nullableProfile };
const patchBody: paths['/v1/profile']['patch']['requestBody']['content']['application/json'] = saveBody;
// @ts-expect-error A revision-only mutation cannot omit the mutable field.
const revisionOnly: ProfilePatch = { expected_revision: 0 };
// @ts-expect-error Owners are derived from verified identity, not request input.
const bodyOwner: ProfilePatch = { expected_revision: 0, display_name: 'x', user_id: 'other' };
// @ts-expect-error JSON boolean is never a revision.
const booleanRevision: ProfilePatch = { expected_revision: true, display_name: null };
// @ts-expect-error A successful mutation cannot return an absent profile.
const absentSave: ProfileSavedResponse = { profile: null };
void [rawPaddedBody, saved, patchBody, revisionOnly, bodyOwner, booleanRevision, absentSave];
// @ts-expect-error Profile reads accept no owner-selecting body.
const profileBody: NonNullable<paths['/v1/profile']['get']['requestBody']> = { user_id: 'other' };
void [absentProfile, profileGet, omittedProfile, missingName, profileBody];
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
