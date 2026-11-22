# Integration 04 — Swift protection in the shared React Native iOS application

**Lead:** Anisha. **Contract/backend/Android reviewer:** Ishmum. **Status:** C01 simulator host passed; C02 transition and C03 selection/permission source and automated checks implemented. Release, physical signing/feasibility and C02 signed-device acceptance remain open.
**Prerequisites:** BASE-C04 interfaces for initial audit; BASE-C06 before landing
host integration. AUTH and ONB handoffs are needed for the final normal journey.
**Notes:** `docs/integration_notes/plan_04_ios_native_integration_notes.md`.

## Outcome and non-equivalent existing implementations

Produce one React Native iOS app using the real Swift protection/extensions, the
same Supabase session producer and the same FastAPI product contracts as Android.
Retain native enforcement while JS/API are absent. A standalone SwiftUI pilot
with its own anonymous enrollment and database sync is not this integration.

Inspected teammate source includes `DisconnectApp.xcodeproj`, `DisconnectApp/`,
`SharedProtection/`, `SharedPresentation/`, `Disconnect/` report extension and the
DeviceActivityMonitor/ShieldAction/ShieldConfiguration extensions. Its local Expo
`HooshScreenTime` module exposes **authorization only**. Base
`src/infrastructure/native/product-ports.ts` returns null outside Android; the
shared generic `ProtectionService` alone does not implement the richer weekly,
quest, selection and business-event contracts the actual screens consume.

## Product versus pilot compatibility

| Concern | Shared product | Pilot code observed | Integration requirement |
|---|---|---|---|
| Identity | Non-anonymous Supabase account, verified `/v1/me` owner | Anonymous participant + optional password login | No native parallel Auth client; host receives credential-free verified owner context |
| Product data | FastAPI profile/settings/quest/rewards/History | Direct `legacy_swift_*` REST and research queues | Reuse approved schemas; no automatic legacy database migration |
| Session/bypass | Per-app elapsed timer, approved reason-scoped bypass beyond allowance | Active-use minute accounting, daily-minute cap and limited extra | Implement approved shared semantics where supported; never silently port cap/extra policy |
| Recurrence | Weekly plan + versioned recurring quests and overlaps | Native daily/session rules | Implement real compiled schedule/reason coordination and scoped Stop |
| History | Selected-app fixed baseline and explicit coverage | Previous-period report and pilot events | Support approved measurement only if feasible; otherwise truthful unavailable |
| Preferences | Friendly default, approved activity inputs | Tone/context/EventKit/research questions | Not enabled by this integration |

These differences are significant engineering work, not renaming fields. C01/C04
must resolve OS feasibility before promising parity. If a required protection
operation is impossible under supported APIs, record the exact constraint and
request a scoped product decision; keep that capability unavailable and the
relevant mandatory acceptance pending. Do not fabricate success or silently
declare a different behavior equivalent to finish the plan.

## Host, signing and storage decisions

- Prefer adding a normal RN/Expo host entry into the audited existing Xcode
  project while retaining native targets and shared stores. The pilot remains
  available in source/history; do not run two competing `@main` entries in one target.
- Use ordinary React Native/Expo host integration, not a new experimental embedded
  app architecture just to keep both dashboards alive. Generate reference host
  files only in a disposable copy if useful, then review ported changes.
- Inspected host bundle is `com.AnishaDasgupta.DisconnectApp`; App Group is
  `group.com.AnishaDasgupta.DisconnectApp`. These are source observations, not proof
  of current provisioning. Verify actual released/team identifiers and every
  extension's entitlement before changing or distributing anything.
- Keep extension targets free of React Native/SDK credentials. Swift workers and
  extensions coordinate through versioned App Group storage with cross-process
  locking, atomic commits and bounded data; actor serialization alone is not a
  cross-process lock. Secure credentials remain host-only in the Auth-owned store.
- Session owner strings are storage partitions, not OS authorization. Native
  boundary/handle/generation checks must reject stale writes and prevent A data
  from appearing under B without claiming cryptographic attestation of JS.

## Commit ledger

