import { describe, expect, it } from 'vitest';
import { ApiError } from '../../infrastructure/api/errors';
import {
  ACCOUNT_A,
  ACCOUNT_B,
  apiFailure,
  failure,
  json,
  setup,
} from '../../infrastructure/api/__tests__/support';
import { activityDraft, activityPayload, activitySummary } from '../preferences/activity-model';
import { decodeSettingsResponse, readSettings, saveSettings } from './settings-api';

const context = { account: { user_id: ACCOUNT_A, sessionGeneration: 1 } };
const row = () => ({
  user_id: ACCOUNT_A,
  revision: 1,
  activities: { selected_activity_ids: ['reading'], custom_text: '🦖'.repeat(200) },
  plan_draft: {
    weekdays: [0, 6],
    hours: { start_local: '22:00', end_local: '06:00', next_day: true },
    timezone_id: 'US/Eastern',
    session_count: 1,
    session_minutes: 1440,
  },
  created_at: '2026-11-02T12:00:00Z',
  updated_at: '2026-11-02T12:00:00.123456Z',
});
describe('settings runtime boundary', () => {
  it('accepts absence, complete canonical resource and projects only approved fields', () => {
    expect(decodeSettingsResponse({ settings: null }, context)).toEqual({ settings: null });
    expect(
      decodeSettingsResponse({ settings: { ...row(), private: 'ignore' }, extra: true }, context),
    ).toEqual({ settings: row() });
    const partial = {
      ...row(),
      plan_draft: {
        weekdays: [],
        hours: { start_local: null, end_local: '03:00', next_day: true },
        timezone_id: null,
        session_count: null,
        session_minutes: null,
      },
    };
    expect(decodeSettingsResponse({ settings: partial }, context)).toEqual({ settings: partial });
  });
  it.each([
    {},
    { settings: undefined },
    { settings: [] },
    { settings: { ...row(), user_id: ACCOUNT_B } },
    { settings: { ...row(), revision: 0 } },
    { settings: { ...row(), revision: 2147483648 } },
    { settings: { ...row(), created_at: '2026-02-30T12:00:00Z' } },
    { settings: { ...row(), updated_at: '2026-11-02T11:59:59Z' } },
    { settings: { ...row(), updated_at: '2026-11-02T12:00:00+00:00' } },
    {
      settings: {
        ...row(),
        activities: { selected_activity_ids: ['reading', 'reading'], custom_text: null },
      },
    },
    {
      settings: { ...row(), activities: { selected_activity_ids: ['unknown'], custom_text: null } },
    },
    { settings: { ...row(), activities: { selected_activity_ids: [] } } },
    ...['', ' ', '\u0085x', 'x\u001c', '🦖'.repeat(201), '\0', '\ud800'].map((custom_text) => ({
      settings: { ...row(), activities: { selected_activity_ids: [], custom_text } },
    })),
    ...[
      undefined,
      {},
      { ...row().plan_draft, weekdays: [1, 0] },
      { ...row().plan_draft, weekdays: [0, 0] },
      { ...row().plan_draft, weekdays: [true] },
      { ...row().plan_draft, session_minutes: 1441 },
      { ...row().plan_draft, session_count: 1.5 },
      { ...row().plan_draft, timezone_id: 'posix/America/New_York' },
      { ...row().plan_draft, timezone_id: '' },
      { ...row().plan_draft, hours: { start_local: '08:00', end_local: '08:00', next_day: true } },
      { ...row().plan_draft, hours: { start_local: '24:00', end_local: null, next_day: false } },
      { ...row().plan_draft, hours: { start_local: null, end_local: null } },
    ].map((plan_draft) => ({ settings: { ...row(), plan_draft } })),
  ])('rejects malformed, foreign or impossible data %#', (value) => {
    expect(() => decodeSettingsResponse(value, context)).toThrow(ApiError);
  });
  it('keeps FEFF which Python strip preserves and keeps raw request text unchanged', () => {
    const activities = { selected_activity_ids: [] as never[], custom_text: '\ufeff' };
    expect(
      decodeSettingsResponse({ settings: { ...row(), activities } }, context).settings?.activities,
    ).toEqual(activities);
    const draft = {
      selected: ['arts_and_crafts'],
      customSelected: true,
      custom: '  Raw 🦖 \u0085',
    };
    expect(activityPayload(draft)).toEqual({
      selected_activity_ids: ['arts_and_crafts'],
      custom_text: draft.custom,
    });
    expect(activityPayload({ ...draft, customSelected: false }).custom_text).toBeNull();
    expect(draft.custom).toBe('  Raw 🦖 \u0085');
    expect(activityDraft(null)).toEqual({ selected: [], customSelected: false, custom: '' });
    expect(activitySummary(activities)).toBe('Custom: \ufeff');
    expect(activitySummary({ selected_activity_ids: [], custom_text: null })).toBeNull();
    expect(() => activityPayload({ ...draft, selected: ['unknown'] })).toThrow(ApiError);
  });
});
describe('real scoped HTTP settings requests', () => {
  it('GET does not create and PATCH sends only the section and captured revision', async () => {
    const { api, fetcher } = setup();
    const signal = new AbortController().signal;
    const operation = { api, signal, account: context.account };
    fetcher.mockResolvedValueOnce(json({ settings: null }));
    await expect(readSettings(operation)).resolves.toEqual({ settings: null });
    const patch = {
      expected_revision: 0,
      activities: { selected_activity_ids: [] as never[], custom_text: ' raw ' },
    };
    const saved = { ...row(), activities: { selected_activity_ids: [], custom_text: 'raw' } };
    fetcher.mockResolvedValueOnce(json({ settings: saved }));
    await expect(saveSettings(patch, operation)).resolves.toEqual({ settings: saved });
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example/v1/settings',
      'https://api.example/v1/settings',
    ]);
    const request = fetcher.mock.calls[1][1]!;
    expect(request.method).toBe('PATCH');
    expect(JSON.parse(request.body as string)).toEqual(patch);
    expect(request.signal).toBeInstanceOf(AbortSignal);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('conflict remains definite; an impossible saved revision is uncertain and never retried', async () => {
    const { api, fetcher } = setup();
    const operation = { api, signal: new AbortController().signal, account: context.account };
    const patch = {
      expected_revision: 0,
      activities: { selected_activity_ids: [] as never[], custom_text: null },
    };
    fetcher.mockResolvedValueOnce(failure(409, 'SETTINGS_CONFLICT', { current_revision: 3 }));
    expect(await apiFailure(saveSettings(patch, operation))).toMatchObject({
      kind: 'conflict',
      requestMayHaveCommitted: false,
    });
    fetcher.mockResolvedValueOnce(json({ settings: { ...row(), revision: 2 } }));
    expect(await apiFailure(saveSettings(patch, operation))).toMatchObject({
      kind: 'invalid_response',
      requestMayHaveCommitted: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
