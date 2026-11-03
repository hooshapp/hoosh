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

## RN-08c — registered Android status and visibility

Metro registers the stable Android adapter through the platform-specific module;
iOS remains with Anisha and web/absent-module builds keep the old unavailable
card. Actual Home uses the existing protection mapper/hook with unknown desired
native revision (never the API revision), plus a separate usage-access read/action.
Unsupported mode now says protection is unimplemented in this build, avoiding a
whole-device/platform verdict. Grant alone always remains inactive.

The connected Router host combines actual route focus and AppState foreground.
Hidden/changed/failed read evidence cannot keep an allowed/active claim; foreground
or focus return reads again. Explicit Review usage access stays busy through its
native launch/current-read operation, serializes taps and uses safe failures.
Retry reads only; it never opens settings. Late or unmounted permission completions
cannot refresh a new owner. This adds no Auth listener, account transfer or root
provider and works independently of API configuration.

The existing native QA probe renders these same production controls with real
AppState visibility, disables simulated state controls, and labels actual native
observations separately from source UI examples. On Pixel, native module connected
and Usage access allowed / App protection not active were observed. Review usage
access opened the real Settings page specifically for Disconnect, with its switch
on from the temporary b grant. Back returned to the same native QA screen.
Complete revoke/grant/cold-start/font/lock/absence observations continue in d.

Checks pass: 382 portable / 502 component / 590 API, types/lint/contracts, 38-file
web isolation / 71 original assets, Android production Hermes export. Fourteen new
component checks cover real Router/AppState reads and cleanup, hide/foreground,
revocation, failed read retry, duplicate Settings action, errors, stale/unmounted
callbacks and module absence. Actual Pixel UI launch does not certify assistive
speech or signed release acceptance.

## RN-08d — physical-device acceptance (2026-11-03)

The rebuilt Android debug app and instrumentation APK passed on Pixel 8 Pro,
Android 16/API 36. See [sanitized device/build evidence](../core_plan_implementation_notes/artifacts/rn-08/device-d.json)
for exact APK hashes, native return values, UI bounds, checks and cleanup. Earlier
a/b/c observations above are historical, not the final permission state.

| Actual action | Observed result |
|---|---|
| Production Home, no API/Auth configured; Review usage access | Own-app Android Settings page opened; usage permission and inactive protection remained separate |
| Settings switch off/on, then Back | Home re-read denied/allowed respectively; neither result claimed installed/active protection |
| External own-package AppOps revoke while backgrounded | Foreground return showed denied rather than retaining the old grant |
| Allow, force-stop and cold launch | Home showed current grant and unimplemented/inactive protection |
| Current keyguard locked, then user unlock | Same Kotlin probe returned locked/null count, then ready/bounded count after unlock |
| Actual zero-width query | Ready with count 0; distinct from locked/denied/null; not a usage-duration measurement |
| Both task Metro servers stopped, API unconfigured | Native instrumentation still returned locked, unlocked, revoked and restored status; this does not make development JS UI independent of Metro |
| Expo Go without local module | Actual native-QA entry showed module absent/unavailable, disabled probe and no permission action |
| Font scale 1.15 and 2.0 | Labels wrapped, permission control remained reachable by scrolling and opened Settings; clickable outer heights 160px (~53dp) and 192px (64dp), density 480dpi |

Build commands above produce both APKs. With own development package granted
usage access and the phone unlocked, the **test APK only** adds this deterministic
empty-window case:

```bash
adb shell am instrument -w -e emptyWindow true com.hoosh.disconnect.dev.test/com.hoosh.disconnect.dev.UsageProbeInstrumentation
```

It runs `queryEvents(end, end)` through the same reader. The production Expo probe
continues to accept only a 1–15 minute window; it exposes no empty-window flag.
For locked acceptance, lock the phone, run the ordinary instrumentation command,
then have its owner unlock it and repeat. Require `deviceLocked:true`, state
`locked`, and null count before claiming a locked pass; merely turning the screen
off can race keyguard activation. Denied/unknown/error also never mean zero.

**Cleanup verified:** own-package GET_USAGE_STATS restored to initial `default`
(final denied/needs_permission/null count); font 1.15 restored; USB stay-awake 0
restored; screen timeout unchanged at 30000ms. Both task Metro servers stopped,
only task reverse mappings 8090/8092 removed (final list empty), own phone UI dump
removed. Development/test APKs and local SDK/JDK/cache retained for reproducibility.
No Auth, hosted database, other app data, iOS or restriction policy was changed.

**Checks:** final `npm run check` passed 382 portable / 502 component / 590 API,
types/lint/contracts/assets; 192 DB tests excluded because no backend change.
`npm run mobile:export` passed 38-file isolation and 71 original SVGs; production
Android Hermes export passed. Both actual native APK builds passed.

**Limits:** this completes a–d's read/permission scope, not RN-08 as a whole.
No enforcement/install/selection/outbox/background engine or measured metrics;
first-unlock-after-reboot, other devices/API levels, unavailable Settings activity
and malformed native payloads are not all physically exercised (adapter tests
cover safe failures). TalkBack/VoiceOver speech, signed release, iOS/Auth/root,
authenticated settings journeys and hosted acceptance remain open. Mode
`unsupported` describes this build's unimplemented protection, not Android as an OS.
