import { expect, it, vi } from 'vitest';

import type { AccountScope } from '../../infrastructure/query/account-scope';
import { createOnboardingProgressRepository } from './progress-repository';

function scope(userId: string) {
  let active = true;
  const account = { user_id: userId, sessionGeneration: 1 };
  const value = {
    account,
    isCurrent: () => active,
    assertCurrent: () => { if (!active) throw new Error('retired scope'); },
  } as AccountScope;
  return { value, retire: () => { active = false; } };
}

function fixture() {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn(async (key: string) => data.get(key) ?? null),
    setItem: vi.fn(async (key: string, raw: string) => { data.set(key, raw); }),
    removeItem: vi.fn(async (key: string) => { data.delete(key); }),
  };
  return { storage, data, repo: createOnboardingProgressRepository(storage, 'fixture') };
}

it('isolates project/account progress and resumes only the appropriate installation record', async () => {
  const { storage, repo } = fixture();
  const a = scope('a').value;
  const b = scope('b').value;
  const saved = { version: 1, step: 'review', settingsRevision: 4 } as const;
  await repo.save(a, saved);
  await expect(createOnboardingProgressRepository(storage, 'fixture').read(a)).resolves.toEqual({ status: 'found', progress: saved });
  await expect(repo.read(b)).resolves.toEqual({ status: 'not_started' });
  await expect(createOnboardingProgressRepository(storage, 'other').read(a)).resolves.toEqual({ status: 'not_started' });
});

it('reports corrupt, failed and incompatible reads and permits explicit discard', async () => {
  const { data, storage, repo } = fixture();
  const a = scope('a').value;
  const key = 'hoosh.setup.fixture.a';
  data.set(key, '{');
  await expect(repo.read(a)).resolves.toEqual({ status: 'read_failed' });
  data.set(key, '{"version":2}');
  await expect(repo.read(a)).resolves.toEqual({ status: 'incompatible' });
  storage.getItem.mockRejectedValueOnce(new Error('fixture storage failure'));
  await expect(repo.read(a)).resolves.toEqual({ status: 'read_failed' });
  expect(data.get(key)).toBe('{"version":2}');
  await repo.discard(a);
  await expect(repo.read(a)).resolves.toEqual({ status: 'not_started' });
});

it('rolls back a local write that finishes after a same-user session replacement', async () => {
  const { data, storage, repo } = fixture();
  const a = scope('a');
  const next = scope('a');
  const previous = { version: 1, step: 'preferences' } as const;
  await repo.save(a.value, previous);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  storage.setItem.mockImplementationOnce(async (key, raw) => {
    await gate;
    data.set(key, raw);
  });
  const outgoing = repo.save(a.value, { version: 1, step: 'complete' });
  const canceled = expect(outgoing).rejects.toThrow('retired scope');
  await vi.waitFor(() => expect(storage.setItem).toHaveBeenCalledTimes(2));
  a.retire();
  const read = repo.read(next.value);
  release();
  await canceled;
  await expect(read).resolves.toEqual({ status: 'found', progress: previous });
});

it('bounds stalled reads without treating them as a new setup', async () => {
  const { storage, repo } = fixture();
  vi.useFakeTimers();
  try {
    storage.getItem.mockReturnValueOnce(new Promise(() => undefined));
    const result = repo.read(scope('a').value);
    await vi.advanceTimersByTimeAsync(2500);
    await expect(result).resolves.toEqual({ status: 'read_failed' });
    expect(storage.setItem).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('rejects a late receipt for a different persisted settings attempt', async () => {
  const { repo } = fixture();
  const a = scope('a').value;
  const old = { expected_revision: 0, plan_draft: null };
  const current = { expected_revision: 1, plan_draft: null };
  await repo.save(a, { version: 1, step: 'review', settingsAttempt: current });
  await expect(repo.save(a, { version: 1, step: 'permission', settingsRevision: 1 }, old))
    .rejects.toMatchObject({ kind: 'conflict' });
  await expect(repo.read(a)).resolves.toMatchObject({
    status: 'found', progress: { settingsAttempt: current },
  });
});
