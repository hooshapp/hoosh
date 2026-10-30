import { afterEach, describe, expect, it, vi } from 'vitest';
import examples from '../../../../../packages/contracts/fixtures/http-v1.json';
import { ApiError, createApiClient } from './client';
import { decodeIdentity } from './decoders';
import {
  ACCOUNT_A,
  REQUEST_ID,
  apiFailure,
  SYNTHETIC_TOKEN,
  failure,
  identity,
  json,
  setup,
} from './__tests__/support';

const decode = (value: unknown) => value;
afterEach(() => vi.restoreAllMocks());

describe('HTTP configuration and credential boundary', () => {
  it.each([
    undefined,
    null,
    '',
    'not a URL',
    'file:///secret',
    'https://user:secret@api.example',
    'https://api.example/prefix',
    'https://api.example?token=secret',
    'https://api.example#secret',
    ' https://api.example',
    'https://api.\nexample',
  ])('keeps invalid configuration unavailable without dispatching (%s)', async (baseUrl) => {
    const { api, fetcher, auth } = setup({ baseUrl });
    expect(api.configuration.status).toBe('unavailable');
    await expect(api.health()).rejects.toMatchObject({ kind: 'configuration' });
    expect(fetcher).not.toHaveBeenCalled();
    expect(auth.port.getAccessToken).not.toHaveBeenCalled();
  });
  it.each([0, -1, Infinity, NaN, 0.5, 2_147_483_648])(
    'rejects invalid timeout %s once at composition',
    async (timeoutMs) => {
      const { api, fetcher } = setup({ timeoutMs });
      expect(api.configuration).toEqual({ status: 'unavailable', reason: 'invalid_timeout' });
      await expect(api.health()).rejects.toMatchObject({ kind: 'configuration' });
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it('allows public health with explicit local HTTP and no Auth producer', async () => {
    const fetcher = vi.fn(async () => json({ status: 'ok', service: 'disconnect-api' }));
    const api = createApiClient({ baseUrl: 'http://127.0.0.1:8000/', fetcher });
    await expect(api.health()).resolves.toEqual({ status: 'ok', service: 'disconnect-api' });
    expect(fetcher.mock.calls[0]).toBeDefined();
    expect(Object.isFrozen(api.configuration)).toBe(true);
  });
  it('requires the full Auth port for protected work', async () => {
    const api = createApiClient({ baseUrl: 'https://api.example' });
    await expect(api.request('/v1/me', { decode })).rejects.toMatchObject({
      kind: 'configuration',
    });
  });
  it.each([
    'https://evil.example/v1/me',
    '//evil.example/v1/me',
    '///evil.example',
    '/\\evil.example',
    '/\t/evil.example',
    '/v1/me#hidden',
  ])('rejects origin/path escape %s before token lookup', async (path) => {
    const { api, fetcher, auth } = setup();
    await expect(api.request(path, { decode })).rejects.toMatchObject({ kind: 'configuration' });
    expect(fetcher).not.toHaveBeenCalled();
    expect(auth.port.getAccessToken).not.toHaveBeenCalled();
  });
  it('injects a fresh token per request and overrides caller credentials', async () => {
    const { api, auth, fetcher } = setup();
    vi.mocked(auth.port.getAccessToken)
      .mockResolvedValueOnce('old-token')
      .mockResolvedValueOnce('new-token');
    for (let index = 0; index < 2; index++)
      await api.request('/v1/me', {
        decode,
        headers: {
          Authorization: 'caller-token',
          Cookie: 'secret',
          Host: 'evil.example',
          'Proxy-Authorization': 'proxy-secret',
          'X-Request-ID': 'caller-id',
        },
      });
    expect(
      fetcher.mock.calls.map(([, init]) => new Headers(init?.headers).get('Authorization')),
    ).toEqual(['Bearer old-token', 'Bearer new-token']);
    const init = fetcher.mock.calls[0][1]!;
    expect(init).toMatchObject({
      redirect: 'error',
      credentials: 'omit',
      cache: 'no-store',
      method: 'GET',
    });
    for (const name of ['Cookie', 'Proxy-Authorization', 'Host', 'X-Request-ID'])
      expect(new Headers(init.headers).has(name)).toBe(false);
  });
  it('public requests strip caller Authorization and never touch Auth or its pause gate', async () => {
    const { api, fetcher, auth } = setup();
    await api.request('/public', {
      authenticated: false,
      decode,
      headers: { Authorization: SYNTHETIC_TOKEN },
    });
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).has('Authorization')).toBe(false);
    expect(auth.port.getAccessToken).not.toHaveBeenCalled();
  });
  it('encodes raw JSON and preserves whitespace and Unicode instead of normalizing a profile draft', async () => {
    const { api, fetcher } = setup();
    await api.request('/v1/profile', {
      method: 'patch',
      json: { expected_revision: 1, display_name: '  e\u0301 🦕  ' },
      decode,
    });
    const init = fetcher.mock.calls[0][1]!;
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({
      expected_revision: 1,
      display_name: '  e\u0301 🦕  ',
    });
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });
  it('rejects invalid JSON encoding and GET bodies before dispatch', async () => {
    const { api, fetcher } = setup();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    for (const json of [undefined, BigInt(1), cyclic])
      await expect(
        api.request('/v1/profile', { method: 'PATCH', json, decode }),
      ).rejects.toMatchObject({ kind: 'configuration' });
    await expect(api.request('/v1/me', { body: 'unexpected', decode })).rejects.toMatchObject({
      kind: 'configuration',
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('Response protocol and safe errors', () => {
  it('handles explicitly empty 204 without JSON parsing, but never treats it as an absent JSON profile', async () => {
    const { api, fetcher } = setup();
    const empty = new Response(null, { status: 204 });
    const parse = vi.spyOn(empty, 'json');
    fetcher.mockResolvedValueOnce(empty);
    await expect(
      api.request('/resource', { method: 'DELETE', response: 'empty' }),
    ).resolves.toBeUndefined();
    expect(parse).not.toHaveBeenCalled();
    fetcher.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api.request('/v1/profile', { decode })).rejects.toMatchObject({
      kind: 'invalid_response',
      status: 204,
    });
  });
  it.each(['<html>private stack jwt</html>', '{', ''])(
    'rejects malformed success JSON safely',
    async (body) => {
      const { me, fetcher } = setup();
      fetcher.mockResolvedValueOnce(
        new Response(body, { headers: { 'X-Request-ID': REQUEST_ID } }),
      );
      const error = await apiFailure(me());
      expect(error).toMatchObject({ kind: 'invalid_response', requestId: REQUEST_ID });
      expect(String(error)).not.toContain(body || 'jwt');
    },
  );
  it.each([
    {},
    { user_id: ACCOUNT_A },
    { user_id: ACCOUNT_A, email: 3 },
    { user_id: 'other', email: null },
  ])('rejects incompatible identity fields or a different owner (%j)', async (body) => {
    const { me, fetcher } = setup();
    fetcher.mockResolvedValueOnce(json(body));
    await expect(me()).rejects.toMatchObject({ kind: 'invalid_response' });
  });
  it('accepts canonical fixture identities, including explicit null email', async () => {
    const { api, fetcher } = setup();
    for (const example of examples.examples.filter((example) =>
      example.case.startsWith('identity'),
    )) {
      fetcher.mockResolvedValueOnce(json(example.response.body));
      await expect(api.request('/v1/me', { decode: decodeIdentity })).resolves.toEqual(
        example.response.body,
      );
    }
  });
  const errorExamples = examples.examples.filter((example) => example.response.status >= 400);
  it.each(errorExamples)('validates canonical envelope: $case', async (example) => {
    const { api, fetcher, auth } = setup();
    fetcher.mockResolvedValueOnce(json(example.response.body, example.response.status));
    const error = await apiFailure(api.request('/contract', { authenticated: false, decode }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: example.response.status, requestId: REQUEST_ID });
    expect(error.kind).not.toBe('invalid_response');
    expect(JSON.stringify(error)).not.toContain('message');
    expect(auth.port.revalidateSession).not.toHaveBeenCalled();
  });
  it.each([
    [401, 'INVALID_TOKEN', 'unauthorized'],
    [403, 'FORBIDDEN', 'forbidden'],
    [409, 'PROFILE_CONFLICT', 'conflict'],
    [422, 'VALIDATION_ERROR', 'validation'],
    [429, 'FUTURE_LIMIT', 'rate_limited'],
    [503, 'DEPENDENCY_UNAVAILABLE', 'unavailable'],
  ] as const)('classifies HTTP %s without server copy leakage', async (status, code, kind) => {
    const { api, fetcher } = setup();
    const details =
      status === 409
        ? { current_revision: 2, password: SYNTHETIC_TOKEN }
        : status === 422
          ? { fields: [{ field: 'display_name', code: 'blank', input: SYNTHETIC_TOKEN }] }
          : { stack: SYNTHETIC_TOKEN };
    fetcher.mockResolvedValueOnce(failure(status, code, details));
    const error = await apiFailure(api.request('/error', { authenticated: false, decode }));
    expect(error).toMatchObject({ kind, status, requestId: REQUEST_ID });
    expect(JSON.stringify(error) + String(error)).not.toContain(SYNTHETIC_TOKEN);
    expect(String(error)).not.toContain('DO_NOT_EXPOSE');
    if (status === 409) expect(error.details).toEqual({ current_revision: 2 });
    if (status === 422)
      expect(error.details).toEqual({ fields: [{ field: 'display_name', code: 'blank' }] });
  });
  it.each(['-1', '1.5', 'Infinity', 'later', ''])(
    'ignores invalid Retry-After %s',
    async (retry) => {
      const { api, fetcher } = setup();
      const response = failure(429, 'FUTURE_LIMIT');
      response.headers.set('Retry-After', retry);
      fetcher.mockResolvedValueOnce(response);
      await expect(api.request('/limit', { authenticated: false, decode })).rejects.toMatchObject({
        kind: 'rate_limited',
        retryAfterMs: undefined,
      });
    },
  );
  it.each([
    ['2', 2000],
    ['9999999999', undefined],
    ['Thu, 29 Oct 2026 12:00:30 GMT', 30000],
  ] as const)('bounds Retry-After %s without retrying transport', async (retry, delay) => {
    const { api, fetcher } = setup({ now: () => Date.parse('2026-10-29T12:00:00Z') });
    const response = failure(429, 'FUTURE_LIMIT');
    response.headers.set('Retry-After', retry);
    fetcher.mockResolvedValueOnce(response);
    await expect(api.request('/limit', { authenticated: false, decode })).rejects.toMatchObject({
      retryAfterMs: delay,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('rejects HTML errors, unsafe request IDs, wrong code/status and mismatched correlation IDs', async () => {
    const { api, fetcher } = setup();
    for (const response of [
      new Response('<html>private JWT password</html>', {
        status: 503,
        headers: { 'X-Request-ID': SYNTHETIC_TOKEN },
      }),
      failure(401, 'PROFILE_CONFLICT', { current_revision: 2 }),
      json(
        {
          error: {
            code: 'FORBIDDEN',
            message: SYNTHETIC_TOKEN,
            retryable: false,
            request_id: 'c3f11b37-139e-4c09-b5d8-808c66100a10',
          },
        },
        403,
      ),
    ]) {
      fetcher.mockResolvedValueOnce(response);
      const error = await apiFailure(api.request('/error', { authenticated: false, decode }));
      expect(error.kind).toBe('invalid_response');
      expect(JSON.stringify(error) + String(error)).not.toContain(SYNTHETIC_TOKEN);
    }
  });
  it('rejects redirects and nonconforming cross-origin responses', async () => {
    const { me, fetcher } = setup();
    const response = json(identity());
    Object.defineProperty(response, 'url', { value: 'https://evil.example/private?token=secret' });
    fetcher.mockResolvedValueOnce(response);
    await expect(me()).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});
