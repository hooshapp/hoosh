# Plan 04 — Shared iOS host and Screen Time

## INT-IOS-C01 — Source audit and Expo reference host

**Status:** Shared host Debug build and simulator launch passed. Internal Release, physical signing and feasibility are open. Branch `integration/shared-product`, host wiring revision `dc1e143`.

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

### Build commands and remaining native verification

Use a modern Ruby toolchain and the pinned Gemfile from `apps/mobile/ios`:

```sh
bundle install
bundle exec pod install
xcodebuild -workspace DisconnectApp.xcworkspace -scheme DisconnectApp \
  -configuration Debug -sdk iphonesimulator CODE_SIGNING_ALLOWED=NO build
```

The simulator Auth gate has now loaded under the simulator signing configuration. Verify embedded-JS Release and signing on a physical device next. Inspect the built app and all four embedded extensions before the permission and feasibility checks. Do not use the authorization-only module to pass selection or protection acceptance.

### CocoaPods workspace checkpoint

- Built an installation-local Ruby 3.4.8 toolchain with OpenSSL and YAML under the ignored `.native-dev/toolchains` folder. The selected Xcode SDK exposes `pipe2` and `dup3` before the host macOS provides them. The private Ruby build uses its existing pipe and descriptor fallbacks for those calls. The toolchain remains local to this checkout.
- Bundler 2.6.9 installed the pinned CocoaPods 1.16.2 successfully. Added the Gemfile and Podfile lockfiles and the generated workspace references. Swift package resolution uses the existing audit snapshot, including Firebase 12.13.0, through the workspace's `Package.resolved`.
- CocoaPods installed 128 pods, including the local Screen Time authorization module. React Native's generated privacy manifest is bundled by the host. The Podfile preserves the extension plists across React Native's post-install hook and keeps its New Architecture flag in `SharedHost-Info.plist`.


### Simulator build and launch results

- Both unsigned compilation and ad-hoc simulator-signed Debug compilation passed on Xcode 27.2. The selected iPhone 17 simulator runs iOS 27.2. The built app contains the report, monitor, shield configuration and shield action extensions. The generated Expo provider includes `SecureStoreModule` and `HooshScreenTimeModule`.
- The unsigned simulator binary produced an Auth storage error. Rebuilding with simulator signing generated the simulated application identifier and Keychain entitlement context. The signed simulator run displayed the shared Hoosh login screen without the earlier storage error. This is a launch and Auth bootstrap check. A provider sign-in and actual Screen Time grant were not performed.
- Expo's `--initialUrl http://localhost:8081?disableOnboarding=1` launch argument opened the development project. A synthetic invalid callback through the custom URL scheme reached the system's “Open in Hoosh?” confirmation. Simulator UI controls were unavailable through the computer connection, so callback acceptance remains unverified.
- The simulator booted for this check is named `Hoosh Shared Host C01`. It is separate from the pilot simulators. The physical iPhone was not used. Internal Release and physical allowance/extension behavior remain open C01 acceptance items.

The successful simulator build uses ordinary simulator signing, which is needed for Auth's device storage:

```sh
export PATH="$PWD/.native-dev/toolchains/ruby/bin:$PATH"
cd apps/mobile/ios
BUNDLE_PATH=../../../.native-dev/toolchains/ios-gems bundle exec pod install --deployment
cd ../../..
xcodebuild -workspace apps/mobile/ios/DisconnectApp.xcworkspace \
  -scheme DisconnectApp -configuration Debug -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=Hoosh Shared Host C01' \
  -derivedDataPath .native-dev/ios-shared-derived \
  -disableAutomaticPackageResolution -onlyUsePackageVersionsFromResolvedFile \
  CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO ONLY_ACTIVE_ARCH=YES build
```

Run these commands from the repository root. Another developer can supply a compatible modern Ruby through PATH before running the pinned Gemfile. The local private toolchain is ignored by Git.


### November 19 — C02 storage and owner-session foundation

