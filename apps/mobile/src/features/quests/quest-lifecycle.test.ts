import type { QuestExecutionView, QuestView } from '@disconnect/contracts';
import { expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import fixture from '../../../../../packages/contracts/fixtures/quest-execution-v1.json';
import type {
  AccountScope,
  AccountOperation,
} from '../../infrastructure/query/account-scope';
import type { ProductNativePort } from '../../infrastructure/native/product-ports';
import type { QuestDeviceSpec } from '../../infrastructure/native/quest-device';
import { ApiError } from '../../infrastructure/api/errors';
import { createQuestLifecycle } from './quest-lifecycle';

const OWNER = `fixture:${fixture.user_id}`,
  ID = fixture.quest_id;
const TOKEN = '00000000-0000-4000-8000-000000000009';
const REQUEST = '00000000-0000-4000-8000-000000000010';
const policy = { timezoneId: 'UTC', sessionsPerDay: 2, sessionSeconds: 60 };
function setup(binding = true) {
  let remote = structuredClone(fixture) as QuestExecutionView;
  let current = true,
    offline = false,
    nativeRevision = 0;
  let spec: QuestDeviceSpec | null = null,
    lostNative = false,
    lostServer = false;
  const calls: string[] = [];
  const quest = {
    quest_id: ID,
    user_id: fixture.user_id,
    revision: 1,
    created_at: '2026-11-11T12:00:00Z',
    updated_at: '2026-11-11T12:00:00Z',
    definition: fixture.versions[0].definition,
  } as QuestView;
  const nativeRead = () => ({
    owner: OWNER,
    questId: ID,
    observedAt: Date.parse(fixture.observed_at),
    remoteRevision: spec?.remoteRevision ?? 0,
    requestId: spec?.requestId ?? null,
    enabled: spec?.enabled ?? false,
    versions: spec?.enabled ? spec.versions : [],
    cancelled: spec?.cancelled ?? [],
    windows: [],
    policy: nativeRevision ? policy : null,
    native: {
      schemaVersion: 3,
      state: 'inactive',
      installedRevision: nativeRevision || null,
      selectionRevision: nativeRevision ? 1 : null,
      selectedAppCount: nativeRevision ? 1 : 0,
      reasonCount: 0,
      pendingEventCount: 0,
      discardedEventCount: 0,
      overlayVisible: false,
      disclosureAccepted: true,
      serviceConnected: true,
    },
  });
  const port = {
    interventionOpen: vi.fn(async () => TOKEN),
    interventionRelease: vi.fn(async () => undefined),
    interventionClaimOwner: vi.fn(async () => nativeRead().native),
    selectionRead: vi.fn(async () => ({
      owner: OWNER,
      revision: 1,
      selectedAppCount: 1,
    })),
    questRead: vi.fn(async () => nativeRead()),
    questApply: vi.fn(
      async (
        _owner: string,
        _token: string,
        expected: number,
        value: QuestDeviceSpec,
      ) => {
        calls.push('native-apply');
        expect(expected).toBe(nativeRevision);
        nativeRevision++;
        spec = value;
        if (lostNative) {
          lostNative = false;
          throw new Error('private native error');
        }
        return nativeRead();
      },
    ),
    questCancel: vi.fn(
      async (
        _owner: string,
        _token: string,
        _expected: number,
        _id: string,
        reason: string,
      ) => {
        calls.push('native-cancel');
        nativeRevision++;
        spec = { ...spec!, cancelled: [...spec!.cancelled, reason] };
        return nativeRead();
      },
    ),
  };
  const request = vi.fn(
    async (
      path: string,
      options: {
        method?: string;
        json?: Record<string, unknown>;
        decode: (v: unknown, c: unknown) => unknown;
      },
    ) => {
      if (offline) throw new ApiError('network');
      if (path.endsWith('/schedule')) {
        calls.push('server-schedule');
        expect(options.json?.quest_revision).toBe(quest.revision);
        remote = {
          ...remote,
          revision: remote.revision + 1,
          enabled: options.json!.enabled as boolean,
        };
        if (remote.enabled)
          remote.versions = [
            {
              ...remote.versions[0],
              revision: remote.revision,
              effective_until: null,
              first_date: options.json!.first_date as string,
            },
          ];
        else
          remote.versions = remote.versions.map((v) => ({
            ...v,
            effective_until: remote.observed_at,
          }));
        remote.occurrences = [];
        if (lostServer) {
          lostServer = false;
          throw new ApiError('network', { requestMayHaveCommitted: true });
        }
      } else if (path.includes('/occurrences/')) {
        calls.push('server-outcome');
        const state = options.json!.state as 'completed' | 'cancelled';
        remote.occurrences[0] = {
          ...remote.occurrences[0],
          state,
          can_confirm: false,
          credits: state === 'completed' ? 50 : 0,
        };
        if (state === 'completed') {
          remote.completed_count = 1;
          remote.credits = 50;
        }
        return options.decode(
          {
            user_id: fixture.user_id,
            quest_id: ID,
            schedule_revision: 1,
            local_date: '2026-11-12',
            state,
            credits: state === 'completed' ? 50 : 0,
          },
          { account: { user_id: fixture.user_id } },
        );
      } else if (!path.endsWith('/execution')) {
        return options.decode(
          { quest, revision: 1 },
          { account: { user_id: fixture.user_id } },
        );
      }
      return options.decode(remote, { account: { user_id: fixture.user_id } });
    },
  );
  const run = async <T>(fn: (op: AccountOperation) => Promise<T>) => {
    if (!current) throw new Error('closed');
    return fn({
      api: { request } as unknown as AccountOperation['api'],
      account: { user_id: fixture.user_id, sessionGeneration: 1 },
      signal: new AbortController().signal,
    });
  };
  const client = new QueryClient();
  const scope = {
    isCurrent: () => current,
    client,
    key: (...parts: unknown[]) => ['account', fixture.user_id, ...parts],
    read: run,
    write: run,
  } as unknown as AccountScope;
  const lifecycle = createQuestLifecycle(
    scope,
    ID,
    binding
      ? { owner: OWNER, port: port as unknown as ProductNativePort }
      : null,
    () => REQUEST,
  );
  return {
    lifecycle,
    port,
    quest,
    request,
    calls,
    nativeRead,
    setOffline: () => {
      offline = true;
    },
    loseNative: () => {
      lostNative = true;
    },
    loseServer: () => {
      lostServer = true;
    },
    replace: () => {
      current = false;
    },
    remote: () => remote,
    ended: () => {
      remote.observed_at = '2026-11-12T12:00:00Z';
      remote.occurrences[0] = {
        ...remote.occurrences[0],
        state: 'ended',
        can_confirm: true,
      };
    },
  };
}
it('only reads on mount/refresh; neither a server schedule nor refresh installs protection', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  expect(f.lifecycle.getSnapshot().remote?.enabled).toBe(true);
  expect(f.lifecycle.getSnapshot().device?.enabled).toBe(false);
  expect(f.port.questApply).not.toHaveBeenCalled();
});
it('does not treat a presentation refresh as an unfinished write for navigation', async () => {
  const f = setup();
  let deliver!: () => void;
  f.port.questRead.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        deliver = () => resolve(f.nativeRead());
      }),
  );
  const reading = f.lifecycle.refresh();
  expect(f.lifecycle.getSnapshot().busy).toBe(true);
  expect(f.lifecycle.getSnapshot().pendingWrite).toBe(false);
  deliver();
  await reading;
  const writing = f.lifecycle.schedule(f.quest, '2026-11-13', policy);
  expect(f.lifecycle.getSnapshot().pendingWrite).toBe(true);
  await writing;
  expect(f.lifecycle.getSnapshot().pendingWrite).toBe(false);
});
it('checks prerequisites, commits desired schedule first, then confirms exact native receipt', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(true);
  expect(f.calls).toEqual(['server-schedule', 'native-apply']);
  expect(f.lifecycle.getSnapshot().device?.requestId).toBe(REQUEST);
});
it('does not create a server schedule when there are no saved distracting apps', async () => {
  const f = setup();
  f.port.selectionRead.mockResolvedValue({
    owner: OWNER,
    revision: 2,
    selectedAppCount: 0,
  });
  await f.lifecycle.refresh();
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  expect(f.calls).toEqual([]);
});
it('keeps desired and installed state distinct after a lost native response; never replays', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  f.loseNative();
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  expect(f.lifecycle.getSnapshot().reviewRequired).toBe(true);
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  await f.lifecycle.refresh();
  expect(f.lifecycle.getSnapshot().reviewRequired).toBe(true);
  await f.lifecycle.refresh(true);
  expect(f.lifecycle.getSnapshot().reviewRequired).toBe(false);
  expect(f.lifecycle.getSnapshot().message).toContain('previous change');
  expect(f.port.questApply).toHaveBeenCalledTimes(1);
});
it('does not install anything after an uncertain server write, even if it committed', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  f.loseServer();
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  expect(f.port.questApply).not.toHaveBeenCalled();
  await f.lifecycle.refresh(true);
  expect(f.lifecycle.getSnapshot().remote?.revision).toBe(2);
  expect(f.port.questApply).not.toHaveBeenCalled();
});
it('stops local recurrence before server calls and preserves local Stop while offline', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  await f.lifecycle.applySaved(policy);
  f.calls.length = 0;
  f.setOffline();
  expect(await f.lifecycle.stop()).toBe(false);
  expect(f.calls).toEqual(['native-apply']);
  expect(f.lifecycle.getSnapshot().device?.enabled).toBe(false);
  expect(f.remote().enabled).toBe(true);
});
it('uses current definition revision and stops only this quest in both stores', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  expect(await f.lifecycle.stop()).toBe(true);
  expect(f.calls).toEqual(['native-apply', 'server-schedule']);
  expect(f.remote().enabled).toBe(false);
});
it('will not complete before end and records one confirmed completion afterward', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  expect(await f.lifecycle.outcome(1, '2026-11-12', true)).toBe(false);
  f.ended();
  await f.lifecycle.refresh();
  expect(await f.lifecycle.outcome(1, '2026-11-12', true)).toBe(true);
  expect(f.lifecycle.getSnapshot().remote?.credits).toBe(50);
  expect(await f.lifecycle.outcome(1, '2026-11-12', true)).toBe(false);
  expect(f.calls.filter((v) => v === 'server-outcome')).toHaveLength(1);
});
it('cancels the single native occurrence before recording account cancellation', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  await f.lifecycle.applySaved(policy);
  f.calls.length = 0;
  expect(await f.lifecycle.outcome(1, '2026-11-12', false)).toBe(true);
  expect(f.calls).toEqual(['native-cancel', 'server-outcome']);
  expect(f.nativeRead().enabled).toBe(true);
});
it('suppresses a server result delivered after account replacement, including native dispatch', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  const original = f.request.getMockImplementation()!;
  f.request.mockImplementation(async (...args) => {
    const result = await original(...args);
    if (args[0].endsWith('/schedule')) f.replace();
    return result;
  });
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  expect(f.port.questApply).not.toHaveBeenCalled();
});
it('requires explicit claim; reads never stop a previous account or erase its state', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  expect(f.port.interventionClaimOwner).not.toHaveBeenCalled();
  expect(await f.lifecycle.claim()).toBe(true);
  expect(f.port.interventionClaimOwner).toHaveBeenCalledWith(
    OWNER,
    TOKEN,
    true,
  );
});
it('blocks delete when this device Stop cannot be confirmed, and redacts errors', async () => {
  const f = setup(false);
  await f.lifecycle.refresh();
  expect(await f.lifecycle.prepareDelete()).toBe(false);
  expect(f.lifecycle.getSnapshot().message).not.toContain('private');
});
it('serializes rapid schedule taps rather than issuing two writes', async () => {
  const f = setup();
  await f.lifecycle.refresh();
  const first = f.lifecycle.schedule(f.quest, '2026-11-13', policy);
  expect(await f.lifecycle.schedule(f.quest, '2026-11-13', policy)).toBe(false);
  expect(await first).toBe(true);
  expect(f.port.questApply).toHaveBeenCalledTimes(1);
});
