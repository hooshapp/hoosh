import type {
  SelectionEditorPort,
  SelectionOwnerLifecyclePort,
} from './selection-editor';
import type { WeeklySchedulePort } from '@/features/plans/weekly-schedule';
import type { QuestDevicePort } from './quest-device';
import type { InterventionProtectionReadPort } from './intervention-protection-reader';
export type ProductNativePort = Partial<
  Pick<
    WeeklySchedulePort,
    'scheduleRead' | 'schedulePreview' | 'scheduleApply' | 'interventionCancel'
  >
> &
  QuestDevicePort &
  SelectionEditorPort &
  SelectionOwnerLifecyclePort &
  InterventionProtectionReadPort & {
    onboardingBaselineRead?(owner: string): Promise<unknown>;
    setNudgeTone?(owner: string, tone: string): Promise<unknown>;
    budgetCapabilities?(): Promise<unknown>;
    interventionEndOwner(owner: string, erase: boolean): Promise<unknown>;
    interventionClaimOwner(
      owner: string,
      token: string,
      stopPrevious: boolean,
    ): Promise<unknown>;
    selectionRead(owner: string): Promise<unknown>;
    historyStop?(owner: string, token: string): Promise<unknown>;
    historyRead?(owner: string): Promise<unknown>;
    historyStart?(owner: string, token: string): Promise<unknown>;
    openUsageAccess?(): Promise<unknown>;
    rewardsRead?(owner: string): Promise<unknown>;
    rewardsAck?(
      owner: string,
      token: string,
      installation: string,
      sequence: number,
    ): Promise<unknown>;
  };
/** Other platforms need their actual bridge; no success stub or synthetic default owner. */
export const productNativePort: ProductNativePort | null = null;
