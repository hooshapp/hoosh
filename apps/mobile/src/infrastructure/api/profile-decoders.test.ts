import { describe, expect, it } from 'vitest';
import { decodeProfileResponse, decodeProfileSavedResponse } from './decoders';
import { ACCOUNT_A, ACCOUNT_B } from './__tests__/support';

const context = { account: { user_id: ACCOUNT_A, sessionGeneration: 1 } };
const profile = {
  user_id: ACCOUNT_A,
  display_name: 'Hello 🦖',
  revision: 1,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00.123456Z',
};
describe('profile wire boundary', () => {
  it('distinguishes absence, explicit null, and a saved profile', () => {
    expect(decodeProfileResponse({ profile: null }, context)).toEqual({
      profile: null,
    });
    expect(
      decodeProfileSavedResponse({ profile: { ...profile, display_name: null } }, context).profile
        .display_name,
    ).toBeNull();
    expect(decodeProfileSavedResponse({ profile }, context)).toEqual({
      profile,
    });
    expect(() => decodeProfileSavedResponse({ profile: null }, context)).toThrow();
  });
  it.each([
    undefined,
    {},
    { profile: undefined },
    { profile: [] },
    ...[
      { user_id: ACCOUNT_B },
      { revision: 0 },
      { revision: 1.5 },
      { revision: Number.MAX_SAFE_INTEGER + 1 },
      { display_name: '' },
      { display_name: 'a'.repeat(81) },
      { display_name: '\uD800' },
      { display_name: 'a\u0000' },
      { display_name: 12 },
      { updated_at: 'not a date' },
      { updated_at: '2026-11-02T12:00:00+00:00' },
      { updated_at: '2026-11-01T12:00:00Z' },
      { updated_at: '2026-02-31T12:00:00Z' },
    ].map((patch) => ({ profile: { ...profile, ...patch } })),
  ])('rejects malformed or different-owner payload %#', (value) => {
    expect(() => decodeProfileResponse(value, context)).toThrow();
  });
  it('counts code points and projects approved fields without client normalization', () => {
    const value = {
      ...profile,
      display_name: '🦖'.repeat(80),
      future_field: 'ignore',
    };
    expect(decodeProfileSavedResponse({ profile: value }, context).profile).toEqual({
      ...profile,
      display_name: value.display_name,
    });
  });
});
