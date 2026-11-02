# Screen Time authorization bridge

The permission page now calls the optional local Expo module `HooshScreenTime`. Both platforms are discovered by Expo autolinking from `apps/mobile/modules/hoosh-screen-time`. JavaScript reads status on entry and when the application becomes active. Opening system settings never counts as approval. Permission authorization never counts as active protection.

## iOS

The Swift module calls `AuthorizationCenter.shared.requestAuthorization(for: .individual)` and reads the OS authorization status. This follows the authorization API already used by the preserved Swift host. Expo config includes the Family Controls entitlement for a generated React Native host. The module does not modify the archived Swift app, App Groups, selection tokens, monitoring, or shields. User denial/cancellation remains retryable; no synthetic success is returned.

Family Controls needs a signed development build and matching provisioning. Expo Go and the web cannot run it. The existing `apps/mobile/ios` project is still the standalone SwiftUI app: this increment does not turn it into the React Native host. Do not run Expo prebuild over it. Generate and validate a separate React Native host in a disposable copy excluding the legacy `ios` directory, then follow the native migration plan to integrate the existing targets with preserved production identity.

## Android

The Kotlin module declares `PACKAGE_USAGE_STATS`, checks `AppOpsManager.OPSTR_GET_USAGE_STATS`, and opens app-specific `ACTION_USAGE_ACCESS_SETTINGS`, falling back to the general list when the device lacks an app-specific settings activity. The app rechecks after returning. Android may not distinguish never-requested from denied, so an ungranted permission is reported as `not_requested` and the UI says access is not enabled.

This is Usage Access authorization only. It does not install accessibility services, overlays, VPNs, background monitoring, notifications, or restrictions. Android restriction strategy is still governed by PD-14. The Android copy explains that granting this permission does not block apps.

## Data and status

Question completion persists the last OS authorization observation with app/hobby choices. Treat it as historical data; always query the native module for current permission after resume. Age and gender remain transient pending PD-17. No usage history or native selection tokens are sent through this bridge. A missing native module returns `unavailable`.

## Validation and release gate

- TypeScript, lint, 87 Vitest tests and 53 Jest tests passed. Coverage includes immediate age taps, permission confirmation vs opening settings, missing modules, unexpected bridge status, request failure, and completion after confirmed authorization.
- Expo autolinking resolves the Swift module for Apple and Kotlin module for Android.
- Swift syntax parsing passed; this is not a native compilation result.
- Live browser review at 393 × 852 identified and fixed collapsed full-width buttons, incorrect app label alignment, an age highlight offset, footer spacing, and missing Figma decorations. The five actual Figma frames were re-read.
- Web export succeeds. Browser testing uses an isolated QA auth provider outside the repository; no auth bypass was added to the app.
- Android native debug compilation passed on November 1: Gradle `:app:assembleDebug` succeeded; `HooshScreenTimeModule` compiled and was registered in Expo's generated module list. APK signature verification passed, and its manifest contains `PACKAGE_USAGE_STATS` for package `ai.hoosh.development`. No device or emulator was connected, so permission prompts, settings return, denial/revocation, and native accessibility remain untested.
- iOS compilation remains blocked by toolchain compatibility. A verified Xcode 26.0.1 archive was expanded locally, but this version fails inside ExpoModulesJSI. Expo SDK 58's actual supported minimum is Xcode 26.4+, correcting earlier Swift-only guidance. Production signing and physical iOS acceptance remain pending. See [development build steps](../runbooks/native-development-builds.md).
