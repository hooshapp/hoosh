import type { AuthSessionPort } from '@disconnect/contracts';
import { act, fireEvent, screen, userEvent, waitFor } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import SettingsRoute from '@/app/(tabs)/settings';
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
    personalization: { age: 24, gender: 'Male', nudge_tone: 'Supportive' },
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
      ...(input.personalization ? { personalization: input.personalization } : {}),
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
  await renderRouter({ _layout: Root, index: SettingsRoute, 'settings/[field]': PreferenceDetail });
  await screen.findByRole('button', { name: /^Redirect Me To\./ });
}
const press = async (name: string) => {
  if (name === 'Edit draft days') { await act(async () => router.push('/settings/days')); return; }
  await userEvent.press(screen.getByRole('button', { name: name === 'Edit activities' ? /^Redirect Me To\./ : name }));
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

// These existing suites exercise account/native business contracts. Disclosure behavior,
// draft retention and native access entry are covered separately with the real container.
jest.mock('@/components/ui/details-panel', () => ({
  DetailsPanel: ({ children }: { children: import('react').ReactNode }) => children,
}));


test('Gender and Nudge Tone use their inline editors, persist, and reopen with the acknowledged choice', async () => {
  const app = setup();
  await mount(app);
  const genderRow = await screen.findByRole('button', { name: 'Gender. Male' });
  await waitFor(() => expect(screen.getByTestId('settings-avatar', { includeHiddenElements: true })).toHaveProp('recyclingKey', 'Male'));
  await userEvent.press(genderRow);
  await userEvent.press(screen.getByRole('radio', { name: 'Female' }));
  expect(screen.getByTestId('settings-avatar', { includeHiddenElements: true })).toHaveProp('recyclingKey', 'Male');
  await userEvent.press(screen.getByRole('button', { name: 'Done' }));
  await screen.findByRole('button', { name: 'Gender. Female' });
  await waitFor(() => expect(screen.getByTestId('settings-avatar', { includeHiddenElements: true })).toHaveProp('recyclingKey', 'Female'));
  expect(app.patch).toHaveBeenLastCalledWith(expect.objectContaining({ personalization: expect.objectContaining({ gender: 'Female', age: 24 }) }));
  await userEvent.press(screen.getByRole('button', { name: /^Nudge Tone\./ }));
  await userEvent.press(screen.getByRole('radio', { name: 'Playful' }));
  await userEvent.press(screen.getByRole('button', { name: 'Done' }));
  await screen.findByRole('button', { name: 'Nudge Tone. Playful' });
  await userEvent.press(screen.getByRole('button', { name: 'Nudge Tone. Playful' }));
  expect(screen.getByRole('radio', { name: 'Playful' })).toHaveProp('accessibilityState', expect.objectContaining({ checked: true }));
  expect(app.patch).toHaveBeenLastCalledWith(expect.objectContaining({ personalization: expect.objectContaining({ gender: 'Female', nudge_tone: 'Playful' }) }));
});

test('App Sessions saves through the inline row and reopening reads the saved values', async () => {
  const app = setup();
  await mount(app);
  await userEvent.press(await screen.findByRole('button', { name: /^App Sessions\./ }));
  await userEvent.press(screen.getByRole('button', { name: 'Increase sessions per day' }));
  await userEvent.press(screen.getByRole('button', { name: 'Increase minutes per session' }));
  await userEvent.press(screen.getByRole('button', { name: 'Save sessions' }));
  await screen.findByRole('button', { name: /App Sessions\. 1 sessions\/day · 1 min each/ });
  expect(app.patch).toHaveBeenLastCalledWith(expect.objectContaining({ plan_draft: expect.objectContaining({ session_count: 1, session_minutes: 1, weekdays: [0] }) }));
});