- Added `SharedProtectionStore.swift` to the local Expo pod. Its Foundation-only source defines versioned per-project/account records for selections, policy reasons, allowances/deadlines/day/timezone, receipts/cancellation, event journals, coverage and a pending claim. Selection bytes stay native. The production root is the existing App Group plus `SharedProductProtection/state-v1.json`; there is no standard UserDefaults fallback or pilot-data import.
- Writes acquire an OS file lock shared across processes, compare the expected revision, validate bounded records, fsync a temporary file, rename atomically, fsync the directory and read back. Missing state is optional; corrupt, newer-version, oversized and unavailable state fail instead of becoming empty state. Abandoned pre-rename files are cleaned under the lock. iOS files use complete-until-first-user-authentication protection; actual before-first-unlock and locked-device availability still need signed-device proof.
- Added credential-free native owner-session begin/end and bridge-destruction invalidation. The existing `/v1/me` boundary starts a native lease only after the SDK and product identity agree. Token-specific cleanup preserves a newer lease; late async lease acquisition is retired after boundary unmount. This lifecycle is separate from the full product port, which remains unregistered on iOS until selection/status/scheduling adapters exist. Beginning/ending a session does not read, create or claim persistent protection records and does not clear restrictions.
- Foundation checks compile/run with `swiftc apps/mobile/modules/hoosh-screen-time/ios/SharedProtectionStore.swift apps/mobile/modules/hoosh-screen-time/ios/ProtectionSchedules.swift apps/mobile/modules/hoosh-screen-time/ios/ProtectionSessions.swift apps/mobile/modules/hoosh-screen-time/ios/ProtectionTransactions.swift apps/mobile/modules/hoosh-screen-time/ios/ProtectionInstallation.swift apps/mobile/modules/hoosh-screen-time/ios/SelectionTransactions.swift apps/mobile/modules/hoosh-screen-time/tests/StoreChecks.swift -o /tmp/hoosh-store-checks && /tmp/hoosh-store-checks`. Passed missing/readback, revision conflicts, account/project lease isolation, old-token cleanup, destruction, failed writes, process death before rename, orphan cleanup, four processes completing 160 contending updates, newer/corrupt/oversized refusal and invalid edits preserving the prior record.
- Focused React boundary checks cover verified identity, replacement/unmount, late lease cleanup and no disk erase. TypeScript and focused ESLint also pass.

C02 is **in progress**, not accepted. This checkpoint defines the store but does not move the pilot or extension writers into it. Pending claims are only a record format, not an implemented device-takeover operation. Remaining: explicit confirmed Stop/readback/claim and recoverable interruption, neutral legacy review UI, compile/use the same state path in enforcement extensions, supported migration fixtures and signed locked-device checks. The pilot `familyActivitySelection` key and default ManagedSettings store remain untouched; no UUID/email linkage or telemetry backfill occurred. C03/C04 protection acceptance must not use these foundation tests as proof of actual enforcement.

- Native verification: pinned `pod install --deployment` passed. The simulator-signed Debug host build passed after adding the pod source, and the incremental build of the final source also passed (`/tmp/hoosh-ios-c02-final-build.log`). Focused React checks passed 12/12 across both configured Jest projects. No physical-device enforcement or locked-device claim is made.


### November 19 — C02 confirmed transition and extension fencing

