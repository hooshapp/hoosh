import { useIOSSelectionDevice, useNativeOwner } from '@/features/protection/native-owner-boundary';
import { useEffect, useMemo, useState } from 'react';
import type { Personalization } from '@disconnect/contracts';
import { useAccountData } from '@/infrastructure/query/account-data-provider';
import { useAppRuntime } from '@/features/account/app-runtime-context';
import { setupRepository } from '@/features/onboarding/progress-storage';
import { useSettingsEditor, type SettingsDraftAdapter } from './use-settings-editor';

const empty: Personalization = { age: null, gender: null, nudge_tone: 'Supportive' };
/** Settings reuses completed answers without changing the approved onboarding flow. */
export function usePersonalization() {
  const { scope } = useAccountData();
  const project = useAppRuntime()?.nativeNamespace;
  const [localAnswers, setLocalAnswers] = useState<{ scopeID: number; values: Personalization }>();
  const seed = localAnswers && localAnswers.scopeID === scope?.id ? localAnswers.values : empty;
  useEffect(() => {
    if (!scope || !project) return;
    let active = true;
    void setupRepository(project).read(scope).then(result => {
      if (!active || !scope.isCurrent() || result.status !== 'found') return;
      const answers = result.progress.questions;
      if (answers?.gender) setLocalAnswers({
        scopeID: scope.id,
        values: { age: answers.age ?? null, gender: answers.gender, nudge_tone: 'Supportive' },
      });
    }).catch(() => undefined);
    return () => { active = false; };
  }, [scope, project]);
  const adapter = useMemo<SettingsDraftAdapter<Personalization>>(() => ({
    draftFor: value => value?.personalization ?? seed,
    sameDraft: (a, b) => a.age === b.age && a.gender === b.gender && a.nudge_tone === b.nudge_tone,
    patch: (draft, base) => ({ expected_revision: base?.revision ?? 0, personalization: draft }),
    saveWhenMissing: value => value?.personalization == null,
  }), [seed]);
  const editor = useSettingsEditor(adapter);
  const native = useNativeOwner(), ios = useIOSSelectionDevice();
  const tone = editor.query.data?.settings?.personalization?.nudge_tone;
  const [tonePending, setTonePending] = useState(false);
  useEffect(() => {
    if (!tone || !scope?.canRun()) return;
    let active = true;
    const operation = ios?.setNudgeTone ? ios.setNudgeTone(tone) : native?.port.setNudgeTone?.(native.owner, tone);
    if (operation) void operation.then(() => { if (active) setTonePending(false); }).catch(() => { if (active) setTonePending(true); });
    return () => { active = false; };
  }, [tone, native, ios, scope]);
  const savedGender = (editor.query.data?.settings?.personalization ?? seed).gender;
  return { ...editor, savedGender, tonePending };
}
