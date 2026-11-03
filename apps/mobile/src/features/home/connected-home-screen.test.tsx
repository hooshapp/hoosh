import type { AuthSessionPort, AuthSnapshot, SettingsView } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import HomeRoute from '@/app/(tabs)/index';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ActivityPreferencesScreen } from '@/features/settings/activity-preferences-screen';
import { PlanDraftScreen } from '@/features/settings/plan-draft-screen';
import { ConnectedSettingsScreen } from '@/features/settings/connected-settings-screen';
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
const home = () => within(screen.getByTestId('home-preferences'));
async function mount(app: ReturnType<typeof setup>, other?: 'settings' | 'activities' | 'days') {
  const result = await render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}>
      <View>
        <ConnectedHomeScreen />
        {other === 'settings' ? (
          <ConnectedSettingsScreen />
        ) : other === 'activities' ? (
          <ActivityPreferencesScreen onBack={jest.fn()} />
        ) : other === 'days' ? (
          <PlanDraftScreen field="days" onBack={jest.fn()} />
        ) : null}
      </View>
    </AccountDataProvider>,
  );
  await home().findByText('Reading');
  return result;
}
const press = async (name: string) => {
  await fireEvent.press(screen.getByRole('button', { name }));
};
afterEach(() => onlineManager.setOnline(true));

