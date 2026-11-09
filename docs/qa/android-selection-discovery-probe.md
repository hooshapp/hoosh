# Android app-context discovery probe

**Part:** Plan 04 RN08-D03; supports later RN-09f. **Owner:** Ishmum.
**Date:** 2026-11-09. **Parent:** `9fda458`.
This implements the first probe in the [selection investigation](android-app-selection-investigation.md).
No picker, saved selection, usage ranking, restriction or Auth integration is added.

## What runs and where

`UsageProbeInstrumentation` accepts `-e probe selection`. The collector and its
synthetic checks live entirely in `app/src/androidTest`; DEX inspection confirms
their definitions are in the test APK and absent from the application APK. It
uses `targetContext`, verifies its UID matches the running process, rejects a
nondebuggable target, and never adopts shell permissions or uses UI automation.
[Instrumentation target context](https://developer.android.com/reference/android/app/Instrumentation#getTargetContext()).

The normal debug manifest declares only MAIN/LAUNCHER intent visibility for this
experiment. `-PhooshSelectionProbeBaseline=true` substitutes an equivalent debug
manifest without that query; unrelated debug overrides are preserved. Values other than explicit `true`/`false`, including an empty value, fail configuration.
Release/main/debugOptimized source manifests are unchanged. Processed release
manifest contains no launcher query. This is build/manifest evidence, not a signed
release APK test. [Android intent queries](https://developer.android.com/training/package-visibility/declaring).

The collector queries ordinary launcher matching activities in the app context,
filters own/invalid/disabled/nonexported/cross-profile candidates, and deduplicates
by package within the current profile. It does not filter every preinstalled app
out as a group. Returned counts describe visible candidates, never total installed
apps or selected apps. Package strings stay in local temporary collections.

Resource resolution samples at most **64** unique candidates, with deterministic
native package ordering; the full discovery counts are not capped. Only success,
failure and blank-label counts are emitted. `loadIcon` may provide a platform
fallback, so success is not proof that every original app icon exists. No bitmap,
label or package identity enters the result, a backend, or our logs.

Current lock/first-unlock state is checked before discovery and after resource
work. Locked/unknown/denied-query reads report null counts, not zero. Error codes
are fixed strings; exception text is discarded. A debug manifest containing broad
package visibility, overlay permission or an accessibility service is rejected.
Usage access is read separately; it is not requested or granted by the probe.

## Build both controls

Use the existing JDK 17 / SDK 37.0 / build-tools 36 / NDK 27.1.12297006 / Gradle
9.4.1 setup in [the Android runbook](android-capability-probe.md). From
`apps/mobile/android`, with `JAVA_HOME` and `ANDROID_HOME` configured:

```sh
# Baseline: no MAIN/LAUNCHER visibility query.
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest -PreactNativeArchitectures=arm64-v8a -PhooshSelectionProbeBaseline=true
mkdir -p ../.expo/selection-probe/manual/baseline
cp app/build/outputs/apk/debug/app-debug.apk ../.expo/selection-probe/manual/baseline/
cp app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk ../.expo/selection-probe/manual/baseline/

# Experiment: explicit query; leave ordinary build outputs in this default state.
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest :app:processReleaseMainManifest -PreactNativeArchitectures=arm64-v8a
mkdir -p ../.expo/selection-probe/manual/query
cp app/build/outputs/apk/debug/app-debug.apk ../.expo/selection-probe/manual/query/
cp app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk ../.expo/selection-probe/manual/query/
```

Inspect the APK manifests with `apkanalyzer manifest print`. Confirm query absence
in baseline/release, presence in debug experiment, identical requested permissions,
no QUERY_ALL_PACKAGES/overlay/cross-profile permissions, and no accessibility
service. Compare DEX hashes: application and test bytecode must each match between
the two debug controls. Compare XML contents without relying on element order.
Inspect defined DEX classes separately: selection probe/check definitions belong
only to the test APK. The committed [build/device evidence](../core_plan_implementation_notes/artifacts/rn-08-selection/discovery-build.json)
records hashes and exact results. APKs remain ignored; do not commit them.

## Execute under the app UID

Connect exactly one authorized, owner-unlocked Android phone. Install only the
known development application/test APKs with `adb install -r`, never uninstall or
clear app data. Instrumentation replaces the running development-app process;
it does not require Metro, an API, account tokens or a foreground activity.

From the repository root:

```sh
adb install -r apps/mobile/.expo/selection-probe/manual/query/app-debug.apk
adb install -r apps/mobile/.expo/selection-probe/manual/query/app-debug-androidTest.apk
adb shell am instrument -w -e probe selection com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

Expect `selfChecksPassed=10`, a JSON `selectionProbe`, and instrumentation code -1.
Require JSON `state: ready` before accepting visibility/resource observations.
An OK instrumentation finish with `state: locked` or `unavailable` is diagnostic
output, not a passed discovery run. Self-check failure reports a fixed error and
canceled result. Empty successful discovery has actual numeric zero counts.

To repeat denied-usage-access comparison, record the current mode for **this dev
package** using `adb shell cmd appops get com.hoosh.disconnect.dev GET_USAGE_STATS`.
Temporarily set it to `ignore`, run baseline and query, and restore that exact
recorded mode in a `finally` block even if install/test/parsing fails. Do not assume
it was default or grant access as a prerequisite. Both variants share the same
package identity; `install -r` preserves its existing data. Never change another
package's access, device lock, global developer/security settings or accounts.
Do not copy serials, inventories, raw logcat or exception traces into evidence.

The default instrumentation invocation (without `probe=selection`) and existing
`emptyWindow` option retain their original usage-reader behavior. Regression-check
that its capabilities still report unavailable selection/unsupported protection,
null installed revision and no installed reasons.

## Synthetic checks

The ten Android cases run before every selection observation, using fabricated
candidates instead of the owner's catalog: genuine empty result; duplicate/self/
ineligible filtering plus output privacy; metadata sampling cap; partial label/icon
failures without exception leaks; initially locked; unknown lock state; lock during
work; query denial; wrong target UID; nondebuggable target. Resource failures do
not masquerade as a failed full catalog, while failed/locked reads never become
empty success. These checks are executed on Android, not mocked JS assertions.

## Actual Pixel results

Pixel 8 Pro / Android API 36, local debug app/test APKs, current-profile scope.
Ten synthetic cases passed in each of three accepted runs (30 case results).
Final default APKs were installed/retested after their final rebuild and hashes
are tied to the artifact. All results are aggregates; no installed-app names or
identifiers were exported.

| Run | Usage authorization | Matching activities | Unique eligible candidates | Resource samples | Label/icon failures |
|---|---|---:|---:|---:|---:|
| Baseline, no launcher query | denied | 54 | 53 | 53 | 0 / 0 |
| Scoped MAIN/LAUNCHER query | denied | 185 | 183 | 64 (capped) | 0 / 0 |
| Scoped query, restored original mode | authorized | 185 | 183 | 64 (capped) | 0 / 0 |

Baseline is not expected to be zero: automatic/dependency visibility already
exists. The controlled query increased visible candidates on this device without
usage access. It does not prove every installed app, managed/private profile,
manufacturer or API level is covered. Observed elapsed times are recorded per run;
there is no latency SLA or benchmark percentile. All 183 candidate icons were not
tested: only the stated bounded sample, including possible native fallbacks.

Both native builds and release manifest processing pass. Invalid/empty baseline
properties are rejected. Manifest contents differ only by the targeted query;
app/test bytecode and permissions match between controls. Initial XML comparison
was sensitive to manifest ordering; semantic comparison corrected the audit,
without changing source behavior. Final default rebuild changed APK bytes, so
those exact final APKs were reinstalled and tested before recording acceptance.

Original own-app usage mode `allow` is restored, font/stay-awake and USB mappings
are unchanged. No app data was cleared, no UI/screenshots/lock operations performed,
and no Metro/API/extra server was started. Debug application/test APKs remain
installed, and both local APK controls are retained under ignored `.expo`.
Some earlier local SDK files were missing; official command-line tools were
checksum-verified and pinned platform/build-tools/NDK/CMake restored. No project
SDK version, dependency lock or application identity changed. Existing Gradle
deprecation warnings remain. No unrelated JS/API suite was rerun for test-only Kotlin.

## Remaining / next step

Proceed to the volatile native picker producer in the existing local module/QA
host. Extract the validated candidate logic intentionally; do not import the
instrumentation collector into production or add a second native framework. Keep
aggregate diagnostics/checks test-only and raw identities native. Cancellation,
owner/group/revision, staging/commit/discard and durable account selection remain
explicit contracts before real production saves. Tokens/Auth remain user-deferred.

Physical lock/unlock and uninstall/disable/resource races, additional devices/API
levels/profiles, full picker accessibility and signed release are not accepted by
this probe. Existing production selection capabilities remain unavailable; no
native rule, selection persistence or blocking is implemented. Original plan IDs
and 46/21/25 counts stay unchanged.
