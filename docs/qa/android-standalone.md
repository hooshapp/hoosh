# Standalone internal Android build — RN-10 / RN08-D06

**Owner:** Ishmum. **Date:** 2026-11-14. This is an internally installable development
APK, not store signing or full application/account acceptance.

## Build and artifact

From the repository root, with the existing Node24/npm11, JDK17 and Android SDK:

```sh
npm run mobile:android:standalone -- --check-config
JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk npm run mobile:android:standalone
```

The ignored `apps/mobile/.env` supplies only the existing three public fields:
`EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Explicit environment fields take precedence;
`--env-file PATH` selects another local file. No key values appear in output/report.
Never use database/service-role/access/refresh credentials as public configuration.
Validation checks format and role, not live key/account validity.

The command uses the real normal Router entry and existing release build. It
forces Expo release rebundling before assembly because `.env` is not a Gradle
file input, enables no developer route or account bypass, and retains R8/Hermes.
Only reviewed public fields are passed to bundling; implicit dotenv is disabled.
It aligns an output copy and signs that copy using the existing local Android
debug certificate. The normal release signing configuration remains unset.
No signing key/password file, APK, mapping or build report is committed.

Outputs, already ignored under native `build/`:

- `apps/mobile/android/app/build/outputs/standalone/disconnect-standalone.apk`
- `apps/mobile/android/app/build/outputs/standalone/build-report.json`

The APK is ARM64, minimum Android API24; this build compiles with SDK37 and targets
SDK36. It contains embedded Hermes bytecode, six fonts and the normal app assets.
The report records the APK/mapping hashes, actual SDK/ABI/package checks and source
HEAD/dirty-worktree state. A hash identifies the exact artifact; a dirty source HEAD
is its base, not a claim that the APK was built from a clean commit.

Static checks verify signature, 16KiB native ZIP alignment, embedded Hermes/fonts,
non-debuggable development package, native protection registration and absence of
known developer-host bundle markers. ZIP alignment is not an actual16KiB-kernel
runtime test. Public key guards occur before bundling; Hermes's delimiter-free
string table is not treated as a reliable text credential scanner.

The package is still `com.hoosh.disconnect.dev`. Installing it replaces a compatible
existing development build of that package. Use an owned emulator for repeatable
acceptance; do not uninstall/clear an existing app to solve a signature mismatch.
Production package identity, private release/upload key, Play distribution and
store review remain separate decisions/work.

## Network configuration

The main checked-in development manifest allows HTTP only to `localhost` and
`127.0.0.1`; other destinations require HTTPS. This supports the existing local API
without enabling global release cleartext. Debug/debugOptimized resources explicitly
retain their prior cleartext policy so LAN Metro debugging continues to work.

Standalone means **no Metro dependency**, not an offline backend. Signed-in API
features still need a reachable API. With a loopback API on a connected development
phone, an intentional USB reverse for that API port is separate from Metro; never
claim a hosted API from a loopback URL. Startup checks below used no reverse ports.

## Exact optimized native smoke check

Start an **owned ARM64 API36 emulator** using the project's existing local AVD.
Do not enable Accessibility, grant usage access, sign in or install test rules.
Then run:

```sh
JAVA_HOME=/path/to/jdk17 ANDROID_HOME=/path/to/sdk \
  npm run mobile:android:standalone:smoke -- --emulator emulator-5556
```

This command refuses phone serials, absent emulators, existing reverse ports and
mismatched APK/report/R8 mapping hashes. It builds a separate debug test APK using
`-PhooshStandaloneSmoke=true`, installs only on the explicit emulator and runs a
plain Java instrumentation runner against the signed, non-debuggable release app.
The ordinary Kotlin/146-native runner remains the default without that property.
The Java runner avoids unminified Kotlin references to the target's renamed R8
classes; exact original-to-renamed native classes come from that artifact's mapping.
No production keep rule or diagnostic route is added.

Six read-only native cases verify:

1. Actual target package is non-debuggable and carries no instrumentation entry.
2. Its installed source APK contains Hermes bytecode and font resources.
3. Actual network policy permits the two loopback hosts and denies remote HTTP.
4. The optimized Expo registry contains HooshUsage, SecureStore and font modules.
5. HooshUsage's actual module definition includes the supported product methods,
   while finite-install/temporary-picker/feedback/test-task APIs are absent.
6. Accessibility service is registered with its binding permission and usage
   declaration, without broad package visibility, overlay or storage permissions.

This proves optimized registration/definition, not a signed-in protection journey
or invocation of every native function. No account, native owner/configuration,
app inventory or permission grant is read/written by this runner.

## Startup acceptance actually observed

The exact internal APK installed successfully on the owned API36 emulator. With no
Metro server or ADB reverse mappings, normal MainActivity displayed **Account access
→ Welcome back**, empty Email/Password fields and Sign in. Embedded fonts/layout
rendered. The test did not fill credentials or press Sign in.

Cold launch after force-stop, Home/background return, and a new cold launch with
airplane mode enabled/Wi-Fi disabled all displayed the same normal gate. Original
emulator airplane/Wi-Fi values were restored and verified. No connected phone was
modified, no Auth/provider/database/account operation ran, and TalkBack stayed off.
The owned emulator is stopped after acceptance; temporary UI XML is removed.

Observed checks: six configuration/environment tests, six optimized native cases,
full workspace553portable/803component(+2existing skips)/682API, types/lint/contracts
and71original assets. Four existing mobile lint warnings remain, zero errors.
No backend/DDL change or PostgreSQL rerun is claimed by this packaging slice.

Signed-in profile/settings/session/account switching remain user-deferred. Anisha's
Auth/onboarding/iOS, full device/screen-reader/true memory-pressure matrices, Play
signing/review and full RN-10/RN08-D06/Plan04 completion remain open. The
[Plan04 implementation notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md)
record source lines, failed attempts, exact artifact hashes and current limits.
