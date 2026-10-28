# Disconnect mobile

Run commands from the repository root; use the single root npm lockfile.

```bash
npm ci
npm run mobile:web
npm run mobile
npm run check
```

See [the root README](../../README.md) for setup, current limitations, ownership, and native integration requirements. Auth and onboarding routes are placeholders; the preview enters Home without authenticating. Add guards only alongside a real auth/onboarding state model.

Use the original Figma mascot/icons when implementing full screens. The initial shell is text-only and contains no fabricated usage, reward, or protection data. The font dependency provides Space Grotesk; no font binaries are copied into this repository.

Native source is not ignored by Git. Preserve the released iOS project when integrating it; do not generate a replacement identity or discard extension targets.
