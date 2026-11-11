import type { AuthSessionPort, AuthSnapshot, QuestView } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { ManagedQuestEditor } from './managed-quest-editor';
import { ConnectedQuestsScreen } from './connected-quests-screen';
import fixture from '../../../../../packages/contracts/fixtures/quests-v1.json';
jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({ confirmation: null, exit: (fn: () => void) => fn() }),
}));
const A = fixture.quest.user_id,
  B = '00000000-0000-4000-8000-000000000002',
  ID = fixture.quest.quest_id;
const signed = (user_id = A, sessionGeneration = 1): AuthSnapshot => ({
  status: 'signed_in',
  credentialStatus: 'ready',
  sessionGeneration,
  user: { user_id, email: null },
});
function setup(existing = true) {
  let snapshot = signed(),
    stored = existing ? (fixture.quest as QuestView) : null,
    revision = existing ? 1 : 0;
  let lose = false,
    hold: ((value: unknown) => void) | null = null;
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
  const request = jest.fn(async (path, options) => {
    const current = snapshot.status === 'signed_in' ? snapshot.user.user_id : B;
    const owner = { user_id: current, sessionGeneration: snapshot.sessionGeneration };
    if (options.method) {
      const expected = options.json.expected_revision;
      if (current !== A || expected !== revision)
        throw new ApiError('conflict', {
          code: 'QUEST_CONFLICT',
          details: { current_revision: revision },
        });
      revision++;
      stored =
        options.method === 'PUT'
          ? ({ ...fixture.quest, revision, definition: options.json.definition } as QuestView)
          : null;
      const value = options.method === 'PUT' ? { quest: stored } : { quest_id: ID, revision };
      if (lose) {
        lose = false;
        throw new ApiError('network', { requestMayHaveCommitted: true });
      }
      if (hold)
        await new Promise<void>((yes) => {
          const next = hold!;
          hold = null;
          next(yes);
        });
      return options.decode(value, { account: owner });
    }
    const own = current === A ? stored : null;
    const value = path.includes('?')
      ? { quests: own ? [own] : [], next_cursor: null }
      : { quest: own, revision: current === A ? revision : 0 };
    return options.decode(value, { account: owner });
  });
  const api = {
    configuration: { status: 'ready', origin: 'https://api.example', timeoutMs: 15000 },
    request,
    getRecoveryState: () => 'ready',
    health: jest.fn(),
    recoverSession: jest.fn(),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    controller,
    request,
    stored: () => stored,
    lose: () => {
      lose = true;
    },
    external: () => {
      revision++;
      stored = {
        ...stored!,
        revision,
        definition: { ...fixture.quest.definition, title: 'Other edit' },
      } as QuestView;
    },
    set: (value: AuthSnapshot) => {
      snapshot = value;
      listeners.forEach((fn) => fn());
    },
    hold: (callback: (release: () => void) => void) => {
      hold = callback as never;
    },
  };
}
async function mount(f: ReturnType<typeof setup>, creating = false, back = jest.fn()) {
  await render(
    <AccountDataProvider controller={f.controller}>
      <ManagedQuestEditor questId={ID} creating={creating} onBack={back} />
    </AccountDataProvider>,
  );
  await screen.findByLabelText('Quest name');
  return back;
}
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
afterEach(() => {
  onlineManager.setOnline(true);
});
test('reads a saved quest, edits only on Save and never claims activation', async () => {
  const f = setup();
  await mount(f);
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'New title');
  expect(f.stored()?.definition.title).toBe('Read a chapter');
  await press('Save quest');
  await screen.findByText('Quest saved. App interventions have not changed.');
  expect(f.stored()?.revision).toBe(2);
  expect(f.stored()?.definition.title).toBe('New title');
  expect(f.request.mock.calls.filter(([, o]) => o.method === 'PUT')).toHaveLength(1);
});
test('new editor saves complete fields with a stable fresh ID', async () => {
  const f = setup(false);
  await mount(f, true);
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'Study');
  await fireEvent.changeText(screen.getByLabelText('What will you do?'), 'Read');
  await press('Start time: Choose time');
  await fireEvent.changeText(screen.getByLabelText('Start time (24-hour HH:MM)'), '10:00');
  await press('End time: Choose time');
  await fireEvent.changeText(screen.getByLabelText('End time (24-hour HH:MM)'), '10:30');
  await fireEvent.changeText(screen.getByLabelText('Quest time zone'), 'UTC');
  await press('Save quest');
  await screen.findByText('Quest saved. App interventions have not changed.');
  expect(f.stored()?.definition.repeat).toBe('none');
  expect(f.request.mock.calls.find(([, o]) => o.method === 'PUT')?.[0]).toBe(`/v1/quests/${ID}`);
});
test('committed lost save is not retried and requires explicit read/review', async () => {
  const f = setup();
  await mount(f);
  f.lose();
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'Uncertain');
  await press('Save quest');
  await screen.findByText(/Change not confirmed/);
  expect(screen.queryByText('Quest saved. App interventions have not changed.')).toBeNull();
  await press('Check latest quest');
  await screen.findByText(/Latest saved quest: Uncertain/);
  await press('Use latest quest');
  expect(screen.getByLabelText('Quest name')).toHaveDisplayValue('Uncertain');
  expect(screen.getByRole('button', { name: 'Save quest' })).toBeDisabled();
  expect(f.request.mock.calls.filter(([, o]) => o.method === 'PUT')).toHaveLength(1);
});
test('conflict retains raw draft, review preserves deliberate edits and save uses latest revision', async () => {
  const f = setup();
  await mount(f);
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'My draft');
  f.external();
  await act(async () => {
    const scope = f.controller.getSnapshot().scope!;
    await scope.client.invalidateQueries({ queryKey: scope.key('quest', ID) });
  });
  expect(screen.getByLabelText('Quest name')).toHaveDisplayValue('My draft');
  await press('Save quest');
  await screen.findByText(/This quest changed elsewhere/);
  expect(screen.getByLabelText('Quest name')).toHaveDisplayValue('My draft');
  await press('Check latest quest');
  await screen.findByText(/Latest saved quest: Other edit/);
  await press('Keep my quest edits');
  await press('Save quest');
  await screen.findByText('Quest saved. App interventions have not changed.');
  expect(f.stored()?.revision).toBe(3);
});
test('delete requires confirmation and committed lost response is recovered by read only', async () => {
  const f = setup(),
    back = jest.fn();
  await mount(f, false, back);
  await press('Delete saved quest');
  await press('Keep quest');
  expect(f.stored()).not.toBeNull();
  await press('Delete saved quest');
  f.lose();
  await press('Delete quest');
  await screen.findByText(/Change not confirmed/);
  expect(back).not.toHaveBeenCalled();
  await press('Back');
  await screen.findByText('Discard unsaved changes?');
  await press('Keep editing');
  expect(back).not.toHaveBeenCalled();
  await press('Check latest quest');
  await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
  expect(f.stored()).toBeNull();
  expect(f.request.mock.calls.filter(([, o]) => o.method === 'DELETE')).toHaveLength(1);
});
test('offline retains draft and blocks writes', async () => {
  const f = setup();
  await mount(f);
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'Offline draft');
  await act(() => onlineManager.setOnline(false));
  expect(screen.getByLabelText('Quest name')).toHaveDisplayValue('Offline draft');
  expect(screen.getByRole('button', { name: 'Save quest' })).toBeDisabled();
  expect(f.request.mock.calls.filter(([, o]) => o.method)).toHaveLength(0);
});
test('owner replacement fences an accepted pending response and private draft', async () => {
  const f = setup();
  await mount(f);
  let release!: () => void;
  f.hold((yes) => {
    release = yes;
  });
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'A private draft');
  await press('Save quest');
  await waitFor(() => expect(release).toBeDefined());
  await act(() => f.set(signed(B, 2)));
  await act(() => release());
  await screen.findByText('Quest no longer saved');
  expect(screen.queryByDisplayValue('A private draft')).toBeNull();
  expect(screen.queryByText('Quest saved. App interventions have not changed.')).toBeNull();
});
test('connected list shows actual saved data and removes it when offline', async () => {
  const f = setup(),
    open = jest.fn();
  await render(
    <AccountDataProvider controller={f.controller}>
      <ConnectedQuestsScreen onCreate={jest.fn()} onOpen={open} />
    </AccountDataProvider>,
  );
  await screen.findByText('Read a chapter');
  expect(screen.getByText('Accepted')).toBeVisible();
  expect(screen.getByText(/Saved · not active/)).toBeVisible();
  await press('Edit Read a chapter');
  expect(open).toHaveBeenCalledWith(ID);
  await act(() => onlineManager.setOnline(false));
  expect(screen.queryByText('Read a chapter')).toBeNull();
  expect(screen.getByText('Connect to load or save quests. Your draft is still here.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create a custom quest' })).toBeDisabled();
});
test('empty saved collection is distinct from unavailable and paging uses exclusive cursors', async () => {
  const f = setup(false),
    create = jest.fn();
  const view = await render(
    <AccountDataProvider controller={f.controller}>
      <ConnectedQuestsScreen onCreate={create} onOpen={jest.fn()} />
    </AccountDataProvider>,
  );
  await screen.findByText('No saved quests yet');
  await press('Create a custom quest');
  expect(create).toHaveBeenCalledTimes(1);
  await view.unmount();
  const paged = setup(),
    secondId = '00000000-0000-4000-8000-000000000020';
  const normal = paged.request.getMockImplementation()!;
  paged.request.mockImplementation(async (path, options) => {
    if (path.includes('?'))
      return options.decode(
        {
          quests: [
            {
              ...fixture.quest,
              quest_id: path.includes('cursor=') ? secondId : ID,
              definition: {
                ...fixture.quest.definition,
                title: path.includes('cursor=') ? 'Second page' : 'First page',
              },
            },
          ],
          next_cursor: path.includes('cursor=') ? null : ID,
        },
        { account: { user_id: A, sessionGeneration: 1 } },
      );
    return normal(path, options);
  });
  await render(
    <AccountDataProvider controller={paged.controller}>
      <ConnectedQuestsScreen onCreate={jest.fn()} onOpen={jest.fn()} />
    </AccountDataProvider>,
  );
  await screen.findByText('First page');
  await press('More saved quests');
  await screen.findByText('Second page');
  expect(screen.queryByText('First page')).toBeNull();
  await press('Previous quests');
  await screen.findByText('First page');
});
