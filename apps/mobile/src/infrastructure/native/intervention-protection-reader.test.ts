import { describe, expect, it, vi } from 'vitest';
import { createInterventionProtectionReader, decodeInterventionProtectionRead } from './intervention-protection-reader';
import { mapProtectionStatus } from '../../features/protection/status-model';
const owner = 'qa-development:00000000-0000-4000-8000-000000000001';
const snapshot = () => ({ capabilities: { platform: 'android', mode: 'overlay', selectionUI: 'unavailable',
  supportsUsageThreshold: false, supportsScheduledRestriction: true, supportsTemporaryAllowance: true,
  supportsAdvanceWarning: false, supportsUsageSummary: false }, authorization: 'authorized',
  status: { authorization: 'authorized', state: 'active', installedRevision: 2, installedReasonIds: ['schedule'] } });
describe('explicit-owner intervention read adapter', () => {
  it('uses one native snapshot and existing presentation without write or permission APIs', async () => {
    const port = { interventionProtectionRead: vi.fn().mockResolvedValue(snapshot()) };
    const read = await createInterventionProtectionReader(owner, port).read();
    expect(port.interventionProtectionRead).toHaveBeenCalledExactlyOnceWith(owner);
    const integration = { availability: 'connected', platform: 'android' } as const;
    expect(mapProtectionStatus(integration, 2, read).kind).toBe('interventions');
    expect(mapProtectionStatus(integration, 3, read).kind).toBe('pending');
    expect(mapProtectionStatus(integration, null, read).kind).toBe('unknown');
  });
  it('strips native inventory extras and detaches returned reason arrays', () => {
    const raw = { ...snapshot(), inventory: ['private'] }; const result = decodeInterventionProtectionRead(raw);
    raw.status.installedReasonIds.push('later');
    expect(result.status.installedReasonIds).toEqual(['schedule']);
    expect(JSON.stringify(result)).not.toContain('private');
  });
  it.each([
    { installedRevision: null }, { installedRevision: 1.5 }, { installedRevision: 2147483648 },
    { installedReasonIds: [] }, { installedReasonIds: ['same', 'same'] },
    { installedReasonIds: ['App.Name'] }, { installedReasonIds: Array(33).fill('one') },
    { authorization: 'denied' }, { state: 'needs_permission' },
  ])('rejects contradictory or out-of-bound native status %j', (change) => {
    const raw = snapshot(); expect(() => decodeInterventionProtectionRead({ ...raw, status: { ...raw.status, ...change } })).toThrow();
  });
  it('never turns revoked access with retained installation into active', () => {
    const raw = snapshot(); const read = decodeInterventionProtectionRead({ ...raw, authorization: 'denied', status: { ...raw.status, authorization: 'denied', state: 'needs_permission' } });
    expect(mapProtectionStatus({ availability: 'connected', platform: 'android' }, 2, read).kind).toBe('permission');
    expect(read.status.installedRevision).toBe(2);
  });
  it('supports absent and future/expired installation without fabricating active state', () => {
    const raw = snapshot();
    expect(decodeInterventionProtectionRead({ ...raw, status: { ...raw.status, state: 'inactive', installedRevision: null, installedReasonIds: [] } }).status.state).toBe('inactive');
    expect(decodeInterventionProtectionRead({ ...raw, status: { ...raw.status, state: 'inactive' } }).status.installedRevision).toBe(2);
  });
  it('requires explicit valid owner and present native read operation', () => {
    expect(() => createInterventionProtectionReader('', { interventionProtectionRead: vi.fn() })).toThrow();
    expect(() => createInterventionProtectionReader(owner, {} as never)).toThrow();
  });
  it('fences completion and further reads after disposal without clearing native state', async () => {
    let done!: (value: unknown) => void; const port = { interventionProtectionRead: vi.fn(() => new Promise((yes) => { done = yes; })) };
    const reader = createInterventionProtectionReader(owner, port); const reading = reader.read(); reader.dispose(); done(snapshot());
    await expect(reading).rejects.toMatchObject({ code: 'scope_closed' });
    await expect(reader.read()).rejects.toMatchObject({ code: 'scope_closed' });
    expect(port.interventionProtectionRead).toHaveBeenCalledTimes(1);
  });
  it('does not expose native errors and does not swallow invalid responses', async () => {
    await expect(createInterventionProtectionReader(owner, { interventionProtectionRead: vi.fn().mockRejectedValue(new Error('private')) }).read()).rejects.toMatchObject({ code: 'unavailable', message: 'Native intervention status could not be confirmed.' });
    await expect(createInterventionProtectionReader(owner, { interventionProtectionRead: vi.fn().mockResolvedValue({}) }).read()).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
