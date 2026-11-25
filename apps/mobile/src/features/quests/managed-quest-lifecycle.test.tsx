import type {
  AuthSessionPort,
  AuthSnapshot,
  QuestExecutionView,
  QuestScheduleVersionView,
} from '@disconnect/contracts';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import fixture from '../../../../../packages/contracts/fixtures/quests-v1.json';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import type { ProductNativePort } from '@/infrastructure/native/product-ports';
import type { QuestDeviceSpec } from '@/infrastructure/native/quest-device';
import { NativeOwnerContext } from '@/features/protection/native-owner-boundary';
import { ManagedQuestEditor } from './managed-quest-editor';

jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  router: { push: jest.fn() },
}));
jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({
    confirmation: null,
    exit: (fn: () => void) => fn(),
  }),
}));
const ID = fixture.quest.quest_id,
  OWNER = `fixture:${fixture.quest.user_id}`;
function setup() {
  const snapshot: AuthSnapshot = {
    status: 'signed_in',
    credentialStatus: 'ready',
    sessionGeneration: 1,
    user: { user_id: fixture.quest.user_id, email: null },
  };
  const auth: AuthSessionPort = {
    getSnapshot: () => snapshot,
    subscribe: () => () => {},
    getAccessToken: jest.fn(),
    revalidateSession: jest.fn(),
  };
  let execution: QuestExecutionView = {
    user_id: fixture.quest.user_id,
    quest_id: ID,
    revision: 0,
    enabled: false,
    observed_at: '2026-11-11T12:00:00Z',
    versions: [],
    occurrences: [],
    credits: 0,
    completed_count: 0,
  };
  let spec: QuestDeviceSpec | null = null,
    nativeRevision = 0,
    deleted = false;
  const calls: string[] = [];
  const request = jest.fn(async (path, options) => {
    let value: unknown;
    if (path.endsWith('/execution')) value = execution;
    else if (path === '/v1/settings')
      value = {
        settings: {
          user_id: fixture.quest.user_id,
          revision: 1,
          activities: { selected_activity_ids: [], custom_text: null },
          plan_draft: {
            weekdays: [],
            hours: null,
            timezone_id: 'UTC',
            session_count: 2,
            session_minutes: 1,
          },
          created_at: fixture.quest.created_at,
          updated_at: fixture.quest.updated_at,
        },
      };
    else if (path.endsWith('/schedule')) {
      calls.push('server-schedule');
      execution = {
        ...execution,
        revision: 1,
        enabled: true,
        versions: [
          {
            revision: 1,
            quest_revision: 1,
            first_date: options.json.first_date,
            definition: fixture.quest.definition,
            effective_from: execution.observed_at,
            effective_until: null,
            enabled: true,
          } as QuestScheduleVersionView,
        ],
      };
      value = execution;
    } else if (options.method === 'DELETE') {
      calls.push('server-delete');
      deleted = true;
      value = { quest_id: ID, revision: 2 };
    } else
      value = {
        quest: deleted ? null : fixture.quest,
        revision: deleted ? 2 : 1,
      };
    return options.decode(value, {
      account: { user_id: fixture.quest.user_id },
    });
  });
  const read = () => ({
    owner: OWNER,
    questId: ID,
    observedAt: Date.parse(execution.observed_at),
    remoteRevision: spec?.remoteRevision ?? 0,
    requestId: spec?.requestId ?? null,
    enabled: spec?.enabled ?? false,
    policy: nativeRevision
      ? { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 60 }
      : null,
    versions: spec?.enabled ? spec.versions : [],
    windows: [],
    cancelled: [],
    native: {
      schemaVersion: 3,
      state: 'inactive',
      installedRevision: nativeRevision || null,
      selectionRevision: nativeRevision ? 1 : null,
      selectedAppCount: nativeRevision ? 1 : 0,
      reasonCount: 0,
      pendingEventCount: 0,
      discardedEventCount: 0,
      overlayVisible: false,
      disclosureAccepted: true,
      serviceConnected: true,
    },
  });
  const port = {
    questRead: jest.fn(async () => read()),
    interventionOpen: jest.fn(
      async () => '00000000-0000-4000-8000-000000000009',
    ),
    interventionRelease: jest.fn(async () => {}),
    selectionRead: jest.fn(async () => ({
      owner: OWNER,
      revision: 1,
      selectedAppCount: 1,
    })),
    questApply: jest.fn(
      async (_owner, _token, _revision, next: QuestDeviceSpec) => {
        calls.push(next.enabled ? 'native-install' : 'native-stop');
        spec = next;
        nativeRevision++;
        return read();
      },
    ),
  } as unknown as ProductNativePort;
  const api = {
    configuration: {
      status: 'ready',
      origin: 'https://api.example',
      timeoutMs: 15000,
    },
    request,
    getRecoveryState: () => 'ready',
    health: jest.fn(),
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  const back = jest.fn();
  return {
    calls,
    back,
    render: () =>
      render(
        <AccountDataProvider controller={controller}>
          <NativeOwnerContext.Provider
            value={{ owner: OWNER, generation: 1, port }}
          >
            <ManagedQuestEditor questId={ID} onBack={back} />
          </NativeOwnerContext.Provider>
        </AccountDataProvider>,
      ),
  };
}
const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
it('connects real editor/hooks/controller to strict server and device receipts without activation on read', async () => {
  const f = setup();
  await f.render();
  await screen.findByRole('button', { name: 'Protection options' });
  expect(screen.queryByText('Quest schedule')).toBeNull();
  await press('Protection options');
  await screen.findByText('Account schedule is stopped.');
  expect(f.calls).toEqual([]);
  await fireEvent.changeText(
    screen.getByLabelText('First quest date (YYYY-MM-DD)'),
    '2026-11-12',
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Schedule quest' }),
    ).toBeEnabled(),
  );
  await press('Schedule quest');
  await screen.findByText(
    'Schedule installed on this device. Protection follows the saved times shown below.',
  );
  expect(f.calls).toEqual(['server-schedule', 'native-install']);
});
it('confirms native Stop before deleting the saved definition and exiting', async () => {
  const f = setup();
  await f.render();
  await screen.findByRole('button', { name: 'Protection options' });
  expect(screen.queryByText('Quest schedule')).toBeNull();
  await press('Protection options');
  await screen.findByText('Account schedule is stopped.');
  await press('Delete saved quest');
  await press('Delete quest');
  await waitFor(() => expect(f.back).toHaveBeenCalled());
  expect(f.calls).toEqual(['native-stop', 'server-delete']);
});
it('does not schedule the saved snapshot while the definition contains unsaved edits', async () => {
  const f = setup();
  await f.render();
  await screen.findByRole('button', { name: 'Protection options' });
  expect(screen.queryByText('Quest schedule')).toBeNull();
  await press('Protection options');
  await screen.findByText('Account schedule is stopped.');
  await fireEvent.changeText(
    screen.getByLabelText('Quest name'),
    'Unsaved change',
  );
  await fireEvent.changeText(
    screen.getByLabelText('First quest date (YYYY-MM-DD)'),
    '2026-11-12',
  );
  expect(screen.getByRole('button', { name: 'Schedule quest' })).toBeDisabled();
  expect(f.calls).toEqual([]);
});
