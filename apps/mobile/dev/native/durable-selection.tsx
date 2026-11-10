import { requireOptionalNativeModule } from 'expo';
import { useRef, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import type { SelectionEditorPort, SelectionOwnerLifecyclePort } from '@/infrastructure/native/selection-editor';

type Port = SelectionEditorPort & SelectionOwnerLifecyclePort;
function nativePort(): Port | null {
  if (Platform.OS !== 'android') return null;
  const value = requireOptionalNativeModule<Partial<Port>>('HooshUsage');
  return value && ['selectionBegin', 'selectionPick', 'selectionCommit', 'selectionRelease', 'selectionEndOwner'].every(
    (key) => typeof value[key as keyof Port] === 'function',
  ) ? value as Port : null;
}
const owners = [
  'qa-development:00000000-0000-4000-8000-000000000001',
  'qa-development:00000000-0000-4000-8000-000000000002',
];
/** Synthetic owners are confined to QA; lifecycle actions never delete a Supabase account. */
export function DurableSelectionQa({ onBack, port: supplied }: { onBack: () => void; port?: Port | null }) {
  const [port] = useState(() => supplied === undefined ? nativePort() : supplied);
  const insets = useSafeAreaInsets();
  const [owner, setOwner] = useState(0), [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState('Test owner A. Local choices only; no account sync or blocking.');
  const [paused, setPaused] = useState(false), [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(true);
  const last = useRef({ erase: false, changeOwner: false });
  const end = (erase: boolean, changeOwner = false) => {
    if (!port || busy) return;
    last.current = { erase, changeOwner };
    setConfirmed(false); setPaused(true); setBusy(true); // Unmount/invalidate old UI before the native fence.
    void port.selectionEndOwner(owners[owner], erase).then(() => {
      setConfirmed(true);
      if (changeOwner) setOwner((value) => 1 - value);
      setGeneration((value) => value + 1);
      setStatus(erase ? 'Local test selection erased. No Auth account was deleted.' : 'Test owner ended. Saved choices retained.');
    }).catch(() => setStatus('Local cleanup could not be confirmed. Keep this owner paused and retry.'))
      .finally(() => setBusy(false));
  };
  return <View style={{ flex: 1, paddingTop: insets.top }}>
    <Text>RN09F_DURABLE_SELECTION_QA_ONLY · {status}</Text>
    <Text>Current test owner: {owner === 0 ? 'A' : 'B'}</Text>
    {paused ? <View>
      <Button label="Resume test owner" disabled={busy || !confirmed} onPress={() => { setGeneration((value) => value + 1); setPaused(false); }} />
      <Button label="Retry local cleanup" disabled={!port || busy} onPress={() => end(last.current.erase, last.current.changeOwner)} />
      <Button label="Erase local test selection" disabled={!port || busy} onPress={() => end(true)} />
    </View> : <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      <Button label="Switch test owner" disabled={!port || busy} onPress={() => end(false, true)} />
      <Button label="End test owner" disabled={!port || busy} onPress={() => end(false)} />
    </View>}
    {!paused ? <NativeAppsEditor owner={owners[owner]} generation={generation} port={port} onBack={onBack} /> : null}
  </View>;
}
