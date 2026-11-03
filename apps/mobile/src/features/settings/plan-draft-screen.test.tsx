import type { AuthSessionPort, AuthSnapshot, SettingsView } from '@disconnect/contracts';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { Text, View } from 'react-native';
import { ApiError } from '@/infrastructure/api/errors';
import { createAccountDataController } from '@/infrastructure/query/account-controller';
import { AccountDataProvider } from '@/infrastructure/query/account-data-provider';
import type { AccountApi } from '@/infrastructure/query/account-scope';
import { emptyPlanDraft, type PlanField } from '@/features/plans/plan-draft-model';
import { PlanDraftScreen } from './plan-draft-screen';
import { ActivityPreferencesScreen } from './activity-preferences-screen';
import { ConnectedSettingsScreen } from './connected-settings-screen';
import PreferenceDetail from '@/app/settings/[field]';

jest.mock('@/features/editors/use-route-draft-guard', () => ({
  useRouteDraftGuard: () => ({ confirmation: null, exit: (navigate: () => void) => navigate() }),
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ field: 'days' }),
}));
const A = 'a46e48ad-c742-4e18-b57d-2c9a56544944';
const B = 'c3f11b37-139e-4c09-b5d8-808c66100a10';
const signedIn = (user_id = A, sessionGeneration = 1): AuthSnapshot => ({
  status: 'signed_in',
  sessionGeneration,
  user: { user_id, email: null },
  credentialStatus: 'ready',
});
const row = (revision = 1, user_id = A): SettingsView => ({
  user_id,
  revision,
  activities: { selected_activity_ids: ['reading'], custom_text: null },
  plan_draft: { ...emptyPlanDraft(), weekdays: [0] },
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}
function setup(initial: SettingsView | null = row()) {
  let snapshot = signedIn();
  let stored = initial;
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
  const get = jest.fn().mockImplementation(async () => ({ settings: stored }));
  const patch = jest.fn().mockImplementation(async (input) => {
    if (input.expected_revision !== (stored?.revision ?? 0))
      throw new ApiError('conflict', {
        code: 'SETTINGS_CONFLICT',
        details: { current_revision: stored?.revision ?? 0 },
      });
    stored = {
      ...(stored ?? row()),
      revision: input.expected_revision + 1,
      activities: Object.hasOwn(input, 'activities')
        ? input.activities
        : (stored?.activities ?? { selected_activity_ids: [], custom_text: null }),
      plan_draft: Object.hasOwn(input, 'plan_draft')
        ? input.plan_draft
        : (stored?.plan_draft ?? null),
    };
    return { settings: stored };
  });
  const api = {
    configuration: { status: 'ready', origin: 'http://localhost', timeoutMs: 15000 },
    getRecoveryState: () => 'ready',
    recoverSession: jest.fn(),
    health: jest.fn(),
    request: jest.fn(async (path, options) => {
      const owner =
        snapshot.status === 'signed_in'
          ? { user_id: snapshot.user.user_id, sessionGeneration: snapshot.sessionGeneration }
          : null;
      const response =
        path === '/v1/settings'
          ? await (options.method === 'PATCH' ? patch(options.json) : get())
          : path === '/v1/me'
            ? { user_id: owner?.user_id, email: null }
            : { profile: null };
      return options.decode(response, { account: owner });
    }),
  } as unknown as AccountApi;
  const controller = createAccountDataController(auth, api);
  return {
    get,
    patch,
    controller,
    stored: () => stored,
    set(next: AuthSnapshot) {
      snapshot = next;
      for (const fn of listeners) fn();
    },
    async refresh() {
      await act(async () => {
        const scope = controller.getSnapshot().scope!;
        await scope.client.invalidateQueries({ queryKey: scope.key('settings') });
      });
    },
  };
}
async function mount(
  app: ReturnType<typeof setup>,
  field: PlanField = 'days',
  extra?: 'activities' | 'hours',
  onBack = jest.fn(),
) {
  const result = await render(
    <AccountDataProvider controller={app.controller} fallback={<Text>Closed</Text>}>
      <View>
        <PlanDraftScreen field={field} onBack={onBack} />
        {extra === 'activities' ? (
          <ActivityPreferencesScreen onBack={jest.fn()} />
        ) : extra === 'hours' ? (
          <PlanDraftScreen field="hours" onBack={jest.fn()} />
        ) : null}
      </View>
    </AccountDataProvider>,
  );
  await screen.findByRole('button', { name: `Save ${field}` });
  return result;
}
const press = async (label: string) => {
  await fireEvent.press(screen.getByRole('button', { name: label }));
};
const toggle = async (label: string) => {
  await fireEvent.press(screen.getByRole('checkbox', { name: label }));
};
const save = (field: PlanField) => screen.getByRole('button', { name: `Save ${field}` });
async function enterTime(which: 'Start' | 'End', value: string) {
  await fireEvent.press(screen.getByRole('button', { name: new RegExp(`^${which} time:`) }));
  await fireEvent.changeText(screen.getByLabelText(new RegExp(`^${which} time \\(24-hour`)), value);
}
afterEach(() => onlineManager.setOnline(true));

test('verified missing row explicitly saves an empty inactive draft, without defaults or a Back warning', async () => {
  const app = setup(null);
  const back = jest.fn();
  await mount(app, 'days', undefined, back);
  expect(save('days')).toBeEnabled();
  await press('Back');
  expect(back).toHaveBeenCalledTimes(1);
  await press('Save days');
  await screen.findByText('Draft saved.');
  expect(app.patch).toHaveBeenCalledWith({ expected_revision: 0, plan_draft: emptyPlanDraft() });
  expect(screen.getByText('Saved draft — not active')).toBeVisible();
  expect(screen.getByRole('checkbox', { name: 'Monday' })).not.toBeChecked();
});
test('day edits preserve partial hours, timezone and session values and omit activities entirely', async () => {
  const initial = {
    ...row(),
    plan_draft: {
      ...emptyPlanDraft(),
      weekdays: [0],
      hours: { start_local: '23:00', end_local: null, next_day: true },
      timezone_id: 'US/Eastern',
      session_count: null,
      session_minutes: 30,
    },
  };
  const app = setup(initial);
  await mount(app);
  await toggle('Tuesday');
  await press('Save days');
  await screen.findByText('Draft saved.');
  expect(app.patch).toHaveBeenCalledWith({
    expected_revision: 1,
    plan_draft: { ...initial.plan_draft, weekdays: [0, 1] },
  });
  expect(app.stored()?.activities).toEqual(initial.activities);
});
test('hours can save one entered time and raw timezone, then explicitly clear hours and timezone', async () => {
  const app = setup();
  await mount(app, 'hours');
  await enterTime('Start', '09:00');
  await fireEvent.changeText(screen.getByLabelText(/^Draft timezone/), 'US/Eastern');
  expect(save('hours')).toBeEnabled();
  await press('Save hours');
  await screen.findByText('Draft saved.');
  expect(app.stored()?.plan_draft?.hours).toEqual({
    start_local: '09:00',
    end_local: null,
    next_day: false,
  });
  expect(app.stored()?.plan_draft?.timezone_id).toBe('US/Eastern');
  await press('Clear draft hours');
  await fireEvent.changeText(screen.getByLabelText(/^Draft timezone/), '');
  await press('Save hours');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(app.stored()?.plan_draft).toMatchObject({
      hours: null,
      timezone_id: null,
      weekdays: [0],
    }),
  );
});
test('entered overnight hours need explicit next day; equal or malformed times stay unsaved', async () => {
  const app = setup();
  await mount(app, 'hours');
  await enterTime('Start', '23:00');
  await enterTime('End', '01:00');
  expect(save('hours')).toBeDisabled();
  await toggle('Ends the next day');
  expect(save('hours')).toBeEnabled();
  await fireEvent.changeText(screen.getByLabelText(/^End time \(24-hour/), '23:00');
  expect(save('hours')).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText(/^End time \(24-hour/), '1:00');
  expect(save('hours')).toBeDisabled();
  expect(app.patch).not.toHaveBeenCalled();
});
test('authoritative timezone error retains raw input; correction saves only accepted canonical data', async () => {
  const app = setup();
  app.patch.mockRejectedValueOnce(
    new ApiError('validation', {
      details: { fields: [{ field: 'plan_draft.timezone_id', code: 'invalid_timezone' }] },
    }),
  );
  await mount(app, 'hours');
  await fireEvent.changeText(screen.getByLabelText(/^Draft timezone/), '  Bad/Zone  ');
  await press('Save hours');
  await screen.findByText('Use a recognized timezone such as America/New_York, or leave it blank.');
  expect(screen.getByLabelText(/^Draft timezone/).props.value).toBe('  Bad/Zone  ');
  expect(app.patch.mock.calls[0][0].plan_draft.timezone_id).toBe('  Bad/Zone  ');
  await fireEvent.changeText(screen.getByLabelText(/^Draft timezone/), 'UTC');
  await press('Save hours');
  await screen.findByText('Draft saved.');
  expect(app.stored()?.plan_draft?.timezone_id).toBe('UTC');
});
test('sessions preserve nullable fields, allow explicit individual clears, and claim no daily allowance', async () => {
  const app = setup();
  await mount(app, 'sessions');
  expect(screen.getAllByText('—')).toHaveLength(2);
  expect(screen.queryByText(/min of planned app time each day/)).toBeNull();
  await press('Increase draft session count');
  await press('Save sessions');
  await screen.findByText('Draft saved.');
  expect(app.stored()?.plan_draft).toMatchObject({
    session_count: 1,
    session_minutes: null,
    weekdays: [0],
  });
  await press('Clear draft session count');
  await press('Increase draft session minutes');
  await press('Save sessions');
  await waitFor(() =>
    expect(app.stored()?.plan_draft).toMatchObject({ session_count: null, session_minutes: 1 }),
  );
  expect(screen.queryByRole('button', { name: 'Increase sessions per day' })).toBeNull();
});
test('clearing the whole plan sends explicit null only after Save and preserves activities', async () => {
  const app = setup();
  await mount(app);
  await press('Clear entire plan draft');
  await screen.findByText('The entire saved plan draft will be cleared when you save.');
  expect(app.patch).not.toHaveBeenCalled();
  await press('Save cleared draft');
  await screen.findByText('Draft cleared.');
  expect(app.patch).toHaveBeenCalledWith({ expected_revision: 1, plan_draft: null });
  expect(app.stored()?.plan_draft).toBeNull();
  expect(app.stored()?.activities.selected_activity_ids).toEqual(['reading']);
});
test('dirty days keep their old base after an activity save, then require review without overwriting activities', async () => {
  const app = setup();
  await mount(app, 'days', 'activities');
  await toggle('Tuesday');
  await toggle('Gym');
  await press('Save activities');
  await screen.findByText('Activities saved.');
  expect(app.get).toHaveBeenCalledTimes(1);
  await press('Save days');
  await screen.findByText('Check latest draft');
  expect(app.patch.mock.calls[1][0].expected_revision).toBe(1);
  await press('Check latest draft');
  await screen.findByRole('button', { name: 'Keep my edits' });
  await press('Keep my edits');
  expect(app.patch).toHaveBeenCalledTimes(2);
  await press('Save days');
  await screen.findByText('Draft saved.');
  expect(app.patch.mock.calls[2][0]).toMatchObject({
    expected_revision: 2,
    plan_draft: { weekdays: [0, 1] },
  });
  expect(app.stored()?.activities.selected_activity_ids).toEqual(['reading', 'gym']);
});
test('separate days and hours editors share one revision; explicit keep preserves latest unseen hours', async () => {
  const app = setup();
  await mount(app, 'days', 'hours');
  await toggle('Tuesday');
  await enterTime('Start', '10:00');
  await press('Save hours');
  await screen.findByText('Draft saved.');
  await press('Save days');
  await screen.findByText('Check latest draft');
  await press('Check latest draft');
  await screen.findByRole('button', { name: 'Keep my edits' });
  await press('Keep my edits');
  await press('Save days');
  await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(3));
  expect(app.stored()?.plan_draft).toMatchObject({
    weekdays: [0, 1],
    hours: { start_local: '10:00', end_local: null, next_day: false },
  });
});
test('uncertain save and failed review preserve partial raw draft; Use latest requires GET and sends no write', async () => {
  const app = setup();
  const acceptedPatch = app.patch.getMockImplementation()!;
  app.patch.mockImplementationOnce(async (input) => {
    await acceptedPatch(input);
    throw new ApiError('network', { requestMayHaveCommitted: true });
  });
  await mount(app, 'hours');
  await enterTime('Start', '11:00');
  await press('Save hours');
  await screen.findByText('Check latest draft');
  app.get.mockRejectedValueOnce(new ApiError('forbidden'));
  await press('Check latest draft');
  await screen.findByText('The latest preferences could not be loaded. Your draft is still here.');
  expect(screen.getByLabelText(/^Start time \(24-hour/).props.value).toBe('11:00');
  expect(save('hours')).toBeDisabled();
  await press('Try again');
  await screen.findByRole('button', { name: 'Use latest draft' });
  await press('Use latest draft');
  expect(save('hours')).toBeDisabled();
  expect(app.patch).toHaveBeenCalledTimes(1);
  expect(app.stored()?.revision).toBe(2);
  expect(screen.getByLabelText(/^Start time \(24-hour/).props.value).toBe('11:00');
});
test('offline drafts and local discard never replay a write; dirty Back uses existing confirmation', async () => {
  const app = setup();
  const back = jest.fn();
  await mount(app, 'days', undefined, back);
  await act(async () => onlineManager.setOnline(false));
  await toggle('Tuesday');
  expect(save('days')).toBeDisabled();
  await press('Back');
  await screen.findByText('Discard unsaved changes?');
  expect(back).not.toHaveBeenCalled();
  await press('Keep editing');
  await act(async () => onlineManager.setOnline(true));
  await waitFor(() => expect(save('days')).toBeEnabled());
  expect(app.patch).not.toHaveBeenCalled();
  await press('Discard changes');
  expect(screen.getByRole('checkbox', { name: 'Tuesday' })).not.toBeChecked();
  expect(app.patch).not.toHaveBeenCalled();
});
test.each([signedIn(B, 2), signedIn(A, 2)])(
  'account or generation replacement suppresses pending old draft/save effects %#',
  async (next) => {
    const app = setup();
    const pending = deferred<{ settings: SettingsView }>();
    app.patch.mockImplementationOnce(() => pending.promise);
    await mount(app);
    await toggle('Tuesday');
    await press('Save days');
    await waitFor(() => expect(app.patch).toHaveBeenCalledTimes(1));
    app.get.mockResolvedValue({
      settings: row(1, next.status === 'signed_in' ? next.user.user_id : B),
    });
    await act(async () => app.set(next));
    await screen.findByRole('checkbox', { name: 'Monday' });
    await act(async () =>
      pending.resolve({
        settings: { ...row(2), plan_draft: { ...emptyPlanDraft(), weekdays: [0, 1] } },
      }),
    );
    expect(screen.getByRole('checkbox', { name: 'Tuesday' })).not.toBeChecked();
    expect(screen.queryByText('Draft saved.')).toBeNull();
  },
);
test('a failed initial read is unavailable, not a missing draft that could create defaults', async () => {
  const app = setup();
  app.get.mockRejectedValue(new ApiError('forbidden'));
  await render(
    <AccountDataProvider controller={app.controller}>
      <PlanDraftScreen field="days" onBack={jest.fn()} />
    </AccountDataProvider>,
  );
  await screen.findByText(
    'Your preferences could not be verified. Your changes have not been discarded.',
  );
  expect(screen.queryByRole('button', { name: 'Save days' })).toBeNull();
  expect(app.patch).not.toHaveBeenCalled();
});
test('real detail route remains unavailable without Auth provider and activates the draft consumer inside it', async () => {
  const view = await render(<PreferenceDetail />);
  expect(save('days')).toBeDisabled();
  const app = setup();
  await view.rerender(
    <AccountDataProvider controller={app.controller}>
      <PreferenceDetail />
    </AccountDataProvider>,
  );
  await screen.findByText('Saved draft — not active');
  await toggle('Tuesday');
  expect(save('days')).toBeEnabled();
});
test('Settings summaries distinguish accepted partial drafts from missing, active or measured outcomes', async () => {
  const app = setup({ ...row(), plan_draft: { ...emptyPlanDraft(), session_minutes: 20 } });
  await render(
    <AccountDataProvider controller={app.controller}>
      <ConnectedSettingsScreen />
    </AccountDataProvider>,
  );
  await screen.findByText('Plan draft — not active');
  await screen.findByText('Draft: count not set; minutes 20');
  expect(screen.queryByText(/min of planned app time each day/)).toBeNull();
  expect(screen.getByText('Draft: no hours chosen; timezone not set')).toBeVisible();
});
