import type { AuthAccountActions, AuthSessionPort } from '@disconnect/contracts';

import { SessionController } from '../../features/auth/session-controller';
import { createApiClient } from '../api/client';
import { createAccountDataController } from '../query/account-controller';
import { readAuthConfig } from './config';
import { AuthUnavailableError } from './errors';
import { createAuthRuntime } from './supabase';

export type AppAuthProducer = Readonly<{
  auth: AuthSessionPort & AuthAccountActions & {
    start(): Promise<void>;
    dispose(): void;
    signIn(email: string, password: string): Promise<void>;
    retryBootstrap(): Promise<void>;
  };
  setForeground: (active: boolean) => void;
  canClearSession: boolean;
  nativeNamespace: string | null;
  getPrivateAccessHeld?: () => boolean;
}>;

function createDefaultAuthProducer(): AppAuthProducer {
  let config: ReturnType<typeof readAuthConfig> | null = null;
  try {
    config = readAuthConfig(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  } catch (error) {
    if (!(error instanceof AuthUnavailableError)) throw error;
  }
  const host = config ? new URL(config.url).hostname : '';
  const nativeNamespace = /^([a-z0-9_-]{1,64})\.supabase\.co$/.exec(host)?.[1] ?? null;
  const controller: SessionController = new SessionController(() => {
    if (!config) throw new AuthUnavailableError('configuration', false);
    return createAuthRuntime(config, controller.storageFailed);
  });
  return {
    auth: controller,
    nativeNamespace,
    canClearSession: Boolean(config),
    getPrivateAccessHeld: controller.getPrivateAccessHeld,
    setForeground: controller.setForeground,
  };
}

/** The account controller and API share the same selected Auth producer. */
export function createAppRuntime(producer: AppAuthProducer = createDefaultAuthProducer()) {
  const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL, auth: producer.auth });
  return { ...producer, api, controller: createAccountDataController(producer.auth, api) };
}
export type AppRuntime = ReturnType<typeof createAppRuntime>;
