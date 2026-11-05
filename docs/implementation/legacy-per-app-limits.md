# Legacy Swift: independent daily app limits

In progress on `landing-page`, November 3, 2026. Owner changed the requirement from a combined daily budget to a separate user-selected daily limit for each app. This supersedes the shared-budget increment in `legacy-swift-repair.md`. Original SwiftUI design, production identifiers, App Group and native extension targets are retained. Changes remain uncommitted.

## Source implementation

- `SharedProtection/DailyLimitPolicy.swift`: versioned catalog of local opaque token data, stable random rule IDs, per-app minutes and event revisions; pure shield selection excludes only an app with an active temporary allowance. New applications default to the prior shared value, or 30 minutes when none exists. Existing app choices survive reordering, deselection and reselection when Apple supplies the same token. A renewed token is treated as a new selection; no app identity is inferred from private token bytes.
- `SharedProtection/PerAppProtection.swift`: shared store operations used by host, action and monitor targets. Reached-day markers and temporary allowances use separate per-rule keys, avoiding a shared read/modify/write reached array. It filters shielded apps to the current selection. Removed apps and previous-day markers do not restrict other apps. Callback adoption verifies the current rule event revision and OS-registered event token/threshold.
- `DisconnectApp/DailyUsageMonitoring.swift`: one event per application on a recurring daily monitor, with each app's selected minutes. Identical registration is reused; limit changes revise the affected event. iOS 17.4+ includes earlier activity in the day. Registration failures remain visible and retryable; a saved preference alone is not successful enforcement. Legacy aggregate and bypass wall-clock monitors are retired after per-app registration succeeds.
- `DisconnectApp/ContentView.swift`: a prominent “Daily limits for each app” card at the top of Stats, in Settings, and in onboarding before “Choose your break length.” Each Apple-labeled app has a saved-minute summary, 5/10/15/30/60 quick choices and 5-minute adjustment up to 240. Limits persist immediately. The card displays registration failures and explains earlier-day usage. Daily limits and temporary break length are distinct controls.
- `AppSelectionStore.swift`: selection changes notify the visible card so it reloads the correct app rows.
- `DisconnectDeviceActivityMonitorExtension.swift`: threshold callbacks mark/reconcile only the matching rule; daily boundaries reconcile previous-day state. Legacy callbacks do not globally overwrite per-app shields while per-app mode is enabled.
- `DisconnectShieldActionExtension.swift`: application actions use that app's own allowance. Open-anyway releases only that app and creates an app-specific usage threshold with past activity excluded. No elapsed-minute notification loop or host countdown enforces this allowance. The observation window has a 24-hour safety expiry and the logical allowance ends at the daily reset. Other reached apps remain shielded. Failure retains protection and records a retryable error. Older iOS without the required fresh-usage API does not pretend that a new allowance succeeded.
- `project.pbxproj`: one synchronized SharedProtection folder compiled in the host, shield-action and monitor targets, preventing independently mirrored policy implementations. No entitlements or bundle IDs changed.

## Scope and retained limits

Only individual application tokens receive per-app limits. Full categories/websites cannot be silently split into per-app budgets; the UI asks users to select applications inside Apple's picker. An unsupported-only selection stops per-app monitoring, clears its old selection shields and shows a correction message. Already-reached limits remain restricted for the day even when increased, as disclosed in the UI. No actual usage counter or “time saved” is fabricated.

Native app selection tokens remain in the device App Group; none are uploaded by the new code. Supabase migration, complete arbitrary blocking schedules, personalized notification-frequency controls and live AI/backend verification remain separate unfinished parts of the broader Swift recovery.

## Verification

