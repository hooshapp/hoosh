import { parseApiConfiguration, resolveApiPath } from './config';
import { decodeHealth, decodeIdentity } from './decoders';
import { ApiError, httpError, safeRequestId } from './errors';
import { createRequestOperation, discardResponse } from './operation';
import { prepareRequest, readJson, validateResponseOrigin } from './protocol';
import { createSessionScope } from './session-scope';
import { defaultApiFetch } from './transport';
import type {
  ApiClientOptions,
  EmptyRequestOptions,
  JsonRequestOptions,
  RequestOptions,
} from './types';

export { ApiError } from './errors';
export type { ApiFetch, ResponseDecoder } from './types';

/** One client per environment/Auth producer. Auth alone refreshes or invalidates its session. */
export function createApiClient({
  baseUrl,
  auth,
  fetcher = defaultApiFetch,
  timeoutMs,
  now = Date.now,
}: ApiClientOptions) {
  const configuration = Object.freeze(parseApiConfiguration(baseUrl, timeoutMs));
  const sessions = createSessionScope(auth);

  async function execute<T>(
    path: string,
    options: RequestOptions<T>,
    explicit = false,
  ): Promise<T | void> {
    if (configuration.status !== 'ready') throw new ApiError('configuration');
    const url = resolveApiPath(path, configuration.origin);
    const operation = createRequestOperation(configuration.timeoutMs, options.signal, now);
    let session: ReturnType<typeof sessions.open> | undefined;
    let response: Response | undefined;
    let dispatched = false;
    const authenticated = options.authenticated !== false;
    let mutation = false;
    try {
      operation.check();
      const { method, headers, body, mutation: isMutation } = prepareRequest(options);
      mutation = isMutation;
      if (authenticated) session = sessions.open(operation, explicit);
      if (explicit) await session!.revalidate();
      for (let attempt = 0; attempt < 2; attempt++) {
        operation.check();
        const token = session ? await session.token() : null;
        if (token) headers.set('Authorization', `Bearer ${token}`);
        session?.assertRecoveryAllowed();
        operation.check();
        response = await operation.run(async () => {
          session?.assertRecoveryAllowed();
          dispatched = true;
          const result = await fetcher(url, {
            method,
            headers: new Headers(headers),
            body,
            signal: operation.signal,
            redirect: 'error',
            credentials: 'omit',
            cache: 'no-store',
          });
          if (operation.signal.aborted) discardResponse(result);
          return result;
        });
        session?.assertCurrent();
        validateResponseOrigin(response, configuration.origin);
        if (response.status === 401 && session && (explicit || attempt === 1)) session.pause();
        if (response.status === 401 && session && method === 'GET' && !explicit && attempt === 0) {
          session.assertRecoveryAllowed();
          discardResponse(response);
          await session.revalidate();
          session.assertRecoveryAllowed();
          continue;
        }
        if (!response.ok) {
          const errorBody = await readJson(response, operation);
          throw httpError(response, errorBody, now(), session?.isPaused() ?? false);
        }
        let decoded: T | undefined;
        if (response.status === 204) {
          if (options.response !== 'empty') throw new ApiError('invalid_response', { status: 204 });
        } else {
          if (options.response === 'empty')
            throw new ApiError('invalid_response', { status: response.status });
          const requestId = safeRequestId(response.headers.get('X-Request-ID'));
          const value = await readJson(response, operation);
          session?.assertCurrent();
          try {
            decoded = await operation.run(() =>
              options.decode(value, { account: session?.account ?? null, requestId }),
            );
          } catch {
            operation.check();
            session?.assertCurrent();
            throw new ApiError('invalid_response', { status: response.status, requestId });
          }
        }
        operation.check();
        session?.assertCurrent();
        if (explicit) session!.recovered();
        return decoded;
      }
      throw new ApiError('unauthorized', { status: 401 });
    } catch (error) {
      // Preserve cancellation/deadline precedence without leaking external exception messages.
      let safe: ApiError;
      try {
        operation.check();
        session?.assertCurrent();
        safe = error instanceof ApiError ? error : new ApiError('network');
      } catch (stopped) {
        safe = stopped instanceof ApiError ? stopped : new ApiError('unavailable');
      }
      if (safe.status === 401 && session?.isPaused())
        safe = new ApiError(safe.kind, { ...safe, recoveryPaused: true });
      if (
        mutation &&
        dispatched &&
        (['network', 'timeout', 'cancelled', 'invalid_response'].includes(safe.kind) ||
          (safe.status !== undefined && safe.status >= 500))
      )
        throw new ApiError(safe.kind, { ...safe, requestMayHaveCommitted: true });
      throw safe;
    } finally {
      operation.dispose();
      session?.dispose();
      if (response) discardResponse(response);
    }
  }

  function request<T>(path: string, options: JsonRequestOptions<T>): Promise<T>;
  function request(path: string, options: EmptyRequestOptions): Promise<void>;
  function request<T>(path: string, options: RequestOptions<T>) {
    return execute(path, options);
  }
  return {
    configuration,
    request,
    getRecoveryState: sessions.getRecoveryState,
    health: (signal?: AbortSignal) =>
      request('/healthz', { authenticated: false, signal, decode: decodeHealth }),
    /** Explicit user action only: one Auth revalidation + one same-generation identity GET. */
    recoverSession: async (signal?: AbortSignal) => {
      const identity = await execute('/v1/me', { signal, decode: decodeIdentity }, true);
      if (!identity) throw new ApiError('invalid_response');
      return identity;
    },
  };
}
