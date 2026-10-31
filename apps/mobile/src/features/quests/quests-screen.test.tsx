import { render, screen, userEvent } from '@testing-library/react-native';

import QuestsRoute from '@/app/(tabs)/quests';
import { QuestsScreen } from './quests-screen';
import { unavailableQuests, type QuestsModel, type QuestSuggestion } from './quests-model';

const suggestion: QuestSuggestion = {
  id: 'RN09B_TEST_ONLY',
  title: 'Walk outside',
  categoryLabel: 'Walking',
  accent: 'green',
  context: 'Explicit example context',
  scheduleLabels: ['Example day', 'Example time'],
  restrictionNotice: null,
};
const ready: QuestsModel = {
  interestSummary: null,
  suggestions: { state: 'ready', items: [suggestion] },
  saved: { state: 'ready', items: [] },
};
test('actual route has no suggested interests or saved outcomes and no functional create action', async () => {
  await render(<QuestsRoute />);
  expect(screen.getByRole('header', { name: 'Your Quests' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Create a custom quest' })).toBeDisabled();
  expect(screen.queryByText('Evening Gym Session')).toBeNull();
  expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
});
test('ready cards require handlers and retain original pencil/check dimensions', async () => {
  await render(<QuestsScreen model={ready} />);
  expect(screen.getByRole('button', { name: 'Accept Walk outside' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Personalize Walk outside' })).toBeDisabled();
  expect(screen.getByTestId('quest-pencil', { includeHiddenElements: true })).toHaveStyle({
    width: 14,
    height: 14,
  });
  expect(screen.getByTestId('quest-check', { includeHiddenElements: true })).toHaveStyle({
    width: 16,
    height: 16,
  });
});
test('delegates suggestion IDs without promoting them to saved quests or restrictions', async () => {
  const accept = jest.fn(),
    personalize = jest.fn(),
    create = jest.fn();
  await render(
    <QuestsScreen model={ready} onAccept={accept} onPersonalize={personalize} onCreate={create} />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Accept Walk outside' }));
  await userEvent.press(screen.getByRole('button', { name: 'Personalize Walk outside' }));
  await userEvent.press(screen.getByRole('button', { name: 'Create a custom quest' }));
  expect(accept).toHaveBeenCalledWith(suggestion.id);
  expect(personalize).toHaveBeenCalledWith(suggestion.id);
  expect(create).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Walk outside')).toBeVisible();
  expect(screen.queryByText('Saved quests')).toBeNull();
  expect(screen.queryByText(/locked during/)).toBeNull();
});
test.each(['loading', 'error', 'unavailable'] as const)(
  '%s removes prior suggestions rather than selecting a fixture',
  async (state) => {
    const view = await render(<QuestsScreen model={ready} />);
    await view.rerender(<QuestsScreen model={{ ...unavailableQuests, suggestions: { state } }} />);
    expect(screen.queryByText('Walk outside')).toBeNull();
    expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
    expect(screen.queryByText('No suggestions right now')).toBeNull();
  },
);
test('a successful empty result is distinct from unavailability', async () => {
  await render(<QuestsScreen model={{ ...ready, suggestions: { state: 'ready', items: [] } }} />);
  expect(screen.getByRole('header', { name: 'No suggestions right now' })).toBeVisible();
});
test('saved records are supplied separately and never get suggestion accept controls', async () => {
  await render(
    <QuestsScreen
      model={{
        ...unavailableQuests,
        saved: {
          state: 'ready',
          items: [
            {
              id: 'saved',
              title: 'Saved record',
              scheduleLabel: 'Tomorrow',
              statusLabel: 'Scheduled',
            },
          ],
        },
      }}
    />,
  );
  expect(screen.getByRole('header', { name: 'Saved record' })).toBeVisible();
  expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
});
test('controlled busy locks all supplied mutations', async () => {
  const action = jest.fn();
  await render(
    <QuestsScreen model={ready} onAccept={action} onPersonalize={action} onCreate={action} busy />,
  );
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
    await userEvent.press(button);
  }
  expect(action).not.toHaveBeenCalled();
});
test('only an explicit error retry handler exposes a retry', async () => {
  const retry = jest.fn();
  await render(
    <QuestsScreen model={{ ...ready, suggestions: { state: 'error' } }} onRetry={retry} />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
