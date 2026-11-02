/** Compile-only generated-wire handoff. Never imported by the running application. */
import type { ApiErrorEnvelope, AuthIdentity, HealthResponse, MeResponse, paths } from '../src';

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
// @ts-expect-error Only implemented routes are generated; M2 profiles are not exposed yet.
type FutureProfile = paths['/v1/profile'];
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
