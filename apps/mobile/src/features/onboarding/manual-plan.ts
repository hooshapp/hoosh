/** Local authoring preferences only. No session/enforcement policy is implied. */
export const PLAN_APPS = ['Instagram', 'TikTok', 'YouTube', 'Snapchat', 'Reddit', 'Facebook', 'X'] as const;
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type PlanPanel = 'days' | 'hours' | 'sessions' | 'apps' | null;
export type ManualPlan = {
  version: 1;
  days: number[];
  startMinutes: number;
  endMinutes: number;
  sessionsPerDay: number;
  durationMinutes: number;
  apps: string[];
};
export const manualPlanKey = (id: string) => `hoosh.manual-plan.v1:${id}`;
export const manualPlanDraftKey = (id: string) => `hoosh.manual-plan-draft.v1:${id}`;
export function defaultManualPlan(apps: string[]): ManualPlan {
  return { version: 1, days: [0, 1, 2, 3, 4], startMinutes: 540, endMinutes: 1320, sessionsPerDay: 2, durationMinutes: 15, apps: PLAN_APPS.filter(app => apps.includes(app)) };
}
export function validateManualPlan(plan: ManualPlan): string | null {
  if (!plan.days.length) return 'Choose at least one active day.';
  if (plan.startMinutes >= plan.endMinutes) return 'End time must be later than start time. Choose a range within the same day.';
  if (!plan.apps.length) return 'Choose at least one app.';
  return null;
}
export function parseManualPlan(raw: string | null): ManualPlan | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<ManualPlan>;
    if (!p || p.version !== 1 || !Array.isArray(p.days) || !Array.isArray(p.apps)) return null;
    if (p.days.length > 7 || !p.days.every(d => Number.isInteger(d) && d >= 0 && d < 7)) return null;
    if (p.apps.length > PLAN_APPS.length || !p.apps.every(a => PLAN_APPS.some(option => option === a))) return null;
    if (!Number.isInteger(p.startMinutes) || !Number.isInteger(p.endMinutes) || p.startMinutes! < 0 || p.endMinutes! > 1439 || p.startMinutes! >= p.endMinutes!) return null;
    if (![1, 2, 3, 4].includes(p.sessionsPerDay!) || ![5, 10, 15, 30].includes(p.durationMinutes!)) return null;
    return { version: 1, days: [...new Set(p.days)].sort((a,b)=>a-b), apps: [...new Set(p.apps)], startMinutes: p.startMinutes!, endMinutes: p.endMinutes!, sessionsPerDay: p.sessionsPerDay!, durationMinutes: p.durationMinutes! };
  } catch { return null; }
}
export function formatTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
export function parseTime(text: string): number | null {
  const match = text.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]); const minute = Number(match[2]);
  if (minute > 59) return null;
  if (match[3]) {
    if (hour < 1 || hour > 12) return null;
    hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
  } else if (hour > 23) return null;
  return hour * 60 + minute;
}
export function formatDays(days: number[]): string {
  const key = [...days].sort().join('');
  if (key === '01234') return 'Mon – Fri';
  if (key === '0123456') return 'Every day';
  if (key === '56') return 'Sat – Sun';
  return days.length ? days.map(d => DAYS[d]).join(', ') : 'Choose active days';
}
