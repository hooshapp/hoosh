import type { QuestExecutionView, QuestView } from '@disconnect/contracts';
import type { AccountScope } from '../../infrastructure/query/account-scope';
import type { ProductNativePort } from '../../infrastructure/native/product-ports';
import {
  createQuestDeviceClient,
  nativeQuestVersion,
  questReason,
  type DeviceQuestRead,
} from '../../infrastructure/native/quest-device';
import {
  decodeInterventionStatus,
  type InterventionPolicy,
} from '../../infrastructure/native/intervention-coordinator';
import {
  decodeSavedSelection,
  type SavedSelectionSummary,
} from '../../infrastructure/native/selection-editor';
import { isQuestDate } from '../../domain/quest-values';
import {
  readQuestExecution,
  recordQuestOutcome,
  scheduleQuest,
} from './quest-execution-api';
import { readQuest } from './quests-api';

export type QuestLifecycleState = Readonly<{
  remote: QuestExecutionView | null;
  device: DeviceQuestRead | null;
  selection: SavedSelectionSummary | null;
  busy: boolean;
  pendingWrite: boolean;
  reviewRequired: boolean;
  message: string;
}>;
export type QuestNativeBinding = Readonly<{
  owner: string;
  port: ProductNativePort;
}>;
class QuestSetupRequired extends Error {}
function requireDeviceSetup(
  device: DeviceQuestRead,
  selection: SavedSelectionSummary,
  policy: InterventionPolicy | null,
) {
  if (!policy)
    throw new QuestSetupRequired(
      'Save a session count and duration in Settings before applying this quest.',
    );
  if (!selection.selectedAppCount)
    throw new QuestSetupRequired(
      'Choose and save distracting apps on this device before applying this quest.',
    );
  if (!device.native.serviceConnected || !device.native.disclosureAccepted)
    throw new QuestSetupRequired(
      'Review app protection access and return here when the service is connected. Account and device status remain separate.',
    );
}
/** One account/detail operation queue. Reads never install, resume, or replay writes. */
export function createQuestLifecycle(
  scope: AccountScope,
  id: string,
  binding: QuestNativeBinding | null,
  requestId: () => string,
) {
  const device = binding
    ? createQuestDeviceClient(binding.owner, id, binding.port)
    : null;
  let alive = true,
    locked = false;
  let pendingReceipt: string | null = null;
  let state: QuestLifecycleState = {
    remote: null,
    device: null,
    selection: null,
    busy: false,
    pendingWrite: false,
    reviewRequired: false,
    message: 'Checking quest schedule…',
  };
  const listeners = new Set<() => void>();
  const live = () => alive && scope.isCurrent();
  const publish = (patch: Partial<QuestLifecycleState>) => {
    if (!live()) return;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const current = () => {
    if (!live()) throw new Error('Quest account changed');
  };
  const remember = (remote: QuestExecutionView) => {
    current();
    publish({ remote });
    scope.client.setQueryData(scope.key('quest-execution', id), remote);
  };
  async function exclusive(work: () => Promise<void>, failure: string) {
    if (!live() || locked) return false;
    const previouslyUnconfirmed = state.reviewRequired;
    locked = true;
    publish({ busy: true, pendingWrite: true });
    try {
      await work();
      current();
      return true;
    } catch (error) {
      publish({
        reviewRequired:
          error instanceof QuestSetupRequired ? previouslyUnconfirmed : true,
        message: error instanceof QuestSetupRequired ? error.message : failure,
      });
      return false;
    } finally {
      locked = false;
      publish({ busy: false, pendingWrite: false });
    }
  }
  async function readDevice() {
    if (!device || !binding) throw new Error('Device bridge unavailable');
    const result = await device.read();
    current();
    publish({ device: result });
    return result;
  }
  async function readSelection() {
    if (!binding) throw new Error('Device bridge unavailable');
    const result = decodeSavedSelection(
      await binding.port.selectionRead(binding.owner),
      binding.owner,
    );
    current();
    publish({ selection: result });
    return result;
  }
  async function apply(
    remote: Pick<QuestExecutionView, 'revision' | 'versions' | 'occurrences'>,
    enabled: boolean,
    policy: InterventionPolicy | null,
  ) {
    if (!device)
      throw new QuestSetupRequired(
        'App controls are unavailable on this device. Keep the saved quest until device access can be checked.',
      );
    const previous = await readDevice();
    const selection = enabled ? await readSelection() : null;
    current();
    if (enabled && selection) requireDeviceSetup(previous, selection, policy);
    const versions = enabled
      ? remote.versions
          .filter(
            (v) =>
              v.effective_until === null ||
              Date.parse(v.effective_until) > Date.now() - 2 * 86400000,
          )
          .map(nativeQuestVersion)
      : [];
    if (versions.length > 32)
      throw new Error('Too many retained schedule versions');
    const cancelled = remote.occurrences
      .filter(
        (v) => v.state === 'cancelled' && Date.parse(v.ends_at) > Date.now(),
      )
      .map((v) => questReason(id, v.schedule_revision, v.local_date));
    pendingReceipt = requestId();
    const installed = await device.apply(
      previous.native.installedRevision ?? 0,
      {
        requestId: pendingReceipt,
        remoteRevision: remote.revision,
        enabled,
        versions,
        selectionRevision:
          selection?.revision ?? previous.native.selectionRevision ?? 0,
        cancelled,
        policy,
      },
    );
    current();
    pendingReceipt = null;
    publish({ device: installed });
  }
  async function stopLocal() {
    const remote = state.remote ?? {
      revision: 0,
      versions: [],
      occurrences: [],
    };
    await apply(remote, false, null);
    publish({ message: 'Stopped on this device. Updating your account…' });
  }
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => state,
    async refresh(explicit = false) {
      if (!live() || locked) return;
      locked = true;
      publish({ busy: true });
      const results = await Promise.allSettled([
        scope.read((op) => readQuestExecution(id, op)),
        readDevice(),
        readSelection(),
      ]);
      if (live()) {
        const remote = results[0];
        if (remote.status === 'fulfilled') remember(remote.value);
        else publish({ remote: null });
        if (results[1].status === 'rejected') publish({ device: null });
        if (results[2].status === 'rejected') publish({ selection: null });
        const confirmedReceipt =
          pendingReceipt && state.device?.requestId === pendingReceipt;
        if (explicit) {
          const reviewed =
            remote.status === 'fulfilled' &&
            (!binding || results[1].status === 'fulfilled');
          publish({
            reviewRequired: !reviewed,
            message: reviewed
              ? confirmedReceipt
                ? 'The device confirms your previous change. Review the schedule below.'
                : 'Latest account and device state checked. Review them before making another change.'
              : 'Some state could not be checked. Keep changes paused and check again.',
          });
          if (reviewed) pendingReceipt = null;
        } else if (!state.reviewRequired)
          publish({
            message:
              remote.status === 'fulfilled'
                ? 'Saving details and scheduling are separate. Review account and device status below.'
                : 'Account schedule unavailable. A device Stop can still work while offline.',
          });
      }
      locked = false;
      publish({ busy: false });
    },
    schedule(
      quest: QuestView,
      firstDate: string,
      policy: InterventionPolicy | null,
    ) {
      if (
        state.reviewRequired ||
        !state.remote ||
        !isQuestDate(firstDate) ||
        !binding ||
        !policy
      )
        return Promise.resolve(false);
      const expected = state.remote.revision;
      return exclusive(async () => {
        // Check local prerequisites before creating a desired server schedule.
        const previous = await readDevice(),
          selection = await readSelection();
        requireDeviceSetup(previous, selection, policy);
        const remote = await scope.write((op) =>
          scheduleQuest(
            id,
            {
              expected_revision: expected,
              quest_revision: quest.revision,
              first_date: firstDate,
              enabled: true,
            },
            op,
          ),
        );
        remember(remote);
        await apply(remote, true, policy);
        publish({
          message:
            'Schedule installed on this device. Protection follows the saved times shown below.',
        });
      }, 'Scheduling was not fully confirmed. The account may have saved a schedule; device protection is unconfirmed. Check latest state before trying again.');
    },
    applySaved(policy: InterventionPolicy | null) {
      if (state.reviewRequired || !state.remote?.enabled || !policy)
        return Promise.resolve(false);
      const remote = state.remote;
      return exclusive(async () => {
        await apply(remote, true, policy);
        publish({ message: 'Saved schedule installed on this device.' });
      }, 'Device installation was not confirmed. Check latest state before trying again.');
    },
    stop() {
      return exclusive(async () => {
        await stopLocal();
        const latest = await scope.read((op) => readQuestExecution(id, op));
        current();
        const definition = latest.enabled
          ? await scope.read((op) => readQuest(id, op))
          : null;
        if (latest.enabled && !definition?.quest)
          throw new Error('Quest no longer saved');
        const remote = latest.enabled
          ? await scope.write((op) =>
              scheduleQuest(
                id,
                {
                  expected_revision: latest.revision,
                  quest_revision: definition!.quest!.revision,
                  first_date:
                    latest.versions[0]?.first_date ??
                    latest.observed_at.slice(0, 10),
                  enabled: false,
                },
                op,
              ),
            )
          : latest;
        remember(remote);
        publish({
          reviewRequired: false,
          message:
            'Quest stopped on this device and in your account. Other quests and plans are unchanged.',
        });
      }, 'Stop could not be fully confirmed. Check device status below: a confirmed local Stop stays stopped even if the account update failed.');
    },
    outcome(revision: number, day: string, completed: boolean) {
      if (state.reviewRequired) return Promise.resolve(false);
      const occurrence = state.remote?.occurrences.find(
        (v) => v.schedule_revision === revision && v.local_date === day,
      );
      if (
        !occurrence ||
        (completed
          ? !occurrence.can_confirm
          : !['upcoming', 'active'].includes(occurrence.state))
      )
        return Promise.resolve(false);
      return exclusive(
        async () => {
          if (!completed) {
            if (!device) throw new Error('Device bridge unavailable');
            const previous = await readDevice();
            // Nothing installed for this quest means there is no local reason to cancel.
            if (previous.enabled) {
              const result = await device.cancel(
                previous.native.installedRevision ?? 0,
                revision,
                day,
              );
              current();
              publish({ device: result });
            }
          }
          await scope.write((op) =>
            recordQuestOutcome(
              id,
              revision,
              day,
              completed ? 'completed' : 'cancelled',
              op,
            ),
          );
          remember(await scope.read((op) => readQuestExecution(id, op)));
          publish({
            message: completed
              ? 'Completion confirmed. +50 quest credits recorded once.'
              : 'This occurrence is cancelled. Future repeats and other quests are unchanged.',
          });
        },
        completed
          ? 'Completion was not confirmed. Check latest state before trying again; a recorded completion will not earn twice.'
          : 'Cancellation was not fully confirmed. Check device and account state before trying again.',
      );
    },
    claim() {
      return exclusive(async () => {
        if (!binding) throw new Error('Device bridge unavailable');
        let token: string | null = null;
        try {
          const value = await binding.port.interventionOpen(binding.owner);
          if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value))
            throw new Error('Invalid device lease');
          token = value;
          current();
          decodeInterventionStatus(
            await binding.port.interventionClaimOwner(
              binding.owner,
              token,
              true,
            ),
          );
          current();
        } finally {
          if (token)
            await binding.port.interventionRelease(binding.owner, token);
        }
        current();
        await readDevice();
        await readSelection();
        publish({
          reviewRequired: false,
          message:
            'This account can now manage this device. Previous account rules are stopped; no schedule has been resumed.',
        });
      }, 'Device account change could not be confirmed. Check latest state before continuing.');
    },
    async prepareDelete() {
      // Deletion is never allowed to strand this device's active recurring reason.
      return exclusive(async () => {
        await stopLocal();
        publish({
          message:
            'Device quest stopped. Deleting saved details can now continue.',
        });
      }, 'Could not confirm a local Stop. Keep the saved quest and check device access before deleting.');
    },
    dispose() {
      alive = false;
      device?.dispose();
      listeners.clear();
    },
  };
}
