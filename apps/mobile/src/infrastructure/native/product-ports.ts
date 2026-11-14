import type { SelectionEditorPort, SelectionOwnerLifecyclePort } from './selection-editor';
import type { QuestDevicePort } from './quest-device';
import type { InterventionProtectionReadPort } from './intervention-protection-reader';
export type ProductNativePort = QuestDevicePort & SelectionEditorPort & SelectionOwnerLifecyclePort & InterventionProtectionReadPort & {
  interventionEndOwner(owner: string, erase: boolean): Promise<unknown>;
  interventionClaimOwner(owner: string, token: string, stopPrevious: boolean): Promise<unknown>;
  selectionRead(owner: string): Promise<unknown>;
  historyStop?(owner: string, token: string): Promise<unknown>;
  historyRead?(owner: string): Promise<unknown>;
  historyStart?(owner: string, token: string): Promise<unknown>;
  openUsageAccess?(): Promise<unknown>;
  rewardsRead?(owner: string): Promise<unknown>;
  rewardsAck?(owner: string, token: string, installation: string, sequence: number): Promise<unknown>;
};
/** Other platforms need their actual bridge; no success stub or synthetic default owner. */
export const productNativePort: ProductNativePort | null = null;
