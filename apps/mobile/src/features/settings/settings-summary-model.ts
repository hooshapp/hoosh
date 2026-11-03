import type { SettingsResponse } from '@disconnect/contracts';
import type { AccountAvailability } from '../../infrastructure/query/account-controller';
import { activitySummary } from '../preferences/activity-model';
import { planSummary } from '../plans/plan-draft-model';
import type { SettingsValue } from './settings-model';

export type SettingsSummary = Readonly<
  Record<'activities' | 'days' | 'hours' | 'sessions', SettingsValue>
>;
/** Canonical presentation only. Drafts and native status are separate producers. */
export function settingsSummary({
  data,
  availability,
  online,
  isError,
  isPaused,
}: {
  data: SettingsResponse | undefined;
  availability: AccountAvailability;
  online: boolean;
  isError: boolean;
  isPaused: boolean;
}): SettingsSummary {
  const value = (text: string | null): SettingsValue =>
    availability !== 'ready' || !online
      ? { state: 'unavailable' }
      : isError
        ? { state: 'error' }
        : data
          ? { state: 'ready', text }
          : { state: isPaused ? 'unavailable' : 'loading' };
  return {
    activities: value(data?.settings ? activitySummary(data.settings.activities) : 'Not saved yet'),
    days: value(planSummary('days', data?.settings?.plan_draft ?? null)),
    hours: value(planSummary('hours', data?.settings?.plan_draft ?? null)),
    sessions: value(planSummary('sessions', data?.settings?.plan_draft ?? null)),
  };
}
