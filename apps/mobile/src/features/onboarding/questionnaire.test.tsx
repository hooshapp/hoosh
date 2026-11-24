import { fireEvent, render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Questionnaire } from './questionnaire';
import type { OnboardingProgress } from './progress-repository';
beforeEach(() => jest.replaceProperty(Platform, 'OS', 'web'));
afterEach(() => jest.restoreAllMocks());
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
it('web fallback requires gender and age, records 2–4 apps and hobbies, then proceeds to plan with saved answers', async () => {
  const save = jest.fn(async (_next: OnboardingProgress) => true);
  await render(<Questionnaire progress={{ version: 1, step: 'questions' }} busy={false} failed={false} onSave={save} />);
  expect(screen.getByText('What’s your gender?')).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Onboarding step 1 of 7' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  await fireEvent.press(screen.getByText('Other'));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(screen.getByText('How old are you?')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Age 17' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Age 81' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Age 25' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await fireEvent.press(screen.getByText('Instagram'));
  expect(screen.getByRole('button', { name: 'Next →' })).toBeDisabled();
  await fireEvent.press(screen.getByText('YouTube'));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(screen.getByText('What do you want to do instead?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Reading'));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.getByText('Screen Time access')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ step: 'plan', questionsCompleted: true,
    questions: { index: 4, gender: 'Other', age: 25, apps: ['Instagram', 'YouTube'], hobbies: ['Reading'] },
    activities: { selected_activity_ids: ['reading'], custom_text: null } }));
});
it('keeps the current step when saving fails', async () => {
  await render(<Questionnaire progress={{ version: 1, step: 'questions' }} busy={false} failed={false} onSave={async () => false} />);
  await fireEvent.press(screen.getByText('Male'));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(screen.getByText('What’s your gender?')).toBeTruthy();
});
