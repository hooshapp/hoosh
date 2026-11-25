import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { SettingsPatch, SettingsView } from '@disconnect/contracts';
import { SetupPlanSave } from './setup-plan-save';
import type { OnboardingProgress } from './progress-repository';
const mockSubmit = jest.fn(), mockRefetch = jest.fn(), mockActivate = jest.fn();
jest.mock('./activate-accepted-plan', () => ({ activateAcceptedPlan: (...args: unknown[]) => mockActivate(...args) }));
jest.mock('@/features/protection/native-owner-boundary', () => ({ useNativeOwner: () => ({ owner: 'qa:00000000-0000-4000-8000-000000000001' }) }));
jest.mock('@/features/plans/account-weekly-plan', () => ({ weeklyPort: () => ({}) }));
let mockSuccess: (response: { settings: SettingsView }, patch: SettingsPatch) => void;
let mockError: () => void;
const mockScope = { canRun: () => true, isCurrent: () => true, assertCurrent: () => undefined };
jest.mock('@/infrastructure/query/account-data-provider', () => ({ useAccountData: () => ({ scope: mockScope, availability: 'ready' }) }));
jest.mock('@/features/settings/settings-query', () => ({
  useSettingsQuery: () => ({ data: { settings: null }, refetch: mockRefetch }),
  useSettingsMutation: (options: { onSuccess: typeof mockSuccess; onError: typeof mockError }) => {
    mockSuccess = options.onSuccess; mockError = options.onError;
    return { submit: mockSubmit };
  },
}));
const plan = { weekdays: [0], hours: { start_local: '09:00', end_local: '22:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 15 };
const progress: OnboardingProgress = { version: 1, step: 'review', questionsCompleted: true, selectionRevision: 3,
  activities: { selected_activity_ids: ['reading'], custom_text: null }, planDraft: plan };
const saved = { user_id: 'a', revision: 1, activities: progress.activities, plan_draft: plan } as SettingsView;
beforeEach(() => { jest.clearAllMocks(); mockActivate.mockResolvedValue(undefined); mockRefetch.mockResolvedValue({ data: { settings: null } }); });
it('saves the chosen plan once and advances directly to completion checkpoint after acknowledgment', async () => {
  const record = jest.fn(async (_next: OnboardingProgress, _attempt?: SettingsPatch) => true);
  await render(<SetupPlanSave progress={progress} busy={false} record={record} onEdit={jest.fn()} />);
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  const patch = mockSubmit.mock.calls[0][0];
  await act(async () => mockSuccess({ settings: saved }, patch));
  expect(record).toHaveBeenLastCalledWith(expect.objectContaining({ step: 'permission', settingsRevision: 1, settingsAttempt: undefined }), patch);
  expect(screen.queryByText('Check latest settings')).toBeNull();
  expect(screen.queryByText('Latest account settings')).toBeNull();
});
it('readback of an uncertain committed save completes without repeating its write or asking comparison questions', async () => {
  mockRefetch.mockResolvedValue({ data: { settings: saved } });
  const attempt = { expected_revision: 0, activities: progress.activities, plan_draft: plan };
  const record = jest.fn(async (_next: OnboardingProgress, _attempt?: SettingsPatch) => true);
  await render(<SetupPlanSave progress={{ ...progress, settingsAttempt: attempt }} busy={false} record={record} onEdit={jest.fn()} />);
  await waitFor(() => expect(record).toHaveBeenCalledWith(expect.objectContaining({ step: 'permission' }), attempt));
  expect(mockSubmit).not.toHaveBeenCalled();
});
it('a rejected save stays on the existing suggestion and never claims completion', async () => {
  const record = jest.fn(async (_next: OnboardingProgress, _attempt?: SettingsPatch) => true);
  await render(<SetupPlanSave progress={progress} busy={false} record={record} onEdit={jest.fn()} />);
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  await act(async () => mockError());
  expect(screen.getByRole('button', { name: 'Go with suggestion' })).toBeTruthy();
  expect(screen.queryByText('Check latest settings')).toBeNull();
  expect(record.mock.calls.some(([value]) => value.step === 'permission')).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Go with suggestion' }));
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(2));
});

it('does not show completion until native activation is verified', async () => {
  let confirm!: () => void;
  mockActivate.mockImplementationOnce(() => new Promise<void>(resolve => { confirm = resolve; }));
  const record = jest.fn(async (_next: OnboardingProgress, _attempt?: SettingsPatch) => true);
  await render(<SetupPlanSave progress={progress} busy={false} record={record} onEdit={jest.fn()} />);
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  await act(async () => mockSuccess({ settings: saved }, mockSubmit.mock.calls[0][0]));
  expect(mockActivate).toHaveBeenCalledWith(expect.objectContaining({ draft: plan, selectionRevision: 3 }));
  expect(record.mock.calls.some(([value]) => value.step === 'permission')).toBe(false);
  await act(async () => confirm());
  expect(record.mock.calls.some(([value]) => value.step === 'permission')).toBe(true);
});
it('a native activation failure keeps the existing suggestion and never completes', async () => {
  mockActivate.mockRejectedValueOnce(new Error('Device unavailable'));
  const record = jest.fn(async (_next: OnboardingProgress, _attempt?: SettingsPatch) => true);
  await render(<SetupPlanSave progress={progress} busy={false} record={record} onEdit={jest.fn()} />);
  await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
  await act(async () => mockSuccess({ settings: saved }, mockSubmit.mock.calls[0][0]));
  expect(screen.getByText('Couldn’t start app protection. Check Screen Time access and try again.')).toBeTruthy();
  expect(record.mock.calls.some(([value]) => value.step === 'permission')).toBe(false);
});
