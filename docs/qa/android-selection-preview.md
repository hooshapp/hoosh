# Android temporary app-selection preview

**Plan:** existing RN08-D03 / RN-09f, Ishmum, 2026-11-09.
**Commit:** `feat(android): add volatile native app-selection preview` (resolve in Git).

This is a developer-only native chooser, following the [discovery probe](android-selection-discovery-probe.md).
It discovers current-profile launcher candidates with the existing narrow debug
manifest query. It does not create a product/account selection or block an app.
Auth/tokens remain user-deferred; iOS belongs to Anisha.

## Run

1. Use the toolchain/setup in the discovery runbook. From `apps/mobile/android`,
   build `./gradlew :app:assembleDebug :app:assembleDebugAndroidTest
   :hoosh-usage:compileReleaseKotlin -PreactNativeArchitectures=arm64-v8a`.
   Do not enable the no-query baseline property for the picker.
2. Install the two debug APKs with `adb install -r` (preserve app data).
3. From `apps/mobile/dev/native`, run
   `npx expo start --dev-client --localhost --port 8094`.
   Reverse only this task's port: `adb reverse tcp:8094 tcp:8094`.
4. Open the development client with
   `exp+disconnect://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8094`.
   Choose **Android selection preview**, then **Choose apps temporarily**.
   Expo Go has no preview module and shows an explicit disabled fallback.
5. Search/toggle native checkboxes. **Use temporarily** replaces only the current
   QA owner's native-memory selection and returns `{selectionRevision,
   selectedAppCount}`. Cancel/Back leave that confirmed memory unchanged. Clear
   checks edits the draft until confirmation. An unchanged confirmation does not
   increment the revision. Search hides rows without discarding checked choices.
6. Reset or leave this QA screen: its owner is released and memory cleared.
   Background cancels a pending chooser; activity/module destruction clears it.
   A process restart cannot restore it. This ephemeral owner is not an account,
   authorization credential, persistent group or production rule.

## Implementation boundaries

- Candidate package names, labels, icons, checked sets and search stay native.
  Labels fall back to native package text on a resource failure. Locale sorting
  uses package identity only as a native tie-breaker. JS receives count/revision
  only; native error codes/messages are fixed and UI errors are normalized.
- Own app, disabled/nonexported entries and cross-profile candidates are excluded;
  launcher entries are deduplicated by package. This is not an inventory of every
  installed app. Confirmation requeries eligibility and checks unlocked state;
  unavailable candidates reject confirmation without changing previous memory.
- Discovery/labels/icons/revalidation run on one worker; view/session changes run
  on the main thread. Icons use a 16-entry cache. Late callbacks are canceled or
  ignored; JS separately fences stale reads/unmounts and prevents double opening.
- A full-height native window uses scrollable header/list regions, native checkbox
  semantics and fixed actions above system/IME insets. The initial AlertDialog
  prototype clipped actions on the actual device and was replaced before commit.
- Debug/release factories keep picker/catalog/model implementation and preview
  method registrations out of release. The production ProtectionService, Apps
  route and capability summary still report selection unavailable. No dependency,
  permission, manifest, account database or iOS/Auth change is added here.

## Verification and safe recording

Run `npm run check`, `npm run mobile:export`, `npm run mobile:ui:build` and the
native builds. The Android production Hermes export must exclude the QA marker;
inspect compiled release classes/method registrations and the release manifest,
not just JS imports. For on-device synthetic native checks:

```sh
adb shell am instrument -w -e probe selectionPreviewChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
adb shell am instrument -w -e probe selection \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

The first runs 12 volatile-session cases; the second preserves 10 discovery
regressions using the extracted debug catalog. Instrumentation runs use the app's
context; shell inventory queries are not discovery evidence. No owner identities
are emitted. Component tests cover count decoding, native absence, busy/cancel/
errors, old read fencing and unmount/foreground cleanup on both native presets.

Record only static control states/counts, sanitized failures and settings cleanup.
Do not commit installed app names/package IDs, raw device logs, serials, account
information or an unredacted app list. Check own-app focus and unlocked state
before UI inspection. Do not dump hierarchy while TalkBack is active. Restore the
current run's font, usage access, accessibility, keep-awake and USB baseline;
remove only task-created mappings/files/processes, without clearing app data.

See [sanitized results](../core_plan_implementation_notes/artifacts/rn-08-selection/preview.json)
and the final Plan 04 implementation entry for exactly observed cases and limits.

## Recorded phone scope (2026-11-09)

Pixel 8 Pro / API 36, debug development client: 14 normal-font flow observations
pass, including retained search checks, confirm/no-op revision, clear/cancel,
hardware Back, owner release/reset, background cancellation and usage denied.
Six enlarged-font observations pass at scale 2.0: cold reset, safe action bounds,
checkable rows, search via header scroll, no-match status/three actions with the
IME, and Back then Cancel. Normal scale 1.15 is restored. The final app/test APK
pair also passes 12 session and 10 discovery native cases. These are bounded
observations, not an exhaustive accessibility/device matrix. No new TalkBack
speaker observation was made in this run; native checkable flags do not prove
spoken traversal or post-dismissal accessibility focus.

## Next integration gate

Define native durable owner/group/revision and stage/commit/discard behavior before
connecting the real Apps editor. A QA confirmation is not a saved account preference
or installed rule. Persistent storage, account switch/sign-out/deletion cleanup,
product scope (global versus per quest), Auth/root wiring, real enforcement,
iOS, signed release and broader device/profile/accessibility matrices remain open.
Keep original RN08-D03/RN-09f and 46/21/25 parent counts.
