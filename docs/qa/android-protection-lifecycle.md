# Standalone Android protection lifecycle — RN10-D06 / RN08-D06

Ishmum, 2026-11-15. Branch `task/react-native/android-protection-lifecycle`,
base `41d8da8`. The requested independent optimized-native gap pass is complete.
This is owned-emulator evidence for an internal debug-certificate-signed R8 app;
store, personal-device/OEM and managed-account acceptance remain separate.

## Gaps targeted

| Existing evidence retained | New evidence in this pass |
|---|---|
| RN09B-D04a/b debug quest offline reboot, allowance expiry/process kill and screen-off/wake | Optimized standalone native weekly protection with no Metro/API; running allowance across SIGKILL/reboot |
| Debug weekly Apply/task removal and physical offline Stop | Optimized Accessibility revocation/re-enable, native Disable access and network return |
| Six standalone read-only registration/packaging checks and account-gate cold/background/offline start | Actual native pause/allowance in that exact standalone APK, plus explicit Force stop limitation/recovery |

No complete UI, Auth, database, device-state or accessibility suite was repeated.
The six smoke checks ran on the newly used API 30 runtime; they are distinct from
its live protection observations. TalkBack remains user-deferred.

## Exact runtime and setup boundary

Android 11/API 30 Google APIs ARM64, fresh owned AVD,360×640 dp. The exact internal
APK hash is `e045befc5b5b469de7dc764ef0caee2ae1ef52fbace7ff3f2388a3c14885f22c`.
Its original build report/source provenance is retained in the
[evidence](../core_plan_implementation_notes/artifacts/android-protection-lifecycle/evidence.json).
Native production sources match standalone commit `515cf7d`; this task changes
only test code, test-runner selection and documentation. No production keep rule,
native bridge method, account bypass, dependency or APK behavior was added.

The separate test APK supplies a plain-Java synthetic target and initializer.
It refuses non-emulator hardware, debuggable target apps, wrong explicit
confirmation and any existing native installation directory/fixture marker.
Wrong-confirmation and existing-state refusals were actually run; the latter
preserved the state bytes. Forbidden real-hardware/debug-app negative runs were
not performed. Fresh AVD/no existing package is a separate mandatory operator guard.

The initializer directly seeds native v4 data and synthetic disclosure acceptance.
**It does not test production disclosure, Apps selection, Schedule/Apply, SDK
identity or server persistence.** Only the synthetic test package is selected.
The UTC weekly template selects all weekdays, starts five minutes before setup
and ends 45 minutes ahead; it recurs daily until cleanup. It is not a globally
self-expiring test. Policy is three sessions/day, 120 seconds/session, solely to
observe recovery. Those numbers are fixture settings, not new product defaults.

## Observed outcomes

| Condition | Actual result |
|---|---|
| Both networks off, host JS unopened, target window entered after service binding | Native Disconnect pause appears; revision 1, daily count 0; Android has no active default network. |
| Open anyway then exact owned process SIGKILL | New process/service; fresh target entry retains the same session ID, wall/elapsed deadlines and daily count 1. No new allowance or deadline reset. |
| Reboot while that deadline is still in the future | Offline target reentry pauses again: boot-bound allowance no longer authorizes entry; stored session and daily count 1 remain. No budget reset. |
| Revoke Accessibility while pause visible | Overlay/service disappear, target usable; native weekly record, revision, budget and business outbox remain. |
| Explicitly re-enable service, then reenter target offline | Pause returns with same revision/budget/outbox. Binding alone does not invent a missed foreground event. |
| Native Disable app protection button offline | Access/pause removed; saved weekly rules retained rather than misreported as enforcement. |
| Android Force stop, then reopen only the test target | Package is stopped, service unbound, no pause; saved rules remain. This is different from SIGKILL/rebind. |
| Explicit launch of Hoosh after Force stop | Stopped flag clears, but this API 30 service did not rebind from launch alone. Explicit access off/on plus target reentry restored the pause. |
| Wi-Fi/data return | Pause and revision/budget/outbox remain; no Apply/reinstall or backend delivery needed. |

Native coverage remained false across observed gaps. Retained business events are
not delivered-server receipts or awarded credits. Before the explicit Force stop
recovery launch, no normal host/React activity was opened. That launch loads the
normal account gate; no sign-in or account journey was performed.

