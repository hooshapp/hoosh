import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button as MockNativeButton, Platform } from 'react-native';
import { Questionnaire } from './questionnaire';
import type { OnboardingProgress } from './progress-repository';
jest.mock('./questionnaire-permission', () => ({ QuestionnairePermission: ({ selectionQuestion, onContinue }: { selectionQuestion?: boolean; onContinue(d: boolean, revision: number, count: number): void }) => <MockNativeButton title={selectionQuestion ? 'Confirm native target apps' : 'Continue to my plan'} onPress={() => onContinue(false, 7, 2)} /> }));
it.each(['ios', 'android'] as const)('replaces %s app choices with native targets and retains them through hobbies and completion', async platform => {
  jest.replaceProperty(Platform, 'OS', platform);
  const save = jest.fn(async (_p: OnboardingProgress) => true);
  await render(<Questionnaire progress={{ version: 1, step: 'questions', questions: { index: 2, gender: 'Other', age: 25, apps: [], hobbies: [] } }} busy={false} failed={false} onSave={save} />);
  expect(screen.queryByText('Instagram')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: /confirm native target apps/i }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ selectionRevision: 7, questions: expect.objectContaining({ index: 3, apps: [], nativeTargetCount: 2 }) }));
  await fireEvent.press(screen.getByText('Reading'));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(screen.queryByRole('button', { name: 'Continue to my plan' })).toBeNull();
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ step: 'plan', questionsCompleted: true, selectionRevision: 7, questions: expect.objectContaining({ apps: [], nativeTargetCount: 2, hobbies: ['Reading'] }) }));
  jest.restoreAllMocks();
});
