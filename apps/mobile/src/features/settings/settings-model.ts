import type { AuthIdentity } from '@disconnect/contracts';

export type SettingsValue =
  | Readonly<{ state: 'ready'; text: string | null }>
  | Readonly<{ state: 'loading' | 'error' | 'unavailable' }>;
export type SettingsField =
  | 'age'
  | 'gender'
  | 'apps'
  | 'activities'
  | 'days'
  | 'hours'
  | 'sessions'
  | 'googleCalendar'
  | 'appleCalendar';
/** Display only: no onboarding, native picker, recurrence or calendar authorization schema. */
export type SettingsModel = Readonly<{
  account: Readonly<{
    identity: AuthIdentity;
    displayName: string | null;
  }> | null;
  personalInfo: Readonly<{ age: SettingsValue; gender: SettingsValue }> | null;
  apps: SettingsValue;
  activities: SettingsValue;
  days: SettingsValue;
  hours: SettingsValue;
  sessions: SettingsValue;
  calendars: Readonly<{
    googleCalendar: SettingsValue;
    appleCalendar: SettingsValue;
  }> | null;
}>;
export const unavailableSettings: SettingsModel = {
  account: null,
  personalInfo: null,
  apps: { state: 'unavailable' },
  activities: { state: 'unavailable' },
  days: { state: 'unavailable' },
  hours: { state: 'unavailable' },
  sessions: { state: 'unavailable' },
  calendars: null,
};
export function settingsValueLabel(value: SettingsValue): string {
  if (value.state === 'ready')
    return value.text?.trim() ? value.text : 'Not set';
  return value.state === 'loading'
    ? 'Loading…'
    : value.state === 'error'
      ? 'Couldn’t load'
      : 'Not available yet';
}
