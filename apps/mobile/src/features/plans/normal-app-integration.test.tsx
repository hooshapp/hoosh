import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlanDraft, ProtectionIntegration, SettingsResponse } from '@disconnect/contracts';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  act,
  fireEvent,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { historyFixture } from '@/features/history/__tests__/history-fixture';
import { offered } from '@/features/recommendations/__tests__/fixture';
import Root from '@/app/_layout';
import Index from '@/app/index';
import AuthLayout from '@/app/(auth)/_layout';
import SignIn from '@/app/(auth)/sign-in';
import SignUp from '@/app/(auth)/sign-up';
import ConfirmEmail from '@/app/(auth)/confirm-email';
import ForgotPassword from '@/app/(auth)/forgot-password';
import ResetPassword from '@/app/(auth)/reset-password';
import SocialSignIn from '@/app/(auth)/social-sign-in';
import AuthCallback from '@/app/auth/callback';
import AuthLinkError from '@/app/auth/link-error';
import Welcome from '@/app/(onboarding)/welcome';
import OnboardingLayout from '@/app/(onboarding)/_layout';
import QuestDetail from '@/app/quest/[id]';
import NewQuest from '@/app/quest/new';
import Tabs from '@/app/(tabs)/_layout';
import Home from '@/app/(tabs)/index';
import Settings from '@/app/(tabs)/settings';
import Quests from '@/app/(tabs)/quests';
import History from '@/app/(tabs)/history';
import PreferenceDetail from '@/app/settings/[field]';
import { INITIAL_LINK_STATE, type LinkState } from '@/features/auth/link-flow';
import { SessionController } from '@/features/auth/session-controller';
import type { AuthRuntime } from '@/infrastructure/auth/supabase';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ApiError } from '@/infrastructure/api/errors';
import type { AppRuntime } from '@/infrastructure/auth/runtime';
import { createAndroidUsageIntegration } from '@/infrastructure/native/android-usage-adapter';
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
let mockUsageIntegration: ProtectionIntegration;
jest.mock('@/infrastructure/native/protection-integration', () => ({
  get deviceProtectionIntegration() { return mockUsageIntegration; },
}));
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
  index: Index,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignIn,
  '(auth)/sign-up': SignUp,
  '(auth)/confirm-email': ConfirmEmail,
  '(auth)/forgot-password': ForgotPassword,
  '(auth)/reset-password': ResetPassword,
  '(auth)/social-sign-in': SocialSignIn,
  'auth/callback': AuthCallback,
  'auth/link-error': AuthLinkError,
  '(onboarding)/_layout': OnboardingLayout,
  '(onboarding)/welcome': Welcome,
  'quest/[id]': QuestDetail,
  'quest/new': NewQuest,
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
  signedOut = false,
  recoveryPending = false,
  settingsMissing = false,
} = {}) {
  let authRevision = 0;
  const makeSession = (id: string) => ({
    user: { id },
    access_token: `fixture.${btoa(JSON.stringify({ session_id: `fixture-${++authRevision}` }))}.signature`,
    expires_at: Date.now() / 1000 + 3600,
  }) as Session;
  let stored: Session | null = signedOut ? null : makeSession(A);
  let emit: ((event: AuthChangeEvent, session: Session | null) => void) | undefined;
  const storage = new Map<string, string>();
  if (recoveryPending) {
    const flowId = 'fixture-recovery-flow';
    storage.set('fixture-session.pending', JSON.stringify({
      id: flowId,
      phase: 'recovery',
      kind: 'recovery',
      email: 'fixture@example.test',
      createdAt: Date.now(),
      lastSentAt: Date.now(),
      sessionKey: `${A}:fixture-${authRevision}`,
      redirectUrl: `disconnect-dev://auth/callback?flow=${flowId}`,
    }));
  }
  const sdk = {
    getSession: jest.fn(async () => ({
      data: { session: stored },
      error: null,
    })),
    onAuthStateChange: jest.fn((fn: typeof emit) => {
      emit = fn;
      return { data: { subscription: { unsubscribe: () => { emit = undefined; } } } };
    }),
    refreshSession: jest.fn(async () => ({
      data: { session: stored },
      error: null,
    })),
    signOut: jest.fn(async () => {
      stored = null;
      emit?.('SIGNED_OUT', null);
      return { error: null as unknown };
    }),
    signInWithPassword: jest.fn(),
    startAutoRefresh: jest.fn(async () => undefined),
    stopAutoRefresh: jest.fn(async () => undefined),
  };
  const auth = new SessionController(() => ({
    client: { auth: sdk },
    config: { storageKey: 'fixture-session' },
    storage: {
      getItem: async (key: string) => key === 'fixture-session' ? stored?.access_token ?? null : storage.get(key) ?? null,
      setItem: async (key: string, value: string) => { storage.set(key, value); },
      removeItem: async (key: string) => { storage.delete(key); },
    },
  }) as unknown as AuthRuntime);
  let identityResolve!: () => void;
  const identityWait = identityPending
    ? new Promise<void>((yes) => {
        identityResolve = yes;
      })
    : null;
  const settings = new Map<string, SettingsResponse>();
  let pendingAccountASettings: Promise<void> | null = null;
  let beforeSettingsPatch: (() => Promise<void>) | undefined;
  let afterSettingsPatch: (() => Promise<void>) | undefined;
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
  settings.set(A, settingsMissing ? { settings: null } : row(A, draft));
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
        await beforeSettingsPatch?.();
        const previous = settings.get(account.user_id)!;
        const value = previous.settings;
        if (options.json.expected_revision !== (value?.revision ?? 0))
          throw new ApiError('conflict', { code: 'SETTINGS_CONFLICT' });
        const updated = row(
          account.user_id,
          'plan_draft' in options.json ? options.json.plan_draft : value?.plan_draft ?? null,
          (value?.revision ?? 0) + 1,
        );
        if (!updated.settings) throw new Error('Fixture settings missing');
        const activities = 'activities' in options.json ? options.json.activities : value?.activities;
        updated.settings.activities = {
          selected_activity_ids: activities?.selected_activity_ids ?? [],
          custom_text: activities?.custom_text?.trim() ?? null,
        };
        result = updated;
        settings.set(account.user_id, updated);
        await afterSettingsPatch?.();
      } else {
        if (account.user_id === A && pendingAccountASettings) await pendingAccountASettings;
        result = settings.get(account.user_id);
      }
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
    setForeground: auth.setForeground,
    getPrivateAccessHeld: auth.getPrivateAccessHeld,
    authForms: auth,
    authLinks: auth,
    api,
    nativeNamespace: 'fixture',
    controller: createAccountDataController(auth, api),
  };
  let revision: number | null = installed ? 3 : null,
    enabled = installed,
    spec: PlanDraft | null = installed ? SAVED : null,
    savedCount = 1,
    permission = true;
  let selectionRevision = 1;
  let installedSelectionRevision = 1;
  let afterScheduleApply: (() => Promise<void>) | undefined;
  let needsReselection = false;
  let usagePermission = false;
  const openUsageAccess = jest.fn(async () => true);
  mockUsageIntegration = createAndroidUsageIntegration({
    getAuthorization: async () => usagePermission ? 'authorized' : 'denied',
    getCapabilities: jest.fn(),
    getStatus: jest.fn(),
    openUsageAccess,
  });
  let ownerLocked = locked,
    loseApply = false,
    pendingSelection: Promise<void> | null = null;
  const native = () => ({
    state: permission ? (enabled ? 'armed' : 'inactive') : 'needs_permission',
    installedRevision: revision,
    selectionRevision: revision === null ? null : installedSelectionRevision,
    selectedAppCount: revision === null ? 0 : savedCount,
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
        installedSelectionRevision = _selected;
        enabled = true;
        await afterScheduleApply?.();
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
      revision: selectionRevision,
      selectedAppCount: savedCount,
      needsReselection,
    })),
    selectionBegin: jest.fn(async () => {
      if (pendingSelection) await pendingSelection;
      return {
        draftId: HANDLE,
        groupId: 'global',
        baseRevision: selectionRevision,
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
      authorization: permission ? 'authorized' : 'denied',
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
        authorization: permission ? 'authorized' : 'denied',
        state: permission ? (enabled ? 'active' : 'inactive') : 'needs_permission',
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
    auth,
    finishSignOut: () => { stored = null; emit?.('SIGNED_OUT', null); },
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
    usagePermission: (value: boolean) => { usagePermission = value; },
    openUsageAccess,
    onAfterScheduleApply: (fn: () => Promise<void>) => { afterScheduleApply = fn; },
    selectionRevision: (value: number) => { selectionRevision = value; },
    removedApps: (value: boolean) => { needsReselection = value; },
    onBeforeSettingsPatch: (fn: () => Promise<void>) => { beforeSettingsPatch = fn; },
    onAfterSettingsPatch: (fn: () => Promise<void>) => { afterSettingsPatch = fn; },
    delayAccountASettings: (work: Promise<void>) => { pendingAccountASettings = work; },
    pendingSelection: (p: Promise<void>) => {
      pendingSelection = p;
    },
    switch: (id = B) => {
      stored = makeSession(id);
      emit?.('SIGNED_IN', stored);
      return stored;
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
  jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: () => {} });
  focusManager.setFocused(true);
  onlineManager.setOnline(true);
});
afterEach(() => {
  AppState.currentState = originalAppState;
  jest.useRealTimers();
  onlineManager.setOnline(true);
  focusManager.setFocused(true);
  mockPort = null;
  jest.restoreAllMocks();
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
  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(router.canGoBack()).toBe(false);
  await fireEvent.press(screen.getByRole('tab', { name: 'Settings' }));
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
  await screen.findByRole('header', { name: 'Hoosh login' });
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

test('signed-out private deep links land at the real public login screen', async () => {
  const f = fixture({ signedOut: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('header', { name: 'Hoosh login' });
  expect(screen).toHavePathname('/sign-in');
  expect(f.request).not.toHaveBeenCalled();
  expect(f.port.interventionOpen).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('link', { name: 'New here? Sign up' }));
  await screen.findByRole('header', { name: 'Hoosh sign up' });
  expect(screen).toHavePathname('/sign-up');
  expect(screen.queryByLabelText('Age')).toBeNull();
  await fireEvent.press(screen.getByRole('link', { name: 'Already have an account? Log in' }));
  await screen.findByRole('header', { name: 'Hoosh login' });
});

test('public login retains password bytes and keeps validation errors in the form', async () => {
  const f = fixture({ signedOut: true });
  f.sdk.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code: 'invalid_credentials' } });
  await renderRouter(routes, { initialUrl: '/sign-in' });
  const login = await screen.findByRole('button', { name: 'Log in' });
  await fireEvent.press(login);
  await screen.findByText('Enter a valid email address.');
  expect(f.sdk.signInWithPassword).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Email'), ' demo@example.test ');
  await fireEvent.changeText(screen.getByLabelText('Password'), ' short ');
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByText('Email or password is incorrect.');
  expect(f.sdk.signInWithPassword).toHaveBeenCalledWith({ email: 'demo@example.test', password: ' short ' });
});