- Added `ProtectionInstallation` with an explicit-confirmation, expected-revision claim. It writes an `awaiting_stop` marker before affecting protection. The native Stop/readback runs under the shared cross-process lock. Only a successful Stop commits the new installation owner; a failed or interrupted operation retains previous ownership and a retryable marker. Old selection/history/receipts remain in their original account record; active reasons and allowances are retired. Sign-out retains restrictions and does not claim/reset the store.
- The iOS Stop adapter audits the default ManagedSettings store and the pilot's `disconnect.sessions.v1`/`disconnect.dailyCap.v1` stores plus the shared named store. It stops this app's DeviceActivity registrations, clears those stores, cancels the audited break reminders and checks registrations and shield fields before commit. Readback is SDK-level proof; extension timing and actual shield removal require a signed iPhone test.
- The three enforcement/presentation extensions now compile the exact same Foundation store source through explicit Xcode target membership. Monitor and shield-action callbacks run under its lock; delayed bypass writes recheck it. A pending claim, a completed legacy Stop or an assigned product owner prevents legacy callbacks from reinstalling/removing shields or writing pilot history. Configuration falls back to neutral text rather than reading former participant responses when fenced. Missing state retains pilot behavior; corrupt/newer/unavailable state preserves restrictions and denies pilot operations.
- The optional `legacyStopped` field preserves the previous v1 file format. Missing acknowledgment is never inferred as completed migration. No pilot selection, anonymous UUID, email, research record or event is copied into a product account, and no old storage is removed. A previous-v1 fixture and a child-process late callback are checked alongside failed-Stop recovery, confirmation cancellation, stale revisions, account/project isolation and owner-private retention.
- Added an iOS review panel to the existing onboarding device-setup screen. It reads only neutral status/revision through the verified lease. It requires a separate system confirmation for Stop/reconfigure, handles cancellation and refreshes the pending revision after failure. Preparing the device does not select apps, request permission or start protection. iOS's complete product port remains unavailable until C03/C04; Android's adapter and flow are unchanged.
- Focused UI tests exercise confirmation before Stop, failed Stop/retry with refreshed revision, and no takeover without a verified session. The boundary tests still cover owner replacement and late cleanup. The same checks run in both configured Jest projects; 18/18 passed. TypeScript and focused ESLint passed. Foundation storage/transition checks passed, including four-process contention and interrupted-write recovery.

C02 source implementation can feed C03, but its **signed-device acceptance remains open**: verify grant/deny/revoke, confirmed legacy Stop and actual shields disappearing, A/B account transitions, old extension timing, and before-first-unlock/locked reads. C01 Release and physical feasibility are also still open. No production installation or phone state was modified by this checkpoint.

- Build verification: pinned CocoaPods deployment succeeded and the simulator-signed Debug host plus the three updated extension targets built successfully (`/tmp/hoosh-ios-c02-transition-build.log`). This is compilation/signing evidence, not physical enforcement proof.

- Final-source incremental simulator build also passed (`/tmp/hoosh-ios-c02-transition-final.log`). Review lives in the common device-setup shell so it remains available when C03 supplies the iOS product port; Settings already links to Set up Hoosh.


### November 19 — C03 native selection and permission/status capability

- Added Apple's SwiftUI `FamilyActivityPicker` in a native sheet, using the current Expo host view controller. Labels/icons/tokens are rendered by Apple, never sent to JS. It presents only after explicit Choose; no picker or permission prompt opens at startup. The native sheet clearly limits saving to individual apps and rejects categories/websites or more than 512 apps with a review message. No fake simulator app inventory or production selection substitute was added.
- Added `SelectionTransactions`: one bounded native draft, a 15-minute expiry, owner/lease checks, draft versions, expected saved revisions, token-set equality, native encoding and store readback. Picker Done updates only the in-memory draft. Separate Save persists selection without installing protection. Cancel/dismiss/background leave saved choices untouched. Concurrent editors, external selection revisions, account replacement, revoked access and expired handles cannot overwrite saved selection. Repeating an acknowledged save is idempotent; ambiguous writes can be recovered by reloading saved selection.
- Native presentation revalidates the lease on the main actor before showing previous selection; results revalidate it again before altering a draft. Permission requests likewise validate the installation owner before showing the OS prompt and validate the lease after completion. Authorization changes notify subscribers and cancel the picker; background and interactive dismissal cancel the sheet. Actual OS `.denied` is reported as denied, including revocation; no stored boolean substitutes for OS authorization.
- Added a strict selection-only iOS status decoder. Native state reads require the current claimed owner and reveal no other account's data. The C03 projection reports inactive/needs-permission/degraded and cannot claim active protection, installed policy revisions or scheduling capabilities before C04. The Android status decoder is unchanged. Unexpected prior reasons or SDK-visible schedules/shields produce degraded status with an explicit confirmed Stop path, rather than assumed enforcement.
- Added the scoped iOS selection context and reused the shared `NativeAppsEditor` Save/Cancel controls in the existing device-setup screen. Shared setup renders iOS Screen Time labels, explicit access request, selection summary and rechecks on foreground/observer invalidation. Settings already links to this setup flow. Request errors stay visible after readback. Replaced accounts synchronously lose the old context; the full `ProductNativePort` and generic protection service remain unregistered in the explicit iOS platform files until C04 provides the required core/quest semantics. Android's existing port and setup path are preserved.
- Selection-store validation now allows an installed reason to refer to an earlier saved selection revision. Saving a new global selection does not rewrite an installed reason. C04 still needs actual per-occurrence snapshots and installation semantics; C03 does not activate those records.

