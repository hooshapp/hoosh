import type { AuthSessionPort, AuthSnapshot, SettingsView } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text } from 'react-native';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ActivityPreferencesScreen } from './activity-preferences-screen';
import { ConnectedSettingsScreen } from './connected-settings-screen';
import PreferenceDetail from '@/app/settings/[field]';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ field: 'activities' }),
}));

jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({ confirmation: null, exit: (navigate: () => void) => navigate() }),
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
  plan_draft: null,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function setup(initial: SettingsView | null = row()) {
  let snapshot = signedIn();
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
  const get = jest.fn().mockResolvedValue({ settings: initial });
  const patch = jest.fn().mockImplementation(async (input) => ({
    settings: {
      ...row(input.expected_revision + 1),
      activities: input.activities,
    },
  }));
  const api = {
    configuration: { status: 'ready', origin: 'http://localhost', timeoutMs: 15000 },
    getRecoveryState: () => 'ready',
    recoverSession: jest.fn(),
    health: jest.fn(),
    request: jest.fn(async (path, options) => {
      const owner =
        snapshot.status === 'signed_in'
          ? { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration }
          : null;
      const value =
        path === '/v1/settings'
          ? await (options.method === 'PATCH' ? patch(options.json) : get())
          : path === '/v1/me'
            ? { user_id: owner?.user_id, email: null }
            : { profile: null };
      return options.decode(value, { account: owner });
    }),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    get,
    patch,
    controller,
    set(next: AuthSnapshot) {
      snapshot = next;
      for (const fn of listeners) fn();
    },
    async refresh() {
      await act(async () => {
        await controller
          .getSnapshot()
          .scope!.client.invalidateQueries({
            queryKey: controller.getSnapshot().scope!.key('settings'),
          });
      });
    },
  };
}
async function mount(app: ReturnType<typeof setup>, summary = false, onBack = jest.fn()) {
  const result = await render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}>
      {summary ? <ConnectedSettingsScreen /> : <ActivityPreferencesScreen onBack={onBack} />}
    </AccountDataProvider>,
  );
  if (!summary) await screen.findByRole('checkbox', { name: 'Reading' });
  return result;
}
const press = async (label: string) => {
  await fireEvent.press(screen.getByText(label));
};
const choice = (label: string) => screen.getByRole('checkbox', { name: label });
const choose = async (label: string) => {
  await fireEvent.press(choice(label));
};
const edit = async (value: string) => {
  await fireEvent.changeText(screen.getByLabelText(/^Custom activity/), value);
};
const save = () => screen.getByRole('button', { name: 'Save activities' });
const conflict = () =>
  new ApiError('conflict', { code: 'SETTINGS_CONFLICT', details: { current_revision: 2 } });
afterEach(() => onlineManager.setOnline(true));

