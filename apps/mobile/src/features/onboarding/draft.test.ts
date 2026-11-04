import { describe, expect, it } from 'vitest';
import {
  makeSavedQuestionAnswers,
  parseQuestionDraft,
  questionAnswersKey,
  questionCompleteKey,
  questionDraftKey,
  serializeQuestionDraft,
} from './draft';

describe('account-scoped onboarding question drafts', () => {
  it('uses separate draft, answer, and completion keys for each account', () => {
    expect(questionDraftKey('user-a')).not.toBe(questionDraftKey('user-b'));
    expect(questionAnswersKey('user-a')).not.toBe(questionAnswersKey('user-b'));
    expect(questionCompleteKey('user-a')).not.toBe(questionCompleteKey('user-b'));
  });

  it('round-trips the last valid step and selected preferences', () => {
    const draft = { step: 3, apps: ['Instagram', 'Snapchat'], hobbies: ['Gym', 'Gardening'] };
    expect(parseQuestionDraft(serializeQuestionDraft(draft))).toEqual({ version: 1, ...draft });
  });

  it.each([
    null,
    '{broken',
    JSON.stringify({ version: 2, step: 0, apps: [], hobbies: [] }),
    JSON.stringify({ version: 1, step: 9, apps: [], hobbies: [] }),
    JSON.stringify({ version: 1, step: 0, apps: ['Unknown app'], hobbies: [] }),
    JSON.stringify({ version: 1, step: 0, apps: [], hobbies: [''] }),
    JSON.stringify({ version: 1, step: 0, apps: [], hobbies: Array(13).fill('hobby') }),
  ])('rejects invalid or incompatible drafts: %s', raw => {
    expect(parseQuestionDraft(raw)).toBeNull();
  });

  it.each([5, 6, 7])('resumes plan preparation, review and completion at step %s', step => {
    const draft = { step, apps: ['X'], hobbies: ['Walking'], age: 25, gender: 'Other' };
    expect(parseQuestionDraft(serializeQuestionDraft(draft))).toMatchObject(draft);
  });

  it('normalizes duplicates and does not persist gender or age', () => {
    const saved = makeSavedQuestionAnswers(['Instagram', 'instagram', 'X'], [' Gym ', 'gym', 'Walking']);
    expect(saved).toEqual({
      version: 1,
      apps: ['Instagram', 'X'],
      hobbies: ['Gym', 'Walking'],
      screenTimeAccess: 'not_requested',
    });
    expect(saved).not.toHaveProperty('gender');
    expect(saved).not.toHaveProperty('age');
  });
});
