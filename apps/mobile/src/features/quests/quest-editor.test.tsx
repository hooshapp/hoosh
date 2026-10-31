import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { QuestEditor } from './quest-editor';
import { emptyQuestDraft, questDraftIssue, questDuration, type QuestDraft } from './quest-draft';
const draft: QuestDraft = { ...emptyQuestDraft, title: 'Test quest', activity: 'Walk', start: '18:00', end: '20:00', repeat: 'weekly', days: [0] };
test('overnight is explicit and malformed/zero ranges never become a duration', () => {
  expect(questDuration({ ...draft, start: '23:00', end: '01:00' })).toBeNull();
  expect(questDuration({ ...draft, start: '23:00', end: '01:00', nextDay: true })).toBe(120);
  expect(questDuration({ ...draft, end: '24:99' })).toBeNull();
  expect(questDuration({ ...draft, end: draft.start })).toBeNull();
  expect(questDraftIssue({ ...draft, days: [] })).toMatch(/repeat day/);
});
test('raw draft changes are delegated and do not change supplied canonical values', async () => {
  const change = jest.fn(); await render(<QuestEditor mode="create" draft={draft} dirty onChange={change} onBack={jest.fn()} onDiscard={jest.fn()} />);
  await fireEvent.changeText(screen.getByLabelText('Quest name'), 'Changed');
  expect(change).toHaveBeenCalledWith({ ...draft, title: 'Changed' });
  expect(screen.getByLabelText('Quest name')).toHaveDisplayValue('Test quest');
  expect(screen.getByRole('button', { name: 'Save quest' })).toBeDisabled();
});
test.each(['saving', 'unavailable', 'conflict', 'unconfirmed'] as const)('%s blocks save and duplicate writes', async (state) => {
  const save = jest.fn(); await render(<QuestEditor mode="personalize" draft={draft} dirty onChange={jest.fn()} onBack={jest.fn()} onDiscard={jest.fn()} onSave={save} state={state} />);
  await userEvent.press(screen.getByRole('button', { name: state === 'saving' ? 'Saving…' : 'Save quest' })); expect(save).not.toHaveBeenCalled();
});
test('valid save delegates the raw draft; dirty back requires confirmation', async () => {
  const save = jest.fn(), back = jest.fn(); await render(<QuestEditor mode="personalize" draft={draft} dirty onChange={jest.fn()} onBack={back} onDiscard={jest.fn()} onSave={save} />);
  await userEvent.press(screen.getByRole('button', { name: 'Save quest' })); expect(save).toHaveBeenCalledWith(draft);
  await userEvent.press(screen.getByRole('button', { name: 'Back' })); expect(back).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Keep editing' })); expect(back).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Back' })); await userEvent.press(screen.getByRole('button', { name: 'Discard and leave' })); expect(back).toHaveBeenCalledTimes(1);
});
test('cancelling a saved quest needs a separate confirmed host action', async () => {
  const cancel = jest.fn(); await render(<QuestEditor mode="edit" draft={draft} dirty={false} onChange={jest.fn()} onBack={jest.fn()} onDiscard={jest.fn()} onCancelQuest={cancel} />);
  await userEvent.press(screen.getByRole('button', { name: 'Cancel quest' })); expect(cancel).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole('button', { name: 'Confirm cancellation' })); expect(cancel).toHaveBeenCalledTimes(1);
});
