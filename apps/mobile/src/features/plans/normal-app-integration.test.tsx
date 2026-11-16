import type { PlanDraft, SettingsResponse } from '@disconnect/contracts';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import {
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { historyFixture } from '@/features/history/__tests__/history-fixture';
import { offered } from '@/features/recommendations/__tests__/fixture';
import Root from '@/app/_layout';
import Tabs from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Settings from '@/app/(tabs)/settings';
import Quests from '@/app/(tabs)/quests';
import History from '@/app/(tabs)/history';
import PreferenceDetail from '@/app/settings/[field]';
import { createAuthSession } from '@/infrastructure/auth/session';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ApiError } from '@/infrastructure/api/errors';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import type { ProductNativePort } from '@/infrastructure/native/product-ports';

const A = '00000000-0000-4000-8000-000000000001',
  B = '00000000-0000-4000-8000-000000000002';
const HANDLE = '00000000-0000-4000-8000-000000000099';
const SAVED: PlanDraft = {
  weekdays: [0, 2],
  hours: { start_local: '09:00', end_local: '17:00', next_day: false },
  timezone_id: 'UTC',
  session_count: 2,
  session_minutes: 1,
};
let mockRuntime: AppRuntime, mockPort: ProductNativePort | null;
jest.mock('@/infrastructure/auth/runtime', () => ({
  createAppRuntime: () => mockRuntime,
}));
jest.mock('@/infrastructure/native/product-ports', () => ({
  get productNativePort() {
    return mockPort;
  },
}));
jest.mock('@expo-google-fonts/space-grotesk', () => ({
  useFonts: () => [true, null],
  SpaceGrotesk_300Light: 1,
  SpaceGrotesk_400Regular: 1,
  SpaceGrotesk_500Medium: 1,
  SpaceGrotesk_700Bold: 1,
}));
jest.mock('expo-network', () => ({
  addNetworkStateListener: () => ({ remove: jest.fn() }),
  getNetworkStateAsync: async () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
}));
const routes = {
  _layout: Root,
  '(tabs)/_layout': Tabs,
  '(tabs)/index': Home,
  '(tabs)/settings': Settings,
  '(tabs)/quests': Quests,
  '(tabs)/history': History,
  'settings/[field]': PreferenceDetail,
};
function fixture({
  installed = false,
  locked = false,
  draft = SAVED as PlanDraft | null,
  identityPending = false,
  identityUnavailable = false,
} = {}) {
  let stored: Session | null = {
    user: { id: A },
    access_token: 'synthetic-sdk-credential',
  } as Session;
  let emit: ((event: string, session: Session | null) => void) | undefined;
  const sdk = {
    getSession: jest.fn(async () => ({
      data: { session: stored },
      error: null,
    })),
    onAuthStateChange: jest.fn((fn) => {
      emit = fn;
      return { data: { subscription: { unsubscribe: () => {} } } };
    }),
    refreshSession: jest.fn(async () => ({
      data: { session: stored },
      error: null,
    })),
    signOut: jest.fn(async () => {
      stored = null;
      emit?.('SIGNED_OUT', null);
      return { error: null };
    }),
    signInWithPassword: jest.fn(),
    startAutoRefresh: jest.fn(),
    stopAutoRefresh: jest.fn(),
  };
  const auth = createAuthSession(sdk as unknown as SupabaseClient['auth']);
  let identityResolve!: () => void;
  const identityWait = identityPending
    ? new Promise<void>((yes) => {
        identityResolve = yes;
      })
    : null;
  const settings = new Map<string, SettingsResponse>();
  const row = (
    id: string,
    value: PlanDraft | null,
    revision = 1,
  ): SettingsResponse => ({
    settings: {
      user_id: id,
      revision,
      activities: { selected_activity_ids: ['reading'], custom_text: null },
      plan_draft: value,
      created_at: '2026-11-14T00:00:00Z',
      updated_at: '2026-11-14T00:00:00Z',
    },
  });
  settings.set(A, row(A, draft));
  settings.set(B, { settings: null });
  const request = jest.fn(async (path, options) => {
    const state = auth.getSnapshot();
    if (state.status !== 'signed_in') throw new ApiError('no_session');
    const account = {
      user_id: state.user.user_id,
      sessionGeneration: state.sessionGeneration,
    };
    let result: unknown;
    if (path === '/v1/me') {
      if (identityWait) await identityWait;
      if (identityUnavailable) throw new ApiError('unavailable');
      result = { user_id: account.user_id, email: null };
    } else if (path === '/v1/settings') {
      if (options.method === 'PATCH') {
        const previous = settings.get(account.user_id)!;
        const value = previous.settings;
        if (options.json.expected_revision !== (value?.revision ?? 0))
          throw new ApiError('conflict', { code: 'SETTINGS_CONFLICT' });
        result = row(
          account.user_id,
          options.json.plan_draft ?? value?.plan_draft ?? null,
          (value?.revision ?? 0) + 1,
        );
        settings.set(account.user_id, result as SettingsResponse);
      } else result = settings.get(account.user_id);
    } else if (path === '/v1/profile') result = { profile: null };
    else if (path === '/v1/rewards')
      result = {
        user_id: account.user_id,
        revision: 1,
        balance: account.user_id === A ? 50 : 0,
        health: 50,
        artwork: 'doingOkay',
        feed_cost: 20,
        feed_health: 20,
        streak_days: null,
        recent_week_complete: false,
        observed_at: new Date().toISOString(),
        policy_version: 1,
      };
    else if (path === '/v1/history')
      result = { ...historyFixture, user_id: account.user_id };
    else if (path === '/v1/recommendations/current')
      result = { ...offered(), user_id: account.user_id };
    else throw new ApiError('unavailable'); // Unrelated product producers retain their honest unavailable state.
    return options.decode(result, { account });
  });
  const api = {
    configuration: { status: 'ready' },
    getRecoveryState: () => 'ready',
    request,
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  mockRuntime = {
    auth,
    canClearSession: true,
    setForeground: (active) => active ? sdk.startAutoRefresh() : sdk.stopAutoRefresh(),
    api,
    nativeNamespace: 'fixture',
    controller: createAccountDataController(auth, api),
  };
  let revision: number | null = installed ? 3 : null,
    enabled = installed,
    spec: PlanDraft | null = installed ? SAVED : null,
    savedCount = 1,
    permission = true;
  let ownerLocked = locked,
    loseApply = false,
    pendingSelection: Promise<void> | null = null;
  const native = () => ({
    state: permission ? (enabled ? 'armed' : 'inactive') : 'needs_permission',
    installedRevision: revision,
    selectionRevision: revision === null ? null : 1,
    selectedAppCount: revision === null ? 0 : 1,
    reasonCount: enabled ? 1 : 0,
    pendingEventCount: 0,
    overlayVisible: false,
    disclosureAccepted: true,
    serviceConnected: permission,
  });
  const windows = [
    {
      reasonId: 'weekly_2026-11-14',
      startsAt: Date.now() - 1000,
      endsAt: Date.now() + 600000,
    },
  ];
  const installation = () => ({
    observedAt: Date.now(),
    native: native(),
    enabled,
    spec,
    otherInstallation: false,
    windows: enabled ? windows : [],
  });
  const port = {
    scheduleRead: jest.fn(async () => {
      if (ownerLocked) throw Error('private owner');
      return installation();
    }),
    schedulePreview: jest.fn(async () => ({ windows })),
    scheduleApply: jest.fn(
      async (_owner, _handle, expected, next, _selected, value) => {
        if (revision !== null && expected !== revision) throw Error('conflict');
        revision = next;
        spec = value;
        enabled = true;
        if (loseApply) {
          loseApply = false;
          throw Error('lost acknowledgement');
        }
        return installation();
      },
    ),
    interventionCancel: jest.fn(async (_owner, _handle, expected) => {
      if (expected !== revision) throw Error('conflict');
      revision = expected + 1;
      enabled = false;
    }),
    interventionOpen: jest.fn(async () => HANDLE),
    interventionRelease: jest.fn(async () => {}),
    interventionReviewAccess: jest.fn(async () => true),
    interventionClaimOwner: jest.fn(async () => {
      ownerLocked = false;
      revision = null;
      enabled = false;
      spec = null;
      return native();
    }),
    interventionEndOwner: jest.fn(async () => {}),
    selectionEndOwner: jest.fn(async () => {}),
    selectionRead: jest.fn(async (owner) => ({
      owner,
      revision: 1,
      selectedAppCount: savedCount,
    })),
    selectionBegin: jest.fn(async () => {
      if (pendingSelection) await pendingSelection;
      return {
        draftId: HANDLE,
        groupId: 'global',
        baseRevision: 1,
        draftVersion: 0,
        selectedAppCount: savedCount,
        savedAppCount: savedCount,
        dirty: false,
      };
    }),
    selectionPick: jest.fn(),
    selectionCommit: jest.fn(),
    selectionRelease: jest.fn(async () => {}),
    interventionProtectionRead: jest.fn(async () => ({
      schemaVersion: 3,
      authorization: permission ? 'authorized' : 'revoked',
      capabilities: {
        platform: 'android',
        selectionUI: 'unavailable',
        mode: 'overlay',
        supportsUsageThreshold: false,
        supportsScheduledRestriction: true,
        supportsTemporaryAllowance: true,
        supportsAdvanceWarning: false,
        supportsUsageSummary: false,
      },
      status: {
        authorization: permission ? 'authorized' : 'revoked',
        state: enabled ? 'active' : 'inactive',
        installedRevision: revision,
        installedReasonIds: enabled ? ['weekly_2026-11-14'] : [],
      },
    })),
  };
  mockPort = port as unknown as ProductNativePort;
  return {
    port,
    request,
    settings,
    installation,
    sdk,
    unlockIdentity: () => identityResolve(),
    loseApply: () => {
      loseApply = true;
    },
    selectionCount: (n: number) => {
      savedCount = n;
    },
    permission: (value: boolean) => {
      permission = value;
    },
    pendingSelection: (p: Promise<void>) => {
      pendingSelection = p;
    },
    switch: (id = B) => {
      stored = {
        user: { id },
        access_token: 'synthetic-other-credential',
      } as Session;
      emit?.('SIGNED_IN', stored);
    },
  };
}
const press = async (label: string | RegExp) => {
  await fireEvent.press(screen.getByRole('button', { name: label }));
  await act(async () => {
    jest.runAllTicks();
  });
};
const originalAppState = AppState.currentState;
beforeEach(() => {
  AppState.currentState = 'active';
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
});
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.useRealTimers();
  onlineManager.setOnline(true);
  focusManager.setFocused(true);
  mockPort = null;
});