| Part | Intended commit | State / prerequisite |
|---|---|---|
| INT-IOS-C01 | `build(ios): establish audited React Native host and targets` | [Source audit and Expo reference](../integration_notes/plan_04_ios_native_integration_notes.md) recorded. Locked CocoaPods workspace, Debug build and simulator Auth screen passed. Internal Release and physical proof open. |
| INT-IOS-C02 | `feat(ios): add owner-scoped versioned protection storage` | Implemented in source: versioned store/leases, explicit Stop/readback/claim with retry, neutral legacy review and shared extension fencing. Automated isolation/crash/contention/claim checks passed. Signed-device Stop, permission and locked-device acceptance remain open. |
| INT-IOS-C03 | `feat(ios): bridge native selection and protection status` | Source implemented: native picker transactions, permission/status observation and shared setup controls. Automated checks and simulator build passed; real iPhone picker/permission and layout acceptance remain open. |
| INT-IOS-C04 | `feat(ios): integrate scheduled protection and quest lifecycle` | Implementation complete behind the physical activation gate: native commands, weekly/quest Apply/Read/Stop/cancel, native expiry/callbacks, CAS/receipts/recovery, owner-scoped iOS bridge and normal Settings/onboarding/quest consumers are connected. Schema v3 keeps weekly Stop independent of quests and prevents old binaries misreading it. Automated/source checks and localhost review are recorded in [verification guide](../integration_notes/ios_c04_localhost_verification.md). **Acceptance remains open**: signed physical-iPhone timing/permission/overlap/offline/reboot checks; activation remains off. |
| INT-IOS-C05 | `feat(ios): reconcile native events and product measurements` | Durable owner-scoped allowance evidence, bounded drain/ack and existing scoped reward sync are connected; iPhone History rejects stored Android usage as local measurements. Automated and simulator build checks passed. **Acceptance open:** no verified quit/complete-day iPhone producer, no approved aggregate History producer, physical lifecycle/retry checks pending. See the C05 entry in [implementation notes](../integration_notes/plan_04_ios_native_integration_notes.md). |
| INT-IOS-C06 | `test(ios): verify signed normal-app protection journeys` | Release simulator package verified: embedded Hermes JS, normal shared registration, expected extensions/signatures and preview/pilot isolation scan. Product inspector, seven fault checks and standalone/device runbook added. Isolated Release simulator startup/auth navigation/validation and status-bar correction verified; local API/PG17 fixture prepared with 287 DB tests passing. One real-account local save/recovery/session-and-draft relaunch verified; Observed A sign-out→distinct B login Home/Settings/setup separation passed with A data retained; native takeover and hosted persistence remain pending. **Device Release signing/provisioning verified:** host Apple sign-in and enforcing host/extensions Family Controls/App Group passed actual product inspection after profile refresh. **Physical acceptance deferred:** signed iPhone, real accounts/network, elapsed expiry, owner transitions and lifecycle remain pending; activation stays off. See [runbook](../qa/ios-shared-standalone.md). |

### INT-IOS-C01 — Host, target audit and early feasibility proof

1. Inventory project/workspace schemes, host/extension bundle IDs, App Groups,
   Keychain groups, deployment versions, provisioning, privacy manifests, embedded
   targets and existing stores. Resolve inspected mixed deployment settings against
   RN/Expo's supported minimum; do not lower targets to retain unsupported OSs.
2. Establish the installed SDK's supported Xcode/CocoaPods/Swift toolchain using
   lockfiles and official docs. Teammate's successful standalone Swift Xcode build
   does not establish Expo compatibility. Record exact working versions; avoid an
   unrelated framework upgrade during host migration.
3. Integrate an RN root/app delegate/Expo module autolinking into the preserved
   native project. Keep signed monitor/shield/report targets embedded and configure
   URL schemes/Apple Auth return handling with Plan 01. Add explicit Debug and
   embedded-JS internal Release build paths; only the host bundles Hermes/JS.
4. Exclude pilot `NativeAppFlow`, anonymous `NativeSupabase`, research REST,
   enrollment and SwiftUI dashboard entry from the shared host's boot path.
   Reuse native services by dependency, not by invoking the pilot's root lifecycle.
5. Spike the highest-risk approved behaviors on the supported physical OS: native
   elapsed allowance expiry while target remains foreground, reason-scoped bypass,
   weekly/quest interval overlap and extension-only callbacks. Record platform
   scheduling limits, delayed callbacks and shield action affordances. A simulator
   fake or notification is not proof that a native shield can implement them.
6. Produce a method-by-method feasibility/semantic matrix for shared ports before
   C04; do not hide active-use timing behind an elapsed-time method. Preserve
   existing Android behavior if shared interfaces need additive capability detail.

**Validation:** clean native host compile, expected extensions/signatures, root
Auth gate loads, native authorization module resolves, and focused native proof.
**Exit:** host foundation works; feasibility gaps have an explicit blocking effect
on their later feature rather than silently authorizing a substitute policy.

### INT-IOS-C02 — Safe owner and store transition

1. Define versioned native records for owner/project, selection revision, installed
   policy/reasons, allowance/deadline/day bucket, request receipts, cancellation,
   business-event journal and coverage state. Reuse stable existing formats when
   compatible; don't fork another competing installation-wide store.
2. Use one coordinated native state path shared by host and extensions, with
   atomic compare/read/write and cross-process exclusion. Define size bounds,
   corruption/new-version behavior, file protection and locked-device availability.
   Missing state is not the same as unreadable or incompatible state.
