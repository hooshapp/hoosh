import type { AuthSessionPort, AuthSnapshot } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text } from 'react-native';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ProfileSurface } from './profile-surface';

jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({ confirmation: null }),
}));
const A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
const B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
const row = (display_name: string | null = 'Original', revision = 1, user_id = A) => ({
  user_id,
  display_name,
  revision,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
});
function setup(initial: ReturnType<typeof row> | null = row()) {
  let snapshot: AuthSnapshot = {
    status: 'signed_in',
    sessionGeneration: 1,
    user: { user_id: A, email: null },
    credentialStatus: 'ready',
  };
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
  const get = jest.fn().mockResolvedValue({ profile: initial });
  const patch = jest.fn().mockImplementation(async (input) => ({
    profile: row(input.display_name === null ? null : 'Saved', input.expected_revision + 1),
  }));
  const api = {
    configuration: {
      status: 'ready',
      origin: 'http://localhost',
      timeoutMs: 15000,
    },
    getRecoveryState: () => 'ready',
    recoverSession: jest.fn(),
    health: jest.fn(),
    request: jest.fn(async (path, options) =>
      options.decode(
        path === '/v1/me'
          ? {
              user_id: snapshot.status === 'signed_in' ? snapshot.user.user_id : A,
              email: null,
            }
          : await (options.method === 'PATCH' ? patch(options.json) : get()),
        {
          account:
            snapshot.status === 'signed_in'
              ? {
                  user_id: snapshot.user.user_id,
                  sessionGeneration: snapshot.sessionGeneration,
                }
              : null,
        },
      ),
    ),
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
  };
}
async function mount(app: ReturnType<typeof setup>) {
  await render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}>
      <ProfileSurface />
    </AccountDataProvider>,
  );
  await screen.findByLabelText('Display name');
}
const name = () => screen.getByLabelText(/^Display name/);
async function edit(value: string) {
  await fireEvent.changeText(name(), value);
}
async function press(label: string) {
  await fireEvent.press(screen.getByText(label));
}
afterEach(() => onlineManager.setOnline(true));

