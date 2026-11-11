import type { ScheduleInstallation } from './weekly-schedule';

export type WeeklyPlanRead = Readonly<{ phase: 'ready'; installation: ScheduleInstallation; selectionRevision: number; selectedAppCount: number }> |
  Readonly<{ phase: 'checking' | 'error' | 'stale' | 'unavailable' }>;
export type WeeklyPlanStatus = Readonly<{
  kind: 'checking' | 'unknown' | 'unavailable' | 'permission' | 'failed' | 'other' | 'empty' | 'stopped' | 'scheduled' | 'active' | 'unconfirmed';
  title: string; message: string; positive?: boolean;
}>;
/** Device facts only: no activity score, backend draft or JS wall clock can activate this card. */
export function weeklyPlanStatus(read: WeeklyPlanRead, pending: boolean): WeeklyPlanStatus {
  if (read.phase === 'unavailable') return { kind: 'unavailable', title: 'App schedule unavailable', message: 'This build cannot confirm a device schedule.' };
  if (pending && read.phase !== 'checking') return { kind: 'unconfirmed', title: 'Plan change not confirmed', message: 'Refresh the device schedule and review the result before applying again.' };
  if (read.phase === 'checking') return { kind: 'checking', title: 'Checking device schedule', message: 'Checking the schedule and app access on this device…' };
  if (read.phase !== 'ready') return { kind: 'unknown', title: 'Device schedule unknown', message: 'Refresh to confirm the schedule before relying on it.' };
  const { installation: i } = read;
  if (i.native.state === 'failed') return { kind: 'failed', title: 'App schedule needs attention', message: 'The device could not confirm its schedule. Review setup before relying on it.' };
  if (i.otherInstallation) return { kind: 'other', title: 'Another setup is installed', message: 'Review the existing device setup before replacing it with a weekly plan.' };
  if (i.spec && !i.enabled) return { kind: 'stopped', title: 'App schedule stopped', message: 'Your settings are retained. Apps are unrestricted by this weekly plan until you resume it.' };
  if (i.native.state === 'needs_permission') return { kind: 'permission', title: 'App access needed', message: 'Review app access to use your schedule. Permission alone does not apply a plan.' };
  if (!i.spec) return { kind: 'empty', title: 'No weekly plan applied', message: 'Choose your apps and schedule in Settings, then apply the plan.' };
  const active = i.windows.some((w) => w.startsAt <= i.observedAt && i.observedAt < w.endsAt);
  if (active && i.native.state === 'armed') return { kind: 'active', title: 'App interventions active', message: 'Your applied schedule is currently running for its selected apps on this device.', positive: true };
  if (i.enabled && i.windows.some((w) => w.startsAt > i.observedAt) && i.native.state === 'armed') return { kind: 'scheduled', title: 'App schedule ready', message: 'Your weekly plan is applied. Interventions begin during the scheduled hours.' };
  return { kind: 'unknown', title: 'Device schedule unknown', message: 'The device did not confirm the expected schedule. Refresh and review setup.' };
}
/** UI freshness only. Native remains responsible for starting/ending restrictions while JS is absent. */
export function weeklyStatusRefreshDelay(i: ScheduleInstallation): number {
  const next = i.windows.flatMap((w) => [w.startsAt, w.endsAt]).filter((t) => t > i.observedAt);
  return Math.max(250, Math.min(15000, ...next.map((t) => t - i.observedAt)));
}
