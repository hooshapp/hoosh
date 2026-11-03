import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { createContext, useContext } from 'react';
import { createApiClient, type ApiFetch } from '@/infrastructure/api/client';
import { safeRequestId, isRecord } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';

export const origin = 'http://127.0.0.1:8765';
/** Developer-only credential adapter; no refresh, storage or SDK/session claims. */
export async function connect(token: string, generation: number) {
  const response = await fetch(`${origin}/v1/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401 ? 'Token expired or invalid.' : 'API rejected verification.',
    );
  const identity: unknown = await response.json();
  if (
    !isRecord(identity) ||
    !safeRequestId(identity.user_id) ||
    !(identity.email === null || typeof identity.email === 'string')
  )
    throw new Error('Invalid identity.');
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
    const drop = init?.method === 'PATCH' && dropNextSave;
    if (drop) dropNextSave = false;
    const result = await fetch(url, init);
    // Deliver the real write, intentionally lose its response. Never retries a write.
    if (drop) throw new TypeError('RN07_DEVICE_QA_ONLY lost response');
    return result;
  };
  const api = createApiClient({ baseUrl: origin, auth, fetcher });
  const controller = createAccountDataController(auth, api);
  return {
    controller,
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
