import user from '../../assets/icons/settings/user.svg';
import gender from '../../assets/icons/settings/gender.svg';
import apps from '../../assets/icons/settings/apps.svg';
import activities from '../../assets/icons/settings/activities.svg';
import calendar from '../../assets/icons/settings/calendar.svg';
import clock from '../../assets/icons/settings/clock.svg';
import timer from '../../assets/icons/settings/timer.svg';
import info from '../../assets/icons/settings/info.svg';
import chevron from '../../assets/icons/settings/chevron.svg';

export const settingsAssets = {
  user: { source: user, width: 18, height: 18 },
  gender: { source: gender, width: 18, height: 18 },
  apps: { source: apps, width: 18, height: 18 },
  activities: { source: activities, width: 18, height: 18 },
  calendar: { source: calendar, width: 18, height: 18 },
  clock: { source: clock, width: 18, height: 18 },
  timer: { source: timer, width: 18, height: 18 },
  info: { source: info, width: 14, height: 14 },
  chevron: { source: chevron, width: 16, height: 16 },
} as const;
