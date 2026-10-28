import { describe, expect, it, vi } from 'vitest';

import { ApiError, createApiClient, type ApiFetch } from './client';

describe('API integration boundary', () => {
  it('allows public liveness checks without an auth integration', async () => {
    const fetcher = vi.fn<ApiFetch>().mockResolvedValue(
      Response.json({ status: 'ok', service: 'disconnect-api' }),
    );
    const api = createApiClient({ baseUrl: 'http://localhost:8000', fetcher });
    await expect(api.health()).resolves.toEqual({ status: 'ok', service: 'disconnect-api' });
    const [, init] = fetcher.mock.calls[0];
    expect(new Headers(init?.headers).has('Authorization')).toBe(false);
  });

  it('does not send a protected request when no session exists', async () => {
    const fetcher = vi.fn<ApiFetch>();
    const api = createApiClient({ baseUrl: 'http://localhost:8000', fetcher });
    await expect(api.request('/v1/me')).rejects.toThrow('Sign-in is required');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('asks auth for the current token on each request', async () => {
    const fetcher = vi.fn<ApiFetch>().mockImplementation(async () => Response.json({}));
    const getAccessToken = vi.fn().mockResolvedValueOnce('first-token').mockResolvedValueOnce('refreshed-token');
    const api = createApiClient({ baseUrl: 'https://api.example', getAccessToken, fetcher });
    await api.request('/v1/me');
    await api.request('/v1/me');
    expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer first-token');
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer refreshed-token');
  });

  it('preserves HTTP failures for session recovery without exposing response content', async () => {
    const fetcher = vi.fn<ApiFetch>().mockResolvedValue(new Response('private details', { status: 401 }));
    const api = createApiClient({ baseUrl: 'https://api.example', fetcher });
    await expect(api.health()).rejects.toEqual(new ApiError(401));
  });

  it('rejects cross-origin paths before obtaining credentials or fetching', async () => {
    const fetcher = vi.fn<ApiFetch>();
    const getAccessToken = vi.fn().mockResolvedValue('token');
    const api = createApiClient({ baseUrl: 'https://api.example', fetcher, getAccessToken });
    await expect(api.request('//another.example/v1/me')).rejects.toThrow();
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
