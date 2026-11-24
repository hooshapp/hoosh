export type IntroProgress = { section: 0 | 1 | 2; distance: number; gestures: number };
export const INITIAL_PROGRESS: IntroProgress = { section: 0, distance: 0, gestures: 0 };
export const REQUIRED_GESTURES = 3;

/** Count separate upward swipes, never speed or one long swipe's distance. */
export function scrollIntro(current: IntroProgress, distance: number): IntroProgress {
  if (current.section === 2 || current.gestures >= REQUIRED_GESTURES || !Number.isFinite(distance) || distance < 8) return current;
  return { section: 1, distance: current.distance + distance, gestures: current.gestures + 1 };
}

export function continueIntro(current: IntroProgress, accessible = false): IntroProgress {
  if (current.section === 2) return current;
  if (accessible) return { section: (current.section + 1) as 1 | 2, distance: 0, gestures: 0 };
  return current.gestures >= REQUIRED_GESTURES ? { ...current, section: 2 } : current;
}

export function introFraction(progress: IntroProgress): number {
  if (progress.section === 2) return 1;
  return Math.min(1, progress.gestures / REQUIRED_GESTURES);
}
