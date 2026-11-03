import type { SettingsPatch, SettingsResponse, SettingsSavedResponse } from '@disconnect/contracts';
import { ApiError } from '@/infrastructure/api/errors';
import {
  useAccountData,
  useAccountMutation,
  useAccountQuery,
} from '@/infrastructure/query/account-data-provider';
import { readSettings, saveSettings } from './settings-api';

export function useSettingsQuery() {
  const query = useAccountQuery(['settings'], readSettings);
  const protocolFailure =
    query.error instanceof ApiError && query.error.kind === 'invalid_response';
  // Keep the observer/error settled; removing it here can silently trigger a reload.
  return { ...query, data: protocolFailure ? undefined : query.data, protocolFailure };
}
/** Both settings editors must share this query/revision; writes never replay. */
export function useSettingsMutation(options: {
  onSuccess: (response: SettingsSavedResponse) => void;
  onError: (error: unknown) => void;
}) {
  const { scope } = useAccountData();
  return useAccountMutation({
    execute: async (patch: SettingsPatch, operation) => {
      if (!scope) throw new ApiError('cancelled');
      const filter = { queryKey: scope.key('settings'), exact: true };
      await scope.client.cancelQueries(filter);
      const response = await saveSettings(patch, operation);
      // Also cancel a focus/reconnect read that began during the write.
      await scope.client.cancelQueries(filter);
      return response;
    },
    onSuccess: (response) => {
      if (!scope) return;
      scope.client.setQueryData<SettingsResponse>(scope.key('settings'), (current) =>
        current?.settings && current.settings.revision > response.settings.revision
          ? current
          : response,
      );
      options.onSuccess(response);
    },
    onError: options.onError,
  });
}
