import { describe, expect, it } from 'vitest';
import { weeklyPlanStatus, weeklyStatusRefreshDelay, type WeeklyPlanRead } from './weekly-plan-status';
import { decodeScheduleInstallation } from './weekly-schedule';
const spec = { weekdays: [2], hours: { start_local: '09:00', end_local: '17:00', next_day: false }, timezone_id: 'UTC', session_count: 2, session_minutes: 1 };
function ready(now = 2000): Extract<WeeklyPlanRead, { phase: 'ready' }> {
  return { phase: 'ready', selectedAppCount: 1, selectionRevision: 1, installation: decodeScheduleInstallation({ observedAt: now, enabled: true, spec, otherInstallation: false,
    native: { state: 'armed', installedRevision: 1, selectionRevision: 1, selectedAppCount: 1, reasonCount: 1, pendingEventCount: 0, overlayVisible: false, disclosureAccepted: true, serviceConnected: true }, windows: [{ reasonId: 'weekly_2026-11-11', startsAt: 1000, endsAt: 3000 }] }) };
}
describe('weekly device status projection', () => {
  it('uses native observation time for active versus future, never JS wall clock', () => {
    expect(weeklyPlanStatus(ready(2000), false).kind).toBe('active');
    expect(weeklyPlanStatus(ready(500), false).kind).toBe('scheduled');
    expect(weeklyPlanStatus(ready(3000), false).kind).toBe('unknown');
  });
  it.each(['error', 'stale', 'checking', 'unavailable'] as const)('masks earlier evidence for %s', (phase) => {
    expect(weeklyPlanStatus({ phase }, false).kind).toBe(phase === 'checking' ? 'checking' : phase === 'unavailable' ? 'unavailable' : 'unknown');
    expect(weeklyPlanStatus({ phase }, false).positive).not.toBe(true);
  });
  it('requires explicit recovery of uncertain desired changes even when old native plan is active', () => {
    expect(weeklyPlanStatus(ready(), true).kind).toBe('unconfirmed');
    expect(weeklyPlanStatus({ phase: 'error' }, true).kind).toBe('unconfirmed');
  });
  it('permission loss and storage errors cannot claim active interventions', () => {
    let r = { ...ready() }; r.installation = { ...r.installation, native: { ...r.installation.native, state: 'needs_permission' } };
    expect(weeklyPlanStatus(r, false).kind).toBe('permission');
    r.installation = { ...r.installation, native: { ...r.installation.native, state: 'failed' } };
    expect(weeklyPlanStatus(r, false).kind).toBe('failed');
  });
  it('a stopped retained plan stays distinct from a missing plan or unrelated finite setup', () => {
    let r = { ...ready() }; r.installation = { ...r.installation, enabled: false, windows: [] };
    expect(weeklyPlanStatus(r, false).kind).toBe('stopped');
    r.installation = { ...r.installation, spec: null };
    expect(weeklyPlanStatus(r, false).kind).toBe('empty');
    r.installation = { ...r.installation, otherInstallation: true };
    expect(weeklyPlanStatus(r, false).kind).toBe('other');
  });
  it('refreshes at native start/end boundaries, bounds polling and never schedules a zero-delay loop', () => {
    expect(weeklyStatusRefreshDelay(ready().installation)).toBe(1000);
    expect(weeklyStatusRefreshDelay(ready(500).installation)).toBe(500);
    expect(weeklyStatusRefreshDelay(ready(2999).installation)).toBe(250);
    expect(weeklyStatusRefreshDelay({ ...ready().installation, windows: [] })).toBe(15000);
  });
  it('rejects absent/unsafe native observation timestamps instead of guessing from Date.now', () => {
    let r = { ...ready() };
    expect(() => decodeScheduleInstallation({ ...r.installation, observedAt: undefined })).toThrow();
    expect(() => decodeScheduleInstallation({ ...r.installation, observedAt: Infinity })).toThrow();
    expect(() => decodeScheduleInstallation({ ...r.installation, observedAt: -1 })).toThrow();
  });
});
