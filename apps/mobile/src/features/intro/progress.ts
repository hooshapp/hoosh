export type IntroProgress = { section: 0 | 1 | 2; distance: number; gestures: number };
export const INITIAL_PROGRESS: IntroProgress = { section: 0, distance: 0, gestures: 0 };
export const SECTION_DISTANCE = 160;
export const MAX_GESTURES = 5;

/** One completed upward gesture; never advances more than one section. */
export function scrollIntro(current: IntroProgress, distance: number): IntroProgress {
  if (current.section === 2 || !Number.isFinite(distance) || distance < 8) return current;
  const accumulated = current.distance + distance;
  const gestures = current.gestures + 1;
  if (accumulated >= SECTION_DISTANCE || gestures >= MAX_GESTURES) {
    return { section: (current.section + 1) as 1 | 2, distance: 0, gestures: 0 };
  }
  return { ...current, distance: accumulated, gestures };
}

export function introFraction(progress: IntroProgress): number {
  if (progress.section === 2) return 1;
  return (progress.section + Math.max(progress.distance / SECTION_DISTANCE, progress.gestures / MAX_GESTURES)) / 2;
}
