import type { AuthSessionPort } from '@disconnect/contracts';
import { act, fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import HomeRoute from '@/app/(tabs)/index';
import PreferenceDetail from '@/app/settings/[field]';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ApiError } from '@/infrastructure/api/errors';

const user_id = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
function setup() {
  let settings = {
    user_id,
    revision: 1,
    activities: { selected_activity_ids: ['reading'], custom_text: null as string | null },
    plan_draft: {
      weekdays: [0],
      hours: null,
      timezone_id: null,
      session_count: null,
      session_minutes: null,
    },
    created_at: '2026-11-03T12:00:00Z',
    updated_at: '2026-11-03T12:00:00Z',
  };
  const auth: AuthSessionPort = {
    getSnapshot: () => ({
      status: 'signed_in',
      sessionGeneration: 1,
      credentialStatus: 'ready',
      user: { user_id, email: null },
    }),
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
    subscribe: () => () => {},
  };
  const patch = jest.fn().mockImplementation(async (input) => {
    settings = {
      ...settings,
      revision: input.expected_revision + 1,
      ...(input.activities ? { activities: input.activities } : {}),
      ...(Object.hasOwn(input, 'plan_draft') ? { plan_draft: input.plan_draft } : {}),
    };
    return { settings };
  });
  const api = {
    configuration: { status: 'ready', origin: 'http://localhost', timeoutMs: 15000 },
    getRecoveryState: () => 'ready',
    recoverSession: jest.fn(),
    health: jest.fn(),
    request: jest.fn(async (_path, options) =>
      options.decode(await (options.method === 'PATCH' ? patch(options.json) : { settings }), {
        account: { user_id, sessionGeneration: 1 },
      }),
    ),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return { controller, patch };
}
async function mount(app: ReturnType<typeof setup>) {
  function Root() {
    return (
      <AccountDataProvider controller={app.controller}>
        <Stack screenOptions={{ headerShown: false }} />
      </AccountDataProvider>
    );
  }
  await renderRouter({ _layout: Root, index: HomeRoute, 'settings/[field]': PreferenceDetail });
  await screen.findByRole('button', { name: 'Edit activities' });
}
const press = async (name: string) => {
  await userEvent.press(screen.getByRole('button', { name }));
};

test.each([
  ['activities', 'Edit activities', 'Gym', 'Save activities'],
  ['days', 'Edit draft days', 'Tuesday', 'Save days'],
] as const)(
  'real Router removal keeps or discards the dirty %s draft without a write',
  async (field, label, choice, save) => {
    const app = setup();
    await mount(app);
    await press(label);
    await screen.findByRole('checkbox', { name: choice });
    await fireEvent.press(screen.getByRole('checkbox', { name: choice }));
    await act(async () => router.back());
    await screen.findByText('Discard unsaved changes?');
    expect(screen).toHavePathname(`/settings/${field}`);
    await press('Keep editing');
    expect(screen.getByRole('checkbox', { name: choice })).toBeChecked();
    expect(screen.getByRole('button', { name: save })).toBeEnabled();
    await act(async () => router.back());
    await screen.findByText('Discard unsaved changes?');
    await press('Discard and leave');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(app.patch).not.toHaveBeenCalled();
    await press(label);
    await screen.findByRole('checkbox', { name: choice });
    expect(screen.getByRole('checkbox', { name: choice })).not.toBeChecked();
  },
);
test('local Back confirmation leaves through the real removal guard once, without a second prompt', async () => {
  const app = setup();
  await mount(app);
  await press('Edit activities');
  await screen.findByRole('checkbox', { name: 'Gym' });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym' }));
  await press('Back');
  await screen.findByText('Discard unsaved changes?');
  await press('Discard and leave');
  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(screen.queryByText('Discard unsaved changes?')).toBeNull();
  expect(app.patch).not.toHaveBeenCalled();
});
test('accepted save permits real Back without discard and updates the retained Home summary', async () => {
  const app = setup();
  await mount(app);
  await press('Edit activities');
  await screen.findByRole('checkbox', { name: 'Gym' });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym' }));
  await press('Save activities');
  await screen.findByText('Activities saved.');
  await act(async () => router.back());
  await waitFor(() => expect(screen).toHavePathname('/'));
  await screen.findByText('Reading, Gym');
  expect(screen.queryByText('Discard unsaved changes?')).toBeNull();
  expect(app.patch).toHaveBeenCalledTimes(1);
});
test('an unconfirmed save remains dirty behind real Router removal and cannot replay after Keep editing', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(new ApiError('network', { requestMayHaveCommitted: true }));
  await mount(app);
  await press('Edit activities');
  await screen.findByRole('checkbox', { name: 'Gym' });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gym' }));
  await press('Save activities');
  await screen.findByText('Check latest preferences');
  await act(async () => router.back());
  await screen.findByText('Discard unsaved changes?');
  await press('Keep editing');
  expect(screen).toHavePathname('/settings/activities');
  expect(screen.getByRole('checkbox', { name: 'Gym' })).toBeChecked();
  expect(screen.getByRole('button', { name: 'Save activities' })).toBeDisabled();
  expect(app.patch).toHaveBeenCalledTimes(1);
});