test('normal Root verifies ownership, exposes the saved plan in Settings and reuses one native controller across tabs', async () => {
  const f = fixture();
  await renderRouter(routes);
  await pressWhenReady('Manage app schedule');
  expect(screen).toHavePathname('/settings');
  await screen.findByRole('button', {
    name: /Distracting Apps\. 1 apps selected on this device/,
  });
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
  expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
  expect(f.port.selectionBegin).not.toHaveBeenCalled(); // Status polling must not create picker drafts.
  await press('Preview saved plan');
  await screen.findByText('Preview only. Your device schedule is unchanged.');
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
  await press('Apply saved plan');
  await screen.findByText('Plan applied to this device.');
  expect(f.port.scheduleApply).toHaveBeenCalledWith(
    `fixture:${A}`,
    HANDLE,
    0,
    1,
    1,
    SAVED,
  );
  await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
  await screen.findByText('App interventions active');
  await press('Manage app schedule');
  await press('Stop weekly plan');
  await screen.findByText(
    'Schedule stopped. Settings and allowance history retained.',
  );
  expect(f.installation().enabled).toBe(false);
  expect(f.settings.get(A)?.settings?.plan_draft).toEqual(SAVED);
});
async function pressWhenReady(label: string) {
  await screen.findByRole('button', { name: label });
  await press(label);
}

