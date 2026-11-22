# C04 iOS feasibility and implementation checkpoint — November 19, 2026

This is a source/model checkpoint, not approval of an installed iOS policy.
C04 remains in progress. The physical C01 spike is a prerequisite for claiming
elapsed session/bypass behavior. The connected device inventory currently lists
the physical iPhone as unavailable; simulator builds cannot close this gate.
The user chose to keep activation gated and defer the phone test; independent
compiler/session-model work continues without treating that deferral as evidence.

## Contract-by-contract state

| Shared behavior/method | Current evidence | Remaining before registration |
|---|---|---|
| `schedulePreview` | Native saved-zone compiler; yesterday through seven days ahead; summary-only window output | Native bridge runtime check; metadata is explicitly preview-only |
| Weekly `scheduleRead`/`scheduleApply`/reason-scoped Stop | Weekly window compilation and cancellation/overlap model checks | Typed runtime persistence, CAS, stable receipts and recovery now exist; gated OS driver/readback and callback recurrence now exist; method-specific bridge is wired; signed physical recurrence verification remains |
| Quest `questRead`/`questApply`/`questCancel` | Version bounds, first dates, recurrence, stable reason IDs and cancellation compiler checks | Typed quest versions/cancellation records and transaction storage now exist; gated OS registration exists; mutation builders and typed bridge readback are wired; signed physical verification remains |
| Saved selection snapshots | Model preserves a matching active occurrence's previous token snapshot; future occurrences use the newly applied snapshot | Persisted snapshots feed the gated shield union; physical selection-change/overlap verification remains |
| Per-app session count, reentry, concurrent apps, policy edits | Serializable native model checks pass for saved-zone buckets, reused deadlines, scoped grants, extra sessions, policy edits and rollback/reboot invalidation | Owner-scoped v2 storage/transaction commits retain the ledger; native continuous-clock/boot helper now exists and passes host sampling; action callbacks are wired behind the gate; iPhone access and real action/expiry verification remain; no usage-minute substitution |
| Native elapsed expiry while target stays foreground | Candidate padded expiry alarms and gated SDK/callback wiring; no physical timing evidence | Signed-device probe, measured callback/shield outcome and explicit unsupported result if the required behavior cannot be demonstrated |
| Bypass under overlapping reasons | Model cancels one reason while retaining others | Token-specific action wiring and durable grants implemented behind the gate; physical overlap/reentry verification remains |
| Offline/JS-absent operation | Shared App Group and extension fencing exist from C02 | Gated schedule/action callbacks and allowance recovery implemented; process termination/offline/device checks remain |
| Full `ProductNativePort` / scheduling capability | C04 core/quest port is registered per verified owner lease; iOS schema-4 projection is decoded separately, with no invented Android service/overlay access | Activation remains compiled off pending signed-device acceptance; C05 owner-scoped allowance event transport is now available; confirmed quit/day-coverage producers and aggregate iPhone measurements remain unavailable |

## Apple constraints and candidate approach

- Apple's monitoring interval minimum is **15 minutes**. That constrains the OS
  monitor envelope; it does **not** by itself prove that a five-minute session is
  impossible. [Apple: intervalTooShort](https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter/monitoringerror/intervaltooshort)
