import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasSeenIntro, INTRO_SEEN_KEY, rememberIntro, type IntroStorage } from './storage';

afterEach(() => vi.useRealTimers());
describe('device-local first launch flag', () => {
  it('shows the intro with no saved flag and skips it after first display is saved', async () => {
    const data = new Map<string, string>();
    const storage: IntroStorage = {
      getItem: async key => data.get(key) ?? null,
      setItem: async (key, value) => { data.set(key, value); },
    };
    expect(await hasSeenIntro(storage)).toBe(false);
    await rememberIntro(storage);
    expect(await hasSeenIntro(storage)).toBe(true);
    expect([...data.keys()]).toEqual([INTRO_SEEN_KEY]);
  });
  it('treats corrupt or unrelated saved state as an unseen intro', async () => {
    expect(await hasSeenIntro({ getItem: async () => 'authenticated', setItem: async () => undefined })).toBe(false);
  });
  it('reports unavailable reads instead of pretending the intro was seen', async () => {
    const store = { getItem: async () => { throw new Error('blocked'); }, setItem: async () => undefined };
    await expect(hasSeenIntro(store)).rejects.toThrow('blocked');
  });
  it('reports failed writes instead of claiming first launch was remembered', async () => {
    await expect(rememberIntro({ getItem: async () => null, setItem: async () => { throw new Error('full'); } })).rejects.toThrow('full');
  });
  it.each(['read', 'write'])('bounds a stalled %s so navigation cannot hang forever', async operation => {
    vi.useFakeTimers();
    const never = new Promise<never>(() => undefined);
    const store = { getItem: () => never, setItem: () => never };
    const work = operation === 'read' ? hasSeenIntro(store, 100) : rememberIntro(store, 100);
    const check = expect(work).rejects.toThrow('Intro storage unavailable');
    await vi.advanceTimersByTimeAsync(100);
    await check;
    expect(vi.getTimerCount()).toBe(0);
  });
});
