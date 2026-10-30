import type { AuthorizationState, ProtectionCapabilities } from '@disconnect/contracts';
import { describe, expect, it } from 'vitest';

import { capabilities, status } from './__tests__/fixtures';
import { mapProtectionStatus, type ProtectionRead } from './status-model';

// Mapper never calls a service; this identity intentionally has no fake implementation.
const integration = { availability: 'connected', platform: 'ios' } as const;
const ready = (): Extract<ProtectionRead, { phase: 'ready' }> => ({
  phase: 'ready',
  capabilities: capabilities(),
  authorization: 'authorized',
  status: status(),
});
function map(read = ready(), desired: number | null = 4) {
  return mapProtectionStatus(integration, desired, read);
}

describe('independent bridge, permission, capabilities and installation evidence', () => {
  it.each(['ios', 'android'] as const)(
    'does not call a missing %s adapter an unsupported OS or active protection',
    (platform) => {
      const result = mapProtectionStatus(
        { availability: 'not_connected', platform, reason: 'adapter_not_registered' },
        4,
        ready(),
      );
      expect(result.kind).toBe('unavailable');
      expect(result.action).toBeUndefined();
      expect(result.tone).not.toBe('positive');
    },
  );
  it('allows retry for a reported initialization failure, without granting permission', () => {
    expect(
      mapProtectionStatus(
        { availability: 'not_connected', platform: 'ios', reason: 'initialization_failed' },
        4,
        ready(),
      ),
    ).toMatchObject({ kind: 'unavailable', action: 'retry' });
  });
  it.each(['web', 'other', 'ios', 'android'] as const)(
    'keeps explicit unsupported integration %s separate from adapter absence',
    (platform) => {
      expect(
        mapProtectionStatus(
          { availability: 'unsupported', platform, reason: 'build_not_supported' },
          4,
          ready(),
        ).kind,
      ).toBe('unsupported');
    },
  );
  it('does not turn loading/stale/error reads into previous active status', () => {
    for (const phase of ['checking', 'stale', 'error'] as const) {
      const result = mapProtectionStatus(integration, 4, { phase });
      expect(result.kind).not.toBe('active');
      expect(result.tone).not.toBe('positive');
    }
  });
  it('separates a connected but unsupported capability mode', () => {
    const read = ready();
    read.capabilities.mode = 'unsupported';
    expect(map(read).kind).toBe('unsupported');
  });
  it.each(['not_requested', 'denied', 'revoked'] as const)(
    'requires actual permission when current authorization is %s',
    (authorization) => {
      const read = ready();
      read.authorization = authorization;
      expect(map(read)).toMatchObject({
        kind: 'permission',
        action: 'permissions',
        tone: 'attention',
      });
    },
  );
  it.each(['unavailable', 'error'] as const)(
    'treats authorization %s as unknown, not a consent denial',
    (authorization) => {
      const read = ready();
      read.authorization = authorization;
      expect(map(read).kind).toBe('unknown');
    },
  );
  it('never adopts stale status authorization over a separately observed revocation', () => {
    const read = ready();
    read.status = status({ authorization: 'revoked', state: 'needs_permission' });
    expect(map(read).kind).toBe('permission');
  });
  it('does not assume permission alone means an installed active plan', () => {
    expect(
      map({
        ...ready(),
        status: status({ state: 'inactive', installedRevision: null, installedReasonIds: [] }),
      }),
    ).toMatchObject({ kind: 'inactive', action: 'setup' });
  });
  it('keeps installing separate and preserves older installed revision evidence', () => {
    const result = map({
      ...ready(),
      status: status({ state: 'pending_install', installedRevision: 3 }),
    });
    expect(result).toMatchObject({
      kind: 'installing',
      installedRevision: 3,
      desiredRevision: 4,
      tone: 'neutral',
    });
    expect(result.message).toContain('earlier plan');
  });
  it.each([4, 5])(
    'does not mislabel installed revision %s as older while installation is pending',
    (installedRevision) => {
      const result = map({
        ...ready(),
        status: status({ state: 'pending_install', installedRevision }),
      });
      expect(result.kind).toBe('installing');
      expect(result.message).not.toContain('earlier');
    },
  );
  it('shows first installation without inventing an older plan', () => {
    const result = map({
      ...ready(),
      status: status({ state: 'pending_install', installedRevision: null }),
    });
    expect(result.kind).toBe('installing');
    expect(result.message).not.toContain('earlier');
  });
  it.each([null, 3, 5])('cannot mark active when desired revision is %j', (desired) => {
    const result = map(ready(), desired);
    expect(result.kind).not.toBe('active');
    expect(result.tone).not.toBe('positive');
  });
  it('requires installed reasons and an actual revision', () => {
    for (const overrides of [{ installedReasonIds: [] }, { installedRevision: null }])
      expect(map({ ...ready(), status: status(overrides) }).kind).toBe('unknown');
  });
  it('maps an active system shield only with matching nonnegative revision and fresh full evidence', () => {
    expect(map()).toMatchObject({
      kind: 'active',
      installedRevision: 4,
      desiredRevision: 4,
      tone: 'positive',
    });
    expect(map({ ...ready(), status: status({ installedRevision: 0 }) }, 0).kind).toBe('active');
  });
  it('never promotes notification-only mode to blocking', () => {
    const result = map({ ...ready(), capabilities: capabilities('notification_only') });
    expect(result.kind).toBe('reminders');
    expect(result.message).toContain('App access is not blocked');
  });
  it('does not label overlays as system shield protection', () => {
    const result = map({ ...ready(), capabilities: capabilities('overlay') });
    expect(result.kind).toBe('interventions');
    expect(result.title).not.toBe('Protection active');
  });
  it.each(['degraded', 'failed'] as const)(
    'does not display active for native state %s',
    (state) => {
      expect(map({ ...ready(), status: status({ state }) }).kind).toBe(state);
    },
  );
  it('uses safe fixed copy for native errors/notes without exposing native rule IDs or SDK details', () => {
    const read = ready();
    read.status.lastErrorCode = 'DO_NOT_DISPLAY_NATIVE_SECRET';
    expect(map(read).kind).toBe('degraded');
    const output = JSON.stringify(map(read));
    expect(output).not.toContain('DO_NOT_DISPLAY_NATIVE_SECRET');
    expect(output).not.toContain('RN08_TEST_DEVICE_ONLY');
  });
});
describe('invalid native evidence cannot enable a positive status', () => {
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid desired revision %s',
    (revision) => {
      expect(map(ready(), revision).kind).toBe('unknown');
    },
  );
  it.each([
    { installedRevision: -1 },
    { installedRevision: 0.5 },
    { installedReasonIds: [null] },
    { authorization: 'unexpected' },
    { state: 'unexpected' },
    { lastErrorCode: { message: 'secret' } },
  ])('rejects malformed native status %j', (invalid) => {
    const read = ready();
    read.status = { ...read.status, ...invalid } as typeof read.status;
    expect(map(read).kind).toBe('unknown');
  });
  it.each([
    { platform: 'android' },
    { mode: 'unexpected' },
    { selectionUI: 'unexpected' },
    { supportsUsageThreshold: 'true' },
    { notes: null },
  ])('rejects malformed/mismatched capabilities %j', (invalid) => {
    const read = ready();
    read.capabilities = { ...read.capabilities, ...invalid } as ProtectionCapabilities;
    expect(map(read).kind).toBe('unknown');
  });
  it('rejects an unknown authorization value', () => {
    const read = ready();
    read.authorization = 'unexpected' as AuthorizationState;
    expect(map(read).kind).toBe('unknown');
  });
});