Initial rejected attempts are not passes: a target event preceded initial service
binding; the focus helper queried an API 30 window dump without current focus;
PID polling initially rejected the expected temporary no-process interval; and
ADB dropped an empty settings value. Corrected helpers required a new owned
window event, current focus/UID checks, tolerant PID absence and explicit settings
delete. A controlled repeat kill passed on the same allowance. No product service
change was made to conceal an OS or harness outcome.

## Reproduce without accounts

1. Create a fresh task-owned ARM64 emulator. Verify its exact AVD name and that
   neither the app nor its test package already exists. Stop if either exists;
   never uninstall/clear another user's data to force a pass. Save current network,
   accessibility, text, reverse and device settings. Use explicit emulator serials.
2. Use the existing standalone artifact/report/mapping and six read-only smoke
   command from [the standalone runbook](android-standalone.md). Do not rebuild
   the normal app with a test route or Auth bypass.
3. Build the separate initializer APK using the existing JDK17/SDK:

   ```sh
   apps/mobile/android/gradlew -p apps/mobile/android :app:assembleDebugAndroidTest \
     -PhooshStandaloneLifecycle=true -PreactNativeArchitectures=arm64-v8a
   adb -s emulator-5558 install -r apps/mobile/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
   adb -s emulator-5558 shell am instrument -w \
     -e ownedEmulator I_ACCEPT_SYNTHETIC_FIXTURE \
     com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.StandaloneLifecycleFixture
   ```

   Require `standaloneLifecycleFixture=prepared` and result −1. The initializer
   cannot safely rerun over its marker; use only a new disposable AVD if needed.
   AGP registers its selected runner: default remains UsageProbeInstrumentation;
   `hooshStandaloneSmoke=true` selects the separate read-only runner, and
   `hooshStandaloneLifecycle=true` selects this initializer. Do not combine flags.
4. On the owned emulator only, enable the exact protection service and use the
   synthetic activity
   `com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.StandaloneLifecycleTargetActivity`.
   No usage-access grant is needed for this overlay test. A personal phone would
   require its owner's real in-app disclosure/Settings action instead.
5. Exercise the table above. Kill only the verified numeric PID of the owned app;
   record the changed process separately from Force stop/package-stopped state.
   Read only this synthetic native state for aggregate counters/retained deadlines.
   Never inspect account stores, personal inventories or other app content.
6. Do not use ordinary UIAutomation/hierarchy dumps while protection is active;
   default automation can suppress the service under test. Use guarded owned-window
   screenshots and actual native readback. Capture only unlocked target/pause windows
   whose UID/focus is verified; stop on foreign/locked foreground. No speech test.
7. Disable the test service, restore exact saved settings, remove task reverse
   mappings, stop the owned app/emulator and discard only its fresh AVD/definition.
   The recurring native fixture must not be left running.

## Verification and remaining scope

Fixture/test APK compilation and six read-only optimized native checks pass.
Both guard refusals and the live table above pass. Default test-manifest generation
still selects UsageProbeInstrumentation. Six existing public-config Node tests pass.
No mobile/backend test rerun is inferred: production runtime code was unchanged.

All six saved network/accessibility/font settings match their baseline; no bound
protection service or reverse mapping remained before shutdown. The owned emulator
stopped and its fresh AVD/definition were removed. No physical device, hosted/local
account, API/Metro service, credential or database was changed.

Remaining: actual OS low-memory-killer and OEM battery/standby cases; wider/API 24/
API 36/store-signing matrices; normal account-root selection/Apply/Stop/SDK journeys;
Anisha's Auth/iOS and deferred speech. This closes this requested independent pass,
not all RN10-D06/RN08-D06 or Plan04 acceptance. Normal app Stop is not established by
seeded files or the native Disable-access button; prior debug offline Stop evidence
keeps its original scope.

Android references: [UiAutomation service-suppression flags](https://developer.android.com/reference/android/app/UiAutomation#FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES)
and [the intended stopped-package state](https://developer.android.com/about/versions/15/behavior-changes-all#stopped-state).
The API 30 Force stop result above is an observation, not a claim that every Android
version or OEM restores its service identically.