test('a successful login opens the shared Home and keeps auth screens out of its back stack', async () => {
  const f = fixture({ signedOut: true });
  f.sdk.signInWithPassword.mockImplementationOnce(async () => {
    return { data: { session: f.switch(A) }, error: null };
  });
  await renderRouter(routes, { initialUrl: '/sign-in' });
  await screen.findByRole('header', { name: 'Hoosh login' });
  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByRole('tab', { name: 'Home' });
  expect(screen.queryByRole('header', { name: 'Hoosh login' })).toBeNull();
  expect(router.canGoBack()).toBe(false);
});

test('signup without a session shows confirmation guidance and never mounts private data', async () => {
  const f = fixture({ signedOut: true });
  let links: LinkState = INITIAL_LINK_STATE;
  const signUp = jest.fn(async () => {
    links = {
      ...INITIAL_LINK_STATE,
      pending: { id: 'fixture-signup-id', kind: 'signup', phase: 'requested',
        email: 'demo@example.test', createdAt: Date.now(), lastSentAt: Date.now(),
        redirectUrl: 'disconnect-dev://auth/callback?flow=fixture-signup-id' },
    };
  });
  const cancelLink = jest.fn(async () => { links = INITIAL_LINK_STATE; });
  mockRuntime = {
    ...mockRuntime,
    authForms: {
      signUp,
      getLinkSnapshot: () => links,
      resendConfirmation: jest.fn(async () => undefined),
      requestConfirmation: jest.fn(async () => undefined),
      cancelLink,
    },
  };
  await renderRouter(routes, { initialUrl: '/sign-up' });
  await screen.findByRole('header', { name: 'Hoosh sign up' });
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Demo');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.test');
  await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  await screen.findByText('Check your email');
  expect(signUp).toHaveBeenCalledWith('demo@example.test', 'fixture password', 'Demo', undefined);
  expect(screen.getByRole('button', { name: /^Resend in/ })).toBeDisabled();
  expect(f.request).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Return to log in' }));
  await screen.findByRole('header', { name: 'Hoosh login' });
  expect(cancelLink).toHaveBeenCalledTimes(1);
});

