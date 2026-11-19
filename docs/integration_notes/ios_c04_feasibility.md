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
| Weekly `scheduleRead`/`scheduleApply`/reason-scoped Stop | Weekly window compilation and cancellation/overlap model checks | Durable installed definition, CAS/request receipts, OS registration/readback and indefinite recurrence; not implemented by this checkpoint |
| Quest `questRead`/`questApply`/`questCancel` | Version bounds, first dates, recurrence, stable reason IDs and cancellation compiler checks | Durable versions/cancellation ledger, OS registration and typed readback; not implemented by this checkpoint |
| Saved selection snapshots | Model preserves a matching active occurrence's previous token snapshot; future occurrences use the newly applied snapshot | Persist snapshots and connect them to enforcement, not just a preview array |
| Per-app session count, reentry, concurrent apps, policy edits | Serializable native model checks pass for saved-zone buckets, reused deadlines, scoped grants, extra sessions, policy edits and rollback/reboot invalidation | Wire model to owner-scoped atomic storage and a real boot/continuous-clock adapter; no usage-minute substitution |
| Native elapsed expiry while target stays foreground | Candidate padded DeviceActivity interval; no physical evidence | Signed-device probe, measured callback/shield outcome and explicit unsupported result if the required behavior cannot be demonstrated |
| Bypass under overlapping reasons | Model cancels one reason while retaining others | Bind actual application token to reasons active at that action; enforce new reasons independently and preserve running deadlines/counts |
| Offline/JS-absent operation | Shared App Group and extension fencing exist from C02 | New schedule engine and callbacks, uncertain-install recovery, process termination and offline device checks |
| Full `ProductNativePort` / scheduling capability | Unregistered on iOS; weekly/quest acknowledgments currently use Android-oriented intervention fields | Add a truthful iOS projection/contract where needed and register only after required methods/semantics are real; no success stub, synthetic service connection or Android label |

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
no current owner-store wiring, no reward producer and no installation acknowledgment**.
