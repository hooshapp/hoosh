import { ApiError } from './errors';

export const DEFAULT_TIMEOUT_MS = 15_000;
export type ApiConfiguration =
  | { status: 'ready'; origin: string; timeoutMs: number }
  | { status: 'unavailable'; reason: 'missing_url' | 'invalid_url' | 'invalid_timeout' };

/** Validate once when composing an environment's client; no fallback service/origin. */
export function parseApiConfiguration(
  baseUrl: string | null | undefined,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): ApiConfiguration {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647)
    return { status: 'unavailable', reason: 'invalid_timeout' };
  if (!baseUrl) return { status: 'unavailable', reason: 'missing_url' };
  try {
    const base = new URL(baseUrl);
    if (
      /[\u0000-\u0020\u007f]/.test(baseUrl) ||
      !['http:', 'https:'].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== '/'
    )
      return { status: 'unavailable', reason: 'invalid_url' };
    return { status: 'ready', origin: base.origin, timeoutMs };
  } catch {
    return { status: 'unavailable', reason: 'invalid_url' };
  }
}
export function resolveApiPath(path: string, origin: string) {
  try {
    if (!path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(path))
      throw new Error();
    const url = new URL(path, origin);
    if (url.origin !== origin || url.hash) throw new Error();
    return url.toString();
  } catch {
    throw new ApiError('configuration');
  }
}
