import type { PlanDraft, SettingsPatch } from '@disconnect/contracts';

import { ApiError, isRecord } from '../../infrastructure/api/errors';
import { decodePlanDraft } from '../settings/settings-api';
import { isActivityId } from '../preferences/activity-model';
import { completeSchedule } from '../plans/weekly-schedule';
import type { ReviewedWeeklyPlan } from '../plans/use-weekly-plan';
import { setupActivities } from './setup-model';
import type { AccountScope } from '@/infrastructure/query/account-scope';

/** Setup progress is local to this installation and verified account. It does
 * not confer native permission or represent an installed plan. */
export type QuestionnaireAnswers = Readonly<{
  index: number;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  apps: string[];
  nativeTargetCount?: number;
  hobbies: string[];
}>;
export type OnboardingProgress = Readonly<{
  version: 1;
  step: 'questions' | 'preferences' | 'plan' | 'permission' | 'protection' | 'review' | 'complete';
  questions?: QuestionnaireAnswers;
  questionsCompleted?: boolean;
  activities?: SettingsPatch['activities'];
  planDraft?: PlanDraft | null;
  profileRevision?: number;
  settingsRevision?: number;
  settingsBaseRevision?: number;
  settingsAttempt?: SettingsPatch;
  settingsDeferred?: boolean;
  permissionDeferred?: boolean;
  selectionRevision?: number;
  protectionAttempt?: ReviewedWeeklyPlan;
}>;

export type OnboardingProgressRead =
  | { status: 'not_started' | 'read_failed' | 'incompatible' }
  | { status: 'found'; progress: OnboardingProgress };

/** A producer takes the current account scope so it can fence reads and writes
 * when the account or session changes. Plan 02 supplies storage and conversion. */
export interface OnboardingProgressRepository {
  read(scope: AccountScope): Promise<OnboardingProgressRead>;
  save(scope: AccountScope, progress: OnboardingProgress, expectedAttempt?: SettingsPatch): Promise<void>;
  discard(scope: AccountScope): Promise<void>;
}

type ProgressStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

