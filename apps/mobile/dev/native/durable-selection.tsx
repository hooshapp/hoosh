import { requireOptionalNativeModule } from 'expo';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { NativeAppsEditor } from '@/features/preferences/native-apps-editor';
import type { SelectionEditorPort } from '@/infrastructure/native/selection-editor';

function nativePort(): SelectionEditorPort | null {
  if (Platform.OS !== 'android') return null;
  const value = requireOptionalNativeModule<Partial<SelectionEditorPort>>('HooshUsage');
  return value && ['selectionBegin', 'selectionPick', 'selectionCommit', 'selectionRelease'].every(
    (key) => typeof value[key as keyof SelectionEditorPort] === 'function',
  ) ? value as SelectionEditorPort : null;
}
/** Synthetic owner is confined to this QA entry; never mounted by the app's Router. */
export function DurableSelectionQa({ onBack }: { onBack: () => void }) {
  const [port] = useState(nativePort);
  return <View style={{ flex: 1 }}>
    <Text>RN09F_DURABLE_SELECTION_QA_ONLY · Test owner only. Saved on this device, no account sync or blocking.</Text>
    <NativeAppsEditor owner="qa-development:00000000-0000-4000-8000-000000000001" port={port} onBack={onBack} />
  </View>;
}
