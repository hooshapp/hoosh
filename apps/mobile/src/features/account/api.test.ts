import { describe, expect, it } from 'vitest';

import {
  ACCOUNT_B,
  failure,
  identity,
  json,
  setup,
} from '../../infrastructure/api/__tests__/support';
import { readIdentity } from './api';

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
