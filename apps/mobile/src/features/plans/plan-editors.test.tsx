import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { DaysEditor, HoursEditor, SessionsEditor } from './plan-editors';
test('day presets and individual changes delegate without installing a plan', async () => {
  const change = jest.fn();
  await render(<DaysEditor days={[0]} onChange={change} dirty />);
  await userEvent.press(screen.getByRole('button', { name: 'Weekends' }));
  expect(change).toHaveBeenCalledWith([5, 6]);
  await userEvent.press(screen.getByRole('checkbox', { name: 'Monday' }));
  expect(change).toHaveBeenLastCalledWith([]);
  expect(screen.getByRole('button', { name: 'Save days' })).toBeDisabled();
});
test('unknown or invalid session bounds disable edits and never turn unknown counts into zero', async () => {
  await render(
    <SessionsEditor draft={{ count: null, minutes: null }} onChange={jest.fn()} dirty />,
  );
  expect(screen.getAllByText('—')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Increase sessions per day' })).toBeDisabled();
  expect(screen.queryByText(/min of planned/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Save sessions' })).toBeDisabled();
});
test('steppers use caller bounds, clamp and show planned budget rather than measured usage', async () => {
  const change = jest.fn();
  await render(
    <SessionsEditor
      draft={{ count: 2, minutes: 15 }}
      bounds={{ count: { min: 1, max: 2, step: 1 }, minutes: { min: 5, max: 20, step: 10 } }}
      onChange={change}
      dirty
      onSave={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Increase sessions per day' })).toBeDisabled();
  await userEvent.press(screen.getByRole('button', { name: 'Increase minutes per session' }));
  expect(change).toHaveBeenCalledWith({ count: 2, minutes: 20 });
  expect(screen.getByText('30 min of planned app time each day')).toBeVisible();
});
test('overnight range requires explicit next-day confirmation', async () => {
  const view = await render(
    <HoursEditor
      draft={{ start: '23:00', end: '01:00', nextDay: false }}
      onChange={jest.fn()}
      dirty
      onSave={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Save hours' })).toBeDisabled();
  await view.rerender(
    <HoursEditor
      draft={{ start: '23:00', end: '01:00', nextDay: true }}
      onChange={jest.fn()}
      dirty
      onSave={jest.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: 'Save hours' })).toBeEnabled();
});
test('range accessibility actions delegate precise current values; saving disables them', async () => {
  const change = jest.fn(),
    draft = { start: '09:00', end: '22:00', nextDay: false };
  const view = await render(<HoursEditor draft={draft} onChange={change} dirty />);
  await fireEvent(screen.getByRole('adjustable', { name: 'Start time' }), 'accessibilityAction', {
    nativeEvent: { actionName: 'increment' },
  });
  expect(change).toHaveBeenCalledWith({ ...draft, start: '09:01' });
  await view.rerender(<HoursEditor draft={draft} onChange={change} dirty state="saving" />);
  expect(screen.getByRole('adjustable', { name: 'Start time' })).toBeDisabled();
});