test('a reset route opened directly cannot authorize a password change', async () => {
  const f = fixture({ signedOut: true });
  await renderRouter(routes, { initialUrl: '/reset-password' });
  await screen.findByText('A verified recovery link is required. Request a new link on this device.');
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(f.request).not.toHaveBeenCalled();
});

test('forgot-password is reachable from the public sign-in form', async () => {
  fixture({ signedOut: true });
  await renderRouter(routes, { initialUrl: '/sign-in' });
  const link = await screen.findByRole('link', { name: 'Forgot password?' });
  await fireEvent.press(link);
  await screen.findByText('Reset your password');
  expect(screen).toHavePathname('/forgot-password');
});


test('local sign-out detaches private data before failed remote revocation returns', async () => {
  const f = fixture({ installed: true });
  let finish!: () => void;
  const server = new Promise<void>(resolve => { finish = resolve; });
  f.sdk.signOut.mockImplementationOnce(async () => {
    await server;
    f.finishSignOut();
    return { error: { code: 'fixture-offline' } };
  });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('button', { name: 'Stop weekly plan' });
  await press('Sign out of this device');
  expect(screen.queryByRole('button', { name: 'Stop weekly plan' })).toBeNull();
  await waitFor(() => expect(f.port.interventionEndOwner).toHaveBeenCalledWith(`fixture:${A}`, false));
  expect(f.installation().enabled).toBe(true);
  await act(finish);
  await screen.findByText('Signed out on this device. Server sign-out could not be confirmed.');
  expect(await f.auth.getAccessToken()).toBeNull();
  expect(f.port.interventionCancel).not.toHaveBeenCalled();
});

