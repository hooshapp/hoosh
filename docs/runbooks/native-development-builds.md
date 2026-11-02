# Native development builds

Generate a separate Expo React Native host from the current app:

```sh
npm run mobile:native:prepare -- all
```

For one platform, use `ios` or `android` instead of `all`. The generated host lives under `.native-dev/mobile` and is ignored by Git. It contains the real app sources and the local `HooshScreenTime` Expo module, with local configuration symlinked from `apps/mobile`; it has no QA authentication bypass. Rerun preparation after source changes before rebuilding. Treat the generated host as disposable; make durable changes in app config, modules, or config plugins.

This is a development test host, not the App Store migration. Its name is **Hoosh Dev**, iOS identifier is `com.AnishaDasgupta.DisconnectApp.development`, and Android package is `ai.hoosh.development`. These development identities prevent installing over the released app. Production identifiers, legacy extensions, App Groups, and native selection data remain preserved under `apps/mobile/ios`.

## iOS

**Supported build toolchain: Xcode 26.4 or newer for Expo SDK 58.** Xcode 26.0.1 is insufficient; see the November 1 evidence below.

From `.native-dev/mobile/ios`, run `pod install` with a working CocoaPods/Ruby installation. Then open `HooshDev.xcworkspace` and build for a simulator or signed device. For a physical device, select the development team and provision the development identifier with Family Controls and Sign in with Apple capabilities. Do not assume the released app's provisioning profile covers this different development identifier. Apple provider configuration may also require native client-ID adjustments before testing native Apple login in this host.

The simulator can check compilation, launch, layout, and keyboard behavior. Family Controls authorization acceptance must be tested on a signed physical iPhone. Authorization alone does not integrate legacy application selection, monitoring, shielding, or extension targets. Those remain a separate production-host migration step.

Current local tool workaround: macOS ships Ruby 2.6 with stale SDK header paths. A temporary, isolated CocoaPods 1.16.2 bundle was prepared under `/private/tmp/hoosh-pod-toolchain` with Bundler 2.4.22 under `/private/tmp/hoosh-gems`. No system Ruby files were modified. This temporary workaround is not a durable team dependency; install a maintained Ruby/CocoaPods toolchain for regular builds.

## Android

Install Google's Android command-line tools or Android Studio, review and accept the SDK license yourself, and install the SDK/build tools required by the installed React Native version. The current installed React Native version declares compile SDK 37, build tools 37.0.0, and NDK 27.1.12297006; derive future requirements from `node_modules/react-native/gradle/libs.versions.toml` rather than copying obsolete versions.

Set the SDK location in the local development host's `android/local.properties` or `ANDROID_HOME`, then build using its Gradle wrapper. No license hashes are copied or generated automatically. Review any SDK package-license prompts directly.

On a physical Android device, test the Usage Access settings flow, return-to-app status refresh, denial/no change, revocation, and relaunch. Permission does not imply app blocking.

## Acceptance checklist

- Existing native import integrity: `python3 scripts/verify_ios_import.py`.
- Both generated hosts contain the real `HooshScreenTime` module and source.
- Signed-device allow/deny/cancel/revoke/relaunch is recorded separately from web tests and autolinking.
- VoiceOver/TalkBack, keyboard, large text, and small screens require native review.
- No production installation, App Store upload, credential changes, or release signing is performed by the preparation script.

## Current build evidence (2026-10-30)

Both development hosts generate successfully. Apple and Android autolinking resolve the native permission module. Source hashes confirm the generated host uses the real auth provider and the same Swift/Kotlin bridge source as the app. Legacy import verification still passes for all 80 retained source/configuration files.

The iOS host completed CocoaPods installation: 128 dependencies, 127 pods, including `HooshScreenTime 0.1.0`. Both iOS and Android JavaScript/Hermes exports passed. These are bundle checks, not native compilation or device acceptance. The simulator build was attempted with `xcodebuild` and failed in the ExpoModulesJSI Swift package dependency before app/module compilation:

```
package 'apple' is using Swift tools version 6.2.0 but the installed version is 6.1.0
```

Installed Xcode is 16.4 (16F6). This initial Swift-only minimum was superseded by the November 1 compatibility check: Expo SDK 58 needs Xcode 26.4+. Do not change the dependency's declared Swift tools version to conceal the mismatch. Build log: `/private/tmp/hoosh-ios-build.log` (local diagnostic data).

Android native compilation is waiting for the SDK installation and direct user review/acceptance of Google's license. The command-line-tools Mac ARM agreement is open in the app browser. No SDK license was accepted automatically. Physical-device prompts, allow/deny/revoke, and native accessibility/keyboard acceptance remain untested.

## Resume evidence (2026-11-01)

The existing Downloads archive `Xcode_26.0.1_Universal.xip` was verified as signed Apple Software and expanded under `.native-dev/toolchains/xcode26`. Deep/strict code-signature verification passed. Builds selected it with a per-command `DEVELOPER_DIR`; the global Xcode selection and `/Applications/Xcode.app` remain unchanged.