test('missing row saves raw input with revision zero, accepts only canonical result, and suppresses duplicate taps', async () => {
  const app = setup(null);
  await mount(app);
  await edit('  Raw 🦖  ');
  await act(async () => {
    fireEvent.press(screen.getByText('Save changes'));
    fireEvent.press(screen.getByText('Save changes'));
  });
  await waitFor(() => expect(name().props.value).toBe('Saved'));
  expect(app.patch).toHaveBeenCalledTimes(1);
  expect(app.patch).toHaveBeenCalledWith({
    expected_revision: 0,
    display_name: '  Raw 🦖  ',
  });
});
test('server validation preserves raw draft and confirmed clear alone sends null', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(
    new ApiError('validation', {
      details: { fields: [{ field: 'display_name', code: 'blank' }] },
    }),
  );
  await mount(app);
  await edit('   ');
  await press('Save changes');
  await screen.findByText('Enter a display name, or choose Remove display name.');
  expect(name().props.value).toBe('   ');
  await press('Remove display name');
  await press('Remove name');
  await press('Save changes');
  await waitFor(() =>
    expect(app.patch).toHaveBeenLastCalledWith({
      expected_revision: 1,
      display_name: null,
    }),
  );
});
test.each(['conflict', 'unconfirmed'] as const)(
  '%s preserves draft and requires an explicit latest-profile decision without auto replay',
  async (kind) => {
    const app = setup();
    app.patch.mockRejectedValueOnce(
      kind === 'conflict'
        ? new ApiError('conflict')
        : new ApiError('timeout', { requestMayHaveCommitted: true }),
    );
    await mount(app);
    await edit('My draft');
    await press('Save changes');
    const label = kind === 'conflict' ? 'Review latest profile' : 'Check latest profile';
    await screen.findByText(label);
    app.get.mockResolvedValue({ profile: row('Other device', 4) });
    await press(label);
    await screen.findByText('Keep my edits');
    expect(name().props.value).toBe('My draft');
    expect(app.patch).toHaveBeenCalledTimes(1);
    await press('Keep my edits');
    await press('Save changes');
    await waitFor(() =>
      expect(app.patch).toHaveBeenLastCalledWith({
        expected_revision: 4,
        display_name: 'My draft',
      }),
    );
  },
);
test('review can discard a dirty draft in favor of the latest canonical value', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(new ApiError('conflict'));
  await mount(app);
  await edit('Draft');
  await press('Save changes');
  app.get.mockResolvedValue({ profile: row('Latest', 3) });
  await press('Review latest profile');
  await screen.findByText('Use latest profile');
  await press('Use latest profile');
  expect(name().props.value).toBe('Latest');
  expect(app.patch).toHaveBeenCalledTimes(1);
});
test('background refresh never overwrites dirty input or silently advances its expected revision', async () => {
  const app = setup();
  await mount(app);
  await edit('Keep me');
  app.get.mockResolvedValue({ profile: row('Elsewhere', 3) });
  await act(async () => {
    const s = app.controller.getSnapshot().scope!;
    await s.client.refetchQueries({ queryKey: s.key('profile') });
  });
  expect(name().props.value).toBe('Keep me');
  await press('Save changes');
  await waitFor(() =>
    expect(app.patch).toHaveBeenCalledWith({
      expected_revision: 1,
      display_name: 'Keep me',
    }),
  );
});
test('wrong-owner payload masks cached form, recovery reloads only verified data', async () => {
  const app = setup();
  await mount(app);
  await edit('Private draft');
  app.get.mockResolvedValueOnce({ profile: row('Wrong owner', 1, B) });
  await act(async () => {
    const s = app.controller.getSnapshot().scope!;
    await s.client.refetchQueries({ queryKey: s.key('profile') });
  });
  await screen.findByText(
    'Your profile could not be verified. Your changes have not been discarded.',
  );
  expect(screen.queryByLabelText('Display name')).toBeNull();
  expect(screen.queryByText('Wrong owner')).toBeNull();
  expect(app.get).toHaveBeenCalledTimes(2);
  await press('Try again');
  await waitFor(() => expect(name().props.value).toBe('Private draft'));
});
test('offline writes do not queue and a late save cannot populate the next account', async () => {
  const app = setup();
  await mount(app);
  await edit('Draft A');
  let finish!: (value: unknown) => void;
  app.patch.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await press('Save changes');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
  app.get.mockResolvedValue({ profile: row('Account B', 1, B) });
  await act(async () =>
    app.set({
      status: 'signed_in',
      sessionGeneration: 2,
      user: { user_id: B, email: null },
      credentialStatus: 'ready',
    }),
  );
  await waitFor(() => expect(name().props.value).toBe('Account B'));
  await act(async () => finish({ profile: row('Late A', 2) }));
  expect(name().props.value).toBe('Account B');
  await act(async () => onlineManager.setOnline(false));
  await edit('Offline B');
  await press('Save changes');
  expect(app.patch).toHaveBeenCalledTimes(1);
});

test('failed reconciliation keeps the draft blocked until a successful read and explicit choice', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(new ApiError('network', { requestMayHaveCommitted: true }));
  await mount(app);
  await edit('Unconfirmed draft');
  await press('Save changes');
  await screen.findByText('Check latest profile');
  app.get.mockRejectedValueOnce(new ApiError('forbidden'));
  await press('Check latest profile');
  await screen.findByText('The latest profile could not be loaded. Your draft is still here.');
  expect(name().props.value).toBe('Unconfirmed draft');
  await press('Save changes');
  expect(app.patch).toHaveBeenCalledTimes(1);
  app.get.mockResolvedValue({ profile: null });
  await press('Try again');
  await screen.findByText('Keep my edits');
  await press('Keep my edits');
  await press('Save changes');
  await waitFor(() =>
    expect(app.patch).toHaveBeenLastCalledWith({
      expected_revision: 0,
      display_name: 'Unconfirmed draft',
    }),
  );
});

test('same-user generation replacement drops its draft and remounts from the canonical profile', async () => {
  const app = setup();
  await mount(app);
  await edit('Old credential draft');
  app.get.mockResolvedValue({ profile: row('New generation', 3) });
  await act(async () =>
    app.set({
      status: 'signed_in',
      sessionGeneration: 2,
      user: { user_id: A, email: null },
      credentialStatus: 'ready',
    }),
  );
  await waitFor(() => expect(name().props.value).toBe('New generation'));
  expect(screen.queryByText('You have unsaved changes.')).toBeNull();
});

test('offline status immediately disables save and reconnect never replays an edit', async () => {
  const app = setup();
  await mount(app);
  await edit('Offline draft');
  await act(async () => onlineManager.setOnline(false));
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await act(async () => onlineManager.setOnline(true));
  expect(app.patch).not.toHaveBeenCalled();
  expect(name().props.value).toBe('Offline draft');
  await press('Discard changes');
  expect(name().props.value).toBe('Original');
});
