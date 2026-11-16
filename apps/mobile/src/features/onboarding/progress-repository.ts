import type { PlanDraft, SettingsPatch } from '@disconnect/contracts';

import { ApiError, isRecord } from '../../infrastructure/api/errors';
import { decodePlanDraft } from '../settings/settings-api';
import { isActivityId } from '../preferences/activity-model';
import { setupActivities } from './setup-model';
import type { AccountScope } from '@/infrastructure/query/account-scope';

/** Setup progress is local to this installation and verified account. It does
 * not confer native permission or represent an installed plan. */
export type OnboardingProgress = Readonly<{
  version: 1;
  step: 'preferences' | 'plan' | 'permission' | 'review' | 'complete';
  activities?: SettingsPatch['activities'];
  planDraft?: PlanDraft | null;
  profileRevision?: number;
  settingsRevision?: number;
  permissionDeferred?: boolean;
}>;

export type OnboardingProgressRead =
  | { status: 'not_started' | 'read_failed' | 'incompatible' }
  | { status: 'found'; progress: OnboardingProgress };

/** A producer takes the current account scope so it can fence reads and writes
 * when the account or session changes. Plan 02 supplies storage and conversion. */
export interface OnboardingProgressRepository {
  read(scope: AccountScope): Promise<OnboardingProgressRead>;
  save(scope: AccountScope, progress: OnboardingProgress): Promise<void>;
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

const steps = new Set(['preferences', 'plan', 'permission', 'review', 'complete']);
const revision = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 2147483647;

function decodeLocalActivities(value: unknown): SettingsPatch['activities'] {
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

function decodeProgress(raw: string | null): OnboardingProgressRead {
  if (raw === null) return { status: 'not_started' };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return { status: 'read_failed' };
    if (value.version !== 1) return { status: 'incompatible' };
    if (typeof value.step !== 'string' || !steps.has(value.step) ||
      (value.profileRevision !== undefined && !revision(value.profileRevision)) ||
      (value.settingsRevision !== undefined && !revision(value.settingsRevision)) ||
      (value.permissionDeferred !== undefined && typeof value.permissionDeferred !== 'boolean')) {
      return { status: 'read_failed' };
    }
    const progress: OnboardingProgress = {
      version: 1,
      step: value.step as OnboardingProgress['step'],
      ...(value.activities !== undefined ? {
        activities: decodeLocalActivities(value.activities),
      } : {}),
      ...(value.planDraft !== undefined ? { planDraft: decodePlanDraft(value.planDraft) } : {}),
      ...(value.profileRevision !== undefined ? { profileRevision: value.profileRevision } : {}),
      ...(value.settingsRevision !== undefined ? { settingsRevision: value.settingsRevision } : {}),
      ...(value.permissionDeferred !== undefined ? { permissionDeferred: value.permissionDeferred } : {}),
    };
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

  function write(scope: AccountScope, raw: string | null) {
    return enqueue(async () => {
      scope.assertCurrent();
      const key = keyFor(scope);
      const previous = await boundedRead(storage, key);
      scope.assertCurrent();
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
    async save(scope, progress) {
      const decoded = decodeProgress(JSON.stringify(progress));
      if (decoded.status !== 'found') throw new ApiError('invalid_response');
      await write(scope, JSON.stringify(decoded.progress));
    },
    discard: scope => write(scope, null),
  };
}
