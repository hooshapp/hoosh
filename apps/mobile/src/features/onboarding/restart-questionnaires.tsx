import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/features/editors/confirmation-dialog';
import { useAppRuntime } from '@/features/account/app-runtime-context';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useSettingsQuery } from '@/features/settings/settings-query';
import { setupRepository } from './progress-storage';

/** Explicit account-local questionnaire reset. Does not delete the account or installed rules. */
export function RestartQuestionnaires() {
  const router = useRouter();
  const project = useAppRuntime()?.nativeNamespace;
  const { scope } = useAccountData();
  const settings = useSettingsQuery();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = !!project && !!scope?.isCurrent();
  async function restart() {
    if (!ready || !scope || !project || busy) return;
    setBusy(true); setFailed(false); setConfirm(false);
    try {
      await setupRepository(project).save(scope, { version: 1, step: 'questions', ...(!settings.isError && !settings.isPaused && settings.data ? { settingsBaseRevision: settings.data.settings?.revision ?? 0 } : {}) });
      if (scope.isCurrent()) router.replace('/(onboarding)/welcome');
    } catch { if (scope.isCurrent()) setFailed(true); }
    finally { if (scope.isCurrent()) setBusy(false); }
  }
  return <View style={{ gap: 12 }}>
    <Button label="Restart questionnaires" variant="secondary" disabled={!ready} busy={busy} onPress={() => setConfirm(true)} />
    {failed ? <Text accessibilityRole="alert">Questionnaires could not be restarted. Your account has not been deleted. Try again.</Text> : null}
    {confirm ? <ConfirmationDialog title="Restart questionnaires for this account? Previous onboarding answers on this device will be replaced. Your login, saved account plan, history and Screen Time rules will stay unchanged."
      keepLabel="Keep my answers" discardLabel="Restart questionnaires now" onKeep={() => setConfirm(false)} onDiscard={() => { void restart(); }} /> : null}
  </View>;
}
