import { requireOptionalNativeModule } from 'expo';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { AppState, Platform, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { focusControl } from '@/components/ui/focus-control';

export type PreviewPort = {
  previewPickApps(owner: string): Promise<unknown>;
  previewGetSelection(owner: string): Promise<unknown>;
  previewRelease(owner: string): Promise<unknown>;
};
type Summary = { selectionRevision: number; selectedAppCount: number };
let nextOwner = 0;
function nativePort(): PreviewPort | null {
  if (Platform.OS !== 'android') return null;
  const value = requireOptionalNativeModule<Partial<PreviewPort>>('HooshUsage');
  return value && ['previewPickApps', 'previewGetSelection', 'previewRelease'].every(
    (key) => typeof value[key as keyof PreviewPort] === 'function',
  ) ? value as PreviewPort : null;
}
function decode(value: unknown): Summary {
  if (typeof value !== 'object' || value === null) throw new Error('Invalid preview summary');
  const summary = value as Record<string, unknown>;
  for (const key of ['selectionRevision', 'selectedAppCount']) {
    if (!Number.isSafeInteger(summary[key]) || (summary[key] as number) < 0)
      throw new Error('Invalid preview summary');
  }
  return {
    selectionRevision: summary.selectionRevision as number,
    selectedAppCount: summary.selectedAppCount as number,
  };
}
function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? error.code : null;
}

/** QA only: one native-memory owner, count-only response, no account/save/protection integration. */
export function AppSelectionPreview({ port }: { port?: PreviewPort | null }) {
  const [native] = useState(() => port === undefined ? nativePort() : port);
  const [owner] = useState(() => `selection-preview-${++nextOwner}`);
  const [summary, setSummary] = useState<Summary>({ selectionRevision: 0, selectedAppCount: 0 });
  const [notice, setNotice] = useState('No temporary selection confirmed.');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false), locked = useRef(false), generation = useRef(0);
  const returnFocus = useRef(false);
  const trigger = useRef<ComponentRef<typeof Button>>(null);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => {
      if (!native || locked.current) return;
      const operation = ++generation.current;
      void Promise.resolve().then(() => native.previewGetSelection(owner)).then((value) => {
        const current = decode(value);
        if (mounted.current && generation.current === operation) setSummary(current);
      }).catch(() => {
        if (mounted.current && generation.current === operation)
          setNotice('Temporary preview is unavailable.');
      });
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
      if (native) void Promise.resolve().then(() => native.previewRelease(owner)).catch(() => {});
    };
  }, [native, owner]);
  useEffect(() => {
    if (!busy && returnFocus.current) {
      returnFocus.current = false;
      if (AppState.currentState === 'active') focusControl(trigger.current);
    }
  }, [busy]);
  return (
    <Screen title="Android selection preview">
      <Text>RN08_SELECTION_PREVIEW_ONLY — Actual device apps stay in the native picker.</Text>
      <Text>Temporary memory only. Leaving or resetting this screen clears the preview.</Text>
      <Text>No account selection is saved and no apps are blocked.</Text>
      {!native ? <Text>Preview unavailable — use the Android debug development build.</Text> : null}
      <Text>{summary.selectedAppCount} apps temporarily selected</Text>
      <Text>Temporary revision {summary.selectionRevision}</Text>
      <Button
        ref={trigger}
        label="Choose apps temporarily"
        busyLabel="Loading temporary preview…"
        busy={busy}
        disabled={!native}
        onPress={() => {
          if (!native || locked.current) return;
          locked.current = true;
          const operation = ++generation.current;
          setBusy(true);
          setNotice('Opening native preview… Nothing is being saved.');
          void Promise.resolve().then(() => native.previewPickApps(owner)).then((value) => {
            const current = decode(value);
            if (!mounted.current || generation.current !== operation) return;
            setSummary(current);
            setNotice('Temporary selection confirmed. Nothing saved or blocked.');
          }).catch((error: unknown) => {
            if (!mounted.current || generation.current !== operation) return;
            setNotice(errorCode(error) === 'ERR_SELECTION_CANCELLED'
              ? 'Canceled. Temporary selection unchanged.'
              : errorCode(error) === 'ERR_SELECTION_CHANGED'
                ? 'Apps changed. Reopen the preview to review; nothing was confirmed.'
                : 'Temporary selection could not be confirmed. Previous selection unchanged.');
          }).finally(() => {
            locked.current = false;
            if (mounted.current && generation.current === operation) {
              returnFocus.current = true;
              setBusy(false);
            }
          });
        }}
      />
      <Text accessibilityLiveRegion="polite">{notice}</Text>
    </Screen>
  );
}
