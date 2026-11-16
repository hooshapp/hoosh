import { describe, expect, it } from 'vitest';
import { INITIAL_PROGRESS, introFraction, scrollIntro } from './progress';

describe('first-launch scrolling', () => {
  it('advances with two ordinary swipes without a speed requirement', () => {
    const first = scrollIntro(INITIAL_PROGRESS, 80);
    expect(first.section).toBe(0);
    expect(scrollIntro(first, 80)).toEqual({ section: 1, distance: 0, gestures: 0 });
  });
  it('advances on the fifth light swipe, without needing a sixth', () => {
    let state = INITIAL_PROGRESS;
    for (let index = 0; index < 4; index++) state = scrollIntro(state, 8);
    expect(state.section).toBe(0);
    expect(scrollIntro(state, 8).section).toBe(1);
  });
  it('never carries excess movement over into the following section', () => {
    expect(scrollIntro(INITIAL_PROGRESS, 5000)).toEqual({ section: 1, distance: 0, gestures: 0 });
  });
  it.each([0, 2, -80, NaN, Infinity])('ignores taps, reverse movement and invalid distance %s', distance => {
    expect(scrollIntro(INITIAL_PROGRESS, distance)).toBe(INITIAL_PROGRESS);
  });
  it('gives the second section its own five-gesture fallback', () => {
    let state = scrollIntro(INITIAL_PROGRESS, 160);
    for (let index = 0; index < 5; index++) state = scrollIntro(state, 8);
    expect(state).toEqual({ section: 2, distance: 0, gestures: 0 });
    expect(scrollIntro(state, 9999)).toBe(state);
    expect(introFraction(state)).toBe(1);
  });
});