test('same-user session replacement clears the private editor and its back history', async () => {
  const f = fixture();
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByText('No weekly plan applied');
  await act(() => router.push({ pathname: '/settings/[field]', params: { field: 'days' } }));
  await waitFor(() => expect(screen).toHavePathname('/settings/days'));
  await act(() => { f.switch(A); });
  await waitFor(() => expect(screen).toHavePathname('/'));
  expect(router.canGoBack()).toBe(false);
  expect(f.port.selectionEndOwner).toHaveBeenCalledWith(`fixture:${A}`, false);
  expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
});


test('a restored recovery session cannot open private tabs or acquire a product token', async () => {
  const f = fixture({ recoveryPending: true, installed: true });
  await renderRouter(routes, { initialUrl: '/settings' });
  await screen.findByRole('header', { name: 'Hoosh login' });
  expect(screen.queryByRole('tab', { name: 'Settings' })).toBeNull();
  expect(f.auth.canResetPassword()).toBe(true);
  await expect(f.auth.getAccessToken()).rejects.toMatchObject({ reason: 'not_ready' });
  expect(f.request).not.toHaveBeenCalled();
  expect(f.port.interventionOpen).not.toHaveBeenCalled();
});


test('a delayed Settings response from account A cannot populate account B', async () => {
  const f = fixture();
  let release!: () => void;
  f.delayAccountASettings(new Promise<void>(resolve => { release = resolve; }));
  await renderRouter(routes, { initialUrl: '/settings' });
  await waitFor(() => expect(f.request).toHaveBeenCalledWith('/v1/settings', expect.anything()));
  await act(() => { f.switch(); });
  await waitFor(() => expect(screen).toHavePathname('/'));
  await fireEvent.press(screen.getByRole('tab', { name: 'Settings' }));
  await screen.findByText('Save days, hours, a time zone and session allowances before applying.');
  await act(release);
  expect(screen.getByRole('button', { name: 'Apply saved plan' })).toBeDisabled();
  expect(f.port.scheduleApply).not.toHaveBeenCalled();
});


test('setup reviews existing settings without replacing them and records local completion', async () => {
  const f = fixture({ installed: true });
  await AsyncStorage.clear();
  try {
    await renderRouter(routes, { initialUrl: '/settings' });
    await screen.findByRole('button', { name: 'Stop weekly plan' });
    await fireEvent.press(screen.getByRole('link', { name: 'Set up Hoosh' }));
    await screen.findByRole('button', { name: 'Review saved settings' });
    await press('Review saved settings');
    await screen.findByText('Reading');
    await screen.findByText('Active Hours');
    await press('Keep my settings');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.request.mock.calls.some(([, options]) => options.method === 'PATCH')).toBe(false);
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
    expect(f.installation().enabled).toBe(true);
  } finally {
    await AsyncStorage.clear();
  }
});


test('an incomplete local setup resumes once on Home and can be left without a loop', async () => {
  const f = fixture();
  await AsyncStorage.setItem(`hoosh.setup.fixture.${A}`, JSON.stringify({ version: 1, step: 'preferences' }));
  try {
    await renderRouter(routes);
    await screen.findByText('What do you want to do instead?');
    expect(screen).toHavePathname('/welcome');
    await press('Back to Home');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.queryByText('Set up Hoosh')).toBeNull();
    expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
    expect(f.request.mock.calls.some(([, options]) => options.method === 'PATCH')).toBe(false);
  } finally {
    await AsyncStorage.clear();
  }
});

