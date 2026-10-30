# Original design assets

Source: [App UI](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1), captured 2026-10-29, with five RN-09a Home assets captured 2026-10-30. No immutable Figma version was supplied; the manifest records node IDs, original dimensions, byte counts and SHA-256 hashes for these captures.

These SVGs are unmodified downloads from high-fidelity Figma design contexts. Do not redraw, tint, minify, edit paths/root bounds or save transient asset URLs in code. Refresh the source and manifest together when design changes. The larger Home SVG bounds include its stroke overhang around the 18 px layout slot; render it at its original 20.5×20.7758 px bounds with the recorded offset. Other nav glyphs are 20×20 px; Home Dino artwork is 110×110 px. The separately exported [Settings avatar](account/README.md) retains its original 52×52 bounds.

| Local file | Source node | Format / native view bounds | Purpose |
|---|---|---|---|
| [icons/navigation/home-active.svg](icons/navigation/home-active.svg) | `84:135` | SVG, 20.5×20.7758, viewBox `0 0 20.5 20.7758` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/home-inactive.svg](icons/navigation/home-inactive.svg) | `10573:366` | SVG, 20.5×20.7758, viewBox `0 0 20.5 20.7758` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/quests-active.svg](icons/navigation/quests-active.svg) | `10491:103` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/quests-inactive.svg](icons/navigation/quests-inactive.svg) | `84:151` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/history-active.svg](icons/navigation/history-active.svg) | `10573:381` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/history-inactive.svg](icons/navigation/history-inactive.svg) | `84:154` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/settings-active.svg](icons/navigation/settings-active.svg) | `10601:231` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [icons/navigation/settings-inactive.svg](icons/navigation/settings-inactive.svg) | `84:148` | SVG, 20×20, viewBox `0 0 20 20` | Active/inactive navigation glyph; bundled in the app. |
| [mascot/dino-happy.svg](mascot/dino-happy.svg) | `84:77` | SVG, 110×110, viewBox `0 0 110 110` | Original RN-02 inventory capture retained unchanged. RN-09a uses its fresh Home export below. |
| [mascot/dino-needs-care.svg](mascot/dino-needs-care.svg) | `88:68` | SVG, 110×110, viewBox `0 0 110 110` | Explicitly supplied Home artwork only; no score/mood is chosen by default. |
| [mascot/dino-feeling-low.svg](mascot/dino-feeling-low.svg) | `88:77` | SVG, 110×110, viewBox `0 0 110 110` | Explicitly supplied Home artwork only; no score/mood is chosen by default. |
| [mascot/dino-doing-okay.svg](mascot/dino-doing-okay.svg) | `88:86` | SVG, 110×110, viewBox `0 0 110 110` | Explicitly supplied Home artwork only; no score/mood is chosen by default. |
| [mascot/home-dino-happy.svg](mascot/home-dino-happy.svg) | `84:77` | SVG, 110×110, viewBox `0 0 110 110` | Fresh RN-09a original Home export in the ready Dino slot; isolated Figma example only until approved real scoring exists. |
| [icons/home/heart.svg](icons/home/heart.svg) | `84:145` | SVG, 12×12, viewBox `0 0 12 12` | Ready Dino health row, preserved original source bounds. |
| [icons/home/saved-time-ellipse.svg](icons/home/saved-time-ellipse.svg) | `84:97` | SVG, 110×110, viewBox `0 0 110 110` | Weekly card decoration, source layer at left 80/top −30, clipped by its card. |
| [icons/home/check.svg](icons/home/check.svg) | `10605:227` | SVG, 16×16, viewBox `0 0 16 16` | Recommendation Accept decoration inside the named action. |
| [icons/home/streak-dots.svg](icons/home/streak-dots.svg) | `84:125` | SVG, 86×8, viewBox `0 0 86 8` | Seven filled indicators only with explicit recent-week evidence; never inferred from a count. |

## Rendering and verification

`expo-image` renders local statically imported SVG assets across the Expo targets, without a transformer, inline paths, runtime recoloring or an SVG component framework. Its config plugin is registered; native rebuild/linking acceptance remains separate from browser/Jest checks. The [SDK 58 image reference](https://docs.expo.dev/versions/v58.0.0/sdk/image/) documents an iOS SVG arc-decoder limitation; signed iOS/Android visual verification is still required before release. Do not alter original artwork to work around a decoder: choose a verified renderer or source-provided raster exports if device checks reveal an issue.

Navigation uses both original color variants, decorative image semantics and text labels if an image fails. All targets retain accessible names and selected state. [Navigation contract](../src/components/navigation/README.md) explains layout, history and clearance.

`npm run mobile:check-assets` verifies all 18 local files against the manifest, including unchanged bytes and root dimensions. `npm run mobile:export` additionally verifies that all eight nav SVGs exist byte-for-byte in the release export. Home presentation can render explicitly provided variants; the real route has unavailable inputs and no selected mood. Inspect the isolated examples through `npm run mobile:ui`; artwork is not evidence of a working health model.

RN-09a downloaded all five original assets from Home's fresh high-fidelity context.
Its Home Dino export differs in bytes from the earlier `84:77` inventory capture;
both original captures are retained and separately hashed instead of rewriting an
earlier record. Home uses the fresh file for that source slot. Browser evidence
verifies all five effective dimensions and served bytes; full native JS exports
retain them unchanged. No SVG path, root bounds or color was edited.

Third-party app/provider logos are not line icons and are not included in this navigation-only scope. Future auth/app-picker work must export authentic source logos separately with provenance. No emoji, generated art, external CDN or icon-font substitution is used here.

RN-05 preparation adds the original Settings avatar to the manifest and isolated account specimen. Its consumer is not routed into the live app yet; no account gender/mood is inferred from the decorative artwork.
