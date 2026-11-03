import type { SettingsResponse } from '@disconnect/contracts';
import { describe, expect, it } from 'vitest';
import { settingsSummary } from './settings-summary-model';

const input = {
  availability: 'ready' as const,
  online: true,
  isError: false,
  isPaused: false,
  data: undefined as SettingsResponse | undefined,
};
const row: SettingsResponse = {
  settings: {
    user_id: 'a46e48ad-c742-4e18-b57d-2c9a56544944',
    revision: 1,
    activities: { selected_activity_ids: ['reading', 'arts_and_crafts'], custom_text: '\ufeff' },
    plan_draft: {
      weekdays: [0, 6],
      hours: { start_local: '23:00', end_local: null, next_day: true },
      timezone_id: 'US/Eastern',
      session_count: null,
      session_minutes: 30,
    },
    created_at: '2026-11-03T12:00:00Z',
    updated_at: '2026-11-03T12:00:00Z',
  },
};
describe('one canonical Home and Settings projection', () => {
  it('distinguishes initial loading, verified absence and an explicit empty selection/draft', () => {
    expect(Object.values(settingsSummary(input)).every((value) => value.state === 'loading')).toBe(
      true,
    );
    expect(settingsSummary({ ...input, data: { settings: null } })).toEqual({
      activities: { state: 'ready', text: 'Not saved yet' },
      days: { state: 'ready', text: 'No saved draft' },
      hours: { state: 'ready', text: 'No saved draft' },
      sessions: { state: 'ready', text: 'No saved draft' },
    });
    const result = settingsSummary({
      ...input,
      data: {
        settings: {
          ...row.settings!,
          activities: { selected_activity_ids: [], custom_text: null },
          plan_draft: null,
        },
      },
    });
    expect(result.activities).toEqual({ state: 'ready', text: null });
    expect(result.days).toEqual({ state: 'ready', text: 'No saved draft' });
  });
  it('retains canonical labels, Unicode and partial fields without active or measured claims', () => {
    expect(settingsSummary({ ...input, data: row })).toEqual({
      activities: { state: 'ready', text: 'Reading, Arts and crafts, Custom: \ufeff' },
      days: { state: 'ready', text: 'Draft: Monday, Sunday' },
      hours: { state: 'ready', text: 'Draft: 23:00–end not set (next day); US/Eastern' },
      sessions: { state: 'ready', text: 'Draft: count not set; minutes 30' },
    });
  });
  it.each([
    'bootstrapping',
    'signed_out',
    'signing_out',
    'auth_unavailable',
    'api_unavailable',
    'api_paused',
    'recovering',
  ] as const)('masks cached preferences when %s', (availability) => {
    expect(
      Object.values(settingsSummary({ ...input, data: row, availability })).every(
        (value) => value.state === 'unavailable',
      ),
    ).toBe(true);
  });
  it('masks private cached labels offline and after a read error; paused absence is not a verified missing row', () => {
    expect(
      Object.values(settingsSummary({ ...input, data: row, online: false })).every(
        (value) => value.state === 'unavailable',
      ),
    ).toBe(true);
    expect(
      Object.values(settingsSummary({ ...input, data: row, isError: true })).every(
        (value) => value.state === 'error',
      ),
    ).toBe(true);
    expect(
      Object.values(settingsSummary({ ...input, isPaused: true })).every(
        (value) => value.state === 'unavailable',
      ),
    ).toBe(true);
  });
});
