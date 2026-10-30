import { useState } from 'react';
import { View } from 'react-native';

import { UiThemeProvider } from '@/components/ui/theme';
import { ProtectionStatus } from '@/features/protection/protection-status';
import { mapProtectionStatus, type ProtectionRead } from '@/features/protection/status-model';

const scenarios = [
  'No adapter',
  'Unsupported',
  'Checking',
  'Permission revoked',
  'Inactive',
  'Installing first plan',
  'Older installed plan',
  'Read error',
  'Degraded',
  'Failed',
  'Confirmed shield',
  'Reminder only',
  'App interventions',
  'Unknown desired plan',
] as const;
type Scenario = (typeof scenarios)[number];
const connection = { availability: 'connected', platform: 'ios' } as const;
function sample(scenario: Scenario) {
  const read: Extract<ProtectionRead, { phase: 'ready' }> = {
    phase: 'ready',
    authorization: 'authorized',
    capabilities: {
      platform: 'ios',
      selectionUI: 'native_picker',
      mode: 'system_shield',
      supportsUsageThreshold: true,
      supportsScheduledRestriction: true,
      supportsTemporaryAllowance: true,
      supportsAdvanceWarning: false,
      supportsUsageSummary: false,
      notes: [],
    },
    status: {
      authorization: 'authorized',
      state: 'active',
      installedRevision: 4,
      installedReasonIds: ['RN08_PREVIEW_REASON_ONLY'],
    },
  };
  if (scenario === 'No adapter')
    return mapProtectionStatus(
      { availability: 'not_connected', platform: 'ios', reason: 'adapter_not_registered' },
      4,
      read,
    );
  if (scenario === 'Unsupported')
    return mapProtectionStatus(
      { availability: 'unsupported', platform: 'web', reason: 'platform_not_supported' },
      4,
      read,
    );
  if (scenario === 'Checking') return mapProtectionStatus(connection, 4, { phase: 'checking' });
  if (scenario === 'Read error') return mapProtectionStatus(connection, 4, { phase: 'error' });
  if (scenario === 'Permission revoked') read.authorization = 'revoked';
  if (scenario === 'Inactive')
    read.status = {
      authorization: 'authorized',
      state: 'inactive',
      installedRevision: null,
      installedReasonIds: [],
    };
  if (scenario === 'Installing first plan')
    read.status = {
      authorization: 'authorized',
      state: 'pending_install',
      installedRevision: null,
      installedReasonIds: [],
    };
  if (scenario === 'Older installed plan') read.status.installedRevision = 3;
  if (scenario === 'Degraded') read.status = { ...read.status, state: 'degraded' };
  if (scenario === 'Failed') read.status = { ...read.status, state: 'failed' };
  if (scenario === 'Reminder only') read.capabilities.mode = 'notification_only';
  if (scenario === 'App interventions') read.capabilities.mode = 'overlay';
  return mapProtectionStatus(connection, scenario === 'Unknown desired plan' ? null : 4, read);
}
/** Presentation inputs only. No ProtectionService, SDK, native prompt or enforcement mock. */
export function ProtectionSpecimen({ width }: { width: number }) {
  const [scenario, setScenario] = useState<Scenario>('No adapter');
  const [dark, setDark] = useState(false);
  const [notice, setNotice] = useState('No device protection is connected to this preview.');
  const model = sample(scenario);
  const action = () =>
    setNotice('Preview action only. No device settings or restrictions were changed.');
  return (
    <section data-testid="RN08_PROTECTION_SPECIMEN_ONLY">
      <h2>Device protection — simulated evidence only</h2>
      <p>
        These states are examples, not a report about this browser or your phone. No permissions or
        restrictions are changed.
      </p>
      <div
        data-protection-preview
        style={{
          width,
          padding: 16,
          boxSizing: 'border-box',
          background: dark ? '#222222' : '#FFF1DD',
        }}>
        <p style={{ marginTop: 0, fontSize: 12, color: dark ? '#ADADAD' : '#625D54' }}>
          Simulated evidence — no device connected.
        </p>
        <UiThemeProvider theme={dark ? 'dark' : 'warm'}>
          <View>
            <ProtectionStatus
              model={model}
              onRetry={action}
              onReviewPermissions={action}
              onSetup={action}
            />
          </View>
        </UiThemeProvider>
      </div>
      <p aria-live="polite">{notice}</p>
      <label>
        Simulated device state{' '}
        <select
          value={scenario}
          onChange={(event) => {
            setScenario(event.target.value as Scenario);
            setNotice('Simulated evidence changed. No device is connected.');
          }}>
          {scenarios.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input type="checkbox" checked={dark} onChange={(event) => setDark(event.target.checked)} />{' '}
        Dark status summary
      </label>
    </section>
  );
}