- Pure Swift regression executable (`scripts/tests/daily-limit-policy.swift`) passed: different app limits; retaining settings through reorder/relaunch; revision changes; serialization; A-only blocking; A-only bypass preserving B; expired allowances; daily reset; removed selections; bounds and invalid-schema rejection.
- Existing AI decoder regression executable passed.
- Xcode 26.0.1 signed iPhone build passed, including all shared policy consumers. `plutil -lint project.pbxproj` and `git diff --check` passed.
- `scripts/verify_shield_bundle.sh` passed: configuration/action/monitor extensions present, expected identifiers/principal classes and Family Controls signing entitlements.
- The build installed and launched on the owner's iPhone 16 Pro. The owner confirmed the new per-app card and selected app row are visible.
- Device preferences confirmed per-app mode enabled, one app registered and no registration error. After the owner's first 5-minute change, a threshold callback and reached-day record were observed. The owner reported no shield, but further matching showed that reached rule had been deselected and a different current token had a 30-minute limit. Therefore that report is inconclusive for the currently selected app's enforcement; it is not a passed shield test.
- The owner then set the current app row to 5 minutes without reopening the picker. A fresh device read confirmed the active selected rule at 5 minutes, no allowance and no monitoring error; its own reached-day marker was still absent. The owner was asked to use this matching selected app for five active unlocked minutes and report the shield result. This timed device test is pending.
- Diagnostic reads printed only counts, limits and callback/error state. Opaque token data was not printed; temporary local preference copies were removed after extracting the needed state.

## Still required

Confirm matching selected-app threshold → custom shield on the physical phone; two selected apps with different limits; first app blocked while second stays available; per-app allowance expiry using actual app time; lock/unlock pause; force-quit; reboot; midnight/time-zone transitions; permission revocation; offline operation and existing-user upgrade behavior. A signed build and a recorded callback do not prove the system presented a shield. Do not mark this protection flow release-ready yet.

## Shield copy and variation increment

Owner observed the custom shield after the selected app reached its five-minute daily limit. Two-app isolation test remains in progress.

Removed the active concatenated fallback from shield rendering; complete short prompts replace fragments, and overlong user questions end at a word boundary with an ellipsis. Optional shieldPrompts arrays are supported in the host cache and extension; cached complete messages rotate without immediately repeating when alternatives exist. The generation handler requests eight personalized alternatives and rejects incomplete or oversized shield sentences rather than slicing them. Existing packs remain decodable.

Signed iPhone build, embedded extension validation, existing per-app policy and date decoder executables, JavaScript syntax and whitespace checks passed. New build has NOT been installed while the owner tests two-app isolation. Server changes have NOT been deployed; live AI generation and bypass re-shielding still need end-to-end verification. Shield extensions cannot make network requests, so generation must precede presentation. Home Screen icons are controlled by iOS; no icon recoloring implementation is claimed.

## Per-app bypass duration clarification

User requested the shield keep “Open for N minutes” and use the app’s own saved daily duration for its temporary allowance. Configuration now resolves Application.token to the shared rule; action starts allowance with the same rule.minutes. SharedProtection is included in the configuration target. Allowance range now supports the existing 5–240 minute daily limits. Per-app bypass expiry still requires physical-device verification.

## Daily rollover recovery and bypass scheduling repair

Foreground installation now checks a persisted registration day. A new day/migration advances selected event revisions and re-registers with includesPastActivity, preserving earlier usage within today's interval. Reconciliation removes previous-day reached markers and expired/previous-day allowances; disabled mode cannot reapply per-app shields. Allowance scheduling backdates the observation start by one minute while excluding past activity, avoiding a just-passed start boundary. Ending an allowance removes its persisted record before stopping its activity, preventing stale end callbacks from ending it recursively. Added interval and desired/configured shield-count diagnostics; configured state is not proof of effective OS blocking.

Passed: expanded portable policy tests (real midnight, DST, previous-day allowance rejection, exact expiry and app isolation); signed iPhone build; embedded extension validation; whitespace check. Installed and launched. Device readback: registration and reconciliation day 2026-11-4, two registered apps retaining 5/10 minute settings, daily interval-start callback received, old reached markers removed, no allowances or monitoring errors, configured shield count zero before today's thresholds.

Still pending: owner-observed current-day threshold to custom shield, bypass active-use threshold to re-shield, unattended midnight rollover, force quit and reboot. No reboot/reset/uninstall performed and no cloud changes deployed.
