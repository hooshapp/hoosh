# RN-08 / RN-09 — Weekly plan activation

**Owner:** Ishmum. **Date:** 2026-11-10. **Parent:** `0f30ae9`.
**Refs:** RN08-D04, RN09D-D02; existing part IDs retained.

Complete saved `PlanDraft` values now have an explicit-owner consumer and native
weekly compiler. The existing native developer host composes the consumer with
synthetic local owner A. Main account/root/Auth wiring and iOS remain deferred.
This is a real local installation flow; it is not a connected production account.

## Behavior and trust boundaries

- The existing schema supplies Monday=0 weekdays, local HH:mm times, explicit
  next-day flag and IANA zone, per-app sessions/day and minutes/session. Incomplete
  drafts remain valid for storage; activation requires all fields, at least one
  weekday and a coherent positive range. Equal times do not mean all day.
- Preview invokes native calendar compilation without a lease/write. Apply/Update/
  Resume uses native selection and installed revision CAS plus independent exact
  spec/revision/selection readback. No server draft acknowledgment is installation
  evidence; fields and Preview never install. Errors retain raw edits and require
  explicit refresh/review before another write. No automatic replay.
- A selected day owns its start. Overnight ends on the next local date. Intervals
  are half-open. Gaps clamp to first valid instant, collapsed intervals/dates skip;
  repeated starts use earlier offset and repeated ends later offset, once. Read
  the [authorized engineering choices](../architecture/android-intervention-defaults.md#weekly-plan-activation-continuation--2026-11-10).
  These implement the requested flow, not additional PM answers.
- Native v2 atomically persists the weekly definition, app snapshot, enabled flag,
  windows and existing session/day/event record. It reads v1 finite records and
  upgrades on the next accepted write. Older binaries cannot read v2: preserve
  data and avoid downgrading over retained records. App/account data erasure is
  not a generic rollback.
- Recurrence resolves locally on demand from the persisted definition. Preview
  includes yesterday through seven start days ahead, omitting ended intervals;
  that bounded preview is not an installation expiry. No JS/network renewal job.
  Supported compilation dates are 1970–2100. Android service/force-stop limits
  still apply; no tamper-proof or OS-wide reliability promise.
- Updating selection preserves an active occurrence's app snapshot; future
  occurrences use the newly applied selection. Explicit schedule edits replace
  the schedule on Update; they do not imply quest editing/completion behavior.
- Stop retains settings/daily counts/running session history, disables recurrence
  and clears grants/windows. Resume requires explicit action/new revision. Policy
  time-zone changes still reject until explicit local test reset; Stop alone never
  resets allowance history. Production zone migration remains separate.
- Permission/unlock, native selection revision/eligibility and owner/install
  revision are checked natively. A weekly Apply refuses an unrelated finite test.
  Stop only accepts the caller's reviewed weekly installation. Missing modules,
  invalid zones, stale/wrong-owner writes, invalid readback and cleanup ambiguity
  never fabricate successful installation. Owner keys are lifetimes, not Auth.

## Reproduce

Use the toolchain/build setup in [intervention runbook](android-interventions.md).
Java-time APIs use Android core-library desugaring (Google's pinned
`desugar_jdk_libs:2.1.5`); minSdk remains 24. Native compiler runs on JVM and actual
Android, separately from portable/client/component checks.

```sh
JAVA_HOME=/path/to/jdk17 npm run mobile:check-intervention-engine
JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk apps/mobile/android/gradlew \
  -p apps/mobile/android :app:assembleDebug :app:assembleDebugAndroidTest \
  :hoosh-usage:compileReleaseKotlin :app:processReleaseMainManifest \
  -PreactNativeArchitectures=arm64-v8a --console=plain
adb -s YOUR_AUTHORIZED_DEVICE install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
adb -s YOUR_AUTHORIZED_DEVICE install -r apps/mobile/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb -s YOUR_AUTHORIZED_DEVICE shell am instrument -w -e probe interventionChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

Current JVM runner: **68** pure cases (44 previous + 24 weekly calendar/engine).
Android intervention runner: **77** (68 pure + nine actual AtomicFile cases).
Expect `interventionChecksPassed=77`/result −1 only after actual execution. Native
selection regressions remain 17 lifecycle / 22 draft / 12 preview / 11 discovery
self-checks, **139 per target** with intervention cases. Actual narrow discovery
still refuses the service-declaring manifest (`unsafe_manifest`, null inventory,
result 0); that refusal is expected and not a ready-catalog pass.

Start Metro from `apps/mobile/dev/native` with
`npx expo start --dev-client --localhost --port 8094`; use a scoped USB reverse and
existing development-build URL. Expo Go/release lack the native weekly methods.

1. Save a fresh private baseline and back up only the known controlled-owner files,
   including base/sidecars, using the existing intervention cleanup protocol.
2. Use the native saved-app editor to choose only **Disconnect test target** from
   the separate test APK. Save explicitly. In **Android interventions**, review
   disclosure and enable only the named test service under the owner's explicit
   authorization. Permission alone must leave no installation.
3. Open **Weekly schedule**. Choose scheduled apps opens the same native editor;
   Back/Cancel must preserve saved installation and unfinished form input. Supply
   complete days/hours/zone/session values. Example: UTC, today's start weekday,
   start two minutes ago/end fifteen minutes ahead, two sessions/day and one
   minute/session. Explicitly confirm overnight if crossing the date boundary.
4. Preview: require calendar output and absent coordinator installation. Apply:
   require confirmed spec/selection and revision 1, then launch only the owned
   target and require actual pause. Open anyway records one configured session.
5. Change sessions/day and Update: require revision 2, new policy and retained
   daily/session state. Stop: revision 3, retained spec/history, disabled recurrence
   and no pause over the target. Resume: explicit new revision, no automatic action
   merely from reopening the screen.
6. To test an actual end boundary, explicitly shorten the end to a nearby future
   minute, Resume/Update and require pause before end. Keep the owned target
   foreground through the deadline; require pause removal without a Stop command.
   Stop explicitly afterward. Calendar/DST/week cases use injected clocks; do not
   call those actual week-long or real DST observation.
7. Remove the owned host task, relaunch and open Weekly schedule. Require unchanged
   stored stopped spec/revision/history and restored fields, without re-Apply.
   A task removal is not OS process-death, reboot or force-stop acceptance.
8. Stop/erase only the controlled test coordinator; disable the exact service using
   its native action. Restore exact backed-up files/settings after stopping the
   owned app so preferences do not overwrite restoration. Verify service/touch,
   font/power/timeout, usage access and reverse baseline. Remove task-only captures,
   XML and cache backups, stop owned Metro and shut down only the owned emulator.
   Preserve APKs, unrelated data, credentials and any unrelated services.

Use explicit device serials privately. Require an unlocked, visible owned window,
exact owned UID, no visible launcher application/overview, and unchanged focus
before/after every capture. Crop system bars/taskbar. Never dump UIAutomation while
accessibility is active. A missed tap, foreign foreground, development page reset
or offscreen message is a rejected attempt, not a runtime success/failure claim.

## Accepted evidence and limits

Both Pixel 8 Pro/API 36 and isolated AOSP API 36 ARM64 emulator passed 139 native
checks and the real Preview/Apply/pause/session/Update/Stop flow. Phone additionally
passed Resume and actual end-boundary removal; both passed saved-app editor return
and stopped-template restoration after host task removal/relaunch. Exact final
fingerprints, rejected attempts, counts and restoration are in the
[sanitized record](../core_plan_implementation_notes/artifacts/rn-08-weekly-schedule/evidence.json)
and [Plan 04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

No new TalkBack gesture/speech run, API24/25 runtime, other devices/profiles,
week-long execution, true OS process/reboot, production Auth/root/Settings binding,
generic recurring LocalRuleSpec/quest lifecycle/event adapters, reward/streak
producer, history-preserving timezone migration, signed release/store review or
performance SLA is established here. Earlier bounded TalkBack/Metro/lock evidence
remains linked to its earlier fingerprints. Full RN-08/Plan 04 remain open.

Primary references: [Android desugaring](https://developer.android.com/studio/write/java8-support),
[Google library changelog](https://github.com/google/desugar_jdk_libs/blob/master/CHANGELOG.md),
[Java zone rules](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/zone/ZoneRules.html).