test('verified absence can explicitly save empty preferences without prompting on untouched Back', async () => {
  const app = setup(null);
  const back = jest.fn();
  await mount(app, false, back);
  expect(save()).toBeEnabled();
  await press('Back');
  expect(back).toHaveBeenCalledTimes(1);
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.patch).toHaveBeenCalledWith({
    expected_revision: 0,
    activities: { selected_activity_ids: [], custom_text: null },
  });
  expect(save()).toBeDisabled();
});
test('save sends only activities, accepts canonical text and shares the saved resource with Settings', async () => {
  const app = setup();
  const pending = deferred<{ settings: SettingsView }>();
  app.patch.mockImplementationOnce(() => pending.promise);
  await mount(app);
  await choose('Gym');
  await choose('Custom');
  await edit('  Raw 🦖  ');
  await act(async () => {
    fireEvent.press(save());
    fireEvent.press(save());
  });
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
  await act(async () =>
    pending.resolve({
      settings: {
        ...row(2),
        activities: { selected_activity_ids: ['reading', 'gym'], custom_text: 'Raw 🦖' },
      },
    }),
  );
  await screen.findByText('Activities saved.');
  expect(screen.getByLabelText(/^Custom activity/).props.value).toBe('Raw 🦖');
  expect(app.patch).toHaveBeenCalledWith({
    expected_revision: 1,
    activities: { selected_activity_ids: ['reading', 'gym'], custom_text: '  Raw 🦖  ' },
  });
  expect(
    app.controller
      .getSnapshot()
      .scope!.client.getQueryData(app.controller.getSnapshot().scope!.key('settings')),
  ).toMatchObject({ settings: { revision: 2, activities: { custom_text: 'Raw 🦖' } } });
});
test('authoritative Unicode validation retains raw input; custom deselection sends null', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(
    new ApiError('validation', {
      details: { fields: [{ field: 'activities.custom_text', code: 'blank' }] },
    }),
  );
  await mount(app);
  await choose('Custom');
  await edit(' \u0085 ');
  await press('Save activities');
  await screen.findByText('Enter an activity or deselect Custom.');
  expect(screen.getByLabelText(/^Custom activity/).props.value).toBe(' \u0085 ');
  expect(app.patch.mock.calls[0][0].activities.custom_text).toBe(' \u0085 ');
  await edit('\ufeff');
  expect(save()).toBeEnabled();
  await choose('Custom');
  await choose('Gym');
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.patch.mock.calls[1][0].activities.custom_text).toBeNull();
});
test('dirty background reads never overwrite raw inactive custom text or advance the draft base', async () => {
  const app = setup();
  await mount(app);
  await choose('Custom');
  await edit('raw text');
  await choose('Custom');
  app.get.mockResolvedValue({
    settings: {
      ...row(8),
      plan_draft: {
        weekdays: [1],
        hours: null,
        timezone_id: null,
        session_count: null,
        session_minutes: 30,
      },
    },
  });
  await app.refresh();
  await choose('Custom');
  expect(screen.getByLabelText(/^Custom activity/).props.value).toBe('raw text');
  await press('Save activities');
  await waitFor(() =>
    expect(app.patch).toHaveBeenCalledWith({
      expected_revision: 1,
      activities: { selected_activity_ids: ['reading'], custom_text: 'raw text' },
    }),
  );
  await waitFor(() =>
    expect(
      app.controller
        .getSnapshot()
        .scope!.client.getQueryData(app.controller.getSnapshot().scope!.key('settings')),
    ).toMatchObject({ settings: { revision: 8 } }),
  );
  expect(screen.queryByText('Activities saved.')).toBeNull();
});
test('409 requires a fresh read and explicit Keep my edits before revision-based resubmission', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(conflict());
  await mount(app);
  await choose('Gym');
  await press('Save activities');
  await screen.findByText('Check latest preferences');
  expect(save()).toBeDisabled();
  expect(app.get).toHaveBeenCalledTimes(1);
  app.get.mockResolvedValue({
    settings: { ...row(7), activities: { selected_activity_ids: ['walking'], custom_text: null } },
  });
  await press('Check latest preferences');
  await screen.findByText('Keep my edits');
  expect(choice('Gym')).toBeChecked();
  await press('Keep my edits');
  expect(app.patch).toHaveBeenCalledTimes(1);
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.patch.mock.calls[1][0]).toMatchObject({ expected_revision: 7 });
});
test('unconfirmed write and failed latest read retain draft and block automatic replay', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(new ApiError('network', { requestMayHaveCommitted: true }));
  await mount(app);
  await choose('Gym');
  await press('Save activities');
  await screen.findByText('Check latest preferences');
  app.get.mockRejectedValueOnce(new ApiError('forbidden'));
  await press('Check latest preferences');
  await screen.findByText('The latest preferences could not be loaded. Your draft is still here.');
  expect(choice('Gym')).toBeChecked();
  expect(save()).toBeDisabled();
  expect(app.patch).toHaveBeenCalledTimes(1);
  app.get.mockResolvedValue({ settings: row(3) });
  await press('Try again');
  await screen.findByText('Use latest preferences');
  await press('Use latest preferences');
  expect(choice('Gym')).not.toBeChecked();
  expect(save()).toBeDisabled();
  expect(app.patch).toHaveBeenCalledTimes(1);
});
test('latest absence is reviewed explicitly; keep edits then creates with revision zero', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(conflict());
  await mount(app);
  await choose('Gym');
  await press('Save activities');
  await screen.findByText('Check latest preferences');
  app.get.mockResolvedValue({ settings: null });
  await press('Discard changes');
  await screen.findByText(/Latest preferences: No preferences saved yet/);
  await press('Keep my edits');
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.patch.mock.calls[1][0].expected_revision).toBe(0);
});
test('discard is local and dirty Back uses the existing confirmation', async () => {
  const app = setup();
  const back = jest.fn();
  await mount(app, false, back);
  await choose('Gym');
  await press('Back');
  await screen.findByText('Discard unsaved changes?');
  expect(back).not.toHaveBeenCalled();
  await press('Keep editing');
  await press('Discard changes');
  expect(choice('Gym')).not.toBeChecked();
  expect(app.patch).not.toHaveBeenCalled();
  await press('Back');
  expect(back).toHaveBeenCalledTimes(1);
});
test('offline edits stay volatile and reconnect never submits a write', async () => {
  const app = setup();
  await mount(app);
  await act(async () => onlineManager.setOnline(false));
  await choose('Gym');
  expect(save()).toBeDisabled();
  await act(async () => onlineManager.setOnline(true));
  await waitFor(() => expect(save()).toBeEnabled());
  expect(choice('Gym')).toBeChecked();
  expect(app.patch).not.toHaveBeenCalled();
});
test.each([signedIn(B, 2), signedIn(A, 2)])(
  'new account/generation drops pending old drafts and save effects %#',
  async (next) => {
    const app = setup();
    const pending = deferred<{ settings: SettingsView }>();
    app.patch.mockImplementationOnce(() => pending.promise);
    await mount(app);
    await choose('Gym');
    await press('Save activities');
    await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
    app.get.mockResolvedValue({
      settings: row(1, next.status === 'signed_in' ? next.user.user_id : B),
    });
    await act(async () => app.set(next));
    await screen.findByRole('checkbox', { name: 'Reading' });
    await act(async () =>
      pending.resolve({
        settings: {
          ...row(2),
          activities: { selected_activity_ids: ['gym'], custom_text: 'Private A' },
        },
      }),
    );
    expect(choice('Gym')).not.toBeChecked();
    expect(screen.queryByText('Activities saved.')).toBeNull();
    expect(
      app.controller
        .getSnapshot()
        .scope!.client.getQueryData(app.controller.getSnapshot().scope!.key('settings')),
    ).toMatchObject({ settings: { revision: 1 } });
  },
);
test('protocol-invalid refresh quarantines old data without an automatic reload loop', async () => {
  const app = setup();
  await mount(app);
  await choose('Gym');
  app.get.mockResolvedValue({ settings: row(2, B) });
  await app.refresh();
  await screen.findByText(
    'Your preferences could not be verified. Your changes have not been discarded.',
  );
  expect(screen.queryByRole('checkbox', { name: 'Gym' })).toBeNull();
  expect(app.get).toHaveBeenCalledTimes(2);
  app.get.mockResolvedValue({ settings: row(3) });
  await press('Try again');
  await screen.findByRole('checkbox', { name: 'Gym' });
  expect(choice('Gym')).toBeChecked();
  await press('Save activities');
  await waitFor(() => expect(app.patch.mock.calls[0][0].expected_revision).toBe(1));
});
test('Settings observes canonical preferences from the same query without activating other rows', async () => {
  const app = setup(null);
  await mount(app, true);
  await screen.findByText('Not saved yet');
  await act(async () => {
    const scope = app.controller.getSnapshot().scope!;
    scope.client.setQueryData(scope.key('settings'), {
      settings: {
        ...row(2),
        activities: { selected_activity_ids: ['gym'], custom_text: 'Sketch' },
      },
    });
  });
  await screen.findByText('Gym, Custom: Sketch');
  expect(screen.getAllByText('Not available yet').length).toBeGreaterThan(0);
  app.get.mockRejectedValueOnce(new ApiError('forbidden'));
  await app.refresh();
  expect(await screen.findAllByText('Couldn’t load')).toHaveLength(4);
  expect(screen.queryByText('Gym, Custom: Sketch')).toBeNull();
});
test('real detail route stays unavailable without the provider and activates the same editor with it', async () => {
  const view = await render(<PreferenceDetail />);
  expect(save()).toBeDisabled();
  expect(screen.queryByRole('checkbox', { name: 'Reading' })).toBeNull();
  const app = setup();
  await view.rerender(
    <AccountDataProvider controller={app.controller}>
      <PreferenceDetail />
    </AccountDataProvider>,
  );
  await screen.findByRole('checkbox', { name: 'Reading' });
  expect(choice('Reading')).toBeChecked();
  await choose('Gym');
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.patch).toHaveBeenCalledTimes(1);
});
test('a read begun during a pending write is cancelled before the accepted save enters cache', async () => {
  const app = setup();
  const write = deferred<{ settings: SettingsView }>();
  const read = deferred<{ settings: SettingsView }>();
  app.patch.mockImplementationOnce(() => write.promise);
  await mount(app);
  await choose('Gym');
  await press('Save activities');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
  app.get.mockImplementationOnce(() => read.promise);
  let refresh!: Promise<void>;
  await act(async () => {
    refresh = app.controller.getSnapshot().scope!.client.invalidateQueries();
  });
  await waitFor(() => expect(app.get).toHaveBeenCalledTimes(2));
  await act(async () =>
    write.resolve({
      settings: {
        ...row(2),
        activities: { selected_activity_ids: ['reading', 'gym'], custom_text: null },
      },
    }),
  );
  await screen.findByText('Activities saved.');
  await act(async () => {
    read.resolve({ settings: row(1) });
    await refresh;
  });
  expect(choice('Gym')).toBeChecked();
  expect(save()).toBeDisabled();
  expect(
    app.controller
      .getSnapshot()
      .scope!.client.getQueryData(app.controller.getSnapshot().scope!.key('settings')),
  ).toMatchObject({ settings: { revision: 2 } });
});
test('credential unavailability cancels a write into explicit review and resume never replays it', async () => {
  const app = setup();
  const pending = deferred<{ settings: SettingsView }>();
  app.patch.mockImplementationOnce(() => pending.promise);
  await mount(app);
  await choose('Gym');
  await press('Save activities');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
  const snapshot = signedIn();
  await act(async () => app.set({ ...snapshot, credentialStatus: 'unavailable' } as AuthSnapshot));
  await waitFor(() => expect(save()).toBeDisabled());
  await act(async () => app.set(signedIn()));
  await screen.findByText('Check latest preferences');
  expect(save()).toBeDisabled();
  expect(choice('Gym')).toBeChecked();
  expect(app.patch).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve({ settings: row(2) }));
  expect(screen.queryByText('Activities saved.')).toBeNull();
});
