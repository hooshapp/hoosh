/** Compile-only generated-wire handoff. Never imported by the running application. */
import type {
  ApiErrorEnvelope,
  AuthIdentity,
  HealthResponse,
  MeResponse,
  ProfilePatch,
  ProfileResponse,
  ProfileSavedResponse,
  ProfileView,
  SettingsPatch,
  SettingsResponse,
  SettingsSavedResponse,
  SettingsView,
  paths,
} from '../src';

declare const identity: MeResponse;
const domainIdentity: AuthIdentity = identity;
const wireIdentity: MeResponse = domainIdentity;
const nullableEmail: MeResponse = { user_id: 'synthetic-uuid', email: null };
const health: HealthResponse = { status: 'ok', service: 'disconnect-api' };
void [wireIdentity, nullableEmail, health];

// @ts-expect-error Nullable email is required, never omitted.
const missingEmail: MeResponse = { user_id: 'synthetic-uuid' };
const privateClaim: MeResponse = {
  user_id: 'synthetic-uuid',
  email: null,
  // @ts-expect-error Tokens/internal claims are not public identity fields.
  access_token: 'not-a-token',
};
const absentProfile: ProfileResponse = { profile: null };
const nullableProfile: ProfileView = {
  user_id: 'synthetic-uuid',
  display_name: null,
  revision: 1,
  created_at: '2026-10-28T18:00:00Z',
  updated_at: '2026-10-28T18:00:00Z',
};
const presentProfile: ProfileResponse = { profile: nullableProfile };
const profileGet: paths['/v1/profile']['get']['responses'][200]['content']['application/json'] =
  presentProfile;
// @ts-expect-error Absent profile is an explicit null envelope, never omission.
const omittedProfile: ProfileResponse = {};
// @ts-expect-error Nullable display_name is a required property.
const missingName: ProfileView = { user_id: 'id', revision: 1, created_at: 'Z', updated_at: 'Z' };
const saveBody: ProfilePatch = { expected_revision: 0, display_name: null };
const rawPaddedBody: ProfilePatch = { expected_revision: 1, display_name: '  raw draft  ' };
const saved: ProfileSavedResponse = { profile: nullableProfile };
const patchBody: paths['/v1/profile']['patch']['requestBody']['content']['application/json'] =
  saveBody;
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

// Settings has one independent revision and requires at least one explicit section.
const settingsRead: SettingsResponse = { settings: null };
const clearActivities: SettingsPatch = { expected_revision: 0, activities: null };
const clearDraft: SettingsPatch = { expected_revision: 1, plan_draft: null };
const bothSections: SettingsPatch = { expected_revision: 1, activities: null, plan_draft: null };
const settingsPatchBody: paths['/v1/settings']['patch']['requestBody']['content']['application/json'] =
  clearDraft;
declare const storedSettings: SettingsView;
const settingsSaved: SettingsSavedResponse = { settings: storedSettings };
// @ts-expect-error An absent resource cannot be a saved settings success.
const settingsAbsentSave: SettingsSavedResponse = { settings: null };
// @ts-expect-error A settings patch requires at least one section.
const settingsRevisionOnly: SettingsPatch = { expected_revision: 0 };
// @ts-expect-error The generated settings patch must not degrade to unknown.
const settingsUnknown: SettingsPatch = 'not a settings object';
// @ts-expect-error Owner fields are not settings input.
const settingsOwner: SettingsPatch = { expected_revision: 0, activities: null, user_id: 'other' };
// @ts-expect-error Boolean revisions are not accepted.
const settingsBoolean: SettingsPatch = { expected_revision: true, plan_draft: null };
const unknownActivity: SettingsPatch = {
  expected_revision: 0,
  // @ts-expect-error Stored preferences have predefined stable IDs, not display labels.
  activities: { selected_activity_ids: ['Reading'], custom_text: null },
};
void [
  settingsRead,
  clearActivities,
  bothSections,
  settingsPatchBody,
  settingsSaved,
  settingsAbsentSave,
  settingsRevisionOnly,
  settingsUnknown,
  settingsOwner,
  settingsBoolean,
  unknownActivity,
];
