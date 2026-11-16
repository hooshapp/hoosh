import { expect, it } from 'vitest';
import { suggestPlan } from './suggested-plan';

it('uses the higher row at an exact midpoint and calculates one shared budget', () => {
  expect(suggestPlan(1050)).toEqual({
    baselineHours: 3, sessionsPerDay: 6, minutesPerSession: 10, dailyAccessMinutes: 60,
  });
  expect(suggestPlan(1049)?.dailyAccessMinutes).toBe(25);
  expect(suggestPlan(20 * 420)?.dailyAccessMinutes).toBe(480);
});

it('withholds a suggestion when the baseline is invalid or the cap would not reduce it', () => {
  for (const value of [NaN, -1, 0, 175, 10081, 200.5]) {
    expect(suggestPlan(value)).toBeNull();
  }
  expect(suggestPlan(176)?.dailyAccessMinutes).toBe(25);
});