test('normal root never binds SDK identity to native before the verified API identity returns', async () => {
  const f = fixture({ identityPending: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await waitFor(() =>
    expect(f.request).toHaveBeenCalledWith('/v1/me', expect.anything()),
  );
  expect(f.port.scheduleRead).not.toHaveBeenCalled();
  expect(f.port.interventionOpen).not.toHaveBeenCalled();
  await act(f.unlockIdentity);
  await screen.findByText('No weekly plan applied');
});

test('an unavailable API identity keeps the signed-in app from binding native state', async () => {
  const f = fixture({ identityUnavailable: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await waitFor(() =>
    expect(f.request).toHaveBeenCalledWith('/v1/me', expect.anything()),
  );
  expect(screen.getByRole('button', { name: 'Sign out of this device' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Preview saved plan' })).toBeNull();
  expect(screen).toHavePathname('/settings');
  expect(screen.queryByText('Welcome back')).toBeNull();
  expect(f.port.selectionRead).not.toHaveBeenCalled();
  expect(f.port.scheduleRead).not.toHaveBeenCalled();
  expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
});

test('saved editor changes update account draft only; explicit Apply then uses the newly acknowledged draft', async () => {
  const f = fixture();
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('No weekly plan applied');
  await press(/^Draft days\./);
  await screen.findByRole('checkbox', { name: 'Thursday' });
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Thursday' }));
  await press('Save days');
  await screen.findByText('Draft saved.');
  expect(f.settings.get(A)?.settings?.plan_draft?.weekdays).toEqual([0, 2, 3]);
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
  await act(() => router.back());
  await screen.findByRole('button', { name: 'Apply saved plan' });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Apply saved plan' }),
    ).toBeEnabled(),
  );
  await press('Apply saved plan');
  await screen.findByText('Plan applied to this device.');
  expect(f.port.scheduleApply.mock.calls[0][5].weekdays).toEqual([0, 2, 3]);
});

test('offline blocks Preview/Apply but actual installed weekly Stop remains available', async () => {
  const f = fixture({ installed: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('button', { name: 'Stop weekly plan' });
  await act(() => onlineManager.setOnline(false));
  expect(
    screen.getByRole('button', { name: 'Apply saved plan changes' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Preview saved plan' }),
  ).toBeDisabled();
  await press('Stop weekly plan');
  await screen.findByText(
    'Schedule stopped. Settings and allowance history retained.',
  );
  expect(f.port.interventionCancel).toHaveBeenCalledWith(
    `fixture:${A}`,
    HANDLE,
    3,
    null,
  );
});

test('lost committed Apply requires readback and never replays the write', async () => {
  const f = fixture();
  f.loseApply();
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('No weekly plan applied');
  await press('Apply saved plan');
  await screen.findByText('Plan change not confirmed');
  expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
  await press('Refresh device schedule');
  await screen.findByText('Device change confirmed.');
  expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole('button', { name: 'Stop weekly plan' }),
  ).toBeEnabled();
});

test('device account takeover needs an explicit confirmation and never installs a schedule', async () => {
  const f = fixture({ locked: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await pressWhenReady('Use this account on this device');
  await press('Keep current setup');
  expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
  await act(async () => {});
  await press('Use this account on this device');
  await screen.findByRole('button', { name: 'Confirm device account' });
  await press('Confirm device account');
  await screen.findByText('No weekly plan applied');
  expect(f.port.interventionClaimOwner).toHaveBeenCalledWith(
    `fixture:${A}`,
    HANDLE,
    true,
  );
  expect(f.port.interventionRelease).toHaveBeenCalledWith(
    `fixture:${A}`,
    HANDLE,
  );
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});

test('account replacement during an opened selection fences the prior Apply and hides its draft', async () => {
  const f = fixture();
  let release!: () => void;
  f.pendingSelection(
    new Promise<void>((yes) => {
      release = yes;
    }),
  );
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('No weekly plan applied');
  await press('Apply saved plan');
  await waitFor(() => expect(f.port.selectionBegin).toHaveBeenCalledTimes(1));
  await act(() => f.switch());
  await act(release);
  await screen.findByText(
    'Save days, hours, a time zone and session allowances before applying.',
  );
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
  expect(f.port.interventionEndOwner).toHaveBeenCalledWith(
    `fixture:${A}`,
    false,
  );
  expect(
    screen.getByRole('button', { name: 'Apply saved plan' }),
  ).toBeDisabled();
});

test('missing weekly methods preserve native quest support but disable weekly activation', async () => {
  const f = fixture();
  mockPort = { ...mockPort!, scheduleApply: undefined };
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('App schedule unavailable');
  expect(
    screen.getByRole('button', { name: 'Apply saved plan' }),
  ).toBeDisabled();
  expect(f.port.scheduleRead).not.toHaveBeenCalled();
});

test('normal account Home composes actual reward/history/recommendation consumers with native management', async () => {
  fixture();
  await renderRouter(routes);
  await waitFor(() =>
    expect(screen.getByTestId('home-credit-value')).toHaveTextContent('50'),
  );
  await screen.findByText('Read for a little while');
  expect(screen.getByLabelText('Dino health 50%')).toBeVisible();
  await pressWhenReady('Manage app schedule');
  await fireEvent.press(screen.getByRole('tab', { name: 'History' }));
  await screen.findByText('Your stats');
});

test('app-selection read failure disables Apply without losing the independent native Stop', async () => {
  const f = fixture({ installed: true });
  f.port.selectionRead.mockRejectedValue(
    new Error('private selection storage'),
  );
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText(
    'Saved app choices could not be read. Refresh before applying. Your installed weekly plan can still be stopped.',
  );
  expect(
    screen.getByRole('button', { name: 'Apply saved plan changes' }),
  ).toBeDisabled();
  await press('Stop weekly plan');
  await screen.findByText(
    'Schedule stopped. Settings and allowance history retained.',
  );
  expect(f.port.interventionCancel).toHaveBeenCalledTimes(1);
});

test('explicitly cleared account draft never falls back to a retained installed schedule', async () => {
  const f = fixture({ installed: true, draft: null });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText(
    'Save days, hours, a time zone and session allowances before applying.',
  );
  expect(
    screen.getByRole('button', { name: 'Apply saved plan changes' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Stop weekly plan' }),
  ).toBeEnabled();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});

test('normal Settings sign-out removes private routes and retains installed protection without writes', async () => {
  const f = fixture({ installed: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('button', { name: 'Stop weekly plan' });
  await press('Sign out of this device');
  await screen.findByText('Welcome back');
  expect(screen.queryByRole('button', { name: 'Stop weekly plan' })).toBeNull();
  expect(f.port.interventionEndOwner).toHaveBeenCalledWith(
    `fixture:${A}`,
    false,
  );
  expect(f.port.interventionCancel).not.toHaveBeenCalled();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
  expect(f.installation().enabled).toBe(true);
});

test('foreground permission revocation is re-read without automatic reinstallation', async () => {
  const f = fixture({ installed: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('button', { name: 'Stop weekly plan' });
  f.permission(false);
  await press('Refresh device schedule');
  await screen.findByText('App access needed');
  expect(
    screen.getByRole('button', { name: 'Apply saved plan changes' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Stop weekly plan' }),
  ).toBeEnabled();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});

test('rejected Apply readback releases review state without replaying a failed write', async () => {
  const f = fixture();
  f.port.scheduleApply.mockRejectedValueOnce(new Error('native rejected'));
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('No weekly plan applied');
  await press('Apply saved plan');
  await screen.findByText('Plan change not confirmed');
  await press('Refresh device schedule');
  await screen.findByText(
    'The latest device schedule differs from your attempted change. Review it before applying again.',
  );
  expect(
    screen.getByRole('button', { name: 'Apply saved plan' }),
  ).toBeEnabled();
  expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
});
