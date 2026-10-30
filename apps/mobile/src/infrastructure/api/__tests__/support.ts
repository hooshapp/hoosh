import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { vi } from 'vitest';

import { ApiError, createApiClient, type ApiFetch } from '../client';
import { decodeIdentity } from '../decoders';

export const ACCOUNT_A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
export const ACCOUNT_B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
export const REQUEST_ID = 'a46e48ad-c742-4e18-b57d-2c9a56544945';
export const SYNTHETIC_TOKEN = 'RN03_TEST_ONLY_AUTH';
export const identity = (user_id = ACCOUNT_A) => ({ user_id, email: null });
export const signedIn = (
  user_id = ACCOUNT_A,
  sessionGeneration = 1,
  credentialStatus: 'ready' | 'refreshing' | 'unavailable' = 'ready',
): AuthSnapshot => ({
  status: 'signed_in',
  sessionGeneration,
  user: identity(user_id),
  credentialStatus,
});
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
export function makeAuth(initial = signedIn()) {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  const port: AuthSessionPort = {
    getSnapshot: vi.fn(() => snapshot),
    getAccessToken: vi.fn(async () => (snapshot.status === 'signed_in' ? SYNTHETIC_TOKEN : null)),
    revalidateSession: vi.fn(async () => {}),
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return vi.fn(() => {
        listeners.delete(listener);
      });
    }),
  };
  return {
    port,
    get listenerCount() {
      return listeners.size;
    },
    set(next: AuthSnapshot, notify = true) {
      snapshot = next;
      if (notify) for (const listener of [...listeners]) listener();
    },
  };
}
export function json(body: unknown = identity(), status = 200) {
  return Response.json(body, { status, headers: { 'X-Request-ID': REQUEST_ID } });
}
export function failure(status = 401, code = 'INVALID_TOKEN', details?: unknown) {
  return json(
    {
      error: {
        code,
        message: 'DO_NOT_EXPOSE_RAW_SERVER_COPY',
        retryable: status === 503 || status === 429,
        request_id: REQUEST_ID,
        ...(details === undefined ? {} : { details }),
      },
    },
    status,
  );
}
export function setup(options: Partial<Parameters<typeof createApiClient>[0]> = {}) {
  const auth = makeAuth();
  const fetcher = vi.fn<ApiFetch>().mockImplementation(async () => json());
  const api = createApiClient({
    baseUrl: 'https://api.example',
    auth: auth.port,
    fetcher,
    ...options,
  });
  const me = (signal?: AbortSignal) => api.request('/v1/me', { signal, decode: decodeIdentity });
  return { auth, fetcher, api, me };
}
export async function microtasks() {
  for (let count = 0; count < 24; count++) await Promise.resolve();
}

export async function apiFailure(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected an ApiError, but the request succeeded.');
}