test.each([false, true])('setup reviews a local plan via the manual path (%s)', async manual => {
  const f = fixture();
  const key = `hoosh.setup.fixture.${A}`;
  await AsyncStorage.setItem(key, JSON.stringify({ version: 1, step: 'preferences' }));
  try {
    await renderRouter(routes, { initialUrl: '/welcome' });
    const hobby = await screen.findByRole('checkbox', { name: 'Gym' });
    await fireEvent.press(hobby);
    await fireEvent.changeText(screen.getByLabelText('Custom activity'), '  Sketching 🦖  ');
    await press('Next →');
    await screen.findByRole('header', { name: 'We created a plan for you' });
    if (manual) {
      await press('Set up on my own');
      await press('Active Days');
      await fireEvent.press(screen.getByRole('checkbox', { name: 'Sunday' }));
      await press('Review days');
    }
    await press(manual ? 'Review my plan' : 'Go with suggestion');
    await screen.findByRole('header', { name: 'Review your draft' });
    expect(JSON.parse((await AsyncStorage.getItem(key))!)).toMatchObject({
      step: 'review',
      activities: { selected_activity_ids: ['gym'], custom_text: '  Sketching 🦖  ' },
      planDraft: { weekdays: manual ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4], session_count: 2, session_minutes: 15 },
    });
    expect(f.request.mock.calls.some(([, options]) => options.method === 'PATCH')).toBe(false);
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

const setupKey = `hoosh.setup.fixture.${A}`;
const reviewedSetup = {
  version: 1,
  step: 'review',
  settingsBaseRevision: 0,
  activities: { selected_activity_ids: ['gym'], custom_text: '  Sketching 🦖  ' },
  planDraft: SAVED,
};

async function openSetupReview(progress: object = reviewedSetup) {
  await AsyncStorage.setItem(setupKey, JSON.stringify(progress));
  await renderRouter(routes, { initialUrl: '/welcome' });
  await screen.findByRole('header', { name: 'Review your draft' });
}

function settingsWrites(f: ReturnType<typeof fixture>) {
  return f.request.mock.calls.filter(([path, options]) => path === '/v1/settings' && options.method === 'PATCH');
}

test('setup saves the reviewed activities and plan together and records the revision', async () => {
  const f = fixture({ settingsMissing: true });
  try {
    await openSetupReview();
    await press('Save to my account');
    await screen.findByText('Your preferences are saved to your account.');
    expect(settingsWrites(f).map(([, options]) => options.json)).toEqual([{
      expected_revision: 0, activities: reviewedSetup.activities, plan_draft: SAVED,
    }]);
    expect(f.settings.get(A)?.settings?.activities.custom_text).toBe('Sketching 🦖');
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({ step: 'permission', settingsRevision: 1 });
    await press('Finish for now');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('setup conflict requires a new decision and preserves an unrelated schedule', async () => {
  const f = fixture();
  const previous = f.settings.get(A)!.settings!;
  try {
    await openSetupReview({ ...reviewedSetup, settingsBaseRevision: 1, planDraft: undefined });
    f.onBeforeSettingsPatch(async () => {
      f.settings.set(A, { settings: { ...previous, revision: 2, plan_draft: { ...SAVED, session_count: 7 } } });
    });
    await press('Save to my account');
    await screen.findByText('Settings changed elsewhere. Review the latest values.');
    await press('Check latest settings');
    await screen.findByText('7 per day · 1 min each per app');
    await press('Keep my edits');
    expect(settingsWrites(f)).toHaveLength(1);
    await press('Save to my account');
    await screen.findByText('Your preferences are saved to your account.');
    expect(settingsWrites(f)[1]?.[1].json).toEqual({
      expected_revision: 2, activities: reviewedSetup.activities,
    });
    expect(f.settings.get(A)?.settings?.plan_draft?.session_count).toBe(7);
  } finally {
    await AsyncStorage.clear();
  }
});

test('a lost reply reconciles canonical settings and never sends a duplicate PATCH', async () => {
  const f = fixture({ settingsMissing: true });
  f.onAfterSettingsPatch(async () => { throw new ApiError('network', { requestMayHaveCommitted: true }); });
  try {
    await openSetupReview();
    await press('Save to my account');
    await screen.findByText('The save could not be confirmed. Check the latest settings.');
    await press('Check latest settings');
    await press('Confirm saved settings');
    await screen.findByText('Your preferences are saved to your account.');
    expect(settingsWrites(f)).toHaveLength(1);
  } finally {
    await AsyncStorage.clear();
  }
});

test('a restart with a pending attempt requires readback even if the server row is missing', async () => {
  const f = fixture({ settingsMissing: true });
  try {
    await openSetupReview({
      ...reviewedSetup,
      settingsAttempt: { expected_revision: 0, activities: reviewedSetup.activities, plan_draft: SAVED },
    });
    expect(screen.queryByRole('button', { name: 'Save to my account' })).toBeNull();
    await press('Check latest settings');
    await press('Keep my edits');
    expect(settingsWrites(f)).toHaveLength(0);
    await press('Save to my account');
    await screen.findByText('Your preferences are saved to your account.');
    expect(settingsWrites(f)).toHaveLength(1);
  } finally {
    await AsyncStorage.clear();
  }
});

test('a local receipt failure retries only the local write', async () => {
  const f = fixture({ settingsMissing: true });
  f.onAfterSettingsPatch(async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('fixture disk failure'));
  });
  try {
    await openSetupReview();
    await press('Save to my account');
    await screen.findByText('Your settings were saved to your account.');
    await screen.findByText('Setup could not be saved. Try again.');
    await press('Record setup progress');
    await screen.findByText('Your preferences are saved to your account.');
    expect(settingsWrites(f)).toHaveLength(1);
  } finally {
    await AsyncStorage.clear();
  }
});

test('logout during a save leaves the old account pending and keeps the new account isolated', async () => {
  const f = fixture({ settingsMissing: true });
  let finish!: () => void;
  const gate = new Promise<void>(resolve => { finish = resolve; });
  f.onAfterSettingsPatch(() => gate);
  try {
    await openSetupReview();
    await press('Save to my account');
    await waitFor(() => expect(settingsWrites(f)).toHaveLength(1));
    await act(() => { f.switch(); });
    await waitFor(() => expect(screen).toHavePathname('/'));
    await act(finish);
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'review', settingsAttempt: { expected_revision: 0 },
    });
    expect(await AsyncStorage.getItem(`hoosh.setup.fixture.${B}`)).toBeNull();
    expect(screen.queryByText('Your preferences are saved to your account.')).toBeNull();
  } finally {
    finish();
    await AsyncStorage.clear();
  }
});

test('offline setup can finish for now and later reopen its unsynced draft', async () => {
  const f = fixture({ settingsMissing: true });
  try {
    await openSetupReview();
    await act(() => onlineManager.setOnline(false));
    expect(screen.getByRole('button', { name: 'Save to my account' })).toBeDisabled();
    await press('Finish setup for now');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'complete', settingsDeferred: true, activities: reviewedSetup.activities, planDraft: SAVED,
    });
    expect(settingsWrites(f)).toHaveLength(0);
    await act(() => onlineManager.setOnline(true));
    await act(() => router.push('/(onboarding)/welcome'));
    await press('Resume my draft');
    await screen.findByRole('header', { name: 'Review your draft' });
    expect(settingsWrites(f)).toHaveLength(0);
  } finally {
    onlineManager.setOnline(true);
    await AsyncStorage.clear();
  }
});

