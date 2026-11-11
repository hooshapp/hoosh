# RN-08 Android native intervention coordinator

**Owner:** Ishmum. **Date:** 2026-11-10. **Refs:** RN08-D01–D06.
**Scope:** Debug native coordinator and isolated QA consumer. Production Home keeps
its existing read-only adapter; Auth/tokens and Anisha's iOS remain deferred.
[Authorized defaults](../architecture/android-intervention-defaults.md) are
Ishmum-approved engineering decisions, not new PM responses.

## What is implemented

- Explicit compiled finite windows (maximum 32, each at most seven days), saved
  native selection revision/snapshot, per-owner installed revision CAS/readback.
- One atomic no-backup record for installation, app/reason allowances, daily
  per-app counters and an at-least-once event journal. Bound: 512 apps/counters/
  allowances, 256 unacknowledged events, 256 KiB serialized record.
- Elapsed timers with boot/wall guards, independent concurrent app sessions,
  saved-zone midnight/day buckets and first-extra-session exhaustion signals.
  Active sessions/counters survive compatible policy updates; changing time zone
  rejects explicitly until a migration exists. No silent budget reset.
- Preserve active occurrence app snapshots on an update with the same reason ID
  and start; future occurrences use the new explicitly supplied selection. A new
  start identifies a new occurrence. This is not a recurrence/template generator.
- Reason cancellation preserves unrelated reasons/allowances. Bypass covers
  only one app/current reasons; a new reason reuses remaining session time.
- Native lifetime handles: close a bridge or end an owner to invalidate stale
  writes. Retention preserves installed policy/event ownership. Failed erasure
  leaves old handles expired and new opens blocked until cleanup succeeds.
- User-enabled debug AccessibilityService receives window-package metadata only.
  It requests neither screen content nor gesture access. A scrollable native
  accessibility overlay offers Return home, Open anyway and Disable test access.
  It runs without an API/LLM/JS timer, uses system insets and removes on lock,
  foreign/host windows, revocation or teardown. Window reads are coalesced.
- Storage/journal failures do not fabricate saved choices or reward outcomes.
  If an explicit Open anyway cannot persist, disable test access and dismiss the
  pause with a fixed message rather than trapping the user. A full journal
  requires explicit drain/ack; do not silently discard accepted events.

No declared production capability is inferred from debug method presence. No
usage-threshold, advance-warning, weekly recurrence, reward/streak computation,
account deletion or signed/store acceptance is established by this coordinator.
Native facts are inputs to those feature producers, not awarded points.

## Reproduce builds and controller checks

Use the existing [toolchain setup](android-selection-preview.md). From repository root:

```sh
JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk apps/mobile/android/gradlew \
  -p apps/mobile/android :app:assembleDebug :app:assembleDebugAndroidTest \
  :hoosh-usage:compileReleaseKotlin :app:processReleaseMainManifest \
  -PreactNativeArchitectures=arm64-v8a --console=plain
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
adb install -r apps/mobile/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w -e probe interventionChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

The runner contains 50 planned cases: 44 pure controller/lifetime cases plus six
actual Android AtomicFile cases. Expect `interventionChecksPassed=50` and result
−1 **only after executing on the device**. It uses unique cache fixtures and
synthetic owners, removes its directory in finally and emits only a fixed
failure/case marker. JVM execution of the 44 pure cases is separate evidence;
it does not execute the Android persistence cases. Run original selection
lifecycle/draft/preview/discovery modes as native regressions after installation.
Current synthetic discovery has 11 cases. The actual narrow discovery diagnostic
intentionally returns `unsafe_manifest` (result 0, all inventory counts absent)
because this debug APK declares the intervention service. This expected refusal
is separate from the synthetic checks and is not a catalog-coverage pass.

The same 44 pure tests can run without a phone after the native build populates
the local Kotlin cache:

```sh
JAVA_HOME=/path/to/jdk17 npm run mobile:check-intervention-engine
```

The committed runner compiles the actual controller/lifetime/snapshot sources and the same
`InterventionEngineChecks.kt` used by instrumentation. It downloads nothing and
writes only ignored .expo output; this command is separate from Node-only CI.

## Actual device acceptance

1. Save a fresh private baseline: accessibility services/touch exploration,
   disclosure preference, font/power/timeout/usage access, reverse mappings and
   controlled owner A's saved selection. Preserve unrelated data/settings. Do not
   reuse old artifacts as this run's device evidence.
2. Start the existing developer host from `apps/mobile/dev/native`:
   `npx expo start --dev-client --localhost --port 8094`. Reverse just that port
   and use the URL in the preview runbook. Expo Go/release/iOS lack this producer.
3. In Saved apps editor, choose and Save **Disconnect test target**, a launcher
   activity supplied only by the separate test APK. Use only controlled test
   owner A; do not replace unrelated choices without restoring them afterward.
   No personal third-party app or account is necessary for acceptance.
4. Open **Android interventions**. Review access shows the native disclosure.
   Not now must leave access/installation unchanged. For acceptance, the owner
   reads and agrees, then enables only **Disconnect intervention test** in system
   Accessibility settings. Do not auto-grant access with ADB or bypass restricted
   settings. Return and refresh; permission alone must not create an installation.
5. Install ten-minute test. QA values: two overlapping reasons, 600/450-second
   windows, 15-second per-app sessions, two sessions/day, UTC. These are labeled
   test fixtures, not production policy defaults. Confirm native revision/counts.
6. Launch the owned target:
   `adb shell am start -n com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.InterventionFixtureActivity`.
   Require the actual branded overlay, both reasons and safe actions. Use Open
   anyway; target becomes visible and stays available until the native deadline.
   Reopening does not spend another session. Expiry while target is foreground
   prompts again; the first extra session emits the exhausted-allowance signal.
7. Cancel only the quest; the schedule remains. Stop all windows; target no longer
   prompts. Test fresh cold native reads, conflicting revisions/uncertain saves,
   lock/unlock, service revocation/re-enable, native overlay/Back/TalkBack focus,
   enlarged font and system bars. The decoder must not turn stale/invalid evidence
   into an armed/active claim. Capture only owned app/test-target windows.
8. Stop Metro and verify native expiry/pause without the server. Verify actual
   task removal separately if available. Android force-stop/revocation is not a
   persistence guarantee; never bypass Android's controls or call a task swipe
   a full process-death/reboot test. Record exact conditions and build tested.
9. Drain twice before acknowledging: event IDs remain stable. Acknowledge only
   received IDs; repeated acknowledgment is safe. Verify owner B cannot read or
   mutate A. End/retain invalidates old handles without clearing A's installed
   reasons or events; erase clears only A's coordinator after draining issued
   work. Global selection and Auth/server deletion are separate stores/actions.
10. Erase the local test installation/events, restore controlled selection and
    original disclosure/accessibility/power/usage/font/reverse settings, stop only
    the task-owned Metro and remove task captures/XML. Preserve app data/APKs.

Do not use UIAutomation hierarchy dumps while an accessibility service is being
tested: they can suppress the service and invalidate observations. Use known owned
window guards and private captures/OCR, plus owner-observed speech for audibility.
Before and after any private capture, require an unlocked device, exact focused
owned UID, visible/on-screen owned window, unchanged focus token and no visible
launcher application/overview. A focused-package report alone is insufficient:
Android may retain it during Overview. Distinguish system taskbar/navigation by
window type and crop system bars; discard ambiguous bytes before saving/OCR.
Keep inventory/captions/screenshots/serials and credentials out of Git. No locked
or foreign-app screenshot is acceptance evidence.

## Recorded checkpoint

See the historical [implementation evidence](../core_plan_implementation_notes/artifacts/rn-08-interventions/evidence.json),
new [device acceptance evidence](../core_plan_implementation_notes/artifacts/rn-08-intervention-acceptance/evidence.json)
and latest [Plan 04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).
Both the physical Pixel 8 Pro/API 36 and isolated AOSP API 36 ARM64 emulator ran
46 intervention + 17 lifecycle + 22 draft + 12 preview + 11 synthetic discovery
checks (108 each). Actual manifest refusal is expected as described above.

Both targets passed actual native installation/pause, running-session reuse,
foreground expiry, permitted versus extra sessions, precise cancellation and stop.
The emulator also passed screen-off removal/unlock return, Back/Return home and
native pause/bypass/expiry with Hermes explicitly paused and resumed. The phone
passed enlarged-text (1.6) pause/disable, actual revocation and needs-permission
status with retained installation. Native disclosure-to-Settings handoff was
fixed and observed on both. Only the owned test APK target was configured.

Phone baseline files, accessibility/touch settings, font/power/timeout/usage and
reverse mappings were verified restored; local test owner erased, captures removed,
owned Metro stopped and isolated emulator shut down. The APKs and unrelated app
data remain. No TalkBack change was made in this acceptance run.

This is bounded debug acceptance. Production Auth-bound adapter integration,
iOS, new-service TalkBack, actual Metro-stopped/task-removal/process/reboot,
re-enable/failure UI matrix, other devices/profiles, performance and signed/store
acceptance remain open. The earlier root check is historical; the follow-up rebuilt
native debug/test APKs and reran actual Android suites, without rerunning the
unchanged shared/component/API/export suites. Full RN-08 stays open.


## Lifecycle recovery and shared-reader continuation

The continuation after `696eec1` adds an explicit-owner, read-only snapshot adapter.
`interventionProtectionRead` returns one native actor read in the existing shared
capability/authorization/status shape. Its decoder rejects contradictions and
strips extras; disposal rejects pending/new reads without clearing native rules.
Future/expired windows are inactive. The QA host reuses the existing status card,
but a positive matched revision requires explicit install/cancel intent in that
host session. Reopening with only a stored native revision remains unknown. The
normal app's adapter registration and Auth/root are unchanged. `LocalRuleSpec`
recurrence writes still require a policy compiler; the finite-window API is not
silently substituted for that interface.

The host now provides **Remove this test host task**, implemented with Android's
[finishAndRemoveTask](https://developer.android.com/reference/android/app/Activity#finishAndRemoveTask()),
and **Interrupt accessibility feedback**. Both are debug-only; task removal is not
a force-stop, process-death or reboot guarantee. The footer accurately labels this
page as a local test installation. Windows are now labeled ten-minute / 7.5-minute
fixtures so manual checks can finish; sessions remain 15 seconds/two-per-day UTC.
Earlier two-minute acceptance above remains historical.

For actual task acceptance, install a fixture, remove the host task, verify the
host Activity is absent without capturing Home/Overview, launch only the owned
target and require native pause. Relaunch the host, read the same plan/revision,
then verify the shared card does not invent the lost desired UI intent. Revoke
using the native Disable action, require needs_permission and retained plan, then
review the same disclosure/re-enable in Settings. Wait for service binding and a
fresh target foreground event before accepting a resumed pause. A settings switch
alone is not a binding/overlay barrier.

For actual Metro independence, install a fresh fixture, launch the owned target,
start a session, stop only the task's Metro and verify its localhost port closes.
Require native expiry and another native bypass while that server remains absent.
Restart the same owned Metro only if needed for later setup/cleanup. JavaScript
paused and Metro stopped are different test conditions; neither is a reboot test.

### Feedback interruption regression

Android's [onInterrupt](https://developer.android.com/reference/android/accessibilityservice/AccessibilityService#onInterrupt())
interrupts accessibility feedback. This service emits no speech/haptics; clearing
its tracked foreground app there lost expiry after a feedback interrupt. The
callback now leaves tracking/policy intact; actual service/permission/window/lock
cleanup remains independent. No screen/window-content retrieval was added.

To reproduce the native boundary with TalkBack enabled, launch the owned target,
activate Open anyway, then request `interventionInterruptFeedback` through the
attached developer host's native bridge while leaving the target foreground. In
its attached JS console, the debug-only call is:

```js
globalThis.expo.modules.HooshUsage.interventionInterruptFeedback()
```

Require the native pause after the existing session deadline. Merely bringing the
host forward to tap its feedback test button and relaunching the target does not
reproduce a foreground-tracking loss; record the actual condition. This diagnostic
operation interrupts feedback of enabled services, so use it only in the agreed
local acceptance session and restore the original settings. It does not revoke a
service or cancel an installed rule. All 12 debug method registrations and the
snapshot implementation are absent from release classes.

Final target-specific results, exact APK/source fingerprints, owner-observed speech,
rejected attempts, cleanup and remaining gates are in the latest Plan 04 entry and
[continuation evidence](../core_plan_implementation_notes/artifacts/rn-08-lifecycle-reader/evidence.json).


Current continuation acceptance: both Android targets pass 50 intervention + 17
lifecycle + 22 draft + 12 preview + 11 synthetic discovery checks (112 each).
Both pass host-task removal/relaunch, retained permission revoke/re-enable and
Metro-stopped native expiry/bypass. Pixel owner confirms TalkBack speech/traversal
and Open anyway/Return home; the final Return home matches a native quit event.
The feedback-interruption regression is reproduced before/fixed after on Pixel.
The phone baseline and exact known test files are restored, test service/TalkBack
off, captures removed, owned Metro stopped and isolated emulator shut down.
Production/Auth/iOS/recurrence/write integration, signed/store review, process
death/reboot, other device/profile/performance and exhaustive accessibility/failure
matrices remain outside this bounded acceptance. Full RN-08 stays open.
