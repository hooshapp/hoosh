import { describe, expect, it } from 'vitest';
import executionFixtureValue from '../../../../../packages/contracts/fixtures/quest-execution-v1.json';
import type { QuestExecutionView } from '@disconnect/contracts';
import { decodeQuestExecution, isQuestDate } from './quest-execution-api';
const A = '00000000-0000-4000-8000-000000000001', Q = '00000000-0000-4000-8000-000000000002';
const context = { account: { user_id: A, sessionGeneration: 1 } };
function executionFixture(): QuestExecutionView { return structuredClone(executionFixtureValue) as QuestExecutionView; }
describe('own quest execution boundary', () => {
  it('decodes canonical versions and strips unknown/private response fields', () => {
    const value = executionFixture();
    expect(decodeQuestExecution({ ...value, inventory: ['must-not-retain'] }, context, Q)).toEqual(value);
  });
  it('accepts an absent or stopped execution without an enabled current version', () => {
    const value = { ...executionFixture(), revision: 0, enabled: false, versions: [], occurrences: [] };
    expect(decodeQuestExecution(value, context, Q)).toEqual(value);
  });
  it('uses explicit server state and one credited completed outcome', () => {
    const value = executionFixture();
    value.observed_at = '2026-11-12T12:00:00Z'; value.credits = 50; value.completed_count = 1;
    value.occurrences[0] = { ...value.occurrences[0], state: 'completed', credits: 50 };
    expect(decodeQuestExecution(value, context, Q)).toEqual(value);
  });
  it.each([
    (v: QuestExecutionView) => ({ ...v, user_id: Q }),
    (v: QuestExecutionView) => ({ ...v, quest_id: A }),
    (v: QuestExecutionView) => ({ ...v, revision: 0 }),
    (v: QuestExecutionView) => ({ ...v, credits: 50 }),
    (v: QuestExecutionView) => ({ ...v, completed_count: 1 }),
    (v: QuestExecutionView) => ({ ...v, observed_at: '2026-11-12T12:00:00' }),
    (v: QuestExecutionView) => ({ ...v, versions: [...v.versions, ...v.versions] }),
    (v: QuestExecutionView) => ({ ...v, versions: [{ ...v.versions[0], effective_until: '2026-11-10T12:00:00Z' }] }),
    (v: QuestExecutionView) => ({ ...v, versions: [{ ...v.versions[0], first_date: '2026-02-30' }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [...v.occurrences, ...v.occurrences] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], state: 'active' }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], state: 'completed', credits: 50 }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], state: 'cancelled', can_confirm: true }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], ends_at: v.occurrences[0].starts_at }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], schedule_revision: 2 }] }),
    (v: QuestExecutionView) => ({ ...v, occurrences: [{ ...v.occurrences[0], title: 'Another snapshot' }] }),
  ])('rejects inconsistent ownership, credits, clocks and occurrence metadata %#', (change) => {
    expect(() => decodeQuestExecution(change(executionFixture()), context, Q)).toThrow();
  });
  it.each(['20261112', '2026-02-30', '2026-11-12\n', '2026-11-12T00:00:00Z', '2019-12-31', '2101-01-01'])('rejects noncanonical date %s', (v) => expect(isQuestDate(v)).toBe(false));
  it.each(['2026-11-12', '2028-02-29', '2100-01-01'])('accepts explicit date %s', (v) => expect(isQuestDate(v)).toBe(true));
});
