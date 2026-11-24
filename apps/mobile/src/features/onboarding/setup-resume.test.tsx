import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSessionPort } from '@disconnect/contracts';
import { act, screen, waitFor } from '@testing-library/react-native';
import { Redirect, router, Stack, Tabs } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { Text } from 'react-native';
import { AppRuntimeContext } from '@/features/account/app-runtime-context';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import type { JsonRequestOptions } from '@/infrastructure/api/types';
import { ApiError } from '@/infrastructure/api/errors';
import type { OnboardingProgress } from './progress-repository';
import { SetupEntryGate } from './setup-resume';
const UID = '00000000-0000-4000-8000-000000000001';
const homeRendered = jest.fn();
beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); });
async function mount({ missing = true, fail = false, progress, wait, apiConfigured = true }: { missing?: boolean; fail?: boolean; progress?: OnboardingProgress; wait?: Promise<void>; apiConfigured?: boolean } = {}) {
  if (progress) await AsyncStorage.setItem(`hoosh.setup.fixture.${UID}`, JSON.stringify(progress));
  const snapshot = { status: 'signed_in' as const, sessionGeneration: 1, credentialStatus: 'ready' as const, user: { user_id: UID, email: null } };
  const auth = { getSnapshot: () => snapshot, subscribe: () => () => {}, getAccessToken: jest.fn(), revalidateSession: jest.fn() } satisfies AuthSessionPort;
  const api = {
    configuration: apiConfigured ? { status: 'ready', origin: 'http://localhost', timeoutMs: 15000 } : { status: 'unavailable', reason: 'missing_url' },
    getRecoveryState: () => 'ready', recoverSession: jest.fn(), health: jest.fn(),
    request: jest.fn(async (path: string, options: JsonRequestOptions<unknown>) => {
      if (wait) await wait;
      if (fail) throw new ApiError('unavailable', { retryable: false });
      const result = path === '/v1/me' ? { user_id: UID, email: null } : { settings: missing ? null : {
        user_id: UID, revision: 1, activities: { selected_activity_ids: ['reading'], custom_text: null }, plan_draft: null,
        created_at: '2026-11-24T00:00:00Z', updated_at: '2026-11-24T00:00:00Z' } };
      return options.decode(result, { account: { user_id: UID, sessionGeneration: 1 } });
    }),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  function Root() { return <AppRuntimeContext.Provider value={{ nativeNamespace: 'fixture' } as AppRuntime}>
    <AccountDataProvider controller={controller}><Stack screenOptions={{ headerShown: false }} /></AccountDataProvider>
  </AppRuntimeContext.Provider>; }
  function TabLayout() { return <SetupEntryGate><Tabs screenOptions={{ headerShown: false }}><Tabs.Screen name="index" /></Tabs></SetupEntryGate>; }
  function Home() { homeRendered(); return <Text>Actual dashboard</Text>; }
  await renderRouter({ _layout: Root, 'after-oauth': () => <Redirect href="/(tabs)" />,
    '(tabs)/_layout': TabLayout, '(tabs)/index': Home,
    '(onboarding)/welcome': () => <Text>Questionnaire destination</Text> }, { initialUrl: '/after-oauth' });
  return { controller, api };
}
it('a fresh OAuth entry redirects to onboarding before Dashboard can render', async () => {
  await mount();
  await screen.findByText('Questionnaire destination');
  expect(screen).toHavePathname('/welcome');
  expect(homeRendered).not.toHaveBeenCalled();
});
it('an offline or failed API check never grants access to Dashboard', async () => {
  await mount({ fail: true });
  await screen.findByText('Hoosh couldn’t verify your saved setup. Connect and try again.');
  expect(homeRendered).not.toHaveBeenCalled();
});
it('holds the dashboard while verification is pending, then opens questionnaires for a new account', async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await mount({ wait: pending });
  expect(homeRendered).not.toHaveBeenCalled();
  await act(async () => finish());
  await screen.findByText('Questionnaire destination');
  expect(homeRendered).not.toHaveBeenCalled();
});
it('a repeated callback redirect to the real tabs route cannot bypass required onboarding', async () => {
  await mount();
  await screen.findByText('Questionnaire destination');
  await act(async () => router.replace('/(tabs)'));
  await waitFor(() => expect(screen).toHavePathname('/welcome'));
  expect(homeRendered).not.toHaveBeenCalled();
});
it('an established account remains on Dashboard', async () => {
  await mount({ missing: false });
  await screen.findByText('Actual dashboard');
});
it('an incomplete plan resumes even when account settings already exist', async () => {
  await mount({ missing: false, progress: { version: 1, step: 'plan' } });
  await screen.findByText('Questionnaire destination');
  expect(homeRendered).not.toHaveBeenCalled();
});
it('a completed account can open Dashboard', async () => {
  await mount({ missing: false, progress: { version: 1, step: 'complete' } });
  await screen.findByText('Actual dashboard');
});
it('explicit Skip is honored for the active account scope', async () => {
  const app = await mount();
  await screen.findByText('Questionnaire destination');
  const scope = app.controller.getSnapshot().scope!;
  scope.client.setQueryData(scope.key('setup-resume-dismissed'), true);
  await act(async () => router.replace('/(tabs)'));
  await screen.findByText('Actual dashboard');
});
it('unreadable local progress blocks Dashboard rather than treating the account as complete', async () => {
  await AsyncStorage.setItem(`hoosh.setup.fixture.${UID}`, 'not-json');
  await mount();
  await screen.findByText('Hoosh couldn’t verify your saved setup. Connect and try again.');
  expect(homeRendered).not.toHaveBeenCalled();
});

it('a missing API URL blocks Dashboard without calling any substitute API', async () => {
  const app = await mount({ apiConfigured: false });
  await screen.findByText('Hoosh couldn’t verify your saved setup. Connect and try again.');
  expect(homeRendered).not.toHaveBeenCalled();
  expect(app.api.request).not.toHaveBeenCalled();
});