3. Bind the host to a verified product owner through the existing owner boundary;
   lease tokens expire on sign-out/session replacement/bridge destruction.
   Reads or login cannot reassign a store, install rules or expose prior owner's data.
4. Retain installed rules at sign-out, preserve event attribution and fence old
   drafts/writes. Implement confirmed device claim that stops previous-owner rules
   before allowing B's new install, preserving A's private records. Failed claim
   remains recoverable without claiming B owns A's events.
5. Audit existing pilot installation state. No automatic anonymous-UUID → product-
   UUID linkage, no email match, no event/usage/reward backfill. Show a neutral
   legacy-installation review/explicit Stop/reconfigure path without leaking
   participant identity. Keep old storage until a safe disposition is acknowledged.
6. Implement upgrade/version tests, interrupted migration and failed atomic write
   recovery. Migration reads old valid state and writes/readbacks new state before
   retiring old data. Corruption cannot become empty/unrestricted or be overwritten
   just to boot the app; provide recovery with owner-visible consequences.

**Validation/exit:** multi-process contention, crash at write boundaries, A/B lease
fencing, locked reads and migration fixtures prove isolation/persistence without
network or JS. No account-deletion endpoint is added here.

### INT-IOS-C03 — Selection transaction, permission and status adapters

1. Implement native `FamilyActivityPicker` presentation under the active host,
   selection draft → confirm → explicit Save → readback semantics compatible with
   `selection-editor.ts`. Tokens and native app-label/icon views remain native;
   JS receives counts/revisions/handles only. Categories/domains are disabled or
   clearly unsupported for current individual-app scope.
2. Cover Cancel, interactive dismissal, background, permission loss, stale draft,
   competing editors, owner replacement and save acknowledgment loss. Equality is
   native token-set equality, not count equality. Save does not install protection.
3. Bridge actual `AuthorizationCenter` status/request and foreground rechecks.
   Denial/revocation and missing entitlement/module errors are distinct from a
   successful grant. Never prompt implicitly on startup or infer grant from Settings.
4. Expose validated installed-revision/reason/status and observer invalidation.
   Current OS permission + native readback determine active state; a settings row
   or remembered boolean does not. Include stale/partial/error status and Stop path.
   Add a strict iOS status decoder/projection: the existing
   `decodeInterventionProtectionRead` rejects anything except Android/overlay with
   fixed capability flags. Do not weaken its validation or label iOS as Android.
5. Add platform-specific `product-ports.ios.ts` and protection registration using
   the BASE contract. Register a feature group only when all required methods and
   semantics exist. Before C04 supplies required quest/core methods, keep richer
   protection unsupported rather than coercing a partial module into `ProductNativePort`.
6. Reuse shared setup/Settings controls from ONB; platform-only label rendering can
   use a small native view. Do not build a second RN app picker from token strings.

**Validation:** Swift bridge tests, decoder tests with malformed/partial responses,
simulator UI layout, and actual iPhone grant/deny/revoke/picker Save/Cancel. Simulator
picker substitution must remain labelled and DEBUG-only. **Exit:** selection and
status are real, summary-only and correctly capability-gated.

### INT-IOS-C04 — Native schedule/quest engine and installation semantics

1. Implement weekly preview/apply/read/stop plus versioned quest apply/read/cancel
   from the current shared port and generated server schedule versions. Enforce
   native expected revision, saved selection revision and stable request receipts.
   Native readback acknowledges installation; API Save is never an activation.
2. Coordinate weekly and recurring-quest reasons in a single registry/store so one
   Stop does not remove another reason's shield. Preserve active occurrence app
   snapshots; future occurrences use the explicitly installed global selection.
3. Adapt existing ManagedSettings/DeviceActivity/shield services to the approved
   per-app session count/duration and elapsed deadlines. Reentry, simultaneous
   apps, midnight saved zone, DST boundaries, travel, clock changes and reboot
   follow reviewed product policy where implementable. Preserve counts/deadlines
   during policy edits; don't import the pilot's usage-minute cap/one-extra rule.
4. Native bypass applies to the selected app/current active reasons and expires
   natively. A newly starting reason can prompt independently. Do not promise
   unrestricted exact foreground detection if Apple exposes only coarser signals;
   unsupported semantics remain gated per C01, with explicit product review.
5. Keep host/extensions credential-free for enforcement and work without JS/API.
   Observe extension memory/time/schedule limits and bounded journals; no polling
   JS timers or reliance on a background network/AI request to remove/reapply a shield.
6. Handle partial monitor/store installation with read/reconcile and explicit
   recovery. Preserve a confirmed previous installation where safe; if OS state
   cannot be confirmed report degraded. No automatic retry/reset of daily budgets.
   Stop must remain reachable independently of a failed online profile fetch.

