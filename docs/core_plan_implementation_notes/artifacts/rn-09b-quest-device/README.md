# RN09B-D04a independent Android evidence

Owner Ishmum,2026-11-11. [Structured record](evidence.json),
[runbook](../../../qa/quest-lifecycle.md),
[per-file notes](../../plan_04_react_native_integration_notes.md).

These are raw, inspected emulator captures of a synthetic target and generated
local-account quest, with no tokens, personal app inventory or account identifiers.
They show scoped observations, not managed SDK/iOS/signed/store acceptance.

| Capture | Observation |
|---|---|
| `after-reboot-native.png` | Persisted native pause after emulator reboot, API disconnected, host JS unopened. |
| `open-anyway.png` | Native allowance reveals the synthetic target. |
| `allowance-expiry.png` | Pause returns after the one-minute allowance. |
| `schedule-ack.png` | Account schedule and native installation acknowledged separately. |
| `scheduled-pause.png` | Fresh occurrence presents a native pause with API disconnected. |
| `completed-ui.png` | Explicit shared confirmation yields one completion and50credits. |
| `offline-stop.png` | Local Stop survives missing API; account acknowledgement remains uncertain. |
| `stopped-confirmed.png` | Explicit online Stop acknowledges both account and device. |

The fresh occurrence ended with the native pause window absent; the timer did
not award credit. Normal API readback and replay checks confirmed50once. After
offline Stop, native zero versions/disabled receipt remained unchanged on Check;
a separate explicit Stop acknowledged the account. Service access was revoked
on the disposable emulator for completion/Stop, not on the physical phone.

Live UI used the bridge build before the final pre-parser depth guard and removal
of temporary native trace logging. Final source hashes and final APK instrumentation
(106cases on phone and emulator) are separate evidence. Full live timed UI was
not repeated on that final APK. Physical restoration passed earlier; the phone
disconnected before a post-instrumentation baseline recheck. New combined physical
speech/focus, managed SDK and Anisha's iOS/signed acceptance remain open.

Fixture users/private manifest/API, task Metro/emulator and task database stack
were cleaned; database volume retained. No hosted Auth users or migrations changed.
