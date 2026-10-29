# Original design assets

Source: [App UI](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1), captured 2026-10-29. No immutable Figma version was supplied; the manifest records node IDs, original dimensions, byte counts and SHA-256 hashes for this capture.

These SVGs are unmodified downloads from high-fidelity Figma design contexts. Do not redraw, tint, minify, edit paths/root bounds or save transient asset URLs in code. Refresh the source and manifest together when design changes. The larger Home SVG bounds include its stroke overhang around the 18 px layout slot; render it at its original 20.5×20.7758 px bounds with the recorded offset. Other nav glyphs are 20×20 px; Dino artwork is 110×110 px.

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
| [mascot/dino-happy.svg](mascot/dino-happy.svg) | `84:77` | SVG, 110×110, viewBox `0 0 110 110` | Dino source inventory and isolated gallery; no user score/mood assigned or release Home consumer yet. |
| [mascot/dino-needs-care.svg](mascot/dino-needs-care.svg) | `88:68` | SVG, 110×110, viewBox `0 0 110 110` | Dino source inventory and isolated gallery; no user score/mood assigned or release Home consumer yet. |
| [mascot/dino-feeling-low.svg](mascot/dino-feeling-low.svg) | `88:77` | SVG, 110×110, viewBox `0 0 110 110` | Dino source inventory and isolated gallery; no user score/mood assigned or release Home consumer yet. |
| [mascot/dino-doing-okay.svg](mascot/dino-doing-okay.svg) | `88:86` | SVG, 110×110, viewBox `0 0 110 110` | Dino source inventory and isolated gallery; no user score/mood assigned or release Home consumer yet. |

## Rendering and verification

`expo-image` renders local statically imported SVG assets across the Expo targets, without a transformer, inline paths, runtime recoloring or an SVG component framework. Its config plugin is registered; native rebuild/linking acceptance remains separate from browser/Jest checks. The [SDK 58 image reference](https://docs.expo.dev/versions/v58.0.0/sdk/image/) documents an iOS SVG arc-decoder limitation; signed iOS/Android visual verification is still required before release. Do not alter original artwork to work around a decoder: choose a verified renderer or source-provided raster exports if device checks reveal an issue.

Navigation uses both original color variants, decorative image semantics and text labels if an image fails. All targets retain accessible names and selected state. [Navigation contract](../src/components/navigation/README.md) explains layout, history and clearance.

`npm run mobile:check-assets` verifies all 12 local files against the manifest, including unchanged bytes and root dimensions. `npm run mobile:export` additionally verifies that all eight nav SVGs exist byte-for-byte in the release export. The four Dino variants are deliberately inventory-only until an approved Home consumer exists; they can be inspected locally through `npm run mobile:ui` and are not evidence of a working health model.

Third-party app/provider logos are not line icons and are not included in this navigation-only scope. Future auth/app-picker work must export authentic source logos separately with provenance. No emoji, generated art, external CDN or icon-font substitution is used here.