The Xcode 26.0.1 simulator retry failed inside ExpoModulesJSI (`JavaScriptObject.swift:946`, sending `slot` risks causing data races). Checking Expo SDK 58's official support table revealed its actual minimum is **Xcode 26.4+**. The previous guidance that Xcode 26.0 was sufficient was incomplete. Install a supported Xcode before retrying; no compiler checks were disabled and no dependency source was patched. Current Mac version is macOS 26.6.2. The retry log is `/private/tmp/hoosh-ios-build26.log`.

The user accepted the Android command-line-tools website download agreement. The Mac ARM ZIP checksum matched Google's published `835b62a26162b229b441d1f6d4680383815a270809eb33522c0d480fa5002c4e`; the tools were extracted under `.native-dev/toolchains/android/sdk`. The platform package identifier is `platforms;android-37.0` in Google's repository (not `platforms;android-37`). Build tools remain `build-tools;37.0.0`.

The SDK installer presents a separate `android-sdk-license` text dated January 16, 2019, different from the download page's April 28, 2026 text. Its full text is available locally in `.native-dev/android-sdk-license.txt`. The user subsequently explicitly approved accepting this installer license and installing platform-tools, SDK 37.0, build tools 37.0.0, and NDK 27.1.12297006. The installer was resumed with that approval; verify completion with the toolchain check before building.

Run `npm run mobile:native:check -- all` before compiling. It reports unsupported Xcode or missing Android SDK packages, and respects `DEVELOPER_DIR` and `ANDROID_HOME` when selecting local tools.

Reference: https://docs.expo.dev/versions/v58.0.0/ (platform support table).

### Android packages installed after explicit approval

The approved installer completed successfully on November 1. Installed packages were independently confirmed using `sdkmanager --list_installed`:

- `platforms;android-37.0`, revision 2
- `build-tools;37.0.0`
- `platform-tools`, version 37.0.1
- `ndk;27.1.12297006`

`npm run mobile:native:check -- android` passes all four package checks. Gradle 9.4.1 starts successfully with the local Temurin Java 25 installation. A debug build is being attempted; no device runtime acceptance is implied by package installation.

Local build command (after preparing the host):

```sh
cd .native-dev/mobile/android
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home \
ANDROID_HOME=/Users/anishadasgupta/hoosh/.native-dev/toolchains/android/sdk \
GRADLE_USER_HOME=/Users/anishadasgupta/hoosh/.native-dev/toolchains/gradle \
./gradlew :app:assembleDebug --console=plain --no-daemon
```

The absolute paths above document this Mac's tool locations; adjust them on another machine. The local diagnostic log is `/private/tmp/hoosh-android-build.log`.

### Android native debug build passed (2026-11-01)

`./gradlew :app:assembleDebug --console=plain --no-daemon` completed successfully in 8m 34s (556 tasks). `hoosh-screen-time:compileDebugKotlin` passed, Expo's generated module list includes the module, and the merged app manifest includes `android.permission.PACKAGE_USAGE_STATS`. Package ID is `ai.hoosh.development`, min SDK 24, target SDK 36, compile SDK 37. The build also installed its required CMake 3.22.1 and build tools 36.0.0 under the same SDK license, and provisioned a Java 17 compilation toolchain in the local Gradle cache.

Artifact: `.native-dev/mobile/android/app/build/outputs/apk/debug/app-debug.apk` (272 MB, universal debug APK). SHA-256: `1a3e6b0c03b49aeecaf95a8a037fa5445270f09502a975a1f4a389ba62e8954b`. `apksigner verify --verbose` passed with APK signature scheme v2. The artifact and debug signing materials remain in ignored generated output.

This is an Expo development-client APK; interactive tests need Metro running from `.native-dev/mobile`. For USB testing, start Metro on localhost and reverse that port with adb after connecting the device. Device authorization must be approved directly on the phone. Do not infer successful app launch or Usage Access approval from a successful APK build.

`adb devices -l` found no connected Android device or emulator. The user was asked whether to use a physical phone or set up an emulator. Actual allow/deny/settings-return/revoke/relaunch and TalkBack/keyboard checks remain pending. The debug development client also declares Expo's overlay permission; the Hoosh permission module does not request or use overlay access for blocking.

### Local emulator setup (2026-11-01)

At the user's request, installed `emulator` and AOSP `system-images;android-37.0;default;arm64-v8a` using the already accepted SDK license. Created `Hoosh_API37` with the Pixel 5 profile under `.native-dev/toolchains/android/avd`. It boots successfully (`sys.boot_completed=1`) and appears as `emulator-5554`.

The existing verified debug APK installed successfully. Metro runs from the real-auth generated host on localhost port 8091, with `adb reverse tcp:8091 tcp:8091`. Started the development-client intent using the `disconnect-dev` scheme. Hoosh's native process runs, but the foreground activity is Android's `GrantPermissionsActivity`; the first-launch system prompt needs direct user handling. The current Mac UI connection does not expose the emulator window, so no button/permission type was guessed and no app auth bypass was introduced. App intro/signup rendering and the actual Usage Access handoff are not yet confirmed.

