import type { homeDinoAssets } from '@/design/home-assets';

/** Local display inputs, NOT approved HTTP/native/product policy contracts. */
export type HomeDatum<T> =
  Readonly<{ state: 'ready'; value: T }> | Readonly<{ state: 'loading' | 'unavailable' | 'error' }>;

export type DinoDisplay = Readonly<{
  percent: number;
  /** Supplied explicitly by an approved future scorer; never selected from a guessed band. */
  artwork: keyof typeof homeDinoAssets;
  feedCost: number | null;
}>;
export type WeeklyDisplay = Readonly<{
  hours: number;
  periodLabel: string;
  rangeLabel: string;
  sourceLabel: string;
  coverageLabel: string;
}>;
export type StreakDisplay = Readonly<{
  days: number;
  /** The seven filled source dots require actual recent-week evidence, not days >= 7. */
  recentWeekComplete: boolean;
}>;
export type RecommendationDisplay = Readonly<{
  id: string;
  title: string;
  description: string;
  rewardCredits: number | null;
  /** Only from approved restriction/install semantics; do not infer this from an app list. */
  restrictionNotice: string | null;
}>;
export type HomeModel = Readonly<{
  dino: HomeDatum<DinoDisplay>;
  credits: HomeDatum<number>;
  weekly: HomeDatum<WeeklyDisplay>;
  streak: HomeDatum<StreakDisplay>;
  recommendation: HomeDatum<RecommendationDisplay> | Readonly<{ state: 'empty' }>;
}>;

/** Current route has no producers. No example account, statistics, or default mood. */
export const unavailableHome: HomeModel = {
  dino: { state: 'unavailable' },
  credits: { state: 'unavailable' },
  weekly: { state: 'unavailable' },
  streak: { state: 'unavailable' },
  recommendation: { state: 'unavailable' },
};

// Defensive display guards, not response validators or reward/measurement definitions.
const count = (value: number) => Number.isSafeInteger(value) && value >= 0;
const text = (value: string) => typeof value === 'string' && value.trim().length > 0;
function checked<T>(datum: HomeDatum<T>, valid: (value: T) => boolean): HomeDatum<T> {
  return datum.state === 'ready' && !valid(datum.value) ? { state: 'unavailable' } : datum;
}
export function validateHomeDisplay(model: HomeModel): HomeModel {
  return {
    dino: checked(
      model.dino,
      (v) =>
        !!v &&
        Number.isFinite(v.percent) &&
        v.percent >= 0 &&
        v.percent <= 100 &&
        ['needsCare', 'feelingLow', 'doingOkay', 'happy'].includes(v.artwork) &&
        (v.feedCost === null || count(v.feedCost)),
    ),
    credits: checked(model.credits, count),
    weekly: checked(
      model.weekly,
      (v) =>
        !!v &&
        Number.isFinite(v.hours) &&
        v.hours >= 0 &&
        [v.periodLabel, v.rangeLabel, v.sourceLabel, v.coverageLabel].every(text),
    ),
    streak: checked(
      model.streak,
      (v) => !!v && count(v.days) && typeof v.recentWeekComplete === 'boolean',
    ),
    recommendation:
      model.recommendation.state === 'empty'
        ? model.recommendation
        : checked(
            model.recommendation,
            (v) =>
              !!v &&
              [v.id, v.title, v.description].every(text) &&
              (v.rewardCredits === null || count(v.rewardCredits)) &&
              (v.restrictionNotice === null || text(v.restrictionNotice)),
          ),
  };
}

export function unavailableLabel(state: Exclude<HomeDatum<never>['state'], 'ready'>) {
  return state === 'loading'
    ? 'Loading…'
    : state === 'error'
      ? 'Couldn’t load'
      : 'Not available yet';
}
