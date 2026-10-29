export const INTRO_SEEN_KEY = 'disconnect.intro-seen.v1';
export interface IntroStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** A stalled native/browser store must never leave the launch screen waiting forever. */
async function bounded<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Intro storage unavailable')), timeoutMs); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function hasSeenIntro(storage: IntroStorage, timeoutMs = 2500): Promise<boolean> {
  return (await bounded(storage.getItem(INTRO_SEEN_KEY), timeoutMs)) === 'seen';
}

export async function rememberIntro(storage: IntroStorage, timeoutMs = 2500): Promise<void> {
  await bounded(storage.setItem(INTRO_SEEN_KEY, 'seen'), timeoutMs);
}