Restart the emulator with `npm run mobile:android:emulator`. This launcher uses the local ignored SDK/AVD and logs to `/private/tmp/hoosh-emulator.log`. Metro log: `/private/tmp/hoosh-emulator-metro.log`. The emulator and server were left running for the user.

Scope adjustment: the user requested a practical implementation pass, with broader Android compatibility/accessibility and physical-device acceptance deferred until the app is ready. No exhaustive emulator test pass is required now. Usage Access authorization source is wired and compiled; permission approval, app behavior after settings return, and real restriction behavior must not be claimed passed from this setup alone.

### Emulator launch after the user handled the prompt

The user reported allowing the first-launch system prompt. Hoosh then resumed `ai.hoosh.development/.MainActivity`; its process remained running and Metro completed the Android JavaScript bundle (1691 modules). A bounded, app-process-only error-log check found no recent ReactNativeJS errors or fatal AndroidRuntime exception. This confirms startup progress, not visual acceptance of each screen.

An independent `appops get ai.hoosh.development GET_USAGE_STATS` returned no operation and default mode. Usage Access therefore remains ungranted; allowing the initial system prompt must not be recorded as Screen Time authorization. The separate in-app Allow Usage Access flow still needs the user's explicit Android settings approval after authentication/onboarding. Broader testing remains deferred per user preference.

### Sign-in slowdown investigation

The user reported slow sign-in and asked the agent to handle navigation. The macOS auth endpoint health request returned HTTP 401 without credentials in about 0.18 seconds, and emulator DNS resolution/ICMP reachability to the project succeeded. A recent app-process error-log check found no ReactNativeJS or fatal AndroidRuntime error. These checks do not prove that a real password sign-in request has completed or identify the UI slowdown's cause.

The ordinary Mac UI connection does not expose the emulator. Tried Expo's standalone device dashboard locally using `expo-device-hub 0.19.1`; device discovery worked after refresh, but both gRPC and scrcpy browser streams remained connecting. The failed dashboard was closed and its server stopped; no app dependencies were changed for this experiment. Emulator and Metro remain running. The user was asked for explicit authorization to switch to ADB UI automation, as required by the current computer-control tool's instructions. Await that authorization before using ADB for screen reading/input. Do not enter passwords or codes on the user's behalf under this handoff.

### ADB UI handoff authorized

The user explicitly authorized ADB UI automation on the local emulator. The first sanitized UI dump showed the Create account screen rather than Log in. Switched through the visible existing-account link to Log in, filled the previously user-provided test-account email, and focused Password. No password was read, printed, or entered by the agent. The user was asked to enter the password directly and reply ready before submission/navigation continues. Keyboard dismissal or the field's Done action may submit; inspect the current screen before retrying submission.

A local screenshot of the empty password field is `/private/tmp/hoosh-login-ready.png`. UI dump values are omitted from tool output for editable/password fields. This establishes the actual sign-in screen; it does not establish that password authentication succeeded or explain an earlier submitted request's latency.

### Efficient handoff checkpoint — emulator parked

The user requested conserving remaining weekly usage and deferring further testing to a physical Android device. A single sanitized UI check confirmed that signup reached **Check your email**, showing **Request accepted** and a resend action. The user reported no verification email arriving. This confirms UI progression/request acknowledgement only; account creation, verification-email delivery, confirmation callback, and signed-in onboarding remain unconfirmed. No additional resend attempts were made.

The local emulator was shut down without deleting its AVD or app data, and its localhost Metro process was stopped. APK, SDK, AVD, and source changes remain available. Restart using `npm run mobile:android:emulator` and start Metro from `.native-dev/mobile` if needed. All work remains uncommitted on `landing-page`.

Next bounded acceptance run: resolve confirmation-email delivery or select one known verified test account, install the existing debug build on a physical Android device, perform one login/onboarding/Usage Access handoff, and record the result. Physical hardware alone does not resolve email delivery. Avoid repeating full suites without code changes or tuning the emulator further. Android permission module compilation/registration/APK signature passed; actual Usage Access remains ungranted/unverified. iOS still requires a supported Xcode 26.4+ and signed-device verification.

### Confirmed existing account found — read-only dashboard check

A focused read-only check of Supabase Authentication Users found the existing test email account. Its overview reports Created, Confirmation sent, and Confirmed on October 29, 2026 at 12:36 in the dashboard display. It has email and Google identities. No password was read/reset, no account was created/deleted, no email was sent, and no project security settings were changed during this check.

This test account does not need another signup confirmation. Use its existing password to log in; a password entered into a repeated signup request does not reset the existing credential. If the password is unknown, complete the normal recovery flow directly. Fresh-account verification-email delivery remains a separate unverified case; this finding does not certify SMTP delivery generally.

The confirmation-screen copy now explains the existing-account path and that signup does not reset passwords. The copy is shown generically to every requester, without client-side account enumeration. The existing Return to login action already cancels the pending signup flow before navigation. The emulator remains parked per the user's request to conserve usage and defer broader testing to a physical device.
