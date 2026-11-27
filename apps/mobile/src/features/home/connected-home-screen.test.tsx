import type { AuthSessionPort, AuthSnapshot, SettingsView } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActionSheetIOS, Text } from 'react-native';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ConnectedSettingsScreen } from '@/features/settings/connected-settings-screen';
import * as nativeOwner from '@/features/protection/native-owner-boundary';
import { ConnectedHomeScreen } from './connected-home-screen';

jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({ confirmation: null, exit: (go: () => void) => go() }),
}));
const A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
const B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
const signedIn = (user_id = A, sessionGeneration = 1): AuthSnapshot => ({
  status: 'signed_in',
  sessionGeneration,
  user: { user_id, email: null },
  credentialStatus: 'ready',
});
const row = (revision = 1, user_id = A): SettingsView => ({
  user_id,
  revision,
  activities: { selected_activity_ids: ['reading'], custom_text: null },
  plan_draft: {
    weekdays: [0],
    hours: { start_local: '23:00', end_local: null, next_day: true },
    timezone_id: 'US/Eastern',
    session_count: null,
    session_minutes: 30,
  },
  created_at: '2026-11-03T12:00:00Z',
  updated_at: '2026-11-03T12:00:00Z',
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
function setup(initial: SettingsView | null = row()) {
  let snapshot = signedIn();
  let stored = initial;
  let paused = false;
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
  const get = jest.fn().mockImplementation(async () => ({ settings: stored }));
  const patch = jest.fn().mockImplementation(async (input) => {
    stored = {
      ...(stored ?? row()),
      revision: input.expected_revision + 1,
      ...(input.personalization ? { personalization: input.personalization } : {}),
      activities: input.activities ??
        stored?.activities ?? { selected_activity_ids: [], custom_text: null },
      plan_draft: Object.hasOwn(input, 'plan_draft')
        ? input.plan_draft
        : (stored?.plan_draft ?? null),
    };
    return { settings: stored };
  });
  const recoverSession = jest.fn().mockImplementation(async () => {
    paused = false;
    return { user_id: A, email: null };
  });
  const api = {
    configuration: { status: 'ready', origin: 'http://localhost', timeoutMs: 15000 },
    getRecoveryState: () => (paused ? 'paused' : 'ready'),
    recoverSession,
    health: jest.fn(),
    request: jest.fn(async (path, options) => {
      const account =
        snapshot.status === 'signed_in'
          ? { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration }
          : null;
      return options.decode(
        path === '/v1/settings'
          ? await (options.method === 'PATCH' ? patch(options.json) : get())
          : path === '/v1/me'
            ? { user_id: account?.user_id, email: null }
            : { profile: null },
        { account },
      );
    }),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    get,
    patch,
    recoverSession,
    controller,
    set(next: AuthSnapshot) {
      snapshot = next;
      for (const fn of listeners) fn();
    },
    pause() {
      paused = true;
      for (const fn of listeners) fn();
    },
    async refresh() {
      await act(async () => {
        const scope = controller.getSnapshot().scope!;
        await scope.client.invalidateQueries({ queryKey: scope.key('settings') });
      });
    },
  };
}

afterEach(() => onlineManager.setOnline(true));
test('ordinary Home has no testing controls, draft panels or native management buttons', async () => {
  const app = setup();
  await render(<AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}><ConnectedHomeScreen /></AccountDataProvider>);
  expect(screen.queryByTestId('home-preferences')).toBeNull();
  expect(screen.queryByText('Restart questionnaires')).toBeNull();
  expect(screen.queryByText('Set up Hoosh')).toBeNull();
  expect(screen.queryByText('Refresh rewards')).toBeNull();
  expect(screen.queryByText('Manage app schedule')).toBeNull();
  expect(app.patch).not.toHaveBeenCalled();
});
test('Settings retains account preference access without onboarding replay shortcuts', async () => {
  const app = setup();
  await render(<AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}><ConnectedSettingsScreen /></AccountDataProvider>);
  await screen.findByText('Redirect Me To');
  expect(screen.queryByText('Restart questionnaires')).toBeNull();
  expect(screen.queryByText('Set up Hoosh')).toBeNull();
  expect(screen.getByText('Nudge Tone')).toBeTruthy();
  expect(app.patch).not.toHaveBeenCalled();
});

test('the Apple Calendar arrow can connect Reminders independently', async () => {
  const app = setup();
  const calendarNudgeSettings = jest.fn(async () => false);
  const remindersNudgeSettings = jest.fn(async (enabled?: boolean) => enabled === true);
  const device = jest.spyOn(nativeOwner, 'useIOSSelectionDevice').mockReturnValue({
    owner: A,
    generation: 1,
    selection: {
      selectionBegin: jest.fn(),
      selectionPick: jest.fn(),
      selectionCommit: jest.fn(),
      selectionRelease: jest.fn(),
    },
    readSelection: jest.fn(),
    readStatus: jest.fn(),
    requestAuthorization: jest.fn(),
    stop: jest.fn(),
    subscribe: jest.fn(),
    calendarNudgeSettings, remindersNudgeSettings,
  });
  const sheet = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((_options, select) => select(1));
  try {
    await render(<AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}><ConnectedSettingsScreen /></AccountDataProvider>);
    await fireEvent.press(await screen.findByRole('button', { name: /Connect Apple Calendar.*Connect Calendar or Reminders/ }));
    expect(sheet).toHaveBeenCalledWith(expect.objectContaining({
      options: ['Connect Apple Calendar', 'Connect Apple Reminders', 'Cancel'],
    }), expect.any(Function));
    await screen.findByRole('button', { name: /Connect Apple Calendar.*Reminders connected/ });
    expect(remindersNudgeSettings).toHaveBeenCalledWith(true);
    expect(calendarNudgeSettings).not.toHaveBeenCalledWith(true);
  } finally {
    device.mockRestore();
    sheet.mockRestore();
  }
});

test('tone Done saves the account preference while leaving the plan unchanged', async () => {
  const app = setup();
  await render(<AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}><ConnectedSettingsScreen /></AccountDataProvider>);
  await screen.findByRole('button', { name: 'Nudge Tone. Supportive' });
  await fireEvent.press(screen.getByRole('button', { name: 'Nudge Tone. Supportive' }));
  await fireEvent.press(screen.getByRole('radio', { name: 'Direct' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(app.patch).toHaveBeenCalledWith(expect.objectContaining({ expected_revision: 1, personalization: { age: null, gender: null, nudge_tone: 'Direct' } })));
  await screen.findByRole('button', { name: 'Nudge Tone. Direct' });
  expect(screen.queryByRole('radio', { name: 'Supportive' })).toBeNull();
});
