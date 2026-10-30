import check from '../../assets/icons/home/check.svg';
import heart from '../../assets/icons/home/heart.svg';
import ellipse from '../../assets/icons/home/saved-time-ellipse.svg';
import streak from '../../assets/icons/home/streak-dots.svg';
import happy from '../../assets/mascot/home-dino-happy.svg';

import { mascotAssets } from './mascot-assets';

/** Original source dimensions; no tint, path edits, or inferred health bands. */
export const homeAssets = {
  check: { source: check, width: 16, height: 16 },
  heart: { source: heart, width: 12, height: 12 },
  ellipse: { source: ellipse, width: 110, height: 110 },
  streak: { source: streak, width: 86, height: 8 },
} as const;
export const homeDinoAssets = { ...mascotAssets, happy } as const;