**Validation:** policy/model tests and signed iPhone elapsed expiry, overlap,
reason-scoped Stop, offline host termination, recurring boundaries and uncertain
write recovery. **Exit:** required methods perform the reviewed behavior; physical
capability gaps cannot be passed by testing a different pilot policy.

### INT-IOS-C05 — Event attribution, reward/History boundaries and recovery

1. Convert eligible native actions into the existing business event vocabulary,
   with stable installation/sequence IDs, originating owner/revision and evidence
   kind. Shield-render/notification requests are not confirmed quit actions.
   Unknown or unavailable mid-session actions yield no fabricated +30 award.
2. Implement bounded durable drain/ack with dedup/retry and gap/overflow counters.
   Host sync uses the existing scoped FastAPI client; no native credentials or
   direct pilot REST writes. Ack only after server acknowledgment; lost responses
   retry under stable IDs and can't duplicate credits or move A's events to B.
3. Verify source/coverage requirements for rewards/streaks; retain insufficient-
   evidence states. Never award points because a UI button was displayed or a
   missing journal was interpreted as a successful day.
4. Audit Apple measurement privacy/availability separately. Only expose approved
   aggregate selected-app usage if the OS/API permits it and coverage meets the
   fixed-baseline contract. Do not export raw tokens, app inventories or report
   internals; don't relabel the pilot's previous-period chart as the fixed baseline.
   Current server `HistoryPut`/`HistoryView` and RN HTTP/native decoders accept only
   `android_usage_events_v1`. iOS must not submit under that source or show a stored
   Android series as this iPhone's measurements. Default to unavailable until a
   valid producer exists. If supported aggregation is established in this increment,
   add an explicit source/series ownership contract, additive Alembic change only
   if required, generated types and both-platform regressions together; preserve
   existing Android baselines and never switch the series silently.
5. If approved aggregate collection is unavailable, keep shared History explicitly
   unavailable with a reason. Native report presentation, if retained, is separately
   labelled and does not populate backend measurements or a lifetime projection.
   Implement any real supported History start/stop/summary group coherently.
6. On return/permission loss/offline/reboot, reread native truth, close stale handles,
   reconcile installed status and flush owner-correct pending events. Sign-out
   cannot delete retained rules/journal; later sign-in to B cannot drain A as B.

**Validation/exit:** shared reward/history adapters pass strict decoders and loss/
duplicate/gap tests; actual physical action evidence is recorded. No research
telemetry table, fake usage or unsupported cross-platform parity is introduced.

### INT-IOS-C06 — Signed normal-app and packaged-device acceptance

1. Use the same RN routes/Auth/onboarding/backend as Android on an actual signed
   iPhone. Verify sign-in, picker, Save, permission, Apply, native intervention,
   temporary access expiry, Stop and return-to-app status without the pilot root.
2. Run with embedded JS/assets and Metro stopped. Exercise foreground/background,
   host termination, lock/unlock, permission revoke/regrant, offline/reconnect,
   reboot and scheduled/day boundaries using owned test data.
3. Check account A retained rules after logout, B sees no A data, explicit device
   claim, stale callback rejection and native events after account transition.
   Actual sign-ins are supplied privately; fixture identities are separate evidence.
4. Inspect archive/product bundle: expected host ID, extensions embedded/signed,
   shared App Group entitlements, module registration, callback routing, no test
   overrides or pilot anonymous enrollment boot path. Verify actual provisioning;
   store distribution entitlement is separate from successful development signing.
5. Check small/large supported iPhones, keyboard and large text for shared screens
   and native picker/status. Preserve basic accessibility; the separately deferred
   TalkBack work is not a new prerequisite for this iOS integration.
6. Record exact versions/SHA/build hash and failures, update native capability
   matrix and relevant core gates, then hand off to VERIFY-C05. A passing standalone
   Swift test report is supporting evidence, not completion of this new journey.

**Done:** real RN iOS host + required native protection behavior + owner-safe shared
product flow accepted on-device. Optional unsupported measurements are disclosed;
mandatory unimplemented protection behavior keeps its acceptance open.

## Technical references, rollback and release boundary

Use the installed-version instructions for
[Expo in an existing RN project](https://docs.expo.dev/bare/installing-expo-modules/)
and [custom native modules](https://docs.expo.dev/workflow/customizing/).
Track native files explicitly; don't regenerate the audited project in place.
Apple requires separately requested distribution capability for the app and its
Screen Time extensions; see
[Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement).
Development signing and simulator success do not establish distribution approval.

Rollback disables/reverts the new host/adapter coherently while retaining compatible
App Group readers and installed rules. Do not change production bundle/App Group
IDs, delete legacy participant data, clear Keychain wholesale or ship an older
extension that misreads a newer store. A genuine policy/OS blocker is documented
with affected operations and minimum viable alternative for product review;
Android integration continues independently.