async function boundedRead(storage: ProgressStorage, key: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      storage.getItem(key),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Setup storage did not respond.')), 2500);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

const steps = new Set(['questions', 'preferences', 'plan', 'permission', 'protection', 'review', 'complete']);
const revision = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647;

function decodeLocalActivities(value: unknown): Exclude<SettingsPatch['activities'], undefined> {
  if (value === null) return null;
  if (!isRecord(value) || !Array.isArray(value.selected_activity_ids) ||
    !value.selected_activity_ids.every(isActivityId) ||
    (value.custom_text !== null && typeof value.custom_text !== 'string')) {
    throw new ApiError('invalid_response');
  }
  const result = setupActivities(value.selected_activity_ids, value.custom_text === null ? [] : [value.custom_text]);
  if (result.error !== undefined) throw new ApiError('invalid_response');
  return result.value;
}

function decodeAttempt(value: unknown): SettingsPatch {
  if (!isRecord(value) || !(value.expected_revision === 0 || revision(value.expected_revision)) ||
    value.expected_revision >= 2147483647 ||
    (value.activities === undefined && value.plan_draft === undefined)) {
    throw new ApiError('invalid_response');
  }
  const expected_revision = value.expected_revision;
  if (value.activities !== undefined) {
    return {
      expected_revision,
      activities: decodeLocalActivities(value.activities),
      ...(value.plan_draft !== undefined ? { plan_draft: decodePlanDraft(value.plan_draft) } : {}),
    };
  }
  return { expected_revision, plan_draft: decodePlanDraft(value.plan_draft) };
}

function decodeProtectionAttempt(value: unknown): ReviewedWeeklyPlan {
  if (!isRecord(value) || !revision(value.revision) || !revision(value.selectionRevision)) {
    throw new ApiError('invalid_response');
  }
  return {
    revision: value.revision,
    selectionRevision: value.selectionRevision,
    spec: completeSchedule(value.spec),
  };
}

function decodeQuestions(value: unknown): QuestionnaireAnswers {
  if (!isRecord(value) || !Number.isInteger(value.index) || (value.index as number) < 0 || (value.index as number) > 4 ||
    (value.gender !== undefined && !['Male', 'Female', 'Other'].includes(value.gender as string)) ||
    (value.age !== undefined && (!Number.isInteger(value.age) || (value.age as number) < 18 || (value.age as number) > 80)) ||
    !Array.isArray(value.apps) || value.apps.length > 4 || !value.apps.every(v => ['Instagram', 'Snapchat', 'TikTok', 'YouTube', 'Reddit', 'X'].includes(v)) ||
    !Array.isArray(value.hobbies) || value.hobbies.length > 12 || !value.hobbies.every(v => typeof v === 'string' && v.trim().length > 0 && v.length <= 60) ||
    new Set(value.apps).size !== value.apps.length || new Set(value.hobbies).size !== value.hobbies.length) throw new Error('Invalid questionnaire');
  if (value.nativeTargetCount !== undefined && (!Number.isSafeInteger(value.nativeTargetCount) || (value.nativeTargetCount as number) < 1 || (value.nativeTargetCount as number) > 512 || value.apps.length !== 0)) throw new Error('Invalid native target summary');
  return { ...(value.nativeTargetCount === undefined ? {} : { nativeTargetCount: value.nativeTargetCount as number }), index: value.index as number, gender: value.gender as QuestionnaireAnswers['gender'], age: value.age as number | undefined,
    apps: value.apps as string[], hobbies: value.hobbies as string[] };
}

function decodeProgress(raw: string | null): OnboardingProgressRead {
  if (raw === null) return { status: 'not_started' };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return { status: 'read_failed' };
    if (value.version !== 1) return { status: 'incompatible' };
    if (typeof value.step !== 'string' || !steps.has(value.step) ||
      (value.profileRevision !== undefined && !revision(value.profileRevision)) ||
      (value.settingsRevision !== undefined && !revision(value.settingsRevision)) ||
      (value.settingsBaseRevision !== undefined && value.settingsBaseRevision !== 0 && !revision(value.settingsBaseRevision)) ||
      (value.settingsDeferred !== undefined && typeof value.settingsDeferred !== 'boolean') ||
      (value.settingsAttempt !== undefined && (value.step !== 'review' || value.settingsRevision !== undefined)) ||
      (value.protectionAttempt !== undefined && value.step !== 'protection' && value.step !== 'complete') ||
      (value.selectionRevision !== undefined && !revision(value.selectionRevision)) ||
      (value.permissionDeferred !== undefined && typeof value.permissionDeferred !== 'boolean') ||
      (value.questionsCompleted !== undefined && typeof value.questionsCompleted !== 'boolean')) {
      return { status: 'read_failed' };
    }
    const progress: OnboardingProgress = {
      version: 1,
      ...(value.questions !== undefined ? { questions: decodeQuestions(value.questions) } : {}),
      ...(value.questionsCompleted !== undefined ? { questionsCompleted: value.questionsCompleted === true } : {}),
      step: value.step as OnboardingProgress['step'],
      ...(value.activities !== undefined ? {
        activities: decodeLocalActivities(value.activities),
      } : {}),
      ...(value.planDraft !== undefined ? { planDraft: decodePlanDraft(value.planDraft) } : {}),
      ...(value.profileRevision !== undefined ? { profileRevision: value.profileRevision } : {}),
      ...(value.settingsRevision !== undefined ? { settingsRevision: value.settingsRevision } : {}),
      ...(value.settingsBaseRevision !== undefined ? { settingsBaseRevision: value.settingsBaseRevision as number } : {}),
      ...(value.settingsAttempt !== undefined ? { settingsAttempt: decodeAttempt(value.settingsAttempt) } : {}),
      ...(value.settingsDeferred !== undefined ? { settingsDeferred: value.settingsDeferred } : {}),
      ...(value.protectionAttempt !== undefined ? { protectionAttempt: decodeProtectionAttempt(value.protectionAttempt) } : {}),
      ...(value.selectionRevision !== undefined ? { selectionRevision: value.selectionRevision as number } : {}),
      ...(value.permissionDeferred !== undefined ? { permissionDeferred: value.permissionDeferred } : {}),
    };
    if (progress.questions?.nativeTargetCount && !progress.selectionRevision) return { status: 'read_failed' };
    if (progress.questionsCompleted && (!progress.questions?.gender || !progress.questions.age || (!progress.questions.nativeTargetCount && progress.questions.apps.length < 2) || !progress.questions.hobbies.length)) return { status: 'read_failed' };
    return { status: 'found', progress };
  } catch {
    return { status: 'read_failed' };
  }
}

/** One queue per project shares storage order across mounts and account replacement. */
export function createOnboardingProgressRepository(storage: ProgressStorage, project: string): OnboardingProgressRepository {
  let tail: Promise<unknown> = Promise.resolve();
  function enqueue<T>(work: () => Promise<T>) {
    const next = tail.then(work);
    tail = next.catch(() => undefined);
    return next;
  }
  const keyFor = (scope: AccountScope) => `hoosh.setup.${project}.${scope.account.user_id}`;

  function write(scope: AccountScope, raw: string | null, expectedAttempt?: SettingsPatch) {
    return enqueue(async () => {
      scope.assertCurrent();
      const key = keyFor(scope);
      const previous = await boundedRead(storage, key);
      scope.assertCurrent();
      if (expectedAttempt) {
        const stored = decodeProgress(previous);
        if (stored.status !== 'found' ||
          JSON.stringify(stored.progress.settingsAttempt) !== JSON.stringify(expectedAttempt)) {
          throw new ApiError('conflict');
        }
      }
      if (raw === null) await storage.removeItem(key);
      else await storage.setItem(key, raw);
      if (!scope.isCurrent()) {
        // No newer write in this repository can begin until this operation drains.
        if (previous === null) await storage.removeItem(key);
        else await storage.setItem(key, previous);
        scope.assertCurrent();
      }
    });
  }

  return {
    read: scope => enqueue(async () => {
      scope.assertCurrent();
      let value: string | null;
      try {
        value = await boundedRead(storage, keyFor(scope));
      } catch {
        scope.assertCurrent();
        return { status: 'read_failed' };
      }
      scope.assertCurrent();
      return decodeProgress(value);
    }),
    async save(scope, progress, expectedAttempt) {
      const decoded = decodeProgress(JSON.stringify(progress));
      if (decoded.status !== 'found') throw new ApiError('invalid_response');
      await write(scope, JSON.stringify(decoded.progress), expectedAttempt);
    },
    discard: scope => write(scope, null),
  };
}