- Apple's interval callbacks are tied to device use, and its documentation gives
  the scheduled boundaries as earliest callback points. Precise callback delivery
  while continuously using the selected app needs physical proof.
  [Apple: intervalDidEnd](https://developer.apple.com/documentation/deviceactivity/deviceactivitymonitor/intervaldidend(for:))
  [Apple: nextInterval](https://developer.apple.com/documentation/deviceactivity/deviceactivityschedule/nextinterval)
- A **candidate**, not validated behavior, is to pad the OS monitor start backwards
  while preserving the actual business start and expiry. For a future short
  restriction, an end warning could mark its real start; an ongoing session would
  rely on the end callback. A padded interval must never start shielding early or
  extend the user's session. [Apple: schedule initialization](https://developer.apple.com/documentation/deviceactivity/deviceactivityschedule/init(intervalstart:intervalend:repeats:warningtime:))
- The compiler's 512-window bound is a contract/memory bound, not an assertion
  about the OS monitor capacity. Native installation must handle excessive-activity
  and partial-registration errors and cannot register a finite preview as an
  indefinite recurring plan.
- Starting a monitor for an ongoing interval can invoke its callback immediately.
  Consequently, a durable pending installation and extension coordination must
  exist before invoking the OS. A finite list of preview dates is not indefinite
  recurrence. [Apple: startMonitoring](https://developer.apple.com/documentation/deviceactivity/deviceactivitycenter/startmonitoring(_:during:events:))

No policy change to 15-minute user sessions has been made. No active-use threshold,
notification, foreground JS timer or pilot daily cap has been substituted for the
approved elapsed allowance.

## Required physical spike, before enabling activation

Prepare an explicitly diagnostic signed build and identify its bundle ID and data
impact before installation. The shared host currently has the Swift pilot's bundle
ID; installation on the same phone can replace that app. Do not silently replace
the user's pilot, relink its identity or import its records.

Verify the real native picker/access first. Then an isolated timing harness must
measure short and longer grants while a selected target remains foreground, reentry
without extending a deadline, app switching, lock/unlock, host termination and offline
expiry. Repeat for overlapping weekly/quest reasons and Stop during an ongoing
interval. Record requested deadline, native callback time and observed shield time
separately. A registration success is not shield-expiry proof. The diagnostic
harness is still to be implemented; there is no normal-app C04 Apply button yet.

If a required behavior cannot be demonstrated, document it and obtain an explicit
product decision before changing semantics. Do not mark C04 or C06 complete on the
basis of the compiler tests.

## Reproducible compiler checks

From the repository root:

```sh
swiftc apps/mobile/modules/hoosh-screen-time/ios/ProtectionSchedules.swift \
  apps/mobile/modules/hoosh-screen-time/tests/ScheduleChecks.swift \
  -o /tmp/hoosh-schedule-checks
/tmp/hoosh-schedule-checks
```

Checks cover Monday-based start dates, overnight windows, half-open ends, New York
DST gap/fold/collapsed windows, Lord Howe's half-hour fold, quest effective version
bounds, single-occurrence cancellation, overlapping reasons, active snapshot
preservation, invalid input and candidate padded envelopes. Synthetic selection
bytes are test fixtures, not real app tokens or evidence of OS enforcement.


## Session model checks

```sh
swiftc apps/mobile/modules/hoosh-screen-time/ios/ProtectionSessions.swift \
  apps/mobile/modules/hoosh-screen-time/tests/SessionChecks.swift \
  -o /tmp/hoosh-session-checks
/tmp/hoosh-session-checks
```

The serializable model reuses unexpired per-app sessions for newly starting reasons,
caps grants to reason ends, keeps separate app clocks, charges a midnight-crossing
session to its starting day, retains counters/deadlines on edits and scoped Stop,
invalidates exemptions on rollback/reboot, and marks an extra session exhausted only
when it starts. A timezone change with retained history requires migration. Corrupt
serialized durations are rejected. It has **no independent disk path, no OS timer,
owner-store wiring through the transaction core only (action callbacks pending), no reward producer and no installation acknowledgment**.


## Transaction and migration checks

The shared store now reads v1/v2 and writes v2 atomically on its existing path.
Older shared-host v1 readers reject header v2. This does not claim that the separate
Swift pilot understands this store or that a downgrade over retained data is safe.
No physical app was installed in this checkpoint.

```sh
swiftc apps/mobile/modules/hoosh-screen-time/ios/SharedProtectionStore.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionSchedules.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionSessions.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionTransactions.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionRuntimePlanner.swift \
  apps/mobile/modules/hoosh-screen-time/ios/ProtectionInstallation.swift \
  apps/mobile/modules/hoosh-screen-time/tests/TransactionChecks.swift \
  -o /tmp/hoosh-transaction-checks
/tmp/hoosh-transaction-checks
```

The test driver is a model used to inject partial SDK state and lost acknowledgments.
It is not registered in the app. A real driver must verify exact scoped schedules,
settings and permission, preserve unrelated reasons, and reconcile stable names.
Activation capability is checked before any write. The transaction core does not
invent a working expiry adapter or acknowledge production installation on its own.


## November 20 — SDK and clock smoke checks

Run `scripts/check-ios-adapter.sh BOOTED_SIMULATOR_UUID` on a Mac with Xcode and a
booted simulator. It builds temporary executables and removes them afterward. The
checks construct real SDK schedules and verify every mutation gate rejects before
SDK writes. No app installation, authorization prompt, monitor registration or
shield change occurs. Continuous-clock/boot sampling is host proof only.

The adapter deliberately has no production activation override. It is not yet the
`ProtectionInstallationDriver`: the owner runtime still needs recurrence refresh,
active-snapshot/grant union, action callbacks and typed weekly/quest bridge wiring.
Absolute monitor endpoints must be second-aligned. A later driver must explicitly
account for SDK granularity while retaining the exact private session deadline;
the adapter refuses to silently round it. Raw boot/time signals must stay on-device.


## November 20 — Gated driver checkpoint

The native schedule/shield driver now exists, with recurrence rematerialization and
exact SDK readback. It remains disabled by the compile-time gate. This does **not**
complete the elapsed-expiry feasibility gate: expiry alarm creation and extension
callback/action wiring are still outstanding. The full product port is unregistered.
Run the expanded `scripts/check-ios-adapter.sh BOOTED_SIMULATOR_UUID` for model and
SDK checks. Native device allow/deny/revoke, sleep/reboot, foreground expiry,
monitor capacity and signed release checks remain deferred. No physical install.


## November 20 — Candidate expiry and extension dispatch

Native monitor start/end/business-start warning callbacks now dispatch shared-owner
names to the current persisted generation. Expiry alarms are derived from live
per-app grants; equal deadlines share one alarm. Candidate alarm endpoints round
up to the next SDK second (at most 999 ms), while private wall/continuous deadlines
remain exact and unchanged. This **does not prove** exact shield reapplication:
OS callback delay, clock changes, sleep, reboot, termination and foreground delivery
remain physical acceptance items. Activation is still compiled off.

The native action coordinator persists the allowance before any shield removal,
then installs and reads back shields and alarms under the shared store lock. A
failed SDK operation or lost acknowledgment leaves recoverable desired state;
retries within the live grant reuse its count/deadline. A failed operation can
consume the allowance without opening the app until recovery; no refund/reset is
invented. Pending installation/claim, wrong owner or stale generation rejects the
action. Rendering a shared shield reads remaining time without recording a quit,
reward or session. This is neutral native fallback copy, not final Figma/nudge UI.

The full iOS product port and method-specific weekly/quest bridge remain unfinished.
The new path is gated; unclaimed installations retain the fenced legacy path.


## November 20 — C04 bridge implementation complete; device acceptance open

`runtimeRead`, `runtimeApply` and explicit `runtimeRecover` are connected through
the verified owner boundary's existing lease. Weekly and generated quest metadata
use native command builders, expected installation/selection revisions, canonical
request IDs, exact SDK readback and pending recovery. The iOS schema-4 status
projection is distinct from Android; unsupported overlay/service fields normalize
to false and are never used as iOS authorization evidence. Settings, onboarding
review and quest lifecycle use the scoped port. Read/preview never installs.

The state header is now **v3**, at the same locked `state-v1.json` path. Reads of
v1/v2 do not migrate; the next successful atomic write upgrades. An explicit
weekly-enabled flag prevents weekly Stop from stopping quests or being mistaken
for a still-active weekly plan by a downgraded shared binary. Older shared binaries
reject the newer header. Quest-specific request receipts remain scoped; account
Stop/reconfigure retires rule flags without resetting counts or silently resuming
old quests on reclaim. Account schedules remain canonical on the server.

The source implementation does not close physical C01/C04 acceptance. The gate is
still false, protection capabilities are not advertised as verified, and no physical
app has been installed. Browser review verifies draft inputs and honest gated UI;
it does not emulate FamilyControls, OS shielding or successful device activation.
See [localhost and later-device checks](ios_c04_localhost_verification.md).
