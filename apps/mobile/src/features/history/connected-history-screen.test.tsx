import type {
  AuthSessionPort,
  AuthSnapshot,
  HistoryView,
} from '@disconnect/contracts';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { renderRouter } from 'expo-router/testing-library';
import { Platform, Text } from 'react-native';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import {
  NativeOwnerContext,
  type NativeOwner,
} from '@/features/protection/native-owner-boundary';
import { ConnectedHistoryScreen } from './connected-history-screen';
import { ConnectedHomeScreen } from '../home/connected-home-screen';
import { historyFixture } from './__tests__/history-fixture';
const A = historyFixture.user_id,
  B = '00000000-0000-4000-8000-000000000009',
  HANDLE = '00000000-0000-4000-8000-000000000008';
function setup(value: HistoryView = historyFixture) {
  let snapshot: AuthSnapshot = {
    status: 'signed_in',
    credentialStatus: 'ready',
    sessionGeneration: 1,
    user: { user_id: A, email: null },
  };
  let stored = value,
    fail = false,
    lose = false;
  const listeners = new Set<() => void>();
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
  };
  const native = {
    state: 'ready',
    series: {
      series_id: value.series_id,
      timezone_id: 'UTC',
      selected_count: 2,
      started_on: value.started_on,
      source: 'android_usage_events_v1',
      days: [],
    },
  };
  const port = {
    interventionProtectionRead: jest.fn(async () => {
      throw new Error('Protection unavailable in History fixture');
    }),
    historyRead: jest.fn(async () => native),
    historyStart: jest.fn(async () => native),
    historyStop: jest.fn(async () => {
      port.historyRead.mockResolvedValue({
        state: 'not_started',
        series: null,
      } as never);
    }),
    interventionOpen: jest.fn(async () => HANDLE),
    interventionRelease: jest.fn(async () => {}),
    openUsageAccess: jest.fn(async () => true),
  };
  const request = jest.fn(async (path, options) => {
    const account =
      snapshot.status === 'signed_in'
        ? {
            user_id: snapshot.user.user_id,
            sessionGeneration: snapshot.sessionGeneration,
          }
        : null;
    if (fail) throw new ApiError('forbidden');
    if (options.method === 'PUT') {
      if (options.json.expected_revision !== stored.revision)
        throw new ApiError('conflict', {
          code: 'HISTORY_CONFLICT',
          details: { current_revision: stored.revision },
        });
      stored = { ...stored, series_id: options.json.series_id };
      if (lose) {
        lose = false;
        throw new ApiError('network', { requestMayHaveCommitted: true });
      }
    }
    return options.decode(
      { ...stored, user_id: account?.user_id },
      { account },
    );
  });
  const api = {
    configuration: { status: 'ready' },
    getRecoveryState: () => 'ready',
    request,
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  const binding = {
    owner: `qa:${A}`,
    generation: 1,
    port,
  } as unknown as NativeOwner;
  return {
    controller,
    port,
    request,
    native,
    set: (next: AuthSnapshot) => {
      snapshot = next;
      listeners.forEach((fn) => fn());
    },
    fail: () => {
      fail = true;
    },
    lose: () => {
      lose = true;
    },
    ui: (showHome = false) => (
      <AccountDataProvider
        controller={controller}
        fallback={<Text>Signed out</Text>}
      >
        <NativeOwnerContext.Provider value={binding}>
          <ConnectedHistoryScreen />
          {showHome ? <ConnectedHomeScreen /> : null}
        </NativeOwnerContext.Provider>
      </AccountDataProvider>
    ),
  };
}
const press = async (name: string) =>
  act(async () => fireEvent.press(screen.getByRole('button', { name })));
