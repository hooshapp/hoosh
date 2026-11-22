import { SetupDraft } from './setup-draft';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FigmaManualPlan } from './figma-manual-plan';
import { PlanCompletionScreen, PlanSuggestionScreen } from './figma-plan-screens';
import { starterPlan } from './setup-model';
import type { PlanDraftInput } from '@/features/plans/plan-draft-model';

it('keeps edits through accordion changes and saves only a valid reviewed draft', async () => {
  const save = jest.fn();
  function Host() {
    const [input, setInput] = useState<Exclude<PlanDraftInput, null>>(() => starterPlan('UTC'));
    return <FigmaManualPlan input={input} onChange={setInput} onSave={() => save(input)} onBack={jest.fn()} appSummary="Choose apps in device setup" busy={false} />;
  }
  await render(<Host />);
  await fireEvent.press(screen.getByRole('button', { name: 'Active Days' }));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Sunday' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Active Hours' }));
  await fireEvent.changeText(screen.getByLabelText('Start time (HH:mm)'), '22:00');
  await fireEvent.changeText(screen.getByLabelText('End time (HH:mm)'), '07:00');
  expect(screen.getByRole('button', { name: 'Save my plan' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Ends the next day' }));
  await fireEvent.press(screen.getByRole('button', { name: 'App Sessions' }));
  await fireEvent.press(screen.getByRole('button', { name: '3 sessions per day' }));
  await fireEvent.press(screen.getByRole('button', { name: '30 minutes per session' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save my plan' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ weekdays: [0,1,2,3,4,6],
    hours: { start: '22:00', end: '07:00', nextDay: true }, sessions: { count: 3, minutes: 30 } }));
});
it('does not hide invalid time text by collapsing a section', async () => {
  function Host() {
    const [input, setInput] = useState<Exclude<PlanDraftInput, null>>(() => starterPlan('UTC'));
    return <FigmaManualPlan input={input} onChange={setInput} onSave={jest.fn()} onBack={jest.fn()} appSummary="Choose apps" busy={false} />;
  }
  await render(<Host />);
  await fireEvent.press(screen.getByRole('button', { name: 'Active Hours' }));
  await fireEvent.changeText(screen.getByLabelText('Start time (HH:mm)'), '25:00');
  await fireEvent.press(screen.getByRole('button', { name: 'Active Hours' }));
  expect(screen.getByRole('button', { name: 'Save my plan' })).toBeDisabled();
  expect(screen.getByRole('alert')).toBeTruthy();
});
it('routes suggestion choices explicitly and suppresses repeated submission while saving', async () => {
  const accept = jest.fn(), manual = jest.fn();
  await render(<PlanSuggestionScreen apps={[]} description="Reviewed starting schedule" estimate={{ label: 'DRAFT', detail: 'No measured savings' }}
    onAccept={accept} onManual={manual} onSkip={jest.fn()} busy />);
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Set up on my own' })).toBeDisabled();
  expect(accept).not.toHaveBeenCalled(); expect(manual).not.toHaveBeenCalled();
});
it('finishes only through the completion action without claiming device activation', async () => {
  const finish = jest.fn();
  await render(<PlanCompletionScreen hobbies={['Gym','Reading']} onFinish={finish} message="Screen Time setup is still pending." />);
  expect(screen.getByText('Screen Time setup is still pending.')).toBeTruthy();
  expect(finish).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Let’s start →' }));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('accepts the displayed suggestion after returning from an edited manual alternative', async () => {
  const onSave = jest.fn();
  const planDraft = { weekdays: [0], hours: { start_local: '09:00', end_local: '22:00', next_day: false }, timezone_id: 'UTC', session_count: 1, session_minutes: 10 };
  await render(<SetupDraft progress={{ version: 1, step: 'plan', planDraft }} busy={false} failed={false}
    onSave={onSave} onLeave={jest.fn()} onDiscard={jest.fn()}
    suggestion={{ planDraft, apps: [], description: 'One 10-minute session', estimate: { label: 'DRAFT', detail: 'Review only' } }} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Set up on my own' }));
  await fireEvent.press(screen.getByRole('button', { name: 'App Sessions' }));
  await fireEvent.press(screen.getByRole('button', { name: '3 sessions per day' }));
  await fireEvent.press(screen.getByRole('button', { name: '30 minutes per session' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Go with suggestion' }));
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ step: 'review', planDraft }));
});
