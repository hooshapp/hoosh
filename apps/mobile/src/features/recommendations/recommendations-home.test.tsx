import type {
  AuthSessionPort,
  AuthSnapshot,
  RecommendationView,
} from '@disconnect/contracts';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text } from 'react-native';
import { ConnectedHomeScreen } from '@/features/home/connected-home-screen';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { A, ID, offered } from './__tests__/fixture';
const B = '00000000-0000-4000-8000-000000000003';
function setup() {
  let state: AuthSnapshot = {
    status: 'signed_in',
    credentialStatus: 'ready',
    sessionGeneration: 1,
    user: { user_id: A, email: null },
  };
  let value = offered(),
    lose = false,
    failed = false;
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: () => state,
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
  let pending: Promise<void> | null = null;
  const request = jest.fn(async (path, options) => {
    const account =
      state.status === 'signed_in'
        ? {
            user_id: state.user.user_id,
            sessionGeneration: state.sessionGeneration,
          }
        : null;
    let result: unknown = { settings: null };
    if (path.startsWith('/v1/recommendations/')) {
      if (failed) throw new ApiError('network');
      if (options.method === 'PUT') {
        if (pending) await pending;
        if (value.state !== 'offered') {
          if (value.state === options.json.action)
            return options.decode(value, { account });
          throw new ApiError('conflict', { code: 'RECOMMENDATION_CONFLICT' });
        }
        value = {
          ...value,
          state: options.json.action,
          offer: null,
          accepted_quest_id: options.json.action === 'accepted' ? ID : null,
          next_offer_at: new Date(Date.now() + 86400000).toISOString(),
        };
        if (lose) {
          lose = false;
          throw new ApiError('network', { requestMayHaveCommitted: true });
        }
      }
      result =
        account?.user_id === B
          ? {
              ...offered(),
              user_id: B,
              offer: {
                ...offered().offer,
                title: 'A fresh offline idea',
                offer_id: B,
              },
            }
          : value;
    }
    return options.decode(result, { account });
  });
  const api = {
    configuration: { status: 'ready' },
    getRecoveryState: () => 'ready',
    request,
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api),
    open = jest.fn();
  return {
    request,
    open,
    value: () => value,
    lose: () => {
      lose = true;
    },
    fail: () => {
      failed = true;
    },
    setValue: (v: RecommendationView) => {
      value = v;
    },
    replace: () => {
      state = {
        status: 'signed_in',
        credentialStatus: 'ready',
        sessionGeneration: 2,
        user: { user_id: B, email: null },
      };
      listeners.forEach((fn) => fn());
    },
    hold: () => {
      let release!: () => void;
      pending = new Promise<void>((done) => {
        release = done;
      });
      return release;
    },
    ui: (showHome = true) => (
      <AccountDataProvider
        controller={controller}
        fallback={<Text>Signed out</Text>}
      >
        {showHome ? (
          <ConnectedHomeScreen onOpenQuest={open} />
        ) : (
          <Text>Elsewhere</Text>
        )}
      </AccountDataProvider>
    ),
  };
}
const press = (name: string) =>
  act(async () => fireEvent.press(screen.getByRole('button', { name })));
afterEach(() => onlineManager.setOnline(true));
test('actual Home shows interest template, completion-only reward and Accept opens one-time quest review', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  expect(screen.getByText(/Inspired by your saved activities/)).toBeTruthy();
  expect(screen.getByText(/Accept saves a one-time quest/)).toBeTruthy();
  await press('Accept');
  await waitFor(() => expect(s.open).toHaveBeenCalledWith(ID));
  expect(
    s.request.mock.calls.filter(([, o]) => o.method === 'PUT'),
  ).toHaveLength(1);
  expect(
    s.request.mock.calls.find(([, o]) => o.method === 'PUT')?.[1].json,
  ).toEqual({ offer_id: ID, action: 'accepted' });
  expect(
    screen.getByRole('button', { name: 'Open quest' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Check latest suggestion' })).toBeNull();
});
test('Skip persists without accepting, navigating, activating or awarding', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  await press('✕ Skip');
  await waitFor(() =>
    expect(screen.getByText(/Suggestion skipped/)).toBeTruthy(),
  );
  expect(s.open).not.toHaveBeenCalled();
  expect(s.value().state).toBe('skipped');
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
});
test('lost committed Accept response cannot auto-repeat; fresh read recovers review action', async () => {
  const s = setup();
  s.lose();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  await press('Accept');
  await waitFor(() =>
    expect(screen.getByText(/Your choice was not confirmed/)).toBeTruthy(),
  );
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  expect(s.open).not.toHaveBeenCalled();
  await press('Check latest suggestion');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Open quest' }),
    ).toBeTruthy(),
  );
  await press('Open quest');
  expect(s.open).toHaveBeenCalledWith(ID);
  expect(
    s.request.mock.calls.filter(([, o]) => o.method === 'PUT'),
  ).toHaveLength(1);
});
test('offline hides advice and cannot create or skip quests', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  await act(async () => onlineManager.setOnline(false));
  expect(screen.queryByText('Read for a little while')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Accept' })).toBeNull();
  expect(
    s.request.mock.calls.filter(([, o]) => o.method === 'PUT'),
  ).toHaveLength(0);
});
test('expired offer is disabled until a verified refresh', async () => {
  const s = setup();
  s.setValue(offered(Date.now() - 1200000));
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText(/This suggestion expired/)).toBeTruthy(),
  );
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
});
test('account replacement during Accept suppresses old navigation and private response', async () => {
  const s = setup(),
    release = s.hold();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  await press('Accept');
  await act(async () => {
    s.replace();
    release();
  });
  await waitFor(() => expect(s.open).not.toHaveBeenCalled());
  expect(screen.queryByText(/Saved a one-time quest/)).toBeNull();
});

test('a replay acknowledged after quest deletion never claims a new save or navigates', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  s.setValue({
    ...offered(),
    state: 'accepted',
    offer: null,
    accepted_quest_id: null,
    next_offer_at: new Date(Date.now() + 86400000).toISOString(),
  });
  await press('Accept');
  await waitFor(() =>
    expect(screen.getByText(/quest is no longer saved/)).toBeTruthy(),
  );
  expect(s.open).not.toHaveBeenCalled();
  expect(
    screen.queryByRole('button', { name: 'Open quest' }),
  ).toBeNull();
});

test('leaving Home before Accept settles cannot trigger late navigation', async () => {
  const s = setup(),
    release = s.hold();
  const view = await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText('Read for a little while')).toBeTruthy(),
  );
  await press('Accept');
  await view.rerender(s.ui(false));
  await act(async () => {
    release();
  });
  await waitFor(() => expect(s.value().state).toBe('accepted'));
  expect(s.open).not.toHaveBeenCalled();
  expect(screen.getByText('Elsewhere')).toBeTruthy();
});
