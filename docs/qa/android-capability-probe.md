# Android capability and usage-access investigation

## RN-08a — actual baseline (2026-11-03)

Pixel 8 Pro / Android 16 / API 36 is connected through authorized USB debugging.
One local Expo module (`apps/mobile/modules/hoosh-usage`) is autolinked into the
existing mobile project's Android-only development host, `com.hoosh.disconnect.dev`.
No new standalone app or native iOS project was created. iOS tracked files are
unchanged. This is a development identity, not the Play Store/package decision.

The actual debug APK and test APK build and install. Instrumentation runs the same
Kotlin reader without Metro/JS/API/Auth: initial AppOps is default and authorization
is denied; eventCount is null, selfPackageVisible true, userUnlocked true and
deviceLocked false. See [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-08/probe-a.json).
Grant/revocation/locked/empty-window evidence continues in b/d; do not infer those
results from this initial denied observation.

The probe accepts 1–15 minutes, scans at most 1,000 events and returns only state,
bounds, count/capped and own-package visibility. It copies no event/package names
across the bridge, stores no history and sends nothing to the backend. Denied,
locked, unavailable and failed reads return null count rather than zero. It checks
both first-user-unlock and current keyguard state before/after reading. A successful
zero result only means this bounded query was empty; it is not a usage/savings
measurement. Package selection/enumeration stays unavailable: checking the app's
own package does not prove arbitrary package visibility.

The SDK's default template included overlay/storage permissions; these are removed
from main/debug/debugOptimized manifests. Final merged manifest retains usage
access, internet/vibration and required development plumbing, with no overlay,
legacy storage, accessibility, foreground service or QUERY_ALL_PACKAGES permission.
No permission has been granted yet. No restriction, timer, event drain, native
outbox, app selection or background monitor is implemented in this slice.

## Reproduce the development build

Use JDK 17, the SDK/NDK declared by the installed Expo/RN Gradle configuration and
local `ANDROID_HOME`. This run used checksum-verified Temurin 17.0.21+9 and Android
command-line tools in `/tmp/hoosh-android-build-tools`; those downloads/SDK/licenses
are local, not committed. React Native 0.88.1 selects compile SDK 37, target 36,
NDK 27.1.12297006, Gradle 9.4.1. Android SDK package name is `platforms;android-37.0`;
Gradle also installs build-tools 36 for transitive modules. Platform/build-tools 37,
NDK and CMake 3.22.1 were installed. `local.properties`, caches, APKs and private
signing keys are ignored; AGP generates a local debug key. Release signing is unset.

```bash
# From apps/mobile/android, with JAVA_HOME and ANDROID_HOME configured:
./gradlew :app:assembleDebug :app:assembleDebugAndroidTest -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk
adb shell am instrument -w com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

The existing isolated native QA entry includes Android probe. Run
`npx expo start apps/mobile/dev/native --dev-client --localhost --port 8090` from
root; `adb reverse tcp:8090 tcp:8090` and open the development client with that URL.
Expo Go cannot load this module. Probe labels/results are developer-only and their
marker is forbidden in production exports. No new Auth/root guard is introduced.

Native generation was `expo prebuild --platform android --no-install`, never clean
or iOS. Do not blindly regenerate this checked-in host: preserve the custom test
runner, debug manifest permission removals and local-debug/release signing choices.
The generated icon/wrapper resources are Expo template development assets, not a
claim of final production branding or Figma parity.

## Sources and boundaries

- [Expo local modules](https://docs.expo.dev/modules/get-started/) and [autolinking](https://docs.expo.dev/modules/autolinking/): one module under the mobile project's modules directory.
- [Android UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager): usage access and queryEvents are observation, not blocking; locked/empty/unavailable results require care.
- [Android package visibility](https://developer.android.com/training/package-visibility): no broad package access or catalog is added here.

Current code/build configuration and device evidence determine supported behavior.
RN-08b adds the same port's safe read/permission adapter, c owns visible foreground
refresh, d records the real device matrix. User/product enforcement decisions,
Anisha's native iOS/Auth work and signed release/accessibility acceptance stay open.

## RN-08b — read/permission adapter

The same module now returns current authorization, honest unsupported protection
capabilities (all feature flags false; no package picker or usage summary) and
inactive/needs-permission status with null installed revision/empty reasons. The
TypeScript ProtectionService adapter validates these native values and strips
untrusted extras. Selection, rules, temporary allowances, cancellation, drain and
acknowledgment reject explicitly instead of returning success/empty event stubs.

An explicit usage-access Settings action resolves the package-specific screen,
falls back to the general screen if needed, and fails safely when no activity is
available. It runs on the Android main queue. A narrowly scoped intent query makes
that action discoverable; no broad package visibility permission is added. Launch
success is not permission success; the adapter re-reads the current authorization,
serializes repeated requests and c refreshes again on actual foreground return.

Actual rebuilt APK/instrumentation: denied returns needs_permission/null revision;
temporary usage grant returns authorized/inactive/null revision, no installed
reasons, and a bounded ready count of 5 in the one-minute observation. Counts are
not measured usage/savings and are not uploaded. All protection flags remain false.
See [adapter evidence](../core_plan_implementation_notes/artifacts/rn-08/adapter-b.json).
30 portable adapter checks and mobile TypeScript pass. Permission was changed only
for this development package and will be restored to its initial default in d.
UI permission launch/return, external revoke, lock, failure/absence and cleanup
continue in c/d. No enforcement or whole-OS capability verdict follows from this
limited adapter.