Verification: Foundation checks passed draft/Save separation, token changes at equal counts, readback/retry, Cancel/release, competing editors, expired drafts, revoked-access summary and stale-save rejection, plus all C02 storage/claim checks. iOS decoder and unchanged Android decoder checks passed 29/29; focused shared editor, boundary, installation review and iOS setup checks passed 60/60 across the two Jest projects. TypeScript and focused ESLint passed. Pinned CocoaPods deployment and simulator-signed Debug compilation passed (`/tmp/hoosh-ios-c03-build.log`, `/tmp/hoosh-ios-c03-final-build.log`).

C03 **source and automated checks are implemented; signed-device acceptance is open**. No real iPhone grant/deny/revoke, picker Save/Cancel, native layout, token durability across device reinstall/permission changes or C04 enforcement was verified here. The simulator build is not proof of those behaviors. Next is C04 scheduling/quest installation, followed by the planned device acceptance. Preserve C01/C02 physical and Release gates.

- Final native review also checks SDK-visible DeviceActivity registrations and the audited ManagedSettings stores before reporting inactive. Stray restrictions yield degraded status with Stop available. A Swift type-inference limit in the token equality initializer was resolved with explicit generic types and a typed equality helper; subsequent simulator compilation passed (`/tmp/hoosh-ios-c03-verified-build.log`).

- Final-source build including SDK-visible restriction readback passed (`/tmp/hoosh-ios-c03-complete-build.log`). No physical app was installed or production account data changed.


### November 19 — C04 compiler checkpoint; activation remains gated

- Added `ProtectionSchedules.swift`, a native Foundation-only weekly/quest compiler following the existing backend/Android policies: Monday-based weekdays, saved time zone, overnight ownership, half-open windows, first-date/repeat/version-effective bounds and stable per-occurrence reason IDs. It preserves a matching active occurrence's old native selection snapshot and leaves unrelated reasons intact when one occurrence is canceled. Preview dictionaries contain only reason IDs and times.
- Boundary tests found Foundation's repeated-time matching alone did not resolve Lord Howe's half-hour fold as required. The compiler now derives candidate instants from the zone's actual offsets and round-trips wall components, choosing earliest start/latest end and clamping a gap to the first valid minute. New York gaps/folds/collapsed windows and Lord Howe's half-hour transition pass.
- Added read-only native `schedulePreview`. Its response explicitly says preview-only, activation unavailable, and elapsed-session expiry unverified. Candidate padded monitoring envelopes retain the true business start and expiry while meeting the documented minimum interval. This is a scheduling candidate for a physical spike, not proof of callback delivery or installed restrictions. No normal-app Apply action or complete iOS protection port was enabled.
- Added [the method-level C04 feasibility matrix](ios_c04_feasibility.md), including primary Apple references and the remaining native installation, recurrence, receipts, session, bypass and recovery work. The physical iPhone is currently unavailable to tooling. Its required timing spike remains open; the approved elapsed policy has not been replaced with pilot active-use accounting or a different session duration.

C04 is **in progress**. Compiler/model checks passed; actual DeviceActivity/ManagedSettings installation, durable session budgets/deadlines, recurrence callbacks, typed weekly/quest readback, uncertain-install recovery and signed-device timing remain to implement/verify. Do not treat a bounded preview as indefinite recurrence or move this checkpoint to completed enforcement.


### C04 continuation — session policy model; phone test deferred by user

