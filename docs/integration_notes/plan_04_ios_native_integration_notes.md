# Plan 04 — Shared iOS host and Screen Time

## Current resume checkpoint — November 22, 2026

- Branch `integration/shared-product`; current parent `ed263cc`. The owner has
  committed the earlier C06 checkpoints. This delta repairs short intro gestures;
  owner retains commit/push control. No merge/fetch or source-branch port.
- **C06 is partial.** Development device Release signing/provisioning and simulator
  packaging evidence passed. Physical C04/C05/C06 enforcement, native ownership,
  confirmed quit/day and lifecycle acceptance remain deferred. Activation is false.
  See [closeout checklist](../qa/ios-shared-standalone.md#c06-closeout-checklist).
- Prior observed simulator evidence includes local API save/recovery/relaunch,
  Settings edits, A→distinct B separation, native dark status-bar correction,
  maximum-text navigation repair and standard Home overflow repair. Compact SE3/
  iOS18.6 public auth validation/navigation and restart were also observed.
- Latest repair preserves the initial movement RN discards at pan-responder grant,
  so short upward gestures count toward the five-swipe fallback. Real RN responder
  boundary regression tests fail on old code and pass on the fix.28 intro component
  and15 unit tests, TypeScript and focused lint passed. Final Release build/product
  inspection passed; sanitized simulator receipt has current runtime source hashes.
- Only **Hoosh C06 Compact QA** has the new gesture package. Its signed-out synthetic
  state was reset by app reinstall; the owner subsequently reported that intro swipes progressed.
  The original **Hoosh C06 Release QA** keeps B signed in on the prior layout build.
  Full scroll reachability, provider/confirmation and remaining live
  account/native-owner checks stay pending; no credentials in chat/source.
- Existing isolated local FastAPI/PG17 fixture setup is unchanged. No hosted DB or
  physical phone accessed. The older device receipt proves native provisioning,
  not that the latest JS changes ran on a phone. Next physical journey requires a
  spare phone, reachable trusted API and the owner's installation decision.
- iOS plan ends at C06; next named handoff is VERIFY-C05. No C07 invented and no
  physical acceptance substituted by handler tests. Intended files staged when
  handed off, no commit/push performed.

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


### November 20 — C04 native clock and gated SDK primitives

- Added `ProtectionDeviceClock`: public Darwin continuous time (includes sleep), timebase conversion, and a native-only boot-session UUID query. Availability/format errors fail closed; it does not guess a boot identity or fall back to an awake-only clock. Boot identity and raw clock samples are never returned to JS or uploaded. Host sampling passed; iPhone sandbox availability, reboot/sleep behavior and release suitability remain device acceptance items. The kernel key is evidenced by [Apple's XNU source](https://github.com/apple-oss-distributions/xnu/blob/main/bsd/kern/kern_sysctl.c), not a guarantee of access on every physical OS.
- Added `ProtectionOSAdapter` SDK primitives for absolute UTC schedule construction, exact schedule/event readback, staging unique monitor names, cleaning up an uncertain attempted registration, explicit scoped retirement and individual-app shield readback. Staging preserves pre-existing registrations and never overwrites a conflicting confirmed name in place. Callers must hold the owner transaction lock; the primitives are not a complete policy driver. Second alignment is required rather than silently rounding an elapsed deadline. Native recurrence, union/grant computation, callback handling and weekly/quest bridge wiring remain to connect.
- All OS mutation entry points check a compile-time activation gate first; it is false and has no JS/env/preference override. A read-only, lease-scoped `deviceDiagnostics` method exposes only availability/counts, not ticks, boot UUID, monitor names, selection tokens or an active-enforcement claim. The full product port remains unregistered.
- Compiled the new sources into the host and three extension targets. Added extension privacy manifests for app-only/App Group preferences, own-container timestamps and on-device timers; retained the host's timer reason and added the App Group preference reason. [Apple's required-reason guidance](https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api) requires declarations in each executable's bundle. These declarations do not establish App Store acceptance or completed release verification.
- Added `scripts/check-ios-adapter.sh BOOTED_SIMULATOR_UUID`. It checks host clock availability and compiles/runs schedule-construction and mutation-gate checks against the real simulator SDK. It changes no monitors or shields. The SDK CLI binary was confirmed as IOSSIMULATOR/16.4 with SDK 27.2; a command-line sysroot metadata warning did not prevent the actual simulator run. These are SDK/gate checks, not a signed iPhone timing or shield-removal proof.

Activation remains gated per the user's decision. C04 remains in progress: assemble these primitives into the owner-scoped installation driver and recurring/action callbacks, connect correct iOS weekly/quest projections and register only complete capabilities, then perform the deferred physical timing/permission/recovery checks. No app was installed on the physical iPhone and no device protection was enabled here.

- Final verification: pinned CocoaPods deployment, initial and final simulator-signed Debug builds passed (`/tmp/hoosh-ios-c04-adapter-build.log`, `/tmp/hoosh-ios-c04-adapter-final.log`). The smoke script passed on final source. Parsed all four manifests and checked the built host plus all three updated extension bundles for timer and App Group reasons. No physical-device or production enforcement claim is made.


### November 20 — C04 gated native schedule/shield driver

- Added `ProtectionRuntimePlanner` to materialize active snapshots and the current/next registration from persisted weekly/quest definitions at native time. Monitor names are owner/generation/occurrence scoped. Dates advance beyond the preview horizon; changing materialized dates cannot change the reviewed policy, selection or configuration generation.
- Transaction preparation and recovery now resolve current dates, preserve the latest ledger, and reject any resolver that changes installation intent. Pending requests retain their original fingerprint/request ID; SDK state still must match before a receipt is committed.
- Added `ProtectionNativeDriver` to decode only individual native application selections, calculate the union of active reasons, respect existing per-app grants and compare actual scoped monitor schedules and shield state. Token keys reuse native token equality against retained ledger entries; no tokens or app inventory are exported. It stages candidates before retiring stale owner-scoped monitors. Recovery can replace an unconfirmed conflicting registration while preserving confirmed names.
- This is a gated checkpoint, not a completed enforcement engine. No normal-app activation is enabled. Session-expiry monitor creation, monitor/shield extension dispatch, correct weekly/quest JS projections and full iOS port registration remain next. The existing extensions still use their fenced legacy paths. Do not advertise this driver as active or rely on a grant expiring on-device yet.
- Added model checks for owner namespaces, recurrence across boundaries and beyond the preview horizon, immutable intent, stopped-state cleanup and recovery rematerialization. Expanded the SDK smoke script to compile the native driver and run transaction/planner checks. The driver and planner are included in the host pod and three extension targets.

- Verification: expanded planner/transaction/clock/real-SDK gate checks passed; storage/selection/owner-isolation checks passed. Pinned CocoaPods deployment and simulator Debug host plus extension build passed (`/tmp/hoosh-ios-c04-driver-build.log`). The CLI SDK smoke emitted its known sysroot metadata warning and ran successfully on the simulator. No SDK protection mutations or physical-device tests were performed.


### November 20 — C04 candidate expiry alarms and extension callbacks

- Added `ProtectionExpiryPlanner`: deduplicated owner/generation-scoped alarm candidates from live grants, with padded 15-minute OS intervals. SDK endpoints ceil to a second while exact private wall/continuous deadlines stay unchanged. This remains a timing candidate awaiting signed-iPhone proof, not a promise of precise foreground expiry.
- Added the lock/CAS-based `ProtectionRuntimeCoordinator`. An explicit per-app allowance is durable before the driver removes a shield. SDK failures leave desired state for recovery, retries reuse live grants without another charge, and readback must confirm shields and alarms before success. Claims, pending installations, stale generations and other owners are fenced. No counter reset or speculative refund is introduced.
- Added `ProtectionNativeEngine` and routed shared monitor start/end/warning/threshold callbacks to current native definitions. Application shield actions bind only that token's active reasons; Continue responds with defer only after SDK readback. Categories/domains fail closed for shared configurations. Claimed shared configuration can present remaining native session time without reading former-owner pilot answers or creating reward/quit events. The copy is a neutral native fallback, not completed Figma/AI nudge presentation.
- Activation remains compiled off, full iOS port unregistered and no physical installation performed. Next: method-specific weekly/quest bridge/projections, truthful capability registration and the deferred device checks. C04 remains in progress; C05 event attribution/rewards is separate.

- Verification: planner/transaction/coordinator fault checks, host clock checks and real simulator SDK/gate checks passed. Coverage includes durable grant before SDK, failed-install and lost-write recovery without double charge, owner/generation fencing, overlap/alarm deduplication, independent apps, expiry/reboot rejection and exact private deadlines. Pinned pod deployment and full simulator Debug host plus extension build passed (`/tmp/hoosh-ios-c04-callback-build.log`). The known SDK CLI sysroot metadata warning remains; simulator execution succeeded. No physical timing or active-protection proof is claimed.


### November 20 — C04 command bridge and shared app integration

- Implemented credential-free native `runtimeRead`/`runtimeApply`/`runtimeRecover` plus validated weekly Apply/Stop and generated-version quest Apply/cancel builders. Reads return metadata only, never selection tokens, boot identity, raw clocks or prior-owner data. Commands retain request IDs, expected revisions, selection revisions and canonical fingerprints; preparation/SDK recovery remain serialized under the owner store lock.
- Added schema v3 at the same single file/lock path. v1/v2 read compatibility is retained and upgrades occur only on successful atomic writes. The explicit weekly-enabled flag keeps weekly Stop independent of quests. Per-quest request IDs prevent another quest's receipt being used as acknowledgment. Retiring/reclaiming an account cannot silently resume its former quests; counts/session history remain retained. Explicit Apply installs the reviewed global selection for future periods, preserving already-active token snapshots.
- Bound the iOS core/quest port to the verified account's existing lease rather than opening competing owner sessions. Native reads use a separate iOS schema-4 decoder. Android overlay/service/disclosure access is not fabricated. Owner-boundary cleanup retires only that lease. Old installed bridges retain selection-only support; partial scheduling bridges remain unavailable.
- Connected the scoped port to normal account weekly review, Settings controls, onboarding review and quest lifecycle. Apply is disabled with an explicit iPhone-testing-pending status while activation is gated. Native writes independently enforce the gate. Pending requests expose explicit recovery; device Stop/reconfigure remains reachable for an owned pending installation without a successful online draft read. C05 events, rewards and usage measurements are not claimed by this work.
- Added the isolated `?review=c04` localhost page using real validation/status components. Live browser checks confirmed validation blocks zero sessions, overnight hours require the next-day flag, valid input yields a review confirmation, and iPhone Apply remains disabled. It is labelled browser-only and performs no account save or native mutation. [Verification instructions](ios_c04_localhost_verification.md).
- **C04 implementation is complete behind the gate; physical acceptance remains open.** No phone installation, entitlement change, device activation, commit or push was performed.

- Final verification: TypeScript passed; 661 unit tests passed; 64 focused iOS/Android component checks passed. The native check script passed command/recurrence/session/transaction/storage/owner-isolation checks, schema migration/rejection, real-SDK bridge metadata reads and mutation gates. Host continuous-clock availability passed; physical availability remains unverified. Full host/extension simulator build passed on final native source (`/tmp/hoosh-ios-c04-bridge-current-build.log`); isolated browser preview build passed. Full lint passed with four pre-existing warnings in unrelated files; focused changed-file lint passed cleanly. The known simulator CLI sysroot warning remains, with successful execution.


## INT-IOS-C05 — Durable evidence transport and honest iPhone History

Date: 2026-11-21
Owner / reviewer: Anisha / Ishmum
Branch: `integration/shared-product`
Commit message: `INT-IOS-C05: add scoped event sync and guard iPhone History`
Commit: Pending; parent `60008c2c09ad2d64396a3a28805be8ccb7f6ac74`.
Source provenance: new implementation over C04; existing shared reward API/transport
and owner lease are reused, no pilot-event or source-branch import.
Plan: [C05](../integration_plan/04_ios_native_integration.md#int-ios-c05--event-attribution-rewardhistory-boundaries-and-recovery).

### Changes and file inventory

Line ranges refer to this working source snapshot; resolve against its eventual commit.

| File and lines | Change and reason |
|---|---|
| `apps/mobile/modules/hoosh-screen-time/ios/SharedProtectionStore.swift`: 54–80, 153–156, 193 | Optional per-owner journal and schema v4 atomic migration. Old binaries reject v4 instead of silently erasing evidence; v1–v3 remain readable until a successful write. |
| Same file: 288–394 | Content-free allowance evidence retains native originating revision/evidence kind, stable installation/session UUIDs, strictly increasing sequence and timestamp, fixed stream timezone, max256 queue and max32 drain. Persist offered prefix before returning it; ACK only issued data after host server acknowledgment. Countered overflow/clock rollback/timezone mismatch is missing evidence. CAS + existing store lock, retention and owner checks protect concurrent host/extension access. |
| `apps/mobile/modules/hoosh-screen-time/ios/ProtectionRuntimeCoordinator.swift`: 55–58 | Atomically journal a newly consumed allowance with its existing ledger transaction. Retry/live overlap grants do not create another event. Consumption is retained even if later SDK installation/readback fails; it is not an enforcement or quit receipt. |
| `apps/mobile/modules/hoosh-screen-time/ios/HooshScreenTimeModule.swift`: 61–74 | Lease-verified read and ACK methods with bounded integer/UUID validation; native has no API credentials or REST sender. |
| `apps/mobile/src/infrastructure/native/ios-product-port.ts`: 4–5, 50–59 | Register optional transport only when both native methods exist. Validate current owner/token before and after async calls. Existing Home/History reward sync uses scoped FastAPI, validates batches and ACKs only after confirmed server response. No second sync loop. |
| `apps/mobile/src/infrastructure/native/ios-product-port.test.ts`: 72–92 | Missing capability, lease argument mapping, wrong owner/handle and late-result disposal regressions. |
| `apps/mobile/src/features/history/use-history.ts`: 1, 70–85, 133, 185, 236–245, 273 | iOS never reads/uploads Android series, matches it as local usage or exposes Android start/stop/access controls. Account-level explicit receipts remain available. |
| `apps/mobile/src/features/history/connected-history-screen.tsx`: 2, 23–27, 57 | Explicit unavailable iPhone usage explanation; suppress Android measurement metadata on iOS. Shared account receipts are labeled as such. Existing design unchanged. |
| `apps/mobile/src/features/history/connected-history-screen.test.tsx`: 16, 148–149, 383–395 | Existing Android collector scenarios explicitly use Android; added iPhone regression with an otherwise ready stored Android series and port. No collector call or local measured comparison is accepted. Runs in both platform projects. |
| `apps/mobile/modules/hoosh-screen-time/tests/RewardJournalChecks.swift`: 1–51 | Stable retry/restart, bounded overflow/drain/ACK, wrong installation/owner, future ACK, failed atomic writes, malformed cursor, clock/zone gaps and no private inventory/quit/day export checks. |
| `apps/mobile/modules/hoosh-screen-time/tests/RuntimeCoordinatorChecks.swift`: 47–49, 59 | Failed SDK installation still has one consumed-allowance receipt; retry cannot duplicate it. |
| `apps/mobile/modules/hoosh-screen-time/tests/StoreChecks.swift`: 74; `TransactionChecks.swift`: 136 | Update future-version rejection and atomic migration assertions for schema v4. |
| `scripts/check-ios-adapter.sh`: 21 | Include reward journal checks in existing native verification command. |
| `docs/integration_plan/04_ios_native_integration.md`: C05 ledger row | Record implemented scope and open acceptance, not full native completion. |
| This notes file: current checkpoint and C05 entry | Preserve source identity, decisions, every-file inventory, test evidence and remaining handoff. |

### Evidence and privacy decisions

Only allowance consumption has a supported producer in this increment. No shield
render, monitor callback, notification request or absent journal becomes a quit,
complete day or +30 credit. Unknown opening/session-end/mid-session context remains
unsupported; no positive quit reward is fabricated. No `day_closed` is emitted
without a verified full-day coverage source, so missing evidence cannot earn a
successful-day streak. Per-app allowance policy is unchanged.

Native revision and evidence kind remain local provenance; only the existing
approved `RewardBatch` shape crosses the bridge. No raw app token, selection bytes,
app inventory, owner identity or native report internals are in that batch. The
verified scope supplies account identity to existing FastAPI. Sign-out/takeover
retains each owner's queue; a different account cannot drain/ACK the previous one.
Overflow discards oldest evidence and increments the existing server gap counter.
Clock rollback and policy timezone changes skip unverifiable dated events and
record gaps rather than rotating installation IDs or resetting counters. Gaps
reach the server with the next nonempty batch; an all-gap/empty queue is not a
successful covered day. The existing API requires nonempty batches.

Apple's [DeviceActivityReport documentation](https://developer.apple.com/documentation/deviceactivity/deviceactivityreport)
explains the report extension sandbox and restrictions on moving sensitive
content outside it. No approved producer meeting this app's fixed-baseline/export
contract was established. Therefore History stays unavailable on iPhone rather
than exporting report internals or submitting as `android_usage_events_v1`.
The pilot's report and telemetry are not reused as account measurements.
No server schema, generated contract, migration or Android baseline changed.

### Validation

All commands below ran on this uncommitted C05 delta over the parent above:

- `npm run test:unit --workspace @disconnect/mobile`: **662 passed**, including
  existing scoped upload/no-ACK-on-failure, late-account ACK suppression and batch
  validation tests. Log `/tmp/hoosh-ios-c05-unit.log`.
- `npm run test:components --workspace @disconnect/mobile -- --runTestsByPath src/features/history/connected-history-screen.test.tsx src/features/rewards/rewards-home.test.tsx`:
  **40 passed / 4 suites**, Android and iOS projects. Log `/tmp/hoosh-ios-c05-components.log`.
- `services/api/.venv/bin/python -m pytest services/api/tests/api/test_rewards.py -q`:
  **13 passed**. Schema validation only; no hosted/database upload claim.
- Mobile TypeScript and focused ESLint passed (`/tmp/hoosh-ios-c05-types.log`,
  `/tmp/hoosh-ios-c05-lint.log`).
- `scripts/check-ios-adapter.sh 29D9D520-2FEF-4AC5-9262-91D90E548282`:
  model/store/transaction/command/selection/claim/clock/journal checks passed;
  real simulator SDK construction and mutation gates passed. No OS protection
  installed. Log `/tmp/hoosh-ios-c05-native.log`.
- Existing shared workspace Debug build passed with simulator ad-hoc signing,
  `Hoosh Shared Host C01`, `.native-dev/ios-shared-derived`, pinned packages and
  `CODE_SIGN_IDENTITY=- CODE_SIGNING_REQUIRED=NO ONLY_ACTIVE_ARCH=YES`.
  Log `/tmp/hoosh-ios-c05-build.log`. This is compilation, not an installed journey.

An initial check caught a test missing its router focus context; the iPhone History
fixture now tests History without unnecessarily mounting Home outside a router.
An initial native probe caught a missing CAS expected revision; corrected and the
full affected native checks rerun successfully. An overlapping edit invalidated
one intermediate compile; final native checks and build passed on settled sources.

### Remaining / handoff

C05's safe transport and unsupported-History path are implemented. C05 acceptance
remains open for verified quit/complete-day producers and physical permission,
offline, reboot and retry evidence. Existing foreground/native status readers
continue rereading installed truth; no missing journal is a verified protection day.
Host upload still needs the normal signed account/device flow with real server
acknowledgments. Gate stays off; no C04/C06/device/release acceptance is claimed.

Do not roll back to a pre-v4 writer against a v4 store; those binaries deliberately
fail closed. No data cleanup/reset is authorized. User handles commit and push.


## INT-IOS-C06 — Standalone packaging preparation; physical acceptance deferred

Date: 2026-11-21

Owner / reviewer: Anisha / Ishmum. Branch `integration/shared-product`.
Commit: Pending; parent `4f26c995ff102c623de59a9cd9718910d4e0cf22`.
Commit message: `INT-IOS-C06: prepare standalone package inspection and device acceptance`.
Source provenance: new verification tooling over the integrated C05 source; no
pilot feature port, provider configuration, identity/entitlement or runtime change.
Plan: [C06](../integration_plan/04_ios_native_integration.md#int-ios-c06--signed-normal-app-and-packaged-device-acceptance).

### Changes and file inventory

| File and lines at working snapshot | Change and reason |
|---|---|
| `scripts/inspect-ios-product.py`: 1–233 | Inspect actual .app identity/Hoosh title, normal Expo scene/callback, embedded JS and Hermes format, module registration, four extension identities/points, absent preview/pilot configuration and Apple signatures. Device mode requires matching, unexpired provisioning, signing teams and provisioned enforcement/App Group/Apple-sign-in entitlements. Output is redacted hashes/booleans; no profile contents, device IDs or credentials. Never installs a product or reports physical behavior accepted. Compatible with the local Python 3.9. |
| `scripts/test_inspect_ios_product.py`: 1–186 | Seven fault tests: simulator cannot masquerade as device acceptance, missing/preview JS, pilot config/root, callback/extension mismatch, invalid signature, valid device fixture and expired/foreign/missing-entitlement profiles. Mocked Apple commands prove validation behavior only. |
| `docs/qa/ios-shared-standalone.md`: 1–98 | Reproducible Release and inspector commands; device-only profile check, loopback limitation, owner installation decision before replacing pilot, private-account and full lifecycle/permission/expiry/owner handoff matrix. |
| `docs/integration_notes/ios_c04_feasibility.md`: capability table | Correct stale C05-absent wording: scoped allowance transport now exists; confirmed quits/day coverage and aggregate measurements remain unavailable. |
| `docs/integration_plan/04_ios_native_integration.md`: C06 ledger | Record packaging preparation and explicitly pending physical acceptance. |
| `docs/integration_notes/artifacts/ios-c06-simulator-product.json`: whole file | Sanitized actual artifact hashes, platform, signature/entitlement results and source SHA; no profile or credentials. |
| This notes file: current checkpoint and C06 entry | Record C05 owner commit, C06 source identity, implemented tooling, environment limits, actual evidence and next resource-dependent work. |

### Decisions and scope

The owner deferred physical iPhone testing, so no device installation is attempted.
The same bundle ID may replace the pilot; installation requires identifying the
build and obtaining the owner's decision first. Source activation remains false.
No new entitlement/profile, public exposure, hosted account mutation, App Store
submission, API endpoint change or simulated successful native action was added.

Release uses the existing normal Router entry and `export:embed` bundle phase;
Debug intentionally skips bundling. Presence-only checks found all three required
public environment names, but the API URL is loopback. That is a physical-device
connectivity blocker, not a reason to embed a guessed endpoint. Local values are
not copied into notes. The inspector does not claim API connectivity/provider
success, native expiry or account acceptance from a valid package.

### Validation and handoff

- Seven `unittest` fault checks passed using the local Python 3.9; Ruff check
  with `--target-version py39` passed on both new scripts.
- The existing Debug simulator product was actually inspected and rejected:
  embedded JavaScript is missing. This verifies the checker does not accept a
  Metro-dependent package as standalone.
- Release simulator build **passed** using the runbook command, Xcode 27.2,
  simulator SDK 27.2, pinned packages and existing derived directory.
  Log `/tmp/hoosh-ios-c06-release.log`. Embedded Hermes JS is present; this is
  not a Debug/Metro-dependent product.
- Actual `.app` inspector **passed**: expected Hoosh host, callback and shared
  scene, native registration, all four extension identities/points and valid
  ad-hoc signatures; no pilot private config/entry or known preview markers.
  The inspected tree contains 505 files. Sanitized receipt:
  [simulator product](artifacts/ios-c06-simulator-product.json).
- Embedded JS SHA256: `282885f6b22f6255b1f0696beaec437c4e437380d1a62f332cde77d76dbaa07f`.
  Product tree SHA256: `1221db4b5a33854b4ef28411434ae0bd7e39ac5c595846207f892523b2c3090a`.
- Actual simulator signature inspection does **not** contain device Family Controls,
  App Group or Apple-sign-in entitlements/profiles. These are explicitly false in
  the receipt, not inferred from source. This ad-hoc simulator product is not
  accepted as a provisioned phone build. No installation/launch was performed.

Physical signed normal-root login/callback/picker/permission/Apply/expiry/Stop,
Metro-absent launch, foreground/background/termination/lock/offline/reboot and A/B
owner/event journeys remain pending. C05 unsupported producers remain unsupported.
The runbook is the VERIFY-C05 handoff; no parent plan or release acceptance closes
from packaging inspection. No commit or push was performed by this increment.


### C06 continuation — device signing attempted; no account in Xcode

Date: 2026-11-21. Source/runtime remains the C05 parent plus the staged C06
inspection/runbook changes. User explicitly requested no commit/push until C06
is finished, and reconfirmed **continue without phone testing**.

- Read-only discovery showed a paired physical phone, but the installed-app query
  failed because it was locked and the developer disk image could not be mounted.
  **No installed-app inventory was obtained**; an empty result is not evidence that
  the pilot is absent. Device identifiers and private query output stay out of docs.
  After the owner deferred phone testing again, no further device queries were run.
- Attempted a normal signed **Release / iphoneos / generic iOS destination** build
  using the existing workspace, scheme, pinned packages and ignored derived folder.
  This does not install/launch on a phone. It failed before producing an accepted
  device artifact: host provisioning lacks the Sign in with Apple capability and
  `com.apple.developer.applesignin` entitlement already required by source.
- Retried the same build with Xcode's `-allowProvisioningUpdates` to refresh the
  existing approved capability/profile. Xcode reports **No Accounts: Add a new
  account in Accounts settings** and cannot refresh the stale host profile.
  Local log: `/tmp/hoosh-ios-c06-device-build.log`. No successful signing/profile
  update, new capability, identity change or physical installation is claimed.
- Required owner action: Xcode → Settings → Accounts → sign into the existing
  Apple Developer account privately. Do not send passwords/codes in chat. Then
  retry the device Release build and `inspect-ios-product.py --require-device`
  before any installation discussion. Do not remove Apple sign-in to bypass it.
- Signing is now a named C06 blocker in addition to physical acceptance and the
  loopback API endpoint. A successful refresh/device build would still not close
  permission/expiry/offline/reboot/A–B acceptance. Activation stays compiled off.

Only the checkpoint, this continuation entry, C06 ledger and runbook gate changed
in this continuation. No runtime source changed; earlier simulator/checker test
results remain applicable. Documentation diff checks rerun. All work stays staged,
uncommitted and unpushed; no additional test credentials or phone actions requested.


### C06 continuation — signed device Release and provisioning verified

Date: 2026-11-21. The owner completed Xcode sign-in. The same C05 runtime parent
and staged C06 verification delta were used; no runtime source or activation gate
changed. Prior no-account/profile failures above are historical and resolved.

- Retried the runbook's normal Release / iphoneos / generic iOS build with
  `-allowProvisioningUpdates` and pinned packages. **BUILD SUCCEEDED**.
  Log: `/tmp/hoosh-ios-c06-device-build.log`. No simulator ad-hoc signing overrides
  were used. Xcode refreshed provisioning for the already-approved capabilities.
- Ran `python3 scripts/inspect-ios-product.py .native-dev/ios-shared-derived/Build/Products/Release-iphoneos/DisconnectApp.app --require-device --output .native-dev/qa/ios-c06/device-product.json`.
  **Passed actual artifact inspection**: embedded Hermes JS, Hoosh identity/normal
  shared scene/callback/module registration, known preview and pilot isolation scan,
  four expected extension identities/points and all five valid signatures/profiles.
- Host signed/provisioned Apple sign-in, Family Controls and App Group are true.
  Monitor, shield-action and shield-configuration signed/provisioned Family Controls
  and App Group are true. The unused report extension has a valid profile/signature
  but no Family Controls/App Group entitlement; it remains unsupported as a shared
  aggregate History producer. No report-export or measurement capability is inferred.
- Sanitized [device artifact receipt](artifacts/ios-c06-device-product.json) records
  platform, source SHA, hashes and booleans only. JS SHA256:
  `eb70fa0d0c7ad05f97f5201054c1df45fc3ac0bd807efe1a334298202c04aca5`.
  Product tree SHA256:
  `2dda92a03b117511f352c1a173cb78562419f2b61004ed4b164f4843ca90124c`.
  399 files. Profiles, certificate/private-key material and device IDs are not recorded.
- No phone query after renewed deferral, installation, launch, app replacement,
  selected-app access, authorization prompt, provider login or API endpoint change.
  A provisioned package is not a device behavior, network, store entitlement or
  distribution approval claim. The current loopback API still needs replacement
  with a trusted reachable development endpoint before actual phone account tests.

File inventory for this continuation: new
`docs/integration_notes/artifacts/ios-c06-device-product.json` (whole file, sanitized
artifact evidence); `docs/qa/ios-shared-standalone.md` (current signing result and
reproducible normal device build command); C06 ledger in
`docs/integration_plan/04_ios_native_integration.md` (signing blocker resolved);
this notes file (current checkpoint and evidence/handoff). No code changed, so the
existing seven inspector fault tests and lint results remain applicable; actual
product inspection and documentation diff checks were run for this checkpoint.

Physical C04/C05/C06 and VERIFY-C05 acceptance remains deferred, as requested.
Activation stays false. All work remains staged, uncommitted and unpushed until
the owner chooses to commit; C06 is not marked fully accepted.


### C06 continuation — simulator UI and local backend

Date: 2026-11-21. Owner requested an isolated simulated phone, then confirmed no
running API was available and authorized creating a local development backend.
No physical test or pilot replacement is authorized by this continuation.

Implementation and exact evidence are in the
[simulator/backend runbook](../qa/ios-c06-simulator.md). This is independent
preparation and simulator evidence, not completed physical C06 acceptance.

| Changed file | Logical change / evidence |
|---|---|
| `apps/mobile/src/app/_layout.tsx`: 89, 101 | Native navigation owns system-text style: public dark screens use light; warm private screens retain dark; onboarding explicitly light. Fix observed simulator black-on-dark status bar. |
| `apps/mobile/src/app/(auth)/_layout.tsx`: 8 | Light system-text style for the native auth stack, matching its dark canvas. |
| `apps/mobile/src/app/(onboarding)/_layout.tsx`: 8 | Light system-text style for the dark onboarding stack. No questionnaire or protection policy changed. |
| `.gitignore`: 44–47 | Explicitly exclude `.native-dev/` toolchains/credentials/evidence and the private native Supabase plist. Earlier paths were untracked but not fully ignored; no existing data removed. |
| `docs/qa/ios-c06-simulator.md`: 1–106 | Actual simulator case matrix, input limitation, backend scope, isolated database setup, source/test evidence and safe start/stop handoff. |
| `docs/integration_notes/artifacts/ios-c06-simulator-product.json`: updated receipt | Reinspect rebuilt package and record three working layout source hashes; current UI evidence supersedes the earlier simulator JS receipt. |
| `docs/integration_notes/artifacts/ios-c06-backend-readiness.json`: 1–15 | Sanitized actual health/unauthenticated HTTP outcomes, PG17.11/migration/287-test result; live account save explicitly false. |
| This notes file and C06 ledger | Update checkpoint, ownership/request, staging and open physical/live-account acceptance. |

Validation: mobile TypeScript/focused lint; **94 routed component tests** across
Android/iOS; updated simulator Release build and actual product inspection; native
Device Hub observation showing corrected white system text; **287 PostgreSQL17
acceptance cases**, migrations/role/forced-RLS check; HTTP health200 and unauthenticated
identity/profile/settings401. All are current working-delta checks over C05 parent;
real account/native Screen Time/phone acceptance remains separately pending.

Initial Expo module scanning timed out at five seconds while compiling local
tooling; a retry succeeded without changing dependencies or bypassing the scan.
PostgreSQL source was verified against the official archive checksum. The local
cluster/config and logs remain ignored; credentials, Auth IDs and binaries are not
in the committed evidence. No new API implementation, cloud project, provider,
JWT shortcut, managed database migration or native activation was added.

Runtime at handoff: the fresh simulator is on login, API localhost8000 and PG
loopback55432 are running. Requested owner private test-account sign-in; do not
operate the simulator during that credential handoff. Live persistence must
respect the local test Auth FK prerequisite; no successful account save is claimed
from database fixtures. User retains commit and push control; no commit made.


### C06 — real-account simulator save/recovery/relaunch verified

The owner signed in privately, and authorized continued testing. Normal setup
activity selection, manual time editing, review and Save were exercised. Initial
403 correctly identified the isolated database's missing Auth FK prerequisite;
registered only the single simulator setup-key UUID in the guarded local fixture.
No credentials/session tokens read, no hosted writes, JWT bypass or RLS change.
Recovery via Check latest settings/Keep my edits succeeded; one settings row at
revision1 confirmed. Screen Time unavailable/deferred completion was truthful.
Home/Settings restored saved draft and session after process termination/relaunch.
History explicitly disclosed unavailable iPhone measurements; native Apply stayed
disabled. Details/limits: `docs/qa/ios-c06-simulator.md` signed-in continuation.

Changed files: that runbook (new observed sequence and local-FK scope),
`artifacts/ios-c06-backend-readiness.json` (real-save/revision/relaunch booleans),
this checkpoint/entry and C06 ledger (one-account acceptance only). No runtime
source changed; no repeat automated suite required for evidence-only updates.
Second-account/native/physical/provider/remaining layout acceptance stays open.
All intended changes staged; no commit/push. Local services and simulator Home
remain available for review; no physical-device actions performed.


### C06 — Settings edit and API service recovery

Observed local API outage without a claimed successful write or native activation;
restarted only the owned API. Normal simulator session editor saved a changed
count and restored it via a second successful Save. DB revision1→3 confirmed;
original test values restored. This is one-account live local persistence, not
physical/offline/lost-ACK or A/B acceptance. Second-account availability question
is pending with the owner; simulator remains signed in, local services running.

Changed: `docs/qa/ios-c06-simulator.md` (current save status and outage/edit evidence),
`artifacts/ios-c06-backend-readiness.json` (latest revision and editor recovery),
and this notes entry. No code changed, no additional automated suite required.
Diff check passed; all work staged and uncommitted. Local screenshot remains ignored.


### C06 — account-switch identity unresolved (November 22)

Real sign-out hid private routes; Google chooser opened. Owner reported another
Google account, but Settings still presented A identity/data. B identity not
confirmed: no pass or leakage claim. Dashboard browser access unavailable;66
focused callback/controller/account-scope unit checks passed. No runtime changes
or identity unlink/delete. Detailed follow-up in `docs/qa/ios-c06-simulator.md`.
Changed only these two evidence notes; staged, diff checks passed, no commit/push.


### November 22 — distinct-account simulator isolation verified

The earlier repeated identity was resolved when the owner confirmed the entered
email belonged to A. No session-switch or account-linking defect was established.
The owner then signed into a genuinely different account B privately. Settings
showed the different email; Home/Settings showed no saved activities, days, hours
or session draft from A. Setup offered Start setup rather than A's completed
progress. Returned B to Home without creating/editing its plan. Read-only local
DB check confirmed A's sole settings row remains at revision3 unchanged.

This passes observed A sign-out→B login UI/data/setup separation on the packaged
simulator with real Supabase Auth and the local API. It does not prove native
installation/journal takeover, B writes, a return-to-A login, hosted persistence
or physical protection. No credentials read, no identity deletion/unlinking, no
new Auth fixture inserted for B and no native permission changed. Screenshot
`second-account-empty-home.jpg` remains ignored locally. Updated sanitized backend
receipt and these two notes; no runtime change, documentation diff checks passed.
Everything stays staged/uncommitted. B remains signed in on Home; local services
remain running. Physical C06 acceptance remains deferred.


### November 22 — C06 simulator layout repairs

Continued packaged simulator acceptance; not a full C06/device sign-off. Fixed
collapsed tab labels at maximum Dynamic Type using definite adaptive row widths,
without capping font scaling or changing the standard navigation design. Native
maximum-size labels and Home→History navigation verified; moderate accessibility
text used2columns. Restored simulator text setting to its original `large`.
Standard Home overview overflow was then fixed with explicit zero flex bases and
shrink while retaining193:149 card growth; rebuilt Release visibly fits both cards.
B remains on Home; no plan edits, sign-out or physical-device operation.

Changed implementation:
- `apps/mobile/src/components/navigation/main-tab-bar.tsx` lines104–112,142 and
  expanded styles near198: definite available-width allocation replaces collapsed
  percentage flex basis, with one row per destination at the largest scales.
- `apps/mobile/src/components/navigation/main-tab-bar.test.tsx` lines152–201:
  existing measured-clearance/draft-retention case now runs at1.5/2/3.1 font scales.
- `apps/mobile/src/features/home/home-overview.tsx` lines193,282: explicit basis,
  grow and shrink keep the existing overview proportions within the native viewport.
- `docs/integration_notes/artifacts/ios-c06-simulator-product.json`: rebuilt final
  package receipt and exact working-tree source hashes.
- `docs/qa/ios-c06-simulator.md`: current matrix and detailed continuation evidence.
- `docs/integration_plan/04_ios_native_integration.md` C06 row: partial acceptance
  update. This notes entry records scope and boundaries.

88 focused Android/iOS component checks, mobile typecheck and focused lint passed;
full mobile lint0errors/4pre-existing warnings. Release builds and final product
inspection passed. Screenshots/build logs remain ignored locally; see QA note.
Gesture delivery/intro swipes, compact/all-page layouts, screen-reader acceptance,
packaged provider signup/confirmation and B→A/native takeover remain open. Physical
Screen Time acceptance deferred and `ProtectionActivationGate.enabled` stays false.
Local API/DB unchanged; no secrets staged, no commit/push.


### November 22 — C06 compact simulator and explicit closeout

Current source `08b3766`; no runtime changes. Added an isolated iPhone SE3/iOS18.6
simulator, preserving the original signed-in Release QA device. Fresh embedded
startup/Skip, signup name/email validation and keyboard avoidance, login/recovery
navigation, empty recovery validation and intro-not-repeated cold restart observed.
Only synthetic name/invalid email entered; no account/password/email action.
Maximum-text recovery requires scrolling; CUA gesture delivery remains inconclusive,
so full footer/intro gesture acceptance is still open. Restored default text and
left compact simulator at login. Current embedded JS/runtime source hashes match
the committed simulator receipt. Physical phone untouched; activation remains false.

Changed only:
- `docs/qa/ios-c06-simulator.md`: compact-device evidence and explicit limits.
- `docs/qa/ios-shared-standalone.md`: six-requirement C06 closeout checklist,
  identifying simulator, signed-product and still-missing physical proof.
- `docs/integration_plan/04_ios_native_integration.md`: corrected stale top status
  and added compact public-auth evidence to C06 ledger.
- This notes entry: scope and validation record.

C06 is not complete and no iOS C07 exists. Next named handoff is VERIFY-C05 after
required acceptance; do not move the gate or mark native enforcement passed to
advance numbering. Docs/source-receipt checks passed; no redundant runtime suite
run for evidence-only edits. Staged for owner commit/push, neither performed.


### November 22 — C06 native intro responder-grant repair

Found a gap beneath the prior mocked gesture tests: installed RN PanResponder
zeros movement at grant. Short upward gestures could be claimed but contribute
zero on release. Retain the initial displacement per responder, add post-grant
movement once, validate final direction and discard cancelled input. Existing
visual design, thresholds and routing remain intact.

Changed files and evidence:
- `apps/mobile/src/features/intro/IntroSurface.tsx` lines6–29: real responder fix
  and stable testID; no test callback/override or activation change.
- `apps/mobile/src/features/intro/Introduction-gestures.test.tsx` lines1–103: actual
  Introduction + installed RN responder handler traces for five short swipes per
  section, complete distance, final signup, finished-state disable, rejected axes,
  reversal and cancellation. No IntroSurface/PanResponder mock.
- `docs/integration_notes/artifacts/ios-c06-simulator-product.json`: new Release
  package/JS hashes and current IntroSurface/source hashes.
- `docs/qa/ios-c06-simulator.md`: before/after witness, tests, package and manual
  test handoff; `docs/qa/ios-shared-standalone.md`: current closeout state.
- `docs/integration_plan/04_ios_native_integration.md`: C06 ledger repair evidence.
- This notes file: replaced stale resume header and added this continuation.

New6platform regression cases failed against old code and pass after repair;
28 component/15 unit checks, TypeScript, focused lint and final Release build/
inspection passed. Installed on Compact QA only, observed normal login, then
reinstalled that signed-out disposable app to expose a fresh intro for the owner's
manual swipe check (pending). Original B simulator/physical phone/hosted DB untouched.
JS handler traces do not establish OS gesture delivery or native protection.
C06 remains partial; all intended files staged, no commit/push.


### Owner-reported intro result / independent verification handoff

Owner reports that scrolling progressed in the compact simulator, with laptop input
feeling unusual; requested a physical-device feel recheck. Record simulator intro
as owner-reported passed, not independently automated OS touch delivery. This is
Hoosh's intro, not a social-app intervention or Screen Time test. User then asked
to do simulator-capable work and move into other integration while phone checks
wait. VERIFY-C01 readiness is now recorded in the Plan05 notes/manifest; IOS-C06
physical protection/owner/lifecycle gates remain open and activation stays false.
