import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';
import { getScreenTimeAuthorization, requestScreenTimeAuthorization } from '@/infrastructure/screen-time/authorization';
import { OnboardingQuestions } from './OnboardingQuestions';
import { questionAnswersKey, questionCompleteKey, questionDraftKey, serializeQuestionDraft } from './draft';

jest.mock('@/infrastructure/screen-time/authorization', () => ({
  getScreenTimeAuthorization: jest.fn<() => Promise<string>>(async () => 'unavailable'),
  requestScreenTimeAuthorization: jest.fn<() => Promise<string>>(async () => 'unavailable'),
}));
const mockReplace = jest.fn();
const mockStorage = new Map<string, string>();
const mockSnapshot = { status: 'signed_in', user: { user_id: 'account-a', email: 'a@example.test' } };

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ snapshot: mockSnapshot }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { mockStorage.delete(key); }),
  },
}));

function Wrapper({ children }: PropsWithChildren) {
  return <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{children}</SafeAreaProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStorage.clear();
  jest.mocked(getScreenTimeAuthorization).mockResolvedValue('unavailable');
  jest.mocked(requestScreenTimeAuthorization).mockResolvedValue('unavailable');
  mockSnapshot.user.user_id = 'account-a';
});

async function open() {
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  await screen.findByText('What’s your gender?');
}

it('walks through the five Figma screens in order and returns to the correct prior page', async () => {
  await open();
  await fireEvent.press(screen.getByText('Female'));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(await screen.findByText('How old are you?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(await screen.findByText('Which apps do you use most?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(await screen.findByText('How old are you?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('Which apps do you use most?');
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(await screen.findByText('What do you want to do instead?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  expect(await screen.findByText('Screen Time access')).toBeTruthy();
});

it('enforces the 2–4 app selection and allows replacing the defaults', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('Which apps do you use most?');
  await fireEvent.press(screen.getByText('TikTok'));
  await fireEvent.press(screen.getByText('YouTube'));
  expect(screen.getByText('4 selected')).toBeTruthy();
  await fireEvent.press(screen.getByText('Reddit'));
  expect(screen.getByText('4 selected')).toBeTruthy();
  await fireEvent.press(screen.getByText('Instagram'));
  expect(screen.getByText('3 selected')).toBeTruthy();
});

it('adds and removes a custom hobby without duplicates', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('Which apps do you use most?');
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('What do you want to do instead?');
  await fireEvent.changeText(screen.getByLabelText('Add a custom activity'), '  Gardening  ');
  await fireEvent.press(screen.getByRole('button', { name: 'Add this hobby' }));
  expect(screen.getByRole('button', { name: 'Remove Gardening' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove Gardening' }));
  expect(screen.queryByRole('button', { name: 'Remove Gardening' })).toBeNull();
});

it('resumes the account-scoped last step and saves only approved preference fields', async () => {
  mockStorage.set(questionDraftKey('account-a'), serializeQuestionDraft({ step: 4, apps: ['X'], hobbies: ['Walking'] }));
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  expect(await screen.findByText('Screen Time access')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  const saved = JSON.parse(mockStorage.get(questionAnswersKey('account-a')) ?? '{}') as Record<string, unknown>;
  expect(saved).toMatchObject({ apps: ['X'], hobbies: ['Walking'], screenTimeAccess: 'unavailable' });
  expect(saved).not.toHaveProperty('gender');
  expect(saved).not.toHaveProperty('age');
  expect(mockStorage.get(questionCompleteKey('account-a'))).toBe('1');
  expect(mockStorage.has(questionDraftKey('account-a'))).toBe(false);
});

it('does not pretend the unavailable Screen Time button granted access', async () => {
  mockStorage.set(questionDraftKey('account-a'), serializeQuestionDraft({ step: 4, apps: [], hobbies: [] }));
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  await screen.findByText('Screen Time access');
  await fireEvent.press(screen.getByRole('button', { name: 'Allow Screen Time access' }));
  expect(await screen.findByText(/isn’t connected in this app build yet/i)).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

it('updates the selected age immediately when a visible age is tapped', async () => {
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('How old are you?');
  await fireEvent.press(screen.getByRole('button', { name: 'Age 25' }));
  expect(screen.getByRole('button', { name: 'Age 25' }).props.accessibilityState.selected).toBe(true);
});

it('continues only after native authorization is confirmed, and saves that observation', async () => {
  jest.mocked(getScreenTimeAuthorization).mockResolvedValue('not_requested');
  jest.mocked(requestScreenTimeAuthorization).mockResolvedValue('authorized');
  mockStorage.set(questionDraftKey('account-a'), serializeQuestionDraft({ step: 4, apps: [], hobbies: [] }));
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  await screen.findByText('Screen Time access');
  await fireEvent.press(screen.getByRole('button', { name: 'Allow Screen Time access' }));
  expect(await screen.findByRole('button', { name: 'Continue →' })).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue →' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)'));
  expect(JSON.parse(mockStorage.get(questionAnswersKey('account-a')) ?? '{}').screenTimeAccess).toBe('authorized');
});

it('keeps the user on permission setup if the native request fails', async () => {
  jest.mocked(requestScreenTimeAuthorization).mockRejectedValue(new Error('request cancelled'));
  mockStorage.set(questionDraftKey('account-a'), serializeQuestionDraft({ step: 4, apps: [], hobbies: [] }));
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  await screen.findByText('Screen Time access');
  await fireEvent.press(screen.getByRole('button', { name: 'Allow Screen Time access' }));
  expect(await screen.findByText(/Could not request access/)).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

it('includes a typed custom activity when the user presses Next without the plus button', async () => {
  mockStorage.set(questionDraftKey('account-a'), serializeQuestionDraft({ step: 3, apps: ['X'], hobbies: [] }));
  await render(<OnboardingQuestions />, { wrapper: Wrapper });
  await screen.findByText('What do you want to do instead?');
  await fireEvent.changeText(screen.getByLabelText('Add a custom activity'), 'Gardening');
  await fireEvent.press(screen.getByRole('button', { name: 'Next →' }));
  await screen.findByText('Screen Time access');
  await fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
  await waitFor(() => expect(mockReplace).toHaveBeenCalled());
  expect(JSON.parse(mockStorage.get(questionAnswersKey('account-a')) ?? '{}').hobbies).toEqual(['Gardening']);
});
