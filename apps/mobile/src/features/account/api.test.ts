import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_A,
  ACCOUNT_B,
  failure,
  identity,
  json,
  setup,
} from '../../infrastructure/api/__tests__/support';
import { readIdentity, readProfile, saveProfile } from './api';

function read(app: ReturnType<typeof setup>, signal = new AbortController().signal) {
  const snapshot = app.auth.port.getSnapshot();
  if (snapshot.status !== 'signed_in') throw new Error('Test requires signed-in fixture');
  return readIdentity({
    api: app.api,
    signal,
    account: { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration },
  });
}
describe('identity consumer over the real HTTP boundary', () => {
  it.each([null, 'fixture@example.test'])(
    'reads verified identity with email %j and forwards its signal',
    async (email) => {
      const app = setup();
      app.fetcher.mockResolvedValue(json({ ...identity(), email }));
      await expect(read(app)).resolves.toEqual({ ...identity(), email });
      const [url, init] = app.fetcher.mock.calls[0];
      expect(url).toBe('https://api.example/v1/me');
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      expect(app.auth.port.getAccessToken).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects a different backend subject instead of returning it', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(json(identity(ACCOUNT_B)));
    await expect(read(app)).rejects.toMatchObject({ kind: 'invalid_response' });
  });
  it('never accepts an SDK email or health response as backend identity', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(json({ status: 'ok', service: 'disconnect-api' }));
    await expect(read(app)).rejects.toMatchObject({ kind: 'invalid_response' });
  });
  it('forwards cancellation without anonymous fallback', async () => {
    const app = setup();
    const abort = new AbortController();
    abort.abort();
    await expect(read(app, abort.signal)).rejects.toMatchObject({ kind: 'cancelled' });
    expect(app.fetcher).not.toHaveBeenCalled();
  });
  it('preserves a 503 as availability failure without signing out', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(failure(503, 'DEPENDENCY_UNAVAILABLE'));
    await expect(read(app)).rejects.toMatchObject({ kind: 'unavailable', status: 503 });
    expect(app.auth.port.getSnapshot().status).toBe('signed_in');
    expect(app.auth.port.revalidateSession).not.toHaveBeenCalled();
  });
});

const profile = {
  user_id: ACCOUNT_A,
  revision: 2,
  display_name: 'Canonical 🦖',
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:01:00Z',
};
function operation(app: ReturnType<typeof setup>) {
  return {
    api: app.api,
    signal: new AbortController().signal,
    account: { user_id: ACCOUNT_A, sessionGeneration: 1 },
  };
}
describe('profile consumer over the real HTTP boundary', () => {
  it('reads an absent row without creating it', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(json({ profile: null }));
    await expect(readProfile(operation(app))).resolves.toEqual({ profile: null });
    expect(app.fetcher).toHaveBeenCalledTimes(1);
    expect(app.fetcher.mock.calls[0][0]).toBe('https://api.example/v1/profile');
  });
  it('sends only approved raw fields and returns the server canonical value', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(json({ profile }));
    await expect(
      saveProfile({ expected_revision: 1, display_name: '  Raw  ' }, operation(app)),
    ).resolves.toEqual({ profile });
    const [url, init] = app.fetcher.mock.calls[0];
    expect(url).toBe('https://api.example/v1/profile');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({
      expected_revision: 1,
      display_name: '  Raw  ',
    });
  });
  it('treats a stale success revision as uncertain rather than accepting an impossible save', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(json({ profile }));
    await expect(
      saveProfile({ expected_revision: 2, display_name: 'Raw' }, operation(app)),
    ).rejects.toMatchObject({ kind: 'invalid_response', requestMayHaveCommitted: true });
    expect(app.fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not retry a profile conflict and preserves safe revision metadata', async () => {
    const app = setup();
    app.fetcher.mockResolvedValue(failure(409, 'PROFILE_CONFLICT', { current_revision: 5 }));
    await expect(
      saveProfile({ expected_revision: 1, display_name: null }, operation(app)),
    ).rejects.toMatchObject({
      kind: 'conflict',
      details: { current_revision: 5 },
      requestMayHaveCommitted: false,
    });
    expect(app.fetcher).toHaveBeenCalledTimes(1);
  });
});