- User explicitly chose to keep activation gated and test on an iPhone later. Continued independent native model work; that decision is not a successful timing test and does not enable the iOS product port.
- Added `ProtectionSessions.swift`: bounded, serializable native-only per-app sessions, reason-scoped grants and saved-zone day counters. A running session keeps its deadline when another reason begins, without another charge. Separate apps keep separate clocks. Midnight does not extend a session; policy duration/count edits and scoped Stop preserve history. Extra sessions remain available and are marked exhausted only at their start. Wall rollback/reboot invalidate exemptions; counters cannot move to an earlier day. Policy timezone migration is explicitly refused when history exists. Decoder bounds reject corrupt durations before arithmetic.
- Native model checks passed these behaviors, serialization and corrupt-duration rejection. The model currently has no independent disk path and is not yet wired into the owner store or OS callback driver. A real boot/continuous-clock adapter, atomic installation/receipts/recovery, actual recurring monitors and elapsed bypass callbacks remain C04 work. C05 rewards/History are not implemented by these models.

- Native verification: pinned CocoaPods deployment and simulator-signed Debug compilation including the compiler and session models passed (`/tmp/hoosh-ios-c04-model-build.log`). No iPhone was installed or changed. Activation remains gated per the user's decision.

- Final-source incremental simulator build passed as well (`/tmp/hoosh-ios-c04-model-final.log`). This checkpoint is compiler/session model work, not completed C04 enforcement.


### C04 continuation — owner-scoped transactions and recovery

- Added typed native runtime/quest/monitor records and an owner-scoped session ledger to the existing single App Group store. Schema v2 is read alongside v1; only a successful atomic write upgrades a v1 header. The file stays at `state-v1.json` deliberately: an older shared-host reader must encounter and reject the newer header rather than mistake a new filename for an empty installation. No pilot/anonymous records are imported. No live device data was migrated in this work.
- Added `ProtectionTransactions` with a required verified lease, expected installation revision, reviewed saved-selection revision and SHA-256 command fingerprints bound to those revisions. Pending intent is durable before SDK mutation. A receipt is written only after the injected driver's exact readback; the production iOS driver is still absent/gated. Same-ID retries cannot change payload or charge/reset session history. Changed payloads, stale revisions and competing pending requests fail explicitly.
- Lost commit acknowledgment and partial installation retain a recoverable pending request and the previous confirmed record. Explicit recovery rechecks SDK state before reinstalling; a matching target is acknowledged without another install. The commit copies the latest owner ledger under the same cross-process lock, applies policy without resetting counts/deadlines and retires only grants for removed reasons. A receipt alone cannot report installation if SDK state no longer matches.
- Device takeover clears pending installation, retires the previous configuration and grants, and retains that account's session/day history and receipts privately. Neutral installation review now exposes `installation_pending` for explicit Stop/reconfigure; the C03 status projection treats pending/enabled runtime state as degraded, not active.
- Added the exact same Foundation schedule/session/transaction source files to all three enforcement/presentation extension targets so schema v2 is decoded consistently. The driver protocol has no production success implementation, and the full iOS product port remains unregistered. No SDK calls occur when the injected activation capability is off.
- Transaction fault-injection checks passed gated no-op, durable intent before SDK, lost commit recovery without duplicate install, receipt/payload fencing, independent readback, partial failure, latest-ledger preservation, account replacement/takeover and v1 failed/successful migration. The driver in these tests is explicitly a model, not a device enforcement proof. Existing storage/selection checks passed. TypeScript and 26 focused review/boundary/setup checks passed; focused ESLint passed.

C04 remains in progress: a real DeviceActivity/ManagedSettings driver, stable native clock/boot adapter, recurring callbacks, shield grant/reentry handling, exact weekly/quest bridge projections and full port registration still require implementation and verification. Activation remains gated as requested; physical timing proof stays open.

- Native build verification: pinned CocoaPods deployment and simulator-signed Debug compilation passed, including all three extensions with the shared v2 model sources (`/tmp/hoosh-ios-c04-transactions-build.log`). Final storage/selection and transaction fault-injection checks passed. No production driver was enabled and no physical device was installed or migrated.
