# Android checklist reused for iOS

November 23, 2026 · `integration/shared-product`

Android fixes in shared React Native, API and contracts are already in the iOS
source. Android live results are references for the checklist, not iPhone passes.
This run used the existing **Hoosh C06 Release QA**, iOS 27.2 simulator, the normal
Release app and the isolated loopback API. No physical device or pilot was changed.

| Android check / equivalent iOS check | iOS evidence and remaining boundary |
|---|---|
| Embedded startup, restored login and saved draft | Latest Release build and product inspection passed; installed without clearing data. Home/account/preferences restored. |
| Intro, required fields, onboarding order, validation and routing | Included in 486 passing iOS component cases. Prior actual compact/public/intro checks remain documented in `ios-c06-simulator.md`; no new full fresh-account journey claimed. |
| Google chooser and callback | Fresh system browser consent, Google chooser, normal dashboard and expected account in Settings observed on rebuilt product. Passed. |
| Apple sign-in | Native Apple sheet opened. It requires an Apple Account signed into simulator Settings; closing it returned safely to login. Successful native credential exchange remains pending. Android Apple OAuth success is a separate path. |
| Email signup, confirmation and recovery | Shared controller/component coverage passes. Latest actual email delivery/recovery was Android. Fresh live iOS confirmation/recovery remains pending private owner interaction. |
| Settings save/reload | Real signed-in session-count edit 2→3, Save, then 3→2 and Save succeeded on the installed baseline against local API. Original draft survived latest rebuild/restart and Google login. No protection applied. |
| Account separation and logout | Latest logout hides private screens, Google login restores expected account. Controlled iOS account cases pass. Prior distinct A→B live separation is recorded in `ios-c06-simulator.md`; full native device-owner transition remains physical. |
| Quest and recommendation behavior | Full iOS component suite passes; actual saved quests and editor/time controls inspected, Home cooldown displayed. No new completion credit or schedule mutation performed in this run. |
| Rewards and History | Account wallet/health restored. History separates synced account receipts from unavailable iPhone usage; 7/28-day controls inspected. No invented saved-time comparison. No native receipt production claimed. |
| Permission, picker, Apply, Stop, overlaps, expiry and owner fences | Native model and real simulator SDK construction/mutation-gate checks passed. These do not authorize or prove Screen Time OS enforcement. Real picker, grant/deny/revoke/regrant, real app blocking and foreground expiry remain physical. Activation gate unchanged. |
| Offline, kill, reboot and day/timezone boundaries | Controlled iOS component/native-model coverage passes. App restart/session restoration observed. Android live offline/OS/reboot/expiry results are not iOS device evidence. Physical lifecycle matrix remains open. |
| Layout, keyboard and accessibility | Standard simulator Settings layout and normal navigation inspected. Prior compact/large-text work retained. Full current small/large authenticated journey, VoiceOver and physical keyboard/touch feel are not claimed complete. |

## Current checks

- iOS component suite: **60 suites, 486 passed, 2 skipped**. The two skips are
  Android-only native-picker focus-return cases, not iOS failures.
- Focused auth/root subset: **53 passed**, included in the full count above.
- `scripts/check-ios-adapter.sh`: all native model/store/owner/reward/clock and
  real simulator SDK mutation-gate probes passed. No OS monitor/shield changed.
- Current Release build and `scripts/inspect-ios-product.py`: passed, embedded
  Hermes, callback scheme and native registration present. Simulator signatures
  do not establish device provisioning or App Store entitlement approval.
- Sanitized receipt: `../integration_notes/artifacts/verify-ios-android-parity.json`.
  Logs, binaries, screenshot/account identities remain ignored locally.

## Open issues and next action

Closing the Apple account-required sheet returns to login with a generic
connection/retry notice; this does not establish an actual network failure.
Successful native Apple authentication remains unverified.

Settings still shows **Some settings couldn’t be loaded**; distracting-app/device
schedule readback is unconfirmed in this simulator. Account draft saves succeeded,
but that does not resolve the device-status warning. Do not mark protection ready.

Finish owner-assisted native Apple and live iOS email-link checks when available.
Use a spare physical iPhone for permissions, real target app enforcement, expiry,
overlap/scoped Stop, native owner transition, offline/reboot and accessibility.
The deferred elapsed-expiry feasibility/activation gate must be resolved before
claiming those physical enforcement rows pass. See `ios-shared-standalone.md`.