async function openDeviceSetup() {
  await AsyncStorage.setItem(setupKey, JSON.stringify({
    version: 1, step: 'permission', settingsRevision: 1, planDraft: SAVED,
  }));
  await renderRouter(routes, { initialUrl: '/welcome' });
  await screen.findByRole('header', { name: 'Preferences reviewed' });
}

test('onboarding uses the verified native picker and rereads after explicit Save', async () => {
  const f = fixture();
  f.selectionCount(0);
  const draft = {
    draftId: HANDLE, groupId: 'global', baseRevision: 1, draftVersion: 1,
    selectedAppCount: 2, savedAppCount: 0, dirty: true,
  };
  f.port.selectionPick.mockResolvedValue(draft);
  f.port.selectionCommit.mockImplementation(async () => {
    f.selectionCount(2);
    f.selectionRevision(2);
    return { ...draft, baseRevision: 2, savedAppCount: 2, dirty: false };
  });
  try {
    await openDeviceSetup();
    await screen.findByText('No apps saved.');
    expect(screen.getByRole('button', { name: 'Continue to protection review' })).toBeDisabled();
    await press('Choose apps on this device');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose apps' })).toBeEnabled());
    await press('Choose apps');
    await screen.findByText('2 apps selected');
    expect(f.port.selectionCommit).not.toHaveBeenCalled();
    await press('Save selected apps');
    await screen.findByText('App selection saved on this device. Protection has not changed.');
    expect(f.port.selectionCommit).toHaveBeenCalledWith(`fixture:${A}`, HANDLE, 1);
    await press('Back');
    await screen.findByText('2 apps saved on this device.');
    await press('Continue to protection review');
    await screen.findByRole('header', { name: 'Review device setup' });
    expect(f.port.selectionRelease).toHaveBeenCalledWith(`fixture:${A}`, HANDLE);
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'protection', selectionRevision: 2,
    });
    expect(settingsWrites(f)).toHaveLength(0);
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('foreground return rechecks two independent permissions and detects revocation', async () => {
  const f = fixture();
  f.permission(false);
  const listeners = new Set<(state: AppStateStatus) => void>();
  jest.mocked(AppState.addEventListener).mockImplementation((event, listener) => {
    if (event !== 'change') return { remove: () => {} };
    const changed = listener as (state: AppStateStatus) => void;
    listeners.add(changed);
    return { remove: () => listeners.delete(changed) };
  });
  async function foreground() {
    for (const state of ['background', 'active'] as const) {
      await act(() => {
        AppState.currentState = state;
        listeners.forEach(listener => listener(state));
      });
    }
  }
  try {
    await openDeviceSetup();
    await screen.findByText(/Usage Access is off/);
    await press('Review Usage Access');
    expect(f.openUsageAccess).toHaveBeenCalledTimes(1);
    expect(f.port.interventionReviewAccess).not.toHaveBeenCalled();
    f.usagePermission(true);
    await foreground();
    await screen.findByText('Usage Access allowed.');
    expect(screen.getByRole('button', { name: 'Continue to protection review' })).toBeDisabled();
    await press('Review Accessibility access');
    expect(f.port.interventionReviewAccess).toHaveBeenCalledTimes(1);
    f.permission(true);
    await foreground();
    await screen.findByText('Accessibility access allowed for app protection.');
    expect(screen.getByRole('button', { name: 'Continue to protection review' })).toBeEnabled();
    f.permission(false);
    await foreground();
    await screen.findByText(/Accessibility access is off/);
    expect(screen.getByRole('button', { name: 'Continue to protection review' })).toBeDisabled();
    await press('Finish for now');
    await waitFor(() => expect(screen).toHavePathname('/'));
    await act(() => router.push('/(onboarding)/welcome'));
    await press('Resume device setup');
    await screen.findByRole('header', { name: 'Preferences reviewed' });
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('onboarding invalidates a same-count changed selection and flags removed apps', async () => {
  const f = fixture();
  try {
    await openDeviceSetup();
    await screen.findByText('1 app saved on this device.');
    f.selectionRevision(2);
    await press('Continue to protection review');
    await screen.findByText('Device access or app selection changed. Review the latest values.');
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!).step).toBe('permission');
    f.removedApps(true);
    await press('Check device access again');
    await screen.findByText('Some saved apps are no longer available. Choose your apps again.');
    expect(screen.getByRole('button', { name: 'Continue to protection review' })).toBeDisabled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('onboarding without a supported bridge lets the user defer without a synthetic selection', async () => {
  const f = fixture();
  mockPort = null;
  try {
    await openDeviceSetup();
    await screen.findByText(/unavailable in this .*build/);
    expect(screen.queryByRole('button', { name: 'Choose apps on this device' })).toBeNull();
    await press('Finish for now');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.port.selectionBegin).not.toHaveBeenCalled();
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'complete', permissionDeferred: true,
    });
  } finally {
    await AsyncStorage.clear();
  }
});

const reviewedProtection = {
  version: 1, step: 'protection', settingsRevision: 1, selectionRevision: 1, planDraft: SAVED,
};

async function openProtectionReview(progress: object = reviewedProtection) {
  await AsyncStorage.setItem(setupKey, JSON.stringify(progress));
  await renderRouter(routes, { initialUrl: '/welcome' });
  await screen.findByRole('header', { name: 'Review device setup' });
}

test.each([false, true])('normal sign-in through setup and Apply (manual path: %s)', async manual => {
  const f = fixture({ signedOut: true, settingsMissing: true });
  f.sdk.signInWithPassword.mockImplementationOnce(async () => ({
    data: { session: f.switch(A) }, error: null,
  }));
  try {
    await renderRouter(routes, { initialUrl: '/sign-in' });
    await screen.findByRole('header', { name: 'Hoosh login' });
    await fireEvent.changeText(screen.getByLabelText('Email'), 'demo@example.test');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'fixture-password');
    await press('Log in');
    await fireEvent.press(await screen.findByRole('tab', { name: 'Settings' }));
    await fireEvent.press(await screen.findByRole('link', { name: 'Set up Hoosh' }));
    await pressWhenReady('Start setup');
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Gym' }));
    await press('Next →');
    await screen.findByRole('header', { name: 'We created a plan for you' });
    if (manual) {
      await press('Set up on my own');
      await press('Active Days');
      await fireEvent.press(screen.getByRole('checkbox', { name: 'Sunday' }));
      await press('Review days');
    }
    await press(manual ? 'Review my plan' : 'Go with suggestion');
    await pressWhenReady('Save to my account');
    await screen.findByText('Accessibility access allowed for app protection.');
    const saved = f.settings.get(A)?.settings?.plan_draft;
    expect(saved?.weekdays).toEqual(manual ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4]);
    const staged = {
      draftId: HANDLE, groupId: 'global', baseRevision: 1, draftVersion: 1,
      selectedAppCount: 2, savedAppCount: 1, dirty: true,
    };
    f.port.selectionPick.mockResolvedValue(staged);
    f.port.selectionCommit.mockImplementationOnce(async () => {
      f.selectionCount(2);
      f.selectionRevision(2);
      return { ...staged, baseRevision: 2, savedAppCount: 2, dirty: false };
    });
    await press('Choose apps on this device');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose apps' })).toBeEnabled());
    await press('Choose apps');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save selected apps' })).toBeEnabled());
    await press('Save selected apps');
    await screen.findByText('App selection saved on this device. Protection has not changed.');
    await press('Back');
    await screen.findByText('2 apps saved on this device.');
    await press('Continue to protection review');
    await screen.findByRole('header', { name: 'Review device setup' });
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Preview schedule' })).toBeEnabled());
    await press('Preview schedule');
    await screen.findByRole('header', { name: 'Upcoming times on this device' });
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply protection' })).toBeEnabled());
    await press('Apply protection');
    await screen.findByText('This device confirmed the applied schedule.');
    expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
    expect(f.port.scheduleApply).toHaveBeenCalledWith(`fixture:${A}`, HANDLE, 0, 1, 2, saved);

    // The install remains confirmed if writing the completion marker fails.
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('fixture disk failure'));
    await press('Finish setup');
    await screen.findByText('Setup progress could not be recorded. Try again.');
    await press('Finish setup');
    await waitFor(() => expect(screen).toHavePathname('/'));
    await screen.findByText('App interventions active');
    expect(settingsWrites(f)).toHaveLength(1);
    expect(f.port.selectionCommit).toHaveBeenCalledTimes(1);
    expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'complete', permissionDeferred: false,
    });
  } finally {
    await AsyncStorage.clear();
  }
}, 15000);

