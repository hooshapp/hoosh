import { onlineManager } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { settingsSummary } from './settings-summary-model';
import { useSettingsQuery } from './settings-query';

const subscribeOnline = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();
const serverOnlineSnapshot = () => true;
/** Home and Settings observe one key; neither copies a private response into local state. */
export function useSettingsSummary() {
  const { availability } = useAccountData();
  const online = useSyncExternalStore(subscribeOnline, onlineSnapshot, serverOnlineSnapshot);
  const query = useSettingsQuery();
  return {
    query,
    availability,
    online,
    summary: settingsSummary({
      data: query.data,
      availability,
      online,
      isError: query.isError,
      isPaused: query.isPaused,
    }),
  };
}