beforeEach(() => { jest.replaceProperty(Platform, 'OS', 'android'); });
afterEach(() => { onlineManager.setOnline(true); jest.restoreAllMocks(); });
test('actual account History shows measured comparison, receipt types and shared week/month navigation', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  expect(screen.getByText(/Opening 3 · session-end 2/)).toBeTruthy();
  expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  await press('Next history page');
  expect(screen.getByText('50')).toBeTruthy();
  await press('This month');
  expect(screen.getAllByText(/28\/28 closed days/).length).toBeGreaterThan(0);
  await press('View time reclaimed');
  expect(screen.getByLabelText('50% less screen time')).toBeTruthy();
  expect(screen.queryByText(/1.8 years/)).toBeNull();
});
test('negative savings remain visible without positive time-freed circles', async () => {
  const s = setup({
    ...historyFixture,
    week: {
      ...historyFixture.week,
      usage_ms: 21 * 3600000,
      saved_ms: -7 * 3600000,
      reduction_percent: -50,
    },
  });
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('-7')).toBeTruthy());
  await press('Next history page');
  expect(screen.getByText('More screen time')).toBeTruthy();
  await press('View time reclaimed');
  expect(screen.getByText(/Usage increased; no time-freed/)).toBeTruthy();
  expect(screen.queryByLabelText(/less screen time/)).toBeNull();
});
test('selection mismatch never uploads or shows old comparison as current', async () => {
  const s = setup();
  s.port.historyRead.mockResolvedValue({
    state: 'selection_changed',
    series: null,
  } as never);
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText(/Your saved apps changed/)).toBeTruthy(),
  );
  expect(screen.queryByText('7')).toBeNull();
  expect(s.request.mock.calls.some(([, o]) => o.method === 'PUT')).toBe(false);
  expect(screen.getByText('6')).toBeTruthy();
});
test('collection cancellation does not upload a new series or install protection', async () => {
  const s = setup();
  s.port.historyStart.mockResolvedValueOnce(null as never);
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  const before = s.request.mock.calls.filter(
    ([, o]) => o.method === 'PUT',
  ).length;
  await press('Restart History baseline');
  await waitFor(() => expect(s.port.interventionRelease).toHaveBeenCalled());
  expect(
    s.request.mock.calls.filter(([, o]) => o.method === 'PUT'),
  ).toHaveLength(before);
});
test('offline/error masks saved metrics and account replacement cannot reuse native owner', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  await act(async () => onlineManager.setOnline(false));
  expect(screen.queryByText('6')).toBeNull();
  await act(async () => {
    s.fail();
    s.set({
      status: 'signed_in',
      credentialStatus: 'ready',
      sessionGeneration: 2,
      user: { user_id: B, email: null },
    });
    onlineManager.setOnline(true);
  });
  await waitFor(() => expect(screen.queryByText('6')).toBeNull());
  expect(s.port.historyStart).not.toHaveBeenCalled();
});
test('zero baseline keeps measured hours but explains unavailable percentage', async () => {
  const s = setup({
    ...historyFixture,
    week: {
      ...historyFixture.week,
      baseline_ms: 0,
      saved_ms: -7 * 3600000,
      reduction_percent: null,
    },
  });
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('-7')).toBeTruthy());
  await press('Next history page');
  await press('View time reclaimed');
  expect(
    screen.getByText(
      /Percentage is unavailable because baseline usage was zero/,
    ),
  ).toBeTruthy();
});

