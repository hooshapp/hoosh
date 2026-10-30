import { describe, expect, it } from 'vitest';

import { homeExample } from './__tests__/fixtures';
import { unavailableHome, validateHomeDisplay, type HomeModel } from './home-model';

describe('Home display safety', () => {
  it('keeps unavailable, loading, error and empty distinct without any fixture fallback', () => {
    const input: HomeModel = {
      ...unavailableHome,
      dino: { state: 'loading' },
      credits: { state: 'error' },
      recommendation: { state: 'empty' },
    };
    expect(validateHomeDisplay(input)).toEqual(input);
    expect(JSON.stringify(input)).not.toContain('85');
  });
  it('preserves explicit zeroes, decimals, source labels and chosen artwork without inventing policy', () => {
    const input: HomeModel = {
      ...homeExample,
      credits: { state: 'ready', value: 0 },
      dino: { state: 'ready', value: { percent: 0, artwork: 'happy', feedCost: 0 } },
    };
    expect(validateHomeDisplay(input)).toEqual(input);
  });
  it.each([-1, NaN, Infinity, 101])(
    'hides invalid Dino percentage %s rather than clamping it to a positive score',
    (percent) => {
      const dino = { state: 'ready', value: { percent, artwork: 'happy', feedCost: 3 } } as const;
      expect(validateHomeDisplay({ ...homeExample, dino }).dino).toEqual({ state: 'unavailable' });
    },
  );
  it.each([-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'hides invalid credit count %s',
    (value) => {
      expect(
        validateHomeDisplay({ ...homeExample, credits: { state: 'ready', value } }).credits.state,
      ).toBe('unavailable');
    },
  );
  it.each(['rangeLabel', 'sourceLabel', 'coverageLabel', 'periodLabel'] as const)(
    'requires weekly %s before showing a measurement',
    (key) => {
      if (homeExample.weekly.state !== 'ready') throw new Error('Fixture');
      expect(
        validateHomeDisplay({
          ...homeExample,
          weekly: { state: 'ready', value: { ...homeExample.weekly.value, [key]: '  ' } },
        }).weekly.state,
      ).toBe('unavailable');
    },
  );
  it.each([-1, NaN, Infinity])('does not display invalid measured hours %s', (hours) => {
    if (homeExample.weekly.state !== 'ready') throw new Error('Fixture');
    expect(
      validateHomeDisplay({
        ...homeExample,
        weekly: { state: 'ready', value: { ...homeExample.weekly.value, hours } },
      }).weekly.state,
    ).toBe('unavailable');
  });
  it('rejects malformed display counts and blank recommendations independently of valid regions', () => {
    if (homeExample.recommendation.state !== 'ready' || homeExample.dino.state !== 'ready')
      throw new Error('Fixture');
    const output = validateHomeDisplay({
      ...homeExample,
      streak: { state: 'ready', value: { days: -1, recentWeekComplete: true } },
      dino: { state: 'ready', value: { ...homeExample.dino.value, feedCost: -1 } },
      recommendation: { state: 'ready', value: { ...homeExample.recommendation.value, title: '' } },
    });
    expect(output.streak.state).toBe('unavailable');
    expect(output.dino.state).toBe('unavailable');
    expect(output.recommendation.state).toBe('unavailable');
    expect(output.weekly).toEqual(homeExample.weekly);
  });
});
