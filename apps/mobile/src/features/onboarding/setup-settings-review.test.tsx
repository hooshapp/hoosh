import { render, waitFor } from '@testing-library/react-native';
import { SetupSettingsReview } from './setup-settings-review';
import type { OnboardingProgress } from './progress-repository';
const mockSubmit = jest.fn();
const mockScope = { canRun: () => true };
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope, availability: 'ready' }) }));
jest.mock('../settings/settings-query', () => ({
  useSettingsQuery: () => ({ data: { settings: null }, isFetching: false, isError: false, isPaused: false }),
  useSettingsMutation: () => ({ isPending: false, submit: mockSubmit }),
}));
jest.mock('./setup-draft', () => ({ PlanSummary: () => null }));
jest.mock('./figma-plan-screens', () => ({ PlanLoadingScreen: () => null }));
const progress: OnboardingProgress = { version: 1, step: 'review', questionsCompleted: true,
  settingsBaseRevision: 0, activities: { selected_activity_ids: ['reading'], custom_text: null } };
beforeEach(() => mockSubmit.mockClear());
it('saves an explicitly accepted questionnaire plan once without another review tap', async () => {
  const record = jest.fn(async () => true);
  const result = await render(<SetupSettingsReview progress={progress} busy={false} record={record} autoSave />);
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  expect(record).toHaveBeenCalledWith(expect.objectContaining({ settingsAttempt: expect.objectContaining({ expected_revision: 0 }) }));
  await result.rerender(<SetupSettingsReview progress={{ ...progress }} busy={false} record={record} autoSave />);
  expect(mockSubmit).toHaveBeenCalledTimes(1);
});
it('never automatically retries a persisted uncertain write', async () => {
  const record = jest.fn(async () => true);
  await render(<SetupSettingsReview progress={{ ...progress, settingsAttempt: { expected_revision: 0, activities: progress.activities ?? null } }} busy={false} record={record} autoSave />);
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(record).not.toHaveBeenCalled();
});
