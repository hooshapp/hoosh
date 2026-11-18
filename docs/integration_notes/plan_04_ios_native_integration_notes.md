# Plan 04 — Shared iOS host and Screen Time

## INT-IOS-C01 — Source audit and Expo reference host

**Status:** Source audit started. Shared host build, signing verification and physical feasibility are open. Branch `integration/shared-product`, starting revision `93d9c3b`.

### Inspected targets

| Target | Bundle ID | Source entitlement state |
|---|---|---|
| Host | `com.AnishaDasgupta.DisconnectApp` | Family Controls and shared App Group. Apple sign-in entitlement is absent from the tracked host entitlements. |
| DeviceActivity report | Host ID plus `.Disconnect` | ExtensionKit embed. The entitlement file has no App Group or Family Controls entries. Verify the signed report process before relying on shared storage. |
| DeviceActivity monitor | Host ID plus `.DisconnectDeviceActivityMonitorExtension` | Family Controls and shared App Group. |
| Shield action | Host ID plus `.DisconnectShieldActionExtension` | Family Controls and shared App Group. |
| Shield configuration | Host ID plus `.DisconnectShieldConfigurationExtension` | Family Controls and shared App Group. |

The App Group in source is `group.com.AnishaDasgupta.DisconnectApp`. The project embeds all four extensions, with report and app extensions in separate copy phases. Debug and Release exist. The host targets iOS 16.0 and the extensions also specify 16.0. The project default and native unit test target specify 18.5. Xcode lists the native host and extension schemes and resolves the legacy Swift packages. One local code-signing identity was visible. Provisioning and signed embedded entitlements are unverified. No tracked native privacy manifests were found in this project scan.

### Shared host preparation

- Verified local Xcode 27.2 / Swift 6.4.2 and the installed npm packages Expo 58.0.21, React Native 0.88.1, Expo Router 58.0.28 and Expo Apple Authentication 58.0.2. CocoaPods CLI was unavailable on PATH. Xcode package resolution alone does not establish the Expo build toolchain.
- Generated a disposable Expo iOS reference with `prebuild --platform ios --no-install` from the shared config and dependencies. It uses Swift `ExpoAppDelegate`, `use_expo_modules!`, `use_react_native!`, a Metro Debug entry and a bundled Release entry. The reference template targets iOS 16.4. Its disposable identifier was supplied only in the temporary copy.
- The tracked host still enters SwiftUI and initializes the pilot Firebase, notification and shield lifecycle. The shared RN host needs its own Expo entry path in the preserved Xcode project. Install and pin CocoaPods, then verify an unsigned simulator build and a signed host separately before changing device selection or calling protection active.
- The source-branch `HooshScreenTime` Expo module only reads and requests individual authorization. The shared branch has no equivalent registered iOS product port. The authorization module can be considered for host wiring, while owner-scoped selection and scheduling need separate C02–C04 implementation.

### Protection feasibility to test on a signed device

| Capability | Starting evidence | Remaining proof |
|---|---|---|
| Authorization | Family Controls entitlement in source and an individual authorization module on the source branch | Shared host resolves the native module and observes grant, deny and revoke. |
| Selection | Existing Swift picker/store | Owner isolation, explicit Save, readback and individual app counting. |
| Weekly and quest schedules | Existing DeviceActivity monitor interval and threshold callbacks | Shared owner/revision contract, overlapping reasons and scoped Stop. |
| Elapsed allowance and bypass | Pilot uses DeviceActivity threshold and bypass scheduling | Expiry during continuous target-app foreground, extension-only callback reliability and same-window bypass semantics. |
| History and rewards | Pilot report and event stores | Shared coverage/event contracts and boundaries. Pilot data stays out of shared acceptance. |

No iOS app was installed, no entitlements or bundle IDs changed, and no device permission was requested in this audit.

### Shared host wiring

- The existing `DisconnectApp` target now has an Expo app delegate and scene delegate, a host-only Podfile and a Release bundle phase. Debug uses Metro. The scene delegate uses Expo's initial and warm URL forwarding for the existing `disconnect-dev` callback. The shared host display name is Hoosh. Host deployment is 16.4, matching the generated Expo reference. Extension targets retain their source deployment and signing settings.
- Preserved the host and extension bundle IDs and existing embedding phases. Added Sign in with Apple to the host entitlements. The SwiftUI pilot entry and its Firebase and private Supabase configuration files are excluded from the shared host target. The old pilot remains in source. The shared host starts Expo Router and uses the same session code as Android.
- Ported the authorization-only Swift module from `origin/landing-page` as an Apple-only local Expo module. Autolinking resolves it alongside Apple Authentication and Expo Linking. No iPhone app picker, installation or protection status was registered.
- Passed Swift parsing, plist and shell syntax checks, TypeScript, Xcode target listing, Expo iOS Hermes export and the Release embed export with the resolved Router entry. The native workspace has not been built. CocoaPods 1.16.2 installation under the system Ruby 2.6 hit incompatible gem releases and then failed compiling the `nkf` extension because the system Ruby headers are absent from the selected SDK.

### Remaining native verification

Use a modern Ruby toolchain and the pinned Gemfile from `apps/mobile/ios`:

```sh
bundle install
bundle exec pod install
xcodebuild -workspace DisconnectApp.xcworkspace -scheme DisconnectApp \
  -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

After the simulator Auth gate loads, verify embedded-JS Release and signing on a physical device. Inspect the built app and all four embedded extensions before the permission and feasibility checks. Do not use the authorization-only module to pass selection or protection acceptance.
