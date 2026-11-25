import type { PlanDraft } from '@disconnect/contracts';
import { completeSchedule, createWeeklyScheduleClient, sameSchedule, type WeeklySchedulePort } from '../plans/weekly-schedule';

/** The existing Accept/Save action authorizes this exact plan, not later draft edits. */
export async function activateAcceptedPlan({ owner, port, draft, selectionRevision, assertCurrent, recoverPending }: {
  owner: string; port: WeeklySchedulePort; draft: PlanDraft | null | undefined;
  selectionRevision: number | undefined; assertCurrent(): void; recoverPending?(requestID: string): Promise<void>;
}) {
  const spec = completeSchedule(draft);
  if (!selectionRevision || !Number.isSafeInteger(selectionRevision)) throw new Error('App selection must be verified');
  const client = createWeeklyScheduleClient(owner, port);
  try {
    assertCurrent();
    let before = await client.read();
    assertCurrent();
    if (before.native.pendingRequestID && !before.otherInstallation && recoverPending) {
      // A prior explicit Save may have installed only part of its native change.
      // Recover its exact durable request before considering the newly saved plan.
      await recoverPending(before.native.pendingRequestID);
      assertCurrent();
      before = await client.read();
      assertCurrent();
    }
    if (before.otherInstallation || before.native.pendingRequestID ||
      (before.native.platform === 'ios' && !before.native.activationAvailable) || before.native.state === 'needs_permission') {
      throw new Error('Device protection needs review');
    }
    // Recover a lost completion receipt by reading the exact installed plan; never spend or reset allowances.
    if (before.enabled && before.native.state === 'armed' &&
      before.native.selectionRevision === selectionRevision && sameSchedule(before.spec, spec)) return;
    const installed = await client.apply(spec, before.native.installedRevision ?? 0, selectionRevision);
    assertCurrent();
    if (!installed.enabled || installed.native.state !== 'armed' ||
      installed.native.selectionRevision !== selectionRevision || !sameSchedule(installed.spec, spec)) {
      throw new Error('Device protection was not confirmed');
    }
  } finally { client.dispose(); }
}
