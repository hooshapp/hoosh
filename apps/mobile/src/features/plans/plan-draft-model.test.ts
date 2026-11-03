import { describe, expect, it } from 'vitest';
import type { PlanDraft, SettingsView } from '@disconnect/contracts';
import { ApiError } from '../../infrastructure/api/errors';
import {
  emptyPlanDraft,
  isPlanField,
  planDraftInput,
  planDraftPatch,
  planReviewSummary,
  planSummary,
  samePlanInput,
  validDraftHours,
} from './plan-draft-model';

const plan: PlanDraft = {
  weekdays: [0, 6],
  hours: { start_local: '23:00', end_local: null, next_day: true },
  timezone_id: 'US/Eastern',
  session_count: null,
  session_minutes: 30,
};
const settings: SettingsView = {
  user_id: 'a46e48ad-c742-4e18-b57d-2c9a56544944',
  revision: 4,
  activities: { selected_activity_ids: ['reading'], custom_text: 'Art' },
  plan_draft: plan,
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00Z',
};
describe('non-enforcing draft projection', () => {
  it('preserves all partial nullable data, aliases and explicit null intent', () => {
    const input = planDraftInput(plan);
    expect(input.hours).toEqual({ start: '23:00', end: '', nextDay: true });
    expect(input.sessions).toEqual({ count: null, minutes: 30 });
    for (const field of ['days', 'hours', 'sessions'] as const) {
      expect(planDraftPatch(field, input, settings)).toEqual({
        expected_revision: 4,
        plan_draft: plan,
      });
      expect(planDraftPatch(field, null, settings)).toEqual({
        expected_revision: 4,
        plan_draft: null,
      });
    }
    expect(planDraftPatch('days', planDraftInput(null), null)).toEqual({
      expected_revision: 0,
      plan_draft: emptyPlanDraft(),
    });
  });
  it('replaces only viewed fields using the explicitly reviewed base and never sends activities', () => {
    const draft = { ...planDraftInput(plan), weekdays: [5, 1] };
    const latest = {
      ...settings,
      revision: 9,
      plan_draft: { ...plan, timezone_id: 'UTC', session_count: 8 },
    };
    expect(planDraftPatch('days', draft, latest)).toEqual({
      expected_revision: 9,
      plan_draft: { ...latest.plan_draft, weekdays: [1, 5] },
    });
    expect(settings.plan_draft).toEqual(plan);
    const hours = { ...planDraftInput(plan), hours: null, timezone: '' };
    expect(planDraftPatch('hours', hours, settings)).toEqual({
      expected_revision: 4,
      plan_draft: { ...plan, hours: null, timezone_id: null },
    });
    const sessions = { ...planDraftInput(plan), sessions: { count: 1000, minutes: null } };
    expect(planDraftPatch('sessions', sessions, settings)).toEqual({
      expected_revision: 4,
      plan_draft: { ...plan, session_count: 1000, session_minutes: null },
    });
  });
  it('does not guess a timezone or normalize invalid raw timezone text', () => {
    const input = planDraftInput(null);
    expect(input.timezone).toBe('');
    expect(
      planDraftPatch('hours', { ...input, timezone: '  Bad/Zone\ufeff  ' }, null).plan_draft
        ?.timezone_id,
    ).toBe('  Bad/Zone\ufeff  ');
  });
  it.each([
    { start: '', end: '', nextDay: false },
    { start: '09:00', end: '', nextDay: true },
    { start: '', end: '23:59', nextDay: false },
    { start: '23:00', end: '01:00', nextDay: true },
    { start: '09:00', end: '17:00', nextDay: false },
  ])('allows nullable or coherent hours %#', (hours) => expect(validDraftHours(hours)).toBe(true));
  it.each([
    { start: '9:00', end: '', nextDay: false },
    { start: '24:00', end: '', nextDay: true },
    { start: '12:00', end: '12:00', nextDay: true },
    { start: '23:00', end: '01:00', nextDay: false },
    { start: '09:00', end: '17:00', nextDay: true },
    { start: ' ', end: '', nextDay: false },
  ])('rejects entered invalid hours without dropping raw values %#', (hours) => {
    expect(validDraftHours(hours)).toBe(false);
    expect(() => planDraftPatch('hours', { ...planDraftInput(null), hours }, null)).toThrow(
      ApiError,
    );
  });
  it('validates bounded storage choices without inventing allowance policy', () => {
    const input = planDraftInput(null);
    for (const weekdays of [[0, 0], [7], [-1], [0.5]])
      expect(() => planDraftPatch('days', { ...input, weekdays }, null)).toThrow(ApiError);
    for (const sessions of [
      { count: 0, minutes: null },
      { count: 1001, minutes: null },
      { count: null, minutes: 1441 },
      { count: 1.5, minutes: 2 },
    ])
      expect(() => planDraftPatch('sessions', { ...input, sessions }, null)).toThrow(ApiError);
  });
  it('dirty equality considers the viewed fields and distinguishes hours null from partial input', () => {
    const input = planDraftInput(plan);
    expect(samePlanInput('days', input, { ...input, weekdays: [6, 0], timezone: 'UTC' })).toBe(
      true,
    );
    expect(samePlanInput('hours', input, { ...input, timezone: 'UTC' })).toBe(false);
    expect(
      samePlanInput('hours', planDraftInput(null), {
        ...planDraftInput(null),
        hours: { start: '', end: '', nextDay: false },
      }),
    ).toBe(false);
    expect(samePlanInput('sessions', input, null)).toBe(false);
  });
  it('labels only draft values, including partial values and known absence', () => {
    expect(planSummary('days', plan)).toBe('Draft: Monday, Sunday');
    expect(planSummary('hours', plan)).toContain('23:00–end not set (next day); US/Eastern');
    expect(planSummary('sessions', plan)).toBe('Draft: count not set; minutes 30');
    expect(planReviewSummary(null)).toBe('No saved draft');
    expect(planReviewSummary(emptyPlanDraft())).toContain('timezone not set');
    expect(isPlanField('age')).toBe(false);
  });
});
