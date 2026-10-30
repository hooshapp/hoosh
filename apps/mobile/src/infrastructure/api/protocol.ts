import { ApiError, safeRequestId } from './errors';
import type { RequestOperation } from './operation';
import type { RequestOptions } from './types';

/** Resolve transport options once. Credential headers are always owned by this boundary. */
export function prepareRequest<T>(options: RequestOptions<T>) {
  try {
    if (options.method !== undefined && typeof options.method !== 'string') throw new Error();
    const method = (options.method ?? 'GET').toUpperCase();
    if (!['GET', 'HEAD', 'OPTIONS', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(method))
      throw new Error();
    const headers = new Headers(options.headers);
    for (const name of ['Authorization', 'Proxy-Authorization', 'Cookie', 'Host', 'X-Request-ID'])
      headers.delete(name);
    headers.set('Accept', 'application/json');
    let body = options.body;
    if (Object.hasOwn(options, 'json')) {
      if (body !== undefined) throw new Error();
      body = JSON.stringify(options.json);
      if (body === undefined) throw new Error();
      headers.set('Content-Type', 'application/json');
    }
    if (['GET', 'HEAD'].includes(method) && body !== undefined) throw new Error();
    return { method, headers, body, mutation: !['GET', 'HEAD', 'OPTIONS'].includes(method) };
  } catch {
    throw new ApiError('configuration');
  }
}

export function validateResponseOrigin(response: Response, origin: string) {
  try {
    if (response.redirected || (response.status >= 300 && response.status < 400)) throw new Error();
    if (response.url) {
      const final = new URL(response.url);
      if (final.origin !== origin || final.username || final.password) throw new Error();
    }
  } catch {
    throw new ApiError('invalid_response', { status: response.status });
  }
}

export async function readJson(response: Response, operation: RequestOperation): Promise<unknown> {
  const metadata = {
    status: response.status,
    requestId: safeRequestId(response.headers.get('X-Request-ID')),
  };
  const mediaType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
  if (
    mediaType !== 'application/json' &&
    !(mediaType?.startsWith('application/') && mediaType.endsWith('+json'))
  )
    throw new ApiError('invalid_response', metadata);
  try {
    return await operation.run(() => response.json());
  } catch (error) {
    operation.check();
    throw new ApiError(error instanceof SyntaxError ? 'invalid_response' : 'network', metadata);
  }
}
