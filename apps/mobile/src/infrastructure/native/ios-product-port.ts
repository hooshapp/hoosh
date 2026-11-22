import type { ProductNativePort } from './product-ports';
import { decodeSavedSelection } from './selection-editor';
export type IOSRuntimeModule = {
  rewardsRead?(namespace: string, userID: string, token: string): Promise<unknown>;
  rewardsAck?(namespace: string, userID: string, token: string, installation: string, sequence: number): Promise<unknown>;
  runtimeRead(namespace: string, userID: string, token: string, quest: string | null): Promise<unknown>;
  runtimeApply(namespace: string, userID: string, token: string, command: string): Promise<unknown>;
  runtimeRecover(namespace: string, userID: string, token: string, requestID: string): Promise<void>;
};
/** Bind to the verified account's existing lease. Never open a competing owner lease. */
export function createIOSProductPort(args: {
  namespace: string; userID: string; token: string; module: IOSRuntimeModule;
  selection: Pick<ProductNativePort, 'selectionBegin' | 'selectionPick' | 'selectionCommit' | 'selectionRelease' | 'selectionRead'>;
  preview(spec: unknown): Promise<unknown>; review(): Promise<unknown>; end(): Promise<unknown>;
  claim(): Promise<unknown>; protectionRead(): Promise<unknown>; requestID(): string;
}): ProductNativePort & { recover(requestID: string): Promise<void> } {
  const { namespace, userID, token, module } = args;
  const owner = `${namespace}:${userID}`;
  let closed = false, writing = false;
  let pending: { payload: string; command: string } | null = null;
  const check = (value: string, handle?: string) => {
    if (closed || value !== owner || (handle !== undefined && handle !== token.toLowerCase())) throw new Error('Device owner changed');
  };
  const read = async (value: string, quest: string | null = null) => {
    check(value); const result = await module.runtimeRead(namespace, userID, token, quest); check(value);
    // A fresh native read resolves a local uncertain operation only when no
    // durable request remains. It never replays or acknowledges an SDK write.
    if (!writing && result && typeof result === 'object' && 'native' in result) {
      const native = result.native as Record<string, unknown> | null;
      if (native?.schemaVersion === 4 && native.platform === 'ios' && native.pendingRequestID === null) pending = null;
    }
    return result;
  };
  const write = async (value: string, handle: string, payload: Record<string, unknown>) => {
    check(value, handle);
    if (writing) throw new Error('Device change in progress');
    const canonical = JSON.stringify(payload);
    if (pending && pending.payload !== canonical) throw new Error('Recover the pending device change first');
    const command = pending?.command ?? JSON.stringify({ ...payload, requestID: payload.requestID ?? args.requestID() });
    if (command.length > 65536) throw new Error('Device command exceeds the limit');
    pending = { payload: canonical, command }; writing = true;
    try {
      const result = await module.runtimeApply(namespace, userID, token, command);
      check(value, handle); pending = null; return result;
    } finally { writing = false; }
  };
  const selectedRevision = async () => decodeSavedSelection(await args.selection.selectionRead(owner), owner).revision;
  return {
    ...args.selection,
    ...(module.rewardsRead && module.rewardsAck ? {
      rewardsRead: async (value: string) => {
        check(value); const result = await module.rewardsRead!(namespace, userID, token); check(value); return result;
      },
      rewardsAck: async (value: string, handle: string, installation: string, sequence: number) => {
        check(value, handle);
        const result = await module.rewardsAck!(namespace, userID, token, installation, sequence);
        check(value, handle); return result;
      },
    } : {}),
    interventionOpen: async value => { check(value); return token.toLowerCase(); },
    // Release only this operation handle; the verified boundary owns the lease.
    interventionRelease: async (value, handle) => { check(value, handle); },
    interventionReviewAccess: args.review,
    interventionEndOwner: async value => { check(value); closed = true; await args.end(); },
    selectionEndOwner: async value => { if (value !== owner) throw new Error('Device owner changed'); },
    interventionClaimOwner: async (value, handle, stopPrevious) => {
      check(value, handle); if (!stopPrevious) throw new Error('Explicit confirmation required');
      await args.claim(); return (await read(value) as { native: unknown }).native;
    },
    interventionProtectionRead: async value => { check(value); return args.protectionRead(); },
    scheduleRead: value => read(value),
    schedulePreview: args.preview,
    scheduleApply: (value, handle, expected, revision, selectionRevision, weekly) => {
      if (revision !== expected + 1) return Promise.reject(new Error('Invalid device revision'));
      return write(value, handle, { kind: 'weekly_apply', expectedRevision: expected, selectionRevision, weekly });
    },
    interventionCancel: async (value, handle, expected, reason) => {
      check(value, handle); if (reason !== null) throw new Error('Use quest cancellation for individual reasons');
      return write(value, handle, { kind: 'weekly_stop', expectedRevision: expected, selectionRevision: await selectedRevision() });
    },
    questRead: (value, quest) => read(value, quest),
    questApply: async (value, handle, expected, spec) => {
      check(value, handle);
      if (!spec.enabled && expected === 0) return read(value, spec.questId);
      return write(value, handle, { requestID: spec.requestId, kind: 'quest_apply', expectedRevision: expected,
        selectionRevision: spec.enabled ? spec.selectionRevision : await selectedRevision(), policy: spec.policy,
        quest: { questID: spec.questId, remoteRevision: spec.remoteRevision, enabled: spec.enabled, versions: spec.versions, cancelled: spec.cancelled } });
    },
    questCancel: async (value, handle, expected, questID, reasonID) => write(value, handle,
      { kind: 'quest_cancel', expectedRevision: expected, selectionRevision: await selectedRevision(), questID, reasonID }),
    recover: async requestID => {
      check(owner); if (writing) throw new Error('Device change in progress'); writing = true;
      try { await module.runtimeRecover(namespace, userID, token, requestID); check(owner); pending = null; }
      finally { writing = false; }
    },
  };
}
