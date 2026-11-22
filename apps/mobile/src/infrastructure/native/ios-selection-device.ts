import type { SelectionEditorPort, SavedSelectionSummary } from './selection-editor';
import type { ProtectionRead } from '@/features/protection/status-model';
export type IOSSelectionDevice = {
  productPort?: import('./product-ports').ProductNativePort;
  recover?(requestID: string): Promise<void>;
  owner: string;
  generation: number;
  selection: SelectionEditorPort;
  readSelection(): Promise<SavedSelectionSummary>;
  readStatus(): Promise<Extract<ProtectionRead, { phase: 'ready' }>>;
  requestAuthorization(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: () => void): () => void;
};