test('Home and Settings deduplicate their read and display identical canonical partial summaries', async () => {
  const app = setup();
  await mount(app, 'settings');
  expect(app.get).toHaveBeenCalledTimes(1);
  for (const text of [
    'Reading',
    'Draft: Monday',
    'Draft: 23:00–end not set (next day); US/Eastern',
    'Draft: count not set; minutes 30',
  ])
    expect(screen.getAllByText(text)).toHaveLength(2);
  expect(screen.getByText('Saved plan drafts are not active protection.')).toBeVisible();
  expect(screen.getByRole('header', { name: 'Protection unavailable' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Feed Dino' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  expect(screen.queryByText('Protection active')).toBeNull();
});
test('verified missing row and explicit empty selection/draft have distinct labels without writes', async () => {
  const app = setup(null);
  await render(
    <AccountDataProvider controller={app.controller}>
      <ConnectedHomeScreen />
    </AccountDataProvider>,
  );
  await home().findByText('Not saved yet');
  expect(home().getAllByText('No saved draft')).toHaveLength(3);
  await act(async () => {
    const scope = app.controller.getSnapshot().scope!;
    scope.client.setQueryData(scope.key('settings'), {
      settings: {
        ...row(),
        activities: { selected_activity_ids: [], custom_text: null },
        plan_draft: null,
      },
    });
  });
  await home().findByText('Not set');
  expect(home().getAllByText('No saved draft')).toHaveLength(3);
  expect(app.patch).not.toHaveBeenCalled();
  expect(screen.queryByText('Protection active')).toBeNull();
});
test('Home never shows a dirty or pending activity draft; accepted canonical save updates it immediately', async () => {
  const app = setup();
  const write = deferred<{ settings: SettingsView }>();
  app.patch.mockImplementationOnce(() => write.promise);
  await mount(app, 'activities');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym' }));
  expect(home().getByText('Reading')).toBeVisible();
  expect(home().queryByText('Reading, Gym')).toBeNull();
  await press('Save activities');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
  expect(home().getByText('Reading')).toBeVisible();
  await act(async () =>
    write.resolve({
      settings: {
        ...row(2),
        activities: { selected_activity_ids: ['reading', 'gym'], custom_text: 'Canonical' },
      },
    }),
  );
  await home().findByText('Reading, Gym, Custom: Canonical');
  expect(app.get).toHaveBeenCalledTimes(1);
});
test('accepted draft saves and explicit section clear update Home without activating native protection', async () => {
  const app = setup();
  await mount(app, 'days');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Tuesday' }));
  expect(home().getByText('Draft: Monday')).toBeVisible();
  await press('Save days');
  await home().findByText('Draft: Monday, Tuesday');
  await press('Clear entire plan draft');
  expect(home().getByText('Draft: Monday, Tuesday')).toBeVisible();
  await press('Save cleared draft');
  await waitFor(() => expect(home().getAllByText('No saved draft')).toHaveLength(3));
  expect(home().getByText('Reading')).toBeVisible();
  expect(screen.getByRole('header', { name: 'Protection unavailable' })).toBeVisible();
  expect(screen.queryByText('Protection active')).toBeNull();
});
test('an uncertain write never publishes its unverified response; a deliberate GET can update canonical summaries', async () => {
  const app = setup();
  const accept = app.patch.getMockImplementation()!;
  app.patch.mockImplementationOnce(async (input) => {
    await accept(input);
    throw new ApiError('network', { requestMayHaveCommitted: true });
  });
  await mount(app, 'activities');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym' }));
  await press('Save activities');
  await screen.findByText('Check latest preferences');
  expect(home().getByText('Reading')).toBeVisible();
  expect(home().queryByText('Reading, Gym')).toBeNull();
  await press('Check latest preferences');
  await home().findByText('Reading, Gym');
  expect(app.patch).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Activities saved.')).toBeNull();
});
test('failed background reads hide old values in both surfaces while metrics and native availability still render', async () => {
  const app = setup();
  await mount(app, 'settings');
  app.get.mockRejectedValueOnce(new ApiError('forbidden'));
  await app.refresh();
  await home().findByText('Your saved preferences couldn’t be loaded.');
  expect(screen.queryByText('Reading')).toBeNull();
  expect(screen.getAllByText('Couldn’t load')).toHaveLength(8);
  expect(screen.getByRole('header', { name: 'Dino health' })).toBeVisible();
  expect(screen.getByRole('header', { name: 'Protection unavailable' })).toBeVisible();
  await fireEvent.press(home().getByRole('button', { name: 'Try again' }));
  await home().findByText('Reading');
  expect(screen.getAllByText('Reading')).toHaveLength(2);
  expect(app.patch).not.toHaveBeenCalled();
});
test('malformed foreign read hides prior values without retry loops and explicit retry restores them', async () => {
  const app = setup();
  await mount(app);
  app.get.mockResolvedValueOnce({ settings: row(2, B) });
  await app.refresh();
  await home().findByText('Your saved preferences couldn’t be loaded.');
  expect(home().queryByText('Reading')).toBeNull();
  expect(app.get).toHaveBeenCalledTimes(2);
  await press('Try again');
  await home().findByText('Reading');
  expect(app.get).toHaveBeenCalledTimes(3);
});
test('pending initial read is loading rather than missing; its failure cannot create defaults', async () => {
  const app = setup();
  const read = deferred<{ settings: SettingsView | null }>();
  app.get.mockImplementationOnce(() => read.promise);
  await render(
    <AccountDataProvider controller={app.controller}>
      <ConnectedHomeScreen />
    </AccountDataProvider>,
  );
  await home().findByText('Loading saved preferences…');
  expect(home().queryByText('Not saved yet')).toBeNull();
  await act(async () => read.resolve({ settings: null }));
  await home().findByText('Not saved yet');
  expect(app.patch).not.toHaveBeenCalled();
});
test('background refresh marks updating while showing the last canonical value, then updates both surfaces', async () => {
  const app = setup();
  await mount(app, 'settings');
  const read = deferred<{ settings: SettingsView }>();
  app.get.mockImplementationOnce(() => read.promise);
  let refresh!: Promise<void>;
  await act(async () => {
    const scope = app.controller.getSnapshot().scope!;
    refresh = scope.client.invalidateQueries({ queryKey: scope.key('settings') });
  });
  await home().findByText('Updating saved preferences…');
  expect(home().getByText('Reading')).toBeVisible();
  await act(async () => {
    read.resolve({
      settings: {
        ...row(2),
        activities: { selected_activity_ids: ['walking'], custom_text: null },
      },
    });
    await refresh;
  });
  await home().findByText('Walking');
  expect(screen.getAllByText('Walking')).toHaveLength(2);
  expect(home().queryByText('Updating saved preferences…')).toBeNull();
});
test('offline masks cached private labels on both surfaces and reconnect never submits a write', async () => {
  const app = setup();
  await mount(app, 'settings');
  await act(async () => onlineManager.setOnline(false));
  await home().findByText('Connect to verify your saved preferences.');
  expect(screen.queryByText('Reading')).toBeNull();
  await act(async () => onlineManager.setOnline(true));
  await home().findByText('Reading');
  expect(screen.getAllByText('Reading')).toHaveLength(2);
  expect(app.patch).not.toHaveBeenCalled();
});
test('credential unavailability masks saved data and API pause offers deliberate existing-controller recovery', async () => {
  const app = setup();
  await mount(app);
  await act(async () =>
    app.set({ ...signedIn(), credentialStatus: 'unavailable' } as AuthSnapshot),
  );
  await home().findByText('Saved preferences are temporarily unavailable.');
  expect(home().queryByText('Reading')).toBeNull();
  await act(async () => app.set(signedIn()));
  await home().findByText('Reading');
  await act(async () => app.pause());
  await home().findByText('Verify your account access to load saved preferences.');
  expect(home().queryByText('Reading')).toBeNull();
  expect(app.recoverSession).not.toHaveBeenCalled();
  app.recoverSession.mockRejectedValueOnce(new ApiError('unauthorized'));
  await press('Verify account access');
  await home().findByText('Account access could not be verified. Try again.');
  await press('Verify account access');
  await home().findByText('Reading');
  expect(app.recoverSession).toHaveBeenCalledTimes(2);
  expect(app.patch).not.toHaveBeenCalled();
});
test.each([signedIn(B, 2), signedIn(A, 2)])(
  'account/generation replacement rejects a late old read %#',
  async (next) => {
    const app = setup();
    await mount(app);
    const late = deferred<{ settings: SettingsView }>();
    app.get.mockImplementationOnce(() => late.promise);
    let refresh!: Promise<void>;
    await act(async () => {
      const scope = app.controller.getSnapshot().scope!;
      refresh = scope.client.invalidateQueries({ queryKey: scope.key('settings') });
    });
    await waitFor(() => expect(app.get).toHaveBeenCalledTimes(2));
    app.get.mockResolvedValue({
      settings: {
        ...row(1, next.status === 'signed_in' ? next.user.user_id : B),
        activities: { selected_activity_ids: ['music'], custom_text: null },
      },
    });
    await act(async () => app.set(next));
    await home().findByText('Music');
    await act(async () => {
      late.resolve({
        settings: {
          ...row(2),
          activities: { selected_activity_ids: [], custom_text: 'Private old account' },
        },
      });
      await refresh;
    });
    expect(home().queryByText(/Private old account/)).toBeNull();
    expect(home().getByText('Music')).toBeVisible();
  },
);
test('sign-out retires the private Home region rather than retaining preference summaries', async () => {
  const app = setup();
  await mount(app);
  await act(async () => app.set({ status: 'signed_out', sessionGeneration: 2 }));
  await screen.findByText('Closed');
  expect(screen.queryByTestId('home-preferences')).toBeNull();
});
test('the actual route mounts the consumer only inside the provider and passes supported detail navigation', async () => {
  const view = await render(<HomeRoute />);
  expect(screen.queryByTestId('home-preferences')).toBeNull();
  const app = setup();
  await view.rerender(
    <AccountDataProvider controller={app.controller}>
      <HomeRoute />
    </AccountDataProvider>,
  );
  await home().findByText('Reading');
  for (const label of [
    'Edit activities',
    'Edit draft days',
    'Edit draft hours',
    'Edit draft sessions',
  ])
    expect(home().getByRole('button', { name: label })).toBeEnabled();
  const push = jest.spyOn(router, 'push').mockImplementation(() => {});
  try {
    for (const [field, label] of [
      ['activities', 'Edit activities'],
      ['days', 'Edit draft days'],
      ['hours', 'Edit draft hours'],
      ['sessions', 'Edit draft sessions'],
    ]) {
      await press(label);
      expect(push).toHaveBeenLastCalledWith({ pathname: '/settings/[field]', params: { field } });
    }
    expect(push).toHaveBeenCalledTimes(4);
  } finally {
    push.mockRestore();
  }
  expect(screen.queryByRole('button', { name: 'Review protection setup' })).toBeNull();
});
