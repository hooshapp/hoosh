# Normal account app and Android weekly protection

**Owner:** Ishmum. **Date:** 2026-11-14. **Refs:** RN-04/05, RN08-D02–D05,
RN09-D04/D05 and RN09D-D02. Original IDs and parent acceptance gates stay intact.

## Implemented flow

The normal `src/app/_layout.tsx` mounts the existing `AppSessionBoundary`. The one
Supabase SDK/session port feeds `AccountDataProvider`; `/v1/me` must verify the
same account before `NativeOwnerBoundary` supplies a native owner. The new
`AccountWeeklyPlanBoundary` sits inside those boundaries, above the real Router.
It has one controller per verified account/generation, shared by tabs and details.
No developer host, synthetic owner, fixture login or second session manager is
introduced into the product. Anisha retains signup/providers/onboarding/iOS.

Home retains its existing account rewards/Dino, History, recommendations and
installed native status. **Manage app schedule** opens normal Settings. Settings
retains profile, sign-out, activities and the existing saved days/hours/sessions
editors; it adds native selected-app counts and weekly-plan controls.

1. Open **Distracting Apps**, choose apps and explicitly Save. The picker stages
   choices; Save updates device selection. Neither action installs protection.
2. Save complete draft days, hours, explicit IANA zone and session allowances in
   their existing editors. Missing/cleared drafts stay missing. A retained device
   schedule is never silently used instead of the saved account draft.
3. **Preview saved plan** compiles upcoming times without a native write.
4. **Review app protection access** shows the existing native disclosure/Settings
   handoff. The device owner chooses whether to grant access. Permission alone
   does not apply a plan.
5. **Apply saved plan**, **Apply saved plan changes** or **Resume saved plan**
   explicitly installs the latest confirmed account draft plus the saved native
   selection. Native revision/selection CAS and independent readback must agree.
6. **Stop weekly plan** explicitly stops only weekly protection. It retains draft,
   allowance history and unrelated quests. It remains usable without account API
   connectivity and when selection-summary reading fails, provided the device
   confirms the reviewed weekly installation.
7. An unreadable device owner has **Use this account on this device**, with a
   confirmation. Claim stops a previous account's local rules and retains private
   history; no account is deleted and no plan automatically resumes. Ordinary
   sign-in, reads, editor saves, navigation and account switches never claim/apply.
8. Sign-out immediately hides private routes and retires native handles/drafts;
   already installed rules retain their existing explicit-Stop policy. Coordinate
   real managed-account/platform acceptance with Anisha before shipping.

## Recovery and isolation

- Apply/Preview read canonical settings at tap time, not just a rendered query
  snapshot: an editor save can precede React Query's batched observer update.
  Offline, paused, failed, missing or still-fetching settings cannot install.
- One native controller survives tab/detail navigation. Production status reads
  use `selectionRead`, avoiding temporary picker drafts during routine polling.
- Unknown/uncertain writes never replay. Explicit refresh reconciles a committed
  result or a different confirmed installation before allowing another decision.
- App selection failure is distinct from a confirmed empty selection; it disables
  Apply but does not hide an independently readable installed Stop.
- Background observations become stale; foreground/native boundary refreshes
  re-read device facts. Account/generation replacement disposes old work and
  leases; late acknowledgments cannot install using the next account's draft.
- Existing quest-only native records coexist with weekly plans; unrelated finite
  diagnostic installations remain incompatible. No recurrence, reward, calendar,
  timezone-migration or enforcement policy is redefined by this wiring.
- Older Android bridges without the complete weekly method group keep quest and
  selection support; weekly controls report unavailable. iOS has no success stub.

## Repeat the checks

```sh
npm run check
npm run mobile:export
npm exec --workspace @disconnect/mobile -- expo export --platform android --output-dir /tmp/hoosh-normal-app-android-export
JAVA_HOME=/path/to/jdk17 npm run mobile:check-intervention-engine
JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk apps/mobile/android/gradlew \
  -p apps/mobile/android :app:assembleDebug :app:assembleDebugAndroidTest \
  :hoosh-usage:compileReleaseKotlin :app:processReleaseMainManifest \
  -PreactNativeArchitectures=arm64-v8a --max-workers=4 --console=plain
adb -s YOUR_OWNED_EMULATOR install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
adb -s YOUR_OWNED_EMULATOR install -r apps/mobile/android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb -s YOUR_OWNED_EMULATOR shell am instrument -w -e probe interventionChecks \
  com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

The installed Expo dependencies require compile SDK37. This run restored incomplete
local official SDK archives, JDK17 and symlink metadata; no dependency/build-target
change is committed. Native tests use synthetic cache/unique-owner storage and
clean it in `finally`. Use an owned emulator rather than replacing a user's build.

## Observed acceptance and remaining gates

Normal-root tests mount the actual root, tabs, Home/Settings/History and detail
routes with the existing session implementation and synthetic SDK/API/native
edges. Fourteen cases run under both native renderers: verified identity gate,
normal composition/navigation, save-then-Apply, offline Stop, committed/rejected
write recovery, explicit takeover/cancel, account-switch fencing, old bridge,
selection read failure, cleared draft, sign-out and permission reconciliation.
Android bridge tests check real wrapper forwarding and missing weekly methods.
These are component/protocol checks, not real managed Supabase sign-in evidence.

The rebuilt default-SDK37 debug app/test APK and release Kotlin/manifest compile.
Owned API36 emulator reports `interventionChecksPassed=146`, result `-1`; pure JVM
reports117. This includes the new quest-only compatibility case, existing weekly/
quest overlap/Stop preservation, calendar/DST/session/reward and isolated storage
regressions. It does not claim a newly observed native pause from the normal root.
The owned emulator is stopped afterward. Connected phone, permissions, TalkBack,
credentials, hosted users and database are unchanged.

Full checks:553 portable,803 component(+2 existing skips),682 API, types/lint/
contracts/assets; four existing lint warnings, zero errors. Web export/isolation
38files/71original SVGs and normal Android Hermes export pass. No backend/DDL
changed; real PostgreSQL suite was not rerun for this frontend/native slice.

Still pending: current managed-account phone SDK/profile/settings and A/B isolation
journeys, Anisha's final Auth/onboarding review and iOS integration, signed/store/
wider-device/true memory-pressure matrices, hosted disposable deletion and the
user-deferred further TalkBack pass. Plan03/API-10, RN-06/07/11 and full Plan04 do
not become complete from this implementation. Read the
[Plan04 notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
and [weekly native runbook](android-weekly-schedule.md) for historical real-device
Apply/pause/Stop evidence and its exact build/scope boundaries.
