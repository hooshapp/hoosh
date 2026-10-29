# Floating main navigation

RN-02 replaces the text-only scaffold with the original Figma icons and active-label
pill for Home, Quests, History and Settings. The existing Expo Router tab paths and
Auth/onboarding groups remain canonical. The screen bodies still describe unavailable
features; artwork and navigation do not establish Auth, usage, rewards or protection.

## Responsibilities

- `main-tab-bar.tsx` adapts Expo SDK 58's **public** `expo-router/js-tabs` props
  (`emitter`, `navigateToTab`, descriptors and insets). It emits cancellable
  `tabPress` and `tabLongPress`, preserves active-tab reselect behavior, and uses
  the public `PlatformPressable`/`useLinkBuilder` for real browser links, including
  modified/new-tab clicks. Do not replace this with an incompatible older
  `@react-navigation/bottom-tabs` example or a second router.
- The tab layout selects `backBehavior="history"`: Back visits previously selected
  tabs. Reselecting the current tab does not add a duplicate entry. Root/Auth guard
  integration remains Anisha's ownership and is not bypassed by this component.
- `floating-tab-bar-metrics.tsx` owns local presentation measurements. The bar
  reports its actual layout height, including a larger/reflowed layout. The
  navigator also receives the occupied bottom extent through its public height
  callback. No session/account/native state lives here.
- `main-tab-panel.tsx` associates each web tab with its actual screen panel through
  provider-scoped IDs. Native content keeps its own accessibility elements.
- `tab-list-keyboard.ts` implements web manual activation: one active Tab stop,
  wrapping Left/Right focus (including RTL), Home/End, and Space/Enter activation.
  Focus movement alone does not navigate or start a future request. See the
  [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Geometry and assets

The source Home bar is 353×62 px in a 393×852 frame: 20 px side margins, a
28 px bottom gap, 31 px radius, 12/8 px horizontal/vertical padding and 44 px
minimum touch targets. Its green pill includes the active label only. The Settings
source centers the four items; the other source states have a spacer after Home.
The bar grows with the viewport rather than using the source phone's absolute Y.

Safe horizontal insets add to the 20 px margins; the bottom gap is
`max(bottomInset, 28)`. Font scale above 1.3 or usable bar width below 280 px uses
two wrapping columns with visible labels. This deliberate accessibility adaptation
keeps original icon dimensions while allowing text and bar height to grow.

`Screen` automatically consumes the measured bar height in the main provider. Its
bottom padding is `24 + measuredHeight + max(bottomInset, 28)`, with the safe inset
counted once. Before the first layout, 62 px is a minimum-size fallback, not the
final measured result. Outside this provider, Screen reserves only its ordinary
24 px spacing plus safe inset. A caller's explicit `bottomClearance` still overrides
the provider for a different overlapping footer; do not add a second tab reserve.

[Original asset provenance](../../../assets/README.md) identifies all eight nav
variants and four Dino sources. `navigation-assets.ts` statically imports the local
unmodified SVGs; `expo-image` renders them without a transformer, path rewriting or
tinting. Home's stroke overhang uses its original 20.5×20.7758 px image bounds around
the 18 px source slot. Other nav glyphs are 20×20 px. A failed image reveals its
destination label while retaining a working tab and accessible name.

Dino variants are inventoried in `mascot-assets.ts` and the isolated developer
gallery. They are not imported by release Home or selected from an unknown score.
RN-09/PM decisions own the actual Home composition and score/feed policy.

## Checks and handoff

From the repository root:

```bash
npm run check
npm run mobile:check-assets
npm run mobile:ui:build
npm run mobile:export
npm run mobile:ui
```

The asset guard verifies manifest dimensions, byte sizes and SHA-256 hashes;
`mobile:export` also requires all eight exact nav SVGs in the real export. The
existing specimen-isolation guard keeps the developer artwork gallery out of app
routes/bundles. Preview builds disable asset inlining so source SVG files remain
individually inspectable. Exported third-party app/provider logos belong to their
later features and must stay distinct from these line icons.

Jest runs real Router tab destinations, direct links, visited-tab Back/reselect,
Auth-stack separation/return, canceled/long presses, image failure, live font-scale
changes, layout measurements and safe insets under both OS presets. Browser evidence
also exercises real keyboard focus/activation, image decoding, 320/393/430 px
portraits, narrow reflow, scroll clearance and offline transitions **after warming
the route modules/assets in that document**. It does not prove a cold offline web
reload or a native device build.

The optional [browser evidence runner](../../../../../docs/core_plan_implementation_notes/artifacts/rn-02/browser-check.mjs)
uses an externally installed Playwright module, selected with `PLAYWRIGHT_MODULE`
(ESM module path) or the default `playwright` import. Serve the real Expo export on
loopback port 8092 and the separate UI preview on 8091; run the script from the
repository root. It uses its own headless Chrome session and saves local evidence.
Playwright is not an app dependency or an automatic CI/device gate.

Native JS/Hermes exports are separate from signed builds and visual/device
acceptance. Anisha must integrate/link the `expo-image` native dependency in the
audited iOS project before native QA. No prebuild, entitlement or legacy Swift
rewrite was performed. Verify the original SVGs on signed iOS/Android builds,
including the SDK's documented iOS SVG decoder limitation, screen readers and
keyboard/safe-area behavior before release.
