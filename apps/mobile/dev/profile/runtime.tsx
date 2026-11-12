import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { createContext, useContext } from 'react';
import { createApiClient, type ApiFetch } from '@/infrastructure/api/client';
import { safeRequestId, isRecord } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { productNativePort } from '@/infrastructure/native/product-ports';
import type { NativeOwner } from '@/features/protection/native-owner-boundary';

export const origin = 'http://127.0.0.1:8765';
/** Developer-only credential adapter; no refresh, storage or SDK/session claims. */
export async function connect(
  token: string,
  generation: number,
  nativeQuests = false,
) {
  const response = await fetch(`${origin}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? 'Token expired or invalid.'
        : 'API rejected verification.',
    );
  const identity: unknown = await response.json();
  if (
    !isRecord(identity) ||
    !safeRequestId(identity.user_id) ||
    !(identity.email === null || typeof identity.email === 'string')
  )
    throw new Error('Invalid identity.');
  if (nativeQuests && !productNativePort)
    throw new Error('Quest device bridge is unavailable in this build.');
  const snapshot: AuthSnapshot = {
    status: 'signed_in',
    sessionGeneration: generation,
    credentialStatus: 'ready',
    user: {
      user_id: identity.user_id as string,
      email: identity.email as string | null,
    },
  };
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    getAccessToken: async () => token,
    revalidateSession: async () => {
      throw new Error('Reconnect with a current token.');
    },
  };
  let dropNextSave = false;
  const fetcher: ApiFetch = async (url, init) => {
    const drop =
      ['PATCH', 'PUT', 'DELETE'].includes(init?.method ?? 'GET') &&
      dropNextSave;
    if (drop) dropNextSave = false;
    const result = await fetch(url, init);
    // Deliver the real write, intentionally lose its response. Never retries a write.
    if (drop) throw new TypeError('RN07_DEVICE_QA_ONLY lost response');
    return result;
  };
  const api = createApiClient({ baseUrl: origin, auth, fetcher });
  const controller = createAccountDataController(auth, api);
  const questPort =
    nativeQuests && productNativePort
      ? new Proxy(productNativePort, {
          get(target, key) {
            const method = Reflect.get(target, key);
            if (key !== 'questApply')
              return typeof method === 'function'
                ? method.bind(target)
                : method;
            return async (...args: Parameters<typeof target.questApply>) => {
              try {
                return await target.questApply(...args);
              } catch (error: unknown) {
                const code =
                  error && typeof error === 'object' && 'code' in error
                    ? error.code
                    : null;
                console.info(
                  'RN09B_DEVICE_QA_ONLY native quest write rejected',
                  typeof code === 'string' && /^ERR_[A-Z0-9_]{1,80}$/.test(code)
                    ? code
                    : 'ERR_UNAVAILABLE',
                );
                throw error;
              }
            };
          },
        })
      : null;
  // Separate QA namespace; never claim another account or activate rules on connect.
  const nativeOwner: NativeOwner | null = questPort
    ? {
        owner: `qa-quest:${identity.user_id}`,
        generation,
        port: questPort,
      }
    : null;
  return {
    controller,
    nativeOwner,
    dropNext: () => {
      dropNextSave = true;
    },
  };
}
export type Runtime = Awaited<ReturnType<typeof connect>>;
export const RuntimeContext = createContext<{
  runtime: Runtime | null;
  install: (runtime: Runtime | null) => void;
}>({ runtime: null, install: () => {} });
export const useRuntime = () => useContext(RuntimeContext);
