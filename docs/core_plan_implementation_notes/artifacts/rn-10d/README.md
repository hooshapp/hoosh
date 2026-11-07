# RN-10d Android acceptance — 2026-11-07

Ishmum tested the existing Android debug development host on Pixel 8 Pro,
Android 16/API 36, against current JavaScript. This supplements RN-10c's Expo Go
run. It is not signed release or authenticated acceptance. See
[structured results](device-results.json) and the Plan 04 implementation entry.

Two observed failures are fixed: Android native focus scrolling could put the
last Home action beneath the floating navigation bar; Keep editing could lose
TalkBack focus during native modal dismissal. The viewport now ends above the
measured footer, and explicit modal return waits for activity focus and one short
settle with bounded cleanup. Shared source/tests cover iOS behavior, but no iOS
physical result is claimed.

| Evidence | What it establishes |
|---|---|
| [Large-font footer](large-font-footer.png) | Actual Home at font 2.0: Review usage access remains above the expanded navigation. |
| [Modal return](modal-return-focus.png) | Actual custom quest Back has the TalkBack focus rectangle after Keep editing; draft retained. The cropped image intentionally excludes an old speech caption. |
| [Sample checkbox](sample-checkbox-focus.png) | Isolated native Days sample checkbox focus/selected presentation; not a saved plan or real account. |

## Reproduce the bounded run

1. Use an authorized, owner-unlocked Android phone and the existing development
   build instructions in [the native probe runbook](../../../qa/android-capability-probe.md).
   Record the current font, accessibility, radio, animation, timeout and usage-access
   settings privately before changing any. Never copy device/account identifiers into evidence.
2. Start the actual Router with `npx expo start apps/mobile --dev-client --localhost --port 8092`.
   For USB, add `adb reverse tcp:8092 tcp:8092` and open that server in the development client.
   Close the other experience before switching projects; a cold single launch clears
   stale development linking registrations. Do not suppress navigation warnings.
3. At font 1.15 and 2.0 inspect all four tabs, Home's last action, custom quest input,
   IME, footer and dirty Back/Keep/discard. Open Settings apps/activities/days/hours/
   sessions, and History progress/month/reclaimed. Actual unavailable data must stay unavailable.
4. Enable TalkBack temporarily. Observe selected-tab/control speech, safe modal action,
   and return focus. Use screenshots and direct input while it is active. **Do not run
   `uiautomator dump` concurrently:** that automation connection disturbed TalkBack
   and made early focus observations unreliable. Only corrected clean retests are accepted.
   Android's [testing guide](https://developer.android.com/guide/topics/ui/accessibility/testing)
   documents Display speech output; the owner confirmed audio was audible. Captions/focus
   are remotely observed, not a speaker-quality assessment. Input Tab is not an external
   physical keyboard or exhaustive manual screen-reader swipe traversal.
5. Separately open the developer-only native QA project on 8090. Ready Days checks
   checkbox selection/speech; Error Profile shows retained draft/error; Busy Days/Profile
   disable repeat actions. Busy Profile reduced-motion indicator was checked using frame pairs before/after restoring the original animation preference. Sample UI never certifies an API save, account or enforcement.
6. In the actual Router, type a local quest draft, background/return, send the own-package
   `RUNNING_LOW` trim callback, and temporarily disable/restore radios. Verify input remains.
   Android Back opens confirmation; Back again keeps input; explicit discard exits. Force-stop
   only the development package and cold start: safe Home/unavailable is expected, not a
   restored unsaved draft. Metro over USB remains reachable during the radio toggle.
7. Restore exactly this run's baseline, including TalkBack Display speech output, services,
   font 1.15, stay-awake 0, timeout 600000 ms and both radios on. Preserve existing usage
   access `allow`. Remove only this task's reverse ports/XML and stop its two Metro servers.

## Actual results and limits

The structured record separates Router, isolated sample, automated and export
results. Full workspace check passed 382 portable, 518 native-component and 601 API
tests; 199 database tests were deselected, not rerun for JS-only changes. Focused
final tests passed 64/64. Web isolation/assets and production Android Hermes export
passed. Existing 11 lint warnings are outside changed files. The gallery build also passed with
existing dependency eval/chunk-size warnings. The isolated Profile Busy button had
385 changed pixels at normal motion, 0 with reduced motion, and 686 after restoring
the original preference, across separate frame pairs. Inspected crops show the
spinner hidden with reduced motion while Saving text remains; this verifies that
indicator on this device, not every animation/state.

RN10-D01/D02/D05/D06 now have bounded Android development-device evidence. RN10-D04's
read/permission scope was already accepted in RN-08d (`cadc91d`). Full RN-10 remains
open for joint Auth/account flows, iOS/VoiceOver, signed release, additional devices,
physical keyboard, complete manual traversal and asynchronous speech, exhaustive motion/state
matrices and true OS memory-pressure/process/offline integration. No enforcement,
real account save, credentials, cloud change or deletion was performed. Parent IDs
and 46/21/25 plan counts remain unchanged.
