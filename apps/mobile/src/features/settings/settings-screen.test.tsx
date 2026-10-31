import { render, screen, userEvent } from '@testing-library/react-native';
import SettingsRoute from '@/app/(tabs)/settings';
import { AccountHeader } from '@/features/account/account-header';
import { SettingsScreen } from './settings-screen';
import {
  unavailableSettings,
  settingsValueLabel,
  type SettingsModel,
} from './settings-model';
const ready: SettingsModel = {
  ...unavailableSettings,
  account: {
    identity: {
      user_id: 'b0bbcfac-c011-46a8-a795-24c7777b6de9',
      email: 'RN09D_TEST_ONLY@example.test',
    },
    displayName: 'Test supplied name',
  },
  apps: { state: 'ready', text: 'Supplied apps' },
  activities: { state: 'ready', text: 'Supplied activities' },
  days: { state: 'ready', text: 'Supplied days' },
};
test('root has neutral account and unavailable values with supported local-detail navigation', async () => {
  await render(<SettingsRoute />);
  expect(screen.getByRole('header', { name: 'Settings' })).toBeVisible();
  expect(screen.getByRole('header', { name: 'Your account' })).toBeVisible();
  expect(screen.getAllByText('Not available yet')).toHaveLength(5);
  expect(screen.queryByText('Personal Info')).toBeNull();
  expect(screen.queryByText('Calendar Connections')).toBeNull();
  expect(screen.getAllByRole('button')).toHaveLength(5);
  expect(screen.queryByText('Jordan Rivera')).toBeNull();
  expect(screen.queryByText('2 sessions/day · 15 min each')).toBeNull();
});
test('unknown identity suppresses a stale supplied name without claiming signed in', async () => {
  await render(
    <AccountHeader identity={null} displayName="Stale private name" />,
  );
  expect(screen.queryByText('Stale private name')).toBeNull();
  expect(screen.queryByText('Signed-in account')).toBeNull();
  expect(
    screen.getByText('Account details aren’t available yet.'),
  ).toBeVisible();
});
test('rows without owner handlers remain static and omit misleading chevrons', async () => {
  await render(<SettingsScreen model={ready} />);
  expect(screen.getByText('Supplied apps')).toBeVisible();
  expect(screen.queryByRole('button')).toBeNull();
  expect(
    screen.queryByTestId('settings-chevron', { includeHiddenElements: true }),
  ).toBeNull();
});
test('only supported ready row handlers are delegated; unavailable fields cannot edit', async () => {
  const apps = jest.fn(),
    hours = jest.fn();
  await render(<SettingsScreen model={ready} onEdit={{ apps, hours }} />);
  await userEvent.press(
    screen.getByRole('button', { name: 'Distracting Apps. Supplied apps' }),
  );
  expect(apps).toHaveBeenCalledTimes(1);
  expect(hours).not.toHaveBeenCalled();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByText('Supplied apps')).toBeVisible();
});
test.each(['loading', 'error', 'unavailable'] as const)(
  '%s replaces old field values and removes its edit handler',
  async (state) => {
    const view = await render(
      <SettingsScreen model={ready} onEdit={{ apps: jest.fn() }} />,
    );
    await view.rerender(
      <SettingsScreen
        model={{ ...ready, apps: { state } }}
        onEdit={{ apps: jest.fn() }}
      />,
    );
    expect(screen.queryByText('Supplied apps')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  },
);
test('known empty value is distinct from unknown and can open an available editor', async () => {
  expect(settingsValueLabel({ state: 'ready', text: null })).toBe('Not set');
  const edit = jest.fn();
  await render(
    <SettingsScreen
      model={{ ...ready, apps: { state: 'ready', text: null } }}
      onEdit={{ apps: edit }}
    />,
  );
  await userEvent.press(
    screen.getByRole('button', { name: 'Distracting Apps. Not set' }),
  );
  expect(edit).toHaveBeenCalledTimes(1);
});
test('optional sections and original bounds only render when the host supplies their scope', async () => {
  await render(
    <SettingsScreen
      model={{
        ...ready,
        personalInfo: {
          age: { state: 'ready', text: 'Age supplied' },
          gender: { state: 'ready', text: null },
        },
        calendars: {
          googleCalendar: { state: 'unavailable' },
          appleCalendar: { state: 'unavailable' },
        },
      }}
    />,
  );
  expect(screen.getByRole('header', { name: 'Personal Info' })).toBeVisible();
  expect(
    screen.getByRole('header', { name: 'Calendar Connections' }),
  ).toBeVisible();
  for (const [id, size] of [
    ['settings-user', 18],
    ['settings-gender', 18],
    ['settings-apps', 18],
    ['settings-activities', 18],
    ['settings-clock', 18],
    ['settings-timer', 18],
    ['settings-info', 14],
  ] as const)
    expect(screen.getByTestId(id, { includeHiddenElements: true })).toHaveStyle(
      { width: size, height: size },
    );
  expect(screen.queryByRole('button')).toBeNull();
});
test('profile form is the existing controlled component, delegates draft/save and requires identity', async () => {
  const change = jest.fn(),
    save = jest.fn(),
    discard = jest.fn();
  const form = {
    draft: { kind: 'text' as const, value: 'New name' },
    dirty: true,
    state: { kind: 'ready' as const },
    onDraftChange: change,
    onSave: save,
    onDiscard: discard,
  };
  const view = await render(
    <SettingsScreen model={ready} profileForm={form} />,
  );
  expect(screen.getByLabelText('Display name')).toHaveDisplayValue('New name');
  await userEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(save).toHaveBeenCalledWith(form.draft);
  expect(screen.getByText('Test supplied name')).toBeVisible();
  await view.rerender(
    <SettingsScreen model={unavailableSettings} profileForm={form} />,
  );
  expect(screen.queryByLabelText('Display name')).toBeNull();
});
test('edit profile delegates only, without automatically creating an editor or saving', async () => {
  const edit = jest.fn();
  await render(<SettingsScreen model={ready} onEditProfile={edit} />);
  await userEvent.press(
    screen.getByRole('button', { name: 'Edit display name' }),
  );
  expect(edit).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Display name')).toBeNull();
});

test('retry reload intent leaves independent supplied values intact', async () => {
  const retry = jest.fn();
  await render(
    <SettingsScreen
      model={{ ...ready, hours: { state: 'error' } }}
      onRetry={retry}
    />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Supplied days')).toBeVisible();
  expect(screen.getByText('Couldn’t load')).toBeVisible();
});
