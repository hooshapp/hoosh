# RN-10c — physical Android UI QA and two rendering fixes

Date: 2026-11-01. Owner: Ishmum. Parent: `704bc49`. Branch:
`task/react-native/rn-10-android-icons`.

## Actual device and scope

Pixel 8 Pro, Android 16/API 36, Expo Go 58.0.5; 1344×2992 physical pixels at density
480. The phone was USB-authorized by its owner. No serial, real account credential,
installed-app catalog or personal notification content is tracked here. All account,
usage and credit values in populated images are the existing synthetic source
examples. The ordinary Router app retains unavailable live values.

The phone ran Expo Go development UI. `phone-results.json` records actual device
observations; `native-results.json` records separate static iOS/Android Hermes
exports that were not installed. This is not signed standalone build, Auth,
backend persistence or native protection acceptance.

## Cases executed

- All 19 QA destinations opened at the original font scale 1.15. This checks the
  sampled rendered pages, not every interaction and every state on all pages.
- Eleven representative destinations were inspected at font scale 2.0, with
  scrolling/lower-content captures. Home stacked, labels wrapped and the footer
  remained available. Actual four-tab navigation also ran at both font scales.
- Original local assets rendered, including the four Dino moods, branded app icons,
  feature controls and actual active/inactive navigation icons.
- A typed quest draft survived Android Back within its discard prompt in both the
  QA app and actual Router. Explicit discard returned to the QA menu or Quests.
- With large text, header Back opened the prompt while typing, dismissed the IME,
  and left both prompt actions reachable. Android Back kept the typed draft.
- A late Activities custom field scrolled into view while typing above the IME.
- Native horizontal hours-handle drag changed the local start from 9:00 AM to
  1:22 PM. One session increment updated the local planned budget to 45 minutes.
  These were controlled local drafts; nothing was persisted or installed.
- Home cycled through Loading, Error, Unavailable, Busy, Long text and Ready.
- Font scale was restored to 1.15, temporary USB stay-awake to 0, and the unchanged
  screen-off timeout was confirmed as 30000 ms. The final foreground project was
  QA Home in Ready with clearly labeled samples; normal auto-lock remains enabled.

## Failures found, fixed and retested

**Weekdays split into individual letters at font scale 2.0.** `Choice` now grows
compact minimum width above font scale 1.3, using the existing row wrapping. The
normal 1.15 layout is preserved. `quest-weekdays-before.png` reproduces the issue;
`quest-weekdays-after.png` shows seven complete labels on two rows. Actual checkbox
deselection/reselection passed. No rule, day mapping or draft validation changed.

**Selected tab backgrounds became square after switching.** `MainTabBar` now
initializes each pill with the existing bar color, so selection changes color on
an existing native background. Before/after normal-font Settings captures show the
same 377 px middle width: near-top width changes from 377 to 325 px, demonstrating
rounded corners. `check-captures.py` verifies this against the real images. The
large-font four-tab pass also shows rounded selected pills and expanded labels.
No routing, hit-target, original SVG or accessibility-label behavior changed.

## Evidence and reproduction

There are 44 inspected app-only phone captures, with exact dimensions/hashes in
`capture-audit.json`. Source screenshots were cropped from `(0,151)` to
`(1344,2848)` to remove status/notification icons and system navigation. No app
pixels were repainted or resized. A notification-overlaid capture was excluded and
retaken (`gender-baseline-clean.png`). The gray floating Tools gear is Expo Go's
own development overlay, not a product control.

Use the [native QA runbook](../../../../apps/mobile/dev/native/README.md) to repeat
on an authorized, unlocked device. Keep the separate QA project (8090) and ordinary
Router (8081) distinct. Reproduce the weekday defect/retest in Custom quest at
system font scale 2.0, scrolling to weekly choices. Reproduce the tab shape check
at scale 1.15 by selecting History and then Settings. Restore original system
settings after testing. Do not inspect a locked or unrelated application screen.

A stale HMR connection registered the ordinary Router entry against the nested QA
root and stopped local Metro during a final retest. Restarting Metro and
cold-opening Expo Go between projects let the interrupted cases pass. The phone
also auto-locked; the owner unlocked it before testing resumed. No lock bypass,
app-data wipe, framework upgrade or native project regeneration was used. Cold
starts for test setup are not D06 lifecycle acceptance.

Final checks:

```sh
npm run check
npm run mobile:export
npm exec --workspace @disconnect/mobile -- expo export --platform ios --platform android --output-dir .expo/rn-10c-native --source-maps
node docs/core_plan_implementation_notes/artifacts/verify-main-native.mjs rn-10c
python3 docs/core_plan_implementation_notes/artifacts/rn-10c/check-captures.py
```

Workspace checks passed 250 portable + 362 component + 3 API tests, types/lint/Ruff
and asset integrity. Web export passed 38-file specimen isolation and 71 original
assets. Native export source maps match the changed shared components and exclude
project-local dev/test/private API consumers. The optional capture audit requires
Pillow; it verifies the committed phone images rather than emulating Android.

## Remaining acceptance

RN10-D02/D05 have partial physical Android evidence. TalkBack/VoiceOver speech and
traversal, iOS, additional device sizes, signed standalone builds, exhaustive
feature-state matrices, real Auth/profile/native producers, offline/termination/
low-memory behavior and measured responsiveness remain open. No cloud/backend,
native permissions, enforcement policy, signing or released iOS identity changed.
