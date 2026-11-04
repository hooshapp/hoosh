import type { ManualPlan } from './manual-plan';
import type { AuthorizationState } from '@disconnect/contracts';
export const QUESTION_DRAFT_VERSION = 1 as const;
export const QUESTION_STEPS = 9 as const;

export type QuestionDraft = {
  version: typeof QUESTION_DRAFT_VERSION;
  step: number;
  planChoice?: 'manual' | 'suggested';
  apps: string[];
  hobbies: string[];
  age?: number;
  gender?: string;
};

export type SavedQuestionAnswers = {
  version: typeof QUESTION_DRAFT_VERSION;
  apps: string[];
  hobbies: string[];
  screenTimeAccess: AuthorizationState;
  manualPlan?: ManualPlan;
  age?: number;
  gender?: string;
};

const supportedApps = new Set(['Instagram', 'Snapchat', 'TikTok', 'YouTube', 'Reddit', 'X']);

export function questionDraftKey(accountId: string): string {
  return `hoosh.onboarding-draft.v${QUESTION_DRAFT_VERSION}:${accountId}`;
}

export function questionAnswersKey(accountId: string): string {
  return `hoosh.onboarding-answers.v${QUESTION_DRAFT_VERSION}:${accountId}`;
}

export function questionCompleteKey(accountId: string): string {
  return `hoosh.onboarding-questions-complete.v${QUESTION_DRAFT_VERSION}:${accountId}`;
}

export function parseQuestionDraft(raw: string | null): QuestionDraft | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || value.version !== QUESTION_DRAFT_VERSION) return null;
  if (!Number.isInteger(value.step) || (value.step as number) < 0 || (value.step as number) >= QUESTION_STEPS) return null;
  if (!Array.isArray(value.apps) || !Array.isArray(value.hobbies)) return null;
  if (value.apps.length > 4 || value.hobbies.length > 12) return null;
  if (!value.apps.every(item => typeof item === 'string' && supportedApps.has(item))) return null;
  if (!value.hobbies.every(item => typeof item === 'string' && item.trim().length > 0 && item.trim().length <= 40)) return null;
  return {
    version: QUESTION_DRAFT_VERSION,
    step: value.step as number,
    ...(value.planChoice === 'manual' || value.planChoice === 'suggested' ? {planChoice: value.planChoice} : {}),
    apps: uniqueStrings(value.apps as string[]),
    hobbies: uniqueStrings((value.hobbies as string[]).map(item => item.trim().replace(/\s+/g, ' '))),
    age: typeof value.age === 'number' && Number.isInteger(value.age) && value.age >= 18 && value.age <= 80 ? value.age : undefined,
    gender: typeof value.gender === 'string' && ['Male', 'Female', 'Other'].includes(value.gender) ? value.gender : undefined,
  };
}

export function serializeQuestionDraft(draft: Omit<QuestionDraft, 'version'>): string {
  return JSON.stringify({ version: QUESTION_DRAFT_VERSION, ...draft });
}

export function makeSavedQuestionAnswers(apps: string[], hobbies: string[], authorization: AuthorizationState = 'not_requested', demographics?: { age: number; gender: string }): SavedQuestionAnswers {
  return {
    version: QUESTION_DRAFT_VERSION,
    apps: uniqueStrings(apps.filter(app => supportedApps.has(app))),
    hobbies: uniqueStrings(hobbies.map(item => item.trim().replace(/\s+/g, ' ')).filter(item => item.length > 0 && item.length <= 40)),
    screenTimeAccess: authorization,
    ...(demographics ? { age: demographics.age, gender: demographics.gender } : {}),
  };
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => {
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