test('a selection revision change during Apply requires readback and a new review', async () => {
  const f = fixture();
  try {
    await openProtectionReview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply protection' })).toBeEnabled());
    f.selectionRevision(2);
    await press('Apply protection');
    await screen.findByRole('button', { name: 'Check device after Apply' });
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
    await press('Check device after Apply');
    await pressWhenReady('Review latest device setup');
    expect(screen.getByRole('button', { name: 'Apply protection' })).toBeDisabled();
    await press('Review device access again');
    await screen.findByRole('header', { name: 'Preferences reviewed' });
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('a lost Apply reply reconciles exact native schedule and selection without replay', async () => {
  const f = fixture();
  f.loseApply();
  try {
    await openProtectionReview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply protection' })).toBeEnabled());
    await press('Apply protection');
    await screen.findByText('Plan change not confirmed');
    expect(screen.queryByRole('button', { name: 'Apply protection' })).toBeNull();
    await press('Check device after Apply');
    await screen.findByText('This device confirmed the applied schedule.');
    await press('Finish setup');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.port.scheduleApply).toHaveBeenCalledTimes(1);
    expect(settingsWrites(f)).toHaveLength(0);
  } finally {
    await AsyncStorage.clear();
  }
});

test('a restart at the attempted native revision confirms without another apply', async () => {
  const f = fixture({ installed: true });
  try {
    await openProtectionReview({
      ...reviewedProtection,
      protectionAttempt: { revision: 3, selectionRevision: 1, spec: SAVED },
    });
    await screen.findByText('This device confirmed the applied schedule.');
    await press('Finish setup');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
  } finally {
    await AsyncStorage.clear();
  }
});

test('offline protection setup can defer without clearing a saved account plan', async () => {
  const f = fixture();
  try {
    await openProtectionReview();
    await act(() => onlineManager.setOnline(false));
    await screen.findByText('Connect to verify the latest saved plan before applying.');
    expect(screen.getByRole('button', { name: 'Apply protection' })).toBeDisabled();
    await press('Finish for now');
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(f.port.scheduleApply).not.toHaveBeenCalled();
    expect(f.settings.get(A)?.settings?.plan_draft).toEqual(SAVED);
  } finally {
    await AsyncStorage.clear();
  }
});

test('replacement account does not receive a late native installation receipt', async () => {
  const f = fixture();
  let release!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  f.onAfterScheduleApply(() => hold);
  try {
    await openProtectionReview();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply protection' })).toBeEnabled());
    await press('Apply protection');
    await waitFor(() => expect(f.port.scheduleApply).toHaveBeenCalledTimes(1));
    await act(() => { f.switch(); });
    await waitFor(() => expect(screen).toHavePathname('/'));
    await act(release);
    expect(screen.queryByText('This device confirmed the applied schedule.')).toBeNull();
    expect(JSON.parse((await AsyncStorage.getItem(setupKey))!)).toMatchObject({
      step: 'protection', protectionAttempt: { revision: 1, selectionRevision: 1 },
    });
    expect(await AsyncStorage.getItem(`hoosh.setup.fixture.${B}`)).toBeNull();
  } finally {
    release();
    await AsyncStorage.clear();
  }
});
