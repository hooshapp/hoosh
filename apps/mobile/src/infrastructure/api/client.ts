import type { AccessTokenProvider, HealthResponse } from '@disconnect/contracts';

export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`API request failed (${status}).`);
    this.name = 'ApiError';
  }
}

type RequestOptions = Omit<RequestInit, 'headers'> & {
  authenticated?: boolean;
  headers?: HeadersInit;
};

export type ApiFetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Auth supplies fresh tokens; this client neither stores nor refreshes them. */
export function createApiClient({
  baseUrl,
  getAccessToken,
  fetcher = fetch,
}: {
  baseUrl: string;
  getAccessToken?: AccessTokenProvider;
  fetcher?: ApiFetch;
}) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('The API URL must use HTTP or HTTPS.');
  }

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error('API paths must start with a single slash.');
    }
    const url = new URL(path, base);
    if (url.origin !== base.origin) throw new Error('API paths must stay on the configured origin.');

    const { authenticated = true, headers: suppliedHeaders, ...init } = options;
    const headers = new Headers(suppliedHeaders);
    headers.set('Accept', 'application/json');
    if (authenticated) {
      const token = await getAccessToken?.();
      if (!token) throw new Error('Sign-in is required for this request.');
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetcher(url.toString(), { ...init, headers });
    if (!response.ok) throw new ApiError(response.status);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  return {
    request,
    health: () => request<HealthResponse>('/healthz', { authenticated: false }),
  };
}
