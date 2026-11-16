const rows = [
  [2, 5, 5], [3, 6, 10], [5, 8, 15], [10, 10, 20],
  [12, 12, 20], [15, 14, 25], [18, 15, 30], [20, 16, 30],
] as const;

export function validWeeklyMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 7 * 1440;
}

export function suggestPlan(weeklyMinutes: number) {
  if (!validWeeklyMinutes(weeklyMinutes)) return null;
  const dailyMinutes = weeklyMinutes / 7;
  // Below the chart, use manual setup rather than recommend a cap above baseline.
  if (dailyMinutes <= 25) return null;
  const [baselineHours, sessionsPerDay, minutesPerSession] = rows.reduce((best, row) =>
    Math.abs(row[0] * 420 - weeklyMinutes) <= Math.abs(best[0] * 420 - weeklyMinutes) ? row : best);
  return { baselineHours, sessionsPerDay, minutesPerSession, dailyAccessMinutes: sessionsPerDay * minutesPerSession };
}
