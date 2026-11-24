import { describe, expect, it } from 'vitest';
import { INITIAL_PROGRESS, continueIntro, introFraction, scrollIntro } from './progress';

describe('three-scroll introduction', () => {
  it('requires three distinct swipes even when one swipe is very long', () => {
    let state = scrollIntro(INITIAL_PROGRESS, 5000);
    expect(state.section).toBe(1);
    expect(state.gestures).toBe(1);
    expect(continueIntro(state)).toBe(state);
    state = scrollIntro(state, 8);
    expect(continueIntro(state)).toBe(state);
    state = scrollIntro(state, 8);
    expect(state.section).toBe(1);
    expect(state.gestures).toBe(3);
    expect(scrollIntro(state, 100)).toBe(state);
    const finished = continueIntro(state);
    expect(finished.section).toBe(2);
    expect(scrollIntro(finished, 100)).toBe(finished);
    expect(introFraction(finished)).toBe(1);
  });
  it('offers explicit non-gesture progression for accessibility', () => {
    const middle = continueIntro(INITIAL_PROGRESS, true);
    expect(middle.section).toBe(1);
    expect(continueIntro(middle, true).section).toBe(2);
  });
  it.each([0, 2, -80, NaN, Infinity])('ignores taps, reverse movement and invalid distance %s', distance => {
    expect(scrollIntro(INITIAL_PROGRESS, distance)).toBe(INITIAL_PROGRESS);
  });
});
