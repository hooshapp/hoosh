import { describe, expect, it } from 'vitest';
import fixture from '../../../../../packages/contracts/fixtures/quests-v1.json';
import {
  ACCOUNT_A,
  ACCOUNT_B,
  apiFailure,
  json,
  failure,
  setup,
} from '../../infrastructure/api/__tests__/support';
import {
  decodeQuestResponse,
  decodeQuestPage,
  questDefinition,
  readQuest,
  saveQuest,
  deleteQuest,
} from './quests-api';
import { definitionFor, questForm } from './quest-definition-draft';
const id = fixture.quest.quest_id;
const context = { account: { user_id: ACCOUNT_A, sessionGeneration: 1 } };
const row = { ...fixture.quest, user_id: ACCOUNT_A };
const definition = questDefinition(fixture.definition);
const operation = (api: ReturnType<typeof setup>['api']) => ({
  api,
  signal: new AbortController().signal,
  account: context.account,
});
describe('quest wire and request boundary', () => {
  it('decodes canonical own resources and content-free deletion receipts', () => {
    expect(decodeQuestResponse({ quest: row, revision: 1 }, context, id).quest).toEqual(row);
    expect(decodeQuestResponse({ quest: null, revision: 3 }, context, id)).toEqual({
      quest: null,
      revision: 3,
    });
    expect(definitionFor(questForm(definition))).toEqual(definition);
    expect(() => decodeQuestResponse({ quest: null, revision: 0 }, { account: null }, id)).toThrow();
  });
  it.each([
    { quest: row },
    { quest: row, revision: 2 },
    { quest: { ...row, user_id: ACCOUNT_B }, revision: 1 },
    { quest: { ...row, quest_id: ACCOUNT_B }, revision: 1 },
    { quest: { ...row, created_at: '2026-02-30T12:00:00Z' }, revision: 1 },
    { quest: null, revision: -1 },
    { quest: null, revision: true },
  ])('rejects untrusted identity/version/clock response %j', (value) => {
    expect(() => decodeQuestResponse(value, context, id)).toThrow();
  });
  it.each([
    { ...fixture.definition, title: ' ' },
    { ...fixture.definition, activity: '\ud800' },
    { ...fixture.definition, weekdays: [2, 0] },
    { ...fixture.definition, weekdays: [0, 0] },
    { ...fixture.definition, repeat: 'daily' },
    { ...fixture.definition, start_local: '24:00' },
    { ...fixture.definition, next_day: true },
    { ...fixture.definition, native_apps: [] },
  ])('rejects noncanonical/invalid stored definition %j', (value) => {
    expect(() => questDefinition(value)).toThrow();
  });
  it('canonicalizes raw Python-space text and weekday ordering without mutating the form', () => {
    const raw = { ...fixture.definition, title: '\u0085 Book 🦖 \u001c', weekdays: [2, 0] };
    expect(questDefinition(raw, false)).toMatchObject({ title: 'Book 🦖', weekdays: [0, 2] });
    expect(raw.weekdays).toEqual([2, 0]);
  });
  it('rejects duplicate/non-progressing pages and dishonest next cursors', () => {
    expect(decodeQuestPage({ quests: [row], next_cursor: id }, context, null).quests).toHaveLength(
      1,
    );
    expect(() =>
      decodeQuestPage({ quests: [row, row], next_cursor: null }, context, null),
    ).toThrow();
    expect(() =>
      decodeQuestPage({ quests: [row], next_cursor: ACCOUNT_B }, context, null),
    ).toThrow();
    expect(() => decodeQuestPage({ quests: [row], next_cursor: null }, context, id)).toThrow();
  });
  it('dispatches PUT/DELETE once and validates exact own ID/revision/definition', async () => {
    const f = setup();
    f.fetcher.mockResolvedValueOnce(json({ quest: row }));
    await expect(
      saveQuest(id, { expected_revision: 0, definition }, operation(f.api)),
    ).resolves.toEqual({ quest: row });
    expect(f.fetcher.mock.calls[0][1]?.method).toBe('PUT');
    f.fetcher.mockResolvedValueOnce(json({ quest_id: id, revision: 2 }));
    await expect(deleteQuest(id, 1, operation(f.api))).resolves.toEqual({
      quest_id: id,
      revision: 2,
    });
    expect(f.fetcher.mock.calls[1][1]?.method).toBe('DELETE');
  });
  it('masks malformed accepted writes as unconfirmed; never replays', async () => {
    const f = setup();
    f.fetcher.mockResolvedValueOnce(json({ quest: { ...row, revision: 99 } }));
    expect(
      await apiFailure(saveQuest(id, { expected_revision: 0, definition }, operation(f.api))),
    ).toMatchObject({ kind: 'invalid_response', requestMayHaveCommitted: true });
    expect(f.fetcher).toHaveBeenCalledTimes(1);
  });
  it('decodes safe QUEST_CONFLICT and definition validation without raw copy', async () => {
    const f = setup();
    f.fetcher.mockResolvedValueOnce(failure(409, 'QUEST_CONFLICT', { current_revision: 2 }));
    const error = await apiFailure(
      saveQuest(id, { expected_revision: 0, definition }, operation(f.api)),
    );
    expect(error).toMatchObject({
      kind: 'conflict',
      code: 'QUEST_CONFLICT',
      details: { current_revision: 2 },
    });
    expect(error.message).toContain('quest');
    expect(error.message).not.toContain('DO_NOT_EXPOSE');
  });
  it('rejects path injection before fetching; reads never send write bodies', async () => {
    const f = setup();
    expect(() => readQuest('../settings', operation(f.api))).toThrow();
    expect(f.fetcher).not.toHaveBeenCalled();
    f.fetcher.mockResolvedValueOnce(json({ quest: null, revision: 0 }));
    await readQuest(id, operation(f.api));
    expect(f.fetcher.mock.calls[0][1]?.method).toBe('GET');
  });
});
