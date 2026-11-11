import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { QuestExecutionView, QuestView } from '@disconnect/contracts';
import fixture from '../../../../../packages/contracts/fixtures/quest-execution-v1.json';
import type { useQuestLifecycle } from './use-quest-lifecycle';
import { QuestExecutionPanel } from './quest-execution-panel';

jest.mock('@/features/settings/settings-query', () => ({
  useSettingsQuery: () => ({
    data: {
      settings: {
        plan_draft: {
          session_count: 2,
          session_minutes: 1,
          timezone_id: 'UTC',
        },
      },
    },
  }),
}));
type Lifecycle = ReturnType<typeof useQuestLifecycle>;
function setup({
  dirty = false,
  review = false,
  permission = true,
  ended = false,
  bridge = true,
} = {}) {
  const remote = JSON.parse(JSON.stringify(fixture)) as QuestExecutionView;
  if (ended)
    remote.occurrences[0] = {
      ...remote.occurrences[0],
      state: 'ended',
      can_confirm: true,
    };
  const controller = {
    schedule: jest.fn(async () => true),
    refresh: jest.fn(async () => {}),
    stop: jest.fn(async () => true),
    applySaved: jest.fn(async () => true),
    claim: jest.fn(async () => true),
    outcome: jest.fn(async () => true),
  };
  const lifecycle = {
    controller,
    owner: bridge
      ? {
          owner: `fixture:${fixture.user_id}`,
          port: { interventionReviewAccess: jest.fn(async () => true) },
        }
      : null,
    state: {
      remote,
      busy: false,
      reviewRequired: review,
      message: 'Schedule state checked.',
      selection: { selectedAppCount: 1, revision: 1 },
      device: bridge
        ? {
            enabled: false,
            remoteRevision: 0,
            policy: null,
            native: {
              serviceConnected: permission,
              disclosureAccepted: permission,
              state: permission ? 'inactive' : 'needs_permission',
            },
          }
        : null,
    },
  } as unknown as Lifecycle;
  const quest = {
    quest_id: fixture.quest_id,
    user_id: fixture.user_id,
    created_at: '2026-11-11T12:00:00Z',
    updated_at: '2026-11-11T12:00:00Z',
    revision: 1,
    definition: fixture.versions[0].definition,
  } as QuestView;
  const changed = jest.fn();
  return {
    controller,
    changed,
    render: () =>
      render(
        <QuestExecutionPanel
          quest={quest}
          definitionDirty={dirty}
          lifecycle={lifecycle}
          onDraftDirtyChange={changed}
        />,
      ),
  };
}
const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
it('requires explicit canonical date and passes saved session policy without changing details', async () => {
  const f = setup();
  await f.render();
  expect(
    screen.getByRole('button', { name: 'Update quest schedule' }),
  ).toBeDisabled();
  await fireEvent.changeText(
    screen.getByLabelText('First quest date (YYYY-MM-DD)'),
    '2026-11-13',
  );
  expect(f.changed).toHaveBeenLastCalledWith(true);
  await press('Update quest schedule');
  await act(async () => {});
  expect(f.controller.schedule).toHaveBeenCalledWith(
    expect.objectContaining({ revision: 1 }),
    '2026-11-13',
    { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 60 },
  );
  expect(f.changed).toHaveBeenLastCalledWith(false);
});
it.each([
  { dirty: true },
  { review: true },
  { permission: false },
  { bridge: false },
])(
  'blocks activation when a prerequisite is unavailable %j',
  async (options) => {
    const f = setup(options);
    await f.render();
    await fireEvent.changeText(
      screen.getByLabelText('First quest date (YYYY-MM-DD)'),
      '2026-11-13',
    );
    expect(
      screen.getByRole('button', { name: 'Update quest schedule' }),
    ).toBeDisabled();
    expect(f.controller.schedule).not.toHaveBeenCalled();
  },
);
it('requires confirmation for Stop, preserving the safe keep-reviewing action', async () => {
  const f = setup();
  await f.render();
  await press('Stop this quest');
  expect(f.controller.stop).not.toHaveBeenCalled();
  await press('Keep reviewing');
  expect(f.controller.stop).not.toHaveBeenCalled();
  await press('Stop this quest');
  await press('Confirm Stop');
  expect(f.controller.stop).toHaveBeenCalledTimes(1);
});
it('only offers completion after eligibility and explicitly confirms self-reported credit', async () => {
  const f = setup({ ended: true });
  await f.render();
  await press('Confirm completion for 2026-11-12');
  expect(f.controller.outcome).not.toHaveBeenCalled();
  expect(
    screen.getByRole('alert', { name: /Did you complete this activity/ }),
  ).toBeVisible();
  await press('Confirm completion');
  expect(f.controller.outcome).toHaveBeenCalledWith(1, '2026-11-12', true);
});
it('does not show a completion control while an occurrence is upcoming', async () => {
  const f = setup();
  await f.render();
  expect(
    screen.queryByRole('button', { name: 'Confirm completion for 2026-11-12' }),
  ).toBeNull();
  await press('Cancel occurrence 2026-11-12');
  expect(f.controller.outcome).not.toHaveBeenCalled();
  await press('Confirm cancellation');
  expect(f.controller.outcome).toHaveBeenCalledWith(1, '2026-11-12', false);
});