test('confirmed restart uses the reviewed revision and stopping clears only local collection', async () => {
  const s = setup();
  const replacement = '00000000-0000-4000-8000-000000000099';
  s.port.historyStart.mockResolvedValueOnce({
    ...s.native,
    series: { ...s.native.series, series_id: replacement },
  });
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  await press('Restart History baseline');
  await waitFor(() =>
    expect(screen.getByText(/History started. Comparisons/)).toBeTruthy(),
  );
  const writes = s.request.mock.calls.filter(([, o]) => o.method === 'PUT');
  expect(writes.at(-1)?.[1].json).toMatchObject({
    series_id: replacement,
    expected_revision: historyFixture.revision,
  });
  await press('Stop History collection');
  await waitFor(() =>
    expect(screen.getByText(/Collection stopped on this device/)).toBeTruthy(),
  );
  expect(s.port.historyStop).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: 'Stop History collection' }),
  ).toBeNull();
});
test('a lost committed restart response is read back without automatically replacing the series', async () => {
  const s = setup();
  const replacement = '00000000-0000-4000-8000-000000000099';
  s.port.historyStart.mockImplementationOnce(async () => {
    s.native.series.series_id = replacement;
    s.lose();
    return s.native;
  });
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  await press('Restart History baseline');
  await waitFor(() =>
    expect(screen.getByText(/History setup was not confirmed/)).toBeTruthy(),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Stop History collection' }),
    ).toBeTruthy(),
  );
  expect(s.port.historyStart).toHaveBeenCalledTimes(1);
});
test('selection mismatch still allows stopping the private collector', async () => {
  const s = setup();
  s.port.historyRead.mockResolvedValue({
    state: 'selection_changed',
    series: null,
  } as never);
  await render(s.ui());
  await waitFor(() =>
    expect(screen.getByText(/Your saved apps changed/)).toBeTruthy(),
  );
  await press('Stop History collection');
  await waitFor(() =>
    expect(screen.getByText(/Collection stopped on this device/)).toBeTruthy(),
  );
  expect(s.port.historyStop).toHaveBeenCalledTimes(1);
});
test('native read failure keeps receipts but does not imply a working device collector', async () => {
  const s = setup();
  s.port.historyRead.mockRejectedValue(new Error('unavailable'));
  await render(s.ui());
  await waitFor(() =>
    expect(
      screen.getByText(/Device History could not be verified/),
    ).toBeTruthy(),
  );
  expect(screen.getByText('6')).toBeTruthy();
  expect(screen.queryByText('7')).toBeNull();
});

test('Home and History share the same scoped comparison and both hide it offline', async () => {
  const s = setup();
  await renderRouter({ index: () => s.ui(true) }, { initialUrl: '/' });
  const home = () => within(screen.getByTestId('home-weekly-card'));
  await waitFor(() => expect(home().getByText('7')).toBeTruthy());
  expect(screen.getByText('6')).toBeTruthy();
  const reads = s.request.mock.calls.filter(
    ([path, options]) => path === '/v1/history' && options.method !== 'PUT',
  );
  expect(reads).toHaveLength(1);
  await act(async () => onlineManager.setOnline(false));
  expect(home().queryByText('7')).toBeNull();
  expect(screen.queryByText('6')).toBeNull();
});

test('collection can stop offline without an HTTP mutation or revealing cached metrics', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  const before = s.request.mock.calls.length;
  await act(async () => onlineManager.setOnline(false));
  await press('Stop History collection');
  await waitFor(() =>
    expect(screen.getByText(/Collection stopped on this device/)).toBeTruthy(),
  );
  expect(s.port.historyStop).toHaveBeenCalledTimes(1);
  expect(s.request.mock.calls).toHaveLength(before);
  expect(screen.queryByText('6')).toBeNull();
});

test('a pending native read cannot reactivate collection presentation after Stop', async () => {
  const s = setup();
  await render(s.ui());
  await waitFor(() => expect(screen.getByText('6')).toBeTruthy());
  let resolve!: (value: typeof s.native) => void;
  const pending = new Promise<typeof s.native>((done) => {
    resolve = done;
  });
  s.port.historyRead.mockReturnValueOnce(pending);
  await press('Check latest History');
  await waitFor(() => expect(s.port.historyRead).toHaveBeenCalledTimes(2));
  await press('Stop History collection');
  await waitFor(() =>
    expect(screen.getByText(/Collection stopped on this device/)).toBeTruthy(),
  );
  await act(async () => {
    resolve(s.native);
    await pending;
  });
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Stop History collection' }),
    ).toBeNull(),
  );
  expect(screen.queryByText('7')).toBeNull();
});

 test('iPhone never imports a stored Android series or enables Android collection', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const s = setup();
  await render(s.ui());
  await waitFor(() => expect(screen.getByText(/iPhone usage measurement is unavailable/)).toBeTruthy());
  expect(s.port.historyRead).not.toHaveBeenCalled();
  expect(screen.queryByText('Source: Android selected-app usage estimate.')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Start History' })).toBeNull();
  expect(screen.queryByLabelText('50% less screen time')).toBeNull();
  await press('Next history page');
  expect(screen.queryByText('50')).toBeNull();
});
