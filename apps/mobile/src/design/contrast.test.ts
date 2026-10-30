import { expect, it } from 'vitest';

import { colors, uiRecipes } from './tokens';

// WCAG relative luminance for opaque sRGB text/surface pairs, not an app-wide audit.
function luminance(hex: string) {
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)!
    .map((part) => {
      const s = parseInt(part, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
it.each([
  ['Home hours on action green', colors.onAction, colors.action],
  ['Dino percentage on card', colors.readableSuccess, colors.warmCard],
  ['Quest / cost badge text', colors.white, colors.readableSuccess],
  ['Primary action label', colors.actionLabel, colors.action],
  ['Active navigation label', colors.onAction, colors.action],
  ['Warm body text', colors.warmForeground, colors.warmCard],
  ['Warm secondary text', colors.muted, colors.warmCard],
  ['Credits / streak text', colors.warmHeader, colors.warmForeground],
  ['Dark secondary text', colors.darkMuted, colors.darkCard],
  ['Warm error', uiRecipes.warm.error, uiRecipes.warm.canvas],
  ['Dark error', uiRecipes.dark.error, uiRecipes.dark.canvas],
])('%s retains at least 4.5:1 text contrast', (_name, foreground, background) => {
  const a = luminance(foreground),
    b = luminance(background);
  expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(4.5);
});
