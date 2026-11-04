import { describe, expect, it } from 'vitest';
import { defaultManualPlan, formatDays, formatTime, manualPlanDraftKey, manualPlanKey, parseManualPlan, parseTime, validateManualPlan } from './manual-plan';

describe('local manual plan authoring', () => {
  it('keeps saved and draft data separate by account and round-trips custom choices', () => {
    expect(manualPlanKey('a')).not.toBe(manualPlanKey('b'));
    expect(manualPlanDraftKey('a')).not.toBe(manualPlanKey('a'));
    const plan = { ...defaultManualPlan(['X']), days: [5,6], startMinutes: 0, endMinutes: 1439, apps:['Facebook','X'], sessionsPerDay:4, durationMinutes:30 };
    expect(parseManualPlan(JSON.stringify(plan))).toEqual(plan);
    expect(validateManualPlan(plan)).toBeNull();
  });
  it.each(['9:00 AM','12:00 AM','12:00 PM','11:59 PM','23:59','00:00'])('round-trips supported time %s', text => {
    const value = parseTime(text)!;
    expect(parseTime(formatTime(value))).toBe(value);
  });
  it.each(['13:00 PM','0:00 AM','24:00','9:60 AM','9:00 XM','abc','-1:00'])('rejects invalid time %s', text => expect(parseTime(text)).toBeNull());
  it('handles noon and midnight without losing the half-day',()=>{
    expect(parseTime('12:00 AM')).toBe(0);expect(parseTime('12:00 PM')).toBe(720);
    expect(formatTime(1320)).toBe('10:00 PM');
  });
  it('validates empty selections and reversed hours',()=>{
    const p=defaultManualPlan(['Instagram']);
    expect(validateManualPlan({...p,days:[]})).toMatch(/day/);
    expect(validateManualPlan({...p,apps:[]})).toMatch(/app/);
    expect(validateManualPlan({...p,startMinutes:p.endMinutes})).toMatch(/later/);
  });
  it.each([
    {version:2}, {days:[7]}, {days:['Mon']}, {startMinutes:-1}, {startMinutes:1320}, {endMinutes:1440}, {sessionsPerDay:0}, {durationMinutes:60}, {apps:['Unknown']},
  ])('rejects malformed saved plan %s', patch => expect(parseManualPlan(JSON.stringify({...defaultManualPlan(['Instagram']),...patch}))).toBeNull());
  it('summarizes presets and normalizes duplicate selections',()=>{
    expect(formatDays([0,1,2,3,4])).toBe('Mon – Fri');expect(formatDays([5,6])).toBe('Sat – Sun');
    expect(formatDays([0,1,2,3,4,5,6])).toBe('Every day');
    expect(parseManualPlan(JSON.stringify({...defaultManualPlan(['Instagram']),days:[0,0,1],apps:['Instagram','Instagram']}))?.days).toEqual([0,1]);
  });
});
