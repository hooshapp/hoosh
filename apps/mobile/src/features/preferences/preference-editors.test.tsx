import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import {
  AgeEditor,
  ActivitiesEditor,
  AppsEditor,
  GenderEditor,
  type ActivityDraft,
} from './preference-editors';
const back = jest.fn();
test('age options are supplied, never an inferred range or a mandatory demographic', async () => {
  const change = jest.fn();
  await render(
    <AgeEditor value={null} options={[23, 24]} onChange={change} onBack={back} dirty={false} />,
  );
  await userEvent.press(screen.getByRole('radio', { name: '24' }));
  expect(change).toHaveBeenCalledWith(24);
  await userEvent.press(screen.getByRole('button', { name: 'Prefer not to say' }));
  expect(change).toHaveBeenLastCalledWith(null);
  expect(screen.queryByRole('radio', { name: '25' })).toBeNull();
});
test('a native selection handoff never invents an installed-app catalog', async () => {
  const choose = jest.fn();
  const view = await render(
    <AppsEditor selection={{ kind: 'native', summary: null }} onBack={back} dirty={false} />,
  );
  expect(screen.queryByText('Instagram')).toBeNull();
  expect(screen.getByRole('button', { name: 'Choose apps' })).toBeDisabled();
  await view.rerender(
    <AppsEditor
      selection={{ kind: 'native', summary: 'A supplied selection', onChoose: choose }}
      onBack={back}
      dirty
    />,
  );
  await userEvent.press(screen.getByRole('button', { name: 'Choose apps' }));
  expect(choose).toHaveBeenCalledTimes(1);
  expect(screen.getByText('A supplied selection')).toBeVisible();
});
test('search does not clear hidden selections or count only filtered results', async () => {
  const change = jest.fn();
  await render(
    <AppsEditor
      selection={{
        kind: 'catalog',
        options: [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ],
        selected: ['a', 'b'],
        sourceLabel: 'Test supplied catalog',
        onChange: change,
      }}
      onBack={back}
      dirty
    />,
  );
  await fireEvent.changeText(screen.getByLabelText('Search apps'), 'Alpha');
  expect(screen.queryByRole('checkbox', { name: 'Beta' })).toBeNull();
  expect(screen.getByText('2 apps selected for your current plan')).toBeVisible();
  await userEvent.press(screen.getByRole('checkbox', { name: 'Alpha' }));
  expect(change).toHaveBeenCalledWith(['b']);
  await fireEvent.changeText(screen.getByLabelText('Search apps'), 'Nothing');
  expect(screen.getByText('No matching apps')).toBeVisible();
  expect(change).toHaveBeenCalledTimes(1);
});
test('blank custom activity blocks save, preserves text when toggled and delegates raw changes', async () => {
  const draft: ActivityDraft = { selected: [], customSelected: true, custom: '' },
    change = jest.fn();
  await render(
    <ActivitiesEditor
      draft={draft}
      options={[]}
      onChange={change}
      onBack={back}
      dirty
      onSave={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Save activities' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText(/Custom activity/), 'Reading');
  expect(change).toHaveBeenCalledWith({ ...draft, custom: 'Reading' });
  await userEvent.press(screen.getByRole('checkbox', { name: 'Custom' }));
  expect(change).toHaveBeenLastCalledWith({ ...draft, customSelected: false });
});
test('gender is a supplied optional choice, never used to compute a lifespan', async () => {
  const change = jest.fn();
  await render(
    <GenderEditor
      value="a"
      options={[
        { id: 'a', label: 'Choice A' },
        { id: 'b', label: 'Choice B' },
      ]}
      onChange={change}
      dirty
    />,
  );
  await userEvent.press(screen.getByRole('radio', { name: 'Choice B' }));
  expect(change).toHaveBeenCalledWith('b');
  expect(screen.queryByText(/years saved/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
});
test('saving locks selection controls and custom fields', async () => {
  const change = jest.fn();
  await render(
    <ActivitiesEditor
      draft={{ selected: [], customSelected: true, custom: 'Supplied' }}
      options={[{ id: 'a', label: 'A' }]}
      onChange={change}
      onBack={back}
      dirty
      state="saving"
      onSave={jest.fn()}
    />,
  );
  expect(screen.getByRole('checkbox', { name: 'A' })).toBeDisabled();
  expect(screen.getByLabelText('Custom activity')).toBeDisabled();
});
