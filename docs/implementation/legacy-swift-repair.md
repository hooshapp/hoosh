# Legacy Swift recovery — in progress

Owner request: restore the existing Swift iOS application for user feedback within two days. User approved a shared usage budget across selected apps; Android is excluded. Work starts from landing-page commit 322064d. Existing SwiftUI design, bundle IDs, App Group and extension targets are preserved. No release, cloud deployment or push is implied.

## First repair increment

- `DailyUsageMonitoring.swift` registers a recurring DeviceActivity schedule and a combined selected-app/category/domain threshold. Default is a visible, editable 30-minute daily budget in the old Settings screen, separate from temporary bypass length. Permission/registration failures produce a Settings error and retry; they do not claim an installed monitor.
- `ShieldStoreController.swift` registers normal monitoring after onboarding instead of unconditionally applying shields. Threshold state is stored in the App Group and reconciled on launch. `DeviceActivityMonitorExtension.swift` records the reached day and applies shields on the daily threshold; a new day's interval clears the previous day's daily shield. iOS 17.4+ includes earlier activity in the scheduled interval; older iOS cannot provide that same accounting guarantee. Changing an already-reached limit keeps the day blocked until reset.
- `BreakReminderScheduler.swift` cancels legacy elapsed-time notifications and registers actions only. Existing monitor usage callbacks remain the notification producer; monitor notifications now carry the category needed by the host's Done action.
- AI response parsing now accepts the server's ISO-8601 timestamp, including fractional seconds. Previously the default numeric Swift Date decoder rejected that payload and selected fallback text. App Group persisted date encoding remains unchanged. The monitor now reads bounded cached AI reminder messages, with a local fallback.

## Verification completed

- Xcode 16.4 unsigned iOS simulator build: baseline passed; daily-monitor changes passed; final AI-inclusive build passed. This compiles the Swift host and extensions, not just syntax.
- Compiled app contains the shield configuration, shield action and DeviceActivity monitor extensions with their expected extension points and principal classes. This is unsigned bundle evidence; signed entitlements and actual system registration are not yet validated.
- Swift decoder regression executable passed for fractional/whole-second ISO dates and rejection of an invalid date. Command: `xcrun swiftc apps/mobile/ios/DisconnectApp/NudgeResponseDecoder.swift scripts/tests/nudge-response-decoder.swift -o <scratch executable>`, then execute it.
- Swift syntax parsing and `git diff --check` passed.
- A paired iPhone 16 Pro was detected. Device-build investigation is ongoing; do not infer installation or phone acceptance from pairing.

## Not fixed or proven yet

- Bypass still has a wall-clock expiration and a separate relock schedule. Removing the host's timed notifications fixes one source of locked-phone notifications; it does not establish full usage-only bypass accounting or prove the locked-phone requirement passed.
- Full user-defined blocking schedules, reason coordination, notification-frequency personalization, usage-only temporary allowances, midnight/time-zone/reboot races and native failure recovery need implementation and device tests. The recurring *usage budget* above is not a complete blocking-schedule editor.
- The custom shield is packaged; Apple's default Restricted screen remains unresolved until a properly signed installation is exercised.
- Firebase anonymous Auth, Firestore profile/event/feedback writes and Firebase Analytics are already present in the Swift code. The newer RN app supplies Supabase Auth and local preference storage; the FastAPI service is a health foundation, not a product database to copy. Live Firebase project/database existence, rules, permissions, delivery and data visibility still need verification. No cloud database was created or production rules changed.
- AI client decoding/cache fixes are local. Live endpoint authorization, provider quota, output validation, refresh reliability and secure authenticated server integration remain pending. No provider key belongs in Swift.
- Physical-iPhone authorization, before/after budget shielding, custom message, force-quit, restart, lock/unlock, offline and release tests remain pending. Do not give this build to beta users as validated protection yet.
- The original import manifest intentionally documents the source snapshot. Native repairs now change those files; historical import hashes must not be represented as current-file integrity checks.

## Device acceptance sequence

Use a signed build preserving existing production identity. Record OS/build and authorization state; select only controlled test apps. Set the minimum daily budget, verify no shield before actual usage reaches it, lock the phone partway through and confirm usage reminders stop, resume and reach the threshold, verify custom shield and actions. Repeat after force-quit, offline and reboot. Check next-day release separately. Verify server-side event receipt without treating a quit action as measured time saved. Signed install/upgrade and existing-user data preservation need explicit evidence.

## Current external blockers

Device confirmed as iPhone 16 Pro on iOS 26.6.1. The Xcode 26.0.1 device build timed out with the specific error that the Developer Disk Image is not mounted and development services need to be enabled; Xcode asks that the phone be unlocked. No installation occurred. Earlier destination attempts used the CoreDevice ID rather than Xcode's hardware UDID and were superseded by this corrected attempt.

Firebase client configuration is present. A read-only Firestore database-list request with the existing local Firebase administration session returned HTTP 401. This establishes an authentication blocker, not that the database is absent. No tokens/config values were printed, no production data was written and no cloud configuration was changed.


## Backend direction — November 3 follow-up

The owner asked to continue with Supabase rather than Firebase. Use the existing development Supabase project as the intended destination, preserving the old Swift UI and native Screen Time independence. The RN Supabase authentication producer and public project configuration are reusable context; they are not a completed native Swift session implementation, database schema, event ingestion service or AI backend.

Next backend slice: confirm development project access and existing schema, choose an explicit native identity/session migration compatible with existing users, and add versioned profile/event/feedback persistence with owner isolation and retry/idempotency. Keep provider secrets server-side for the AI endpoint. Do not put service-role credentials or OpenAI secrets in the Swift app. Do not remove the existing Firebase libraries/configuration until replacement paths are working and tested; migration is not yet implemented by this decision. Previously deployed Firebase data is not assumed to be present or automatically transferred. The old plan for app-to-FastAPI persistence remains a baseline; any direct Supabase writes require an explicit documented adaptation and actual isolation tests.

Device guidance provided: USB-C data cable to this Mac, unlock, Trust if requested, Developer Mode enabled. A corrected device build was retried after the owner reported enabling Developer Mode.

## Device connection, build and installation — November 3 follow-up

After Developer Mode was enabled and the phone was connected, the corrected Xcode 26.0.1 device build completed successfully. `scripts/verify_shield_bundle.sh` passed against the Debug-iphoneos bundle: shield configuration, shield action and DeviceActivity monitor were embedded with the expected bundle IDs, extension points, principal classes and Family Controls signing entitlements. This supersedes the earlier device-build blocker above.

`devicectl` successfully installed the app with its existing `com.AnishaDasgupta.DisconnectApp` identity onto the paired iPhone 16 Pro and successfully launched it. A subsequent process query found the Swift app process running. No uninstall, data reset, entitlement rewrite, cloud deployment or Git push was performed. Process launch does not prove usable UI or system Screen Time behavior. Owner was asked to report the visible screen, check the new Settings limit, select a controlled test app and report errors or immediate shielding before continuing timed/device-lifecycle acceptance.

## Requirement change: per-app limits

The owner subsequently approved independent daily limits for each selected app. The shared daily-budget implementation above is superseded. See `legacy-per-app-limits.md` for the new source model, per-app shield/allowance logic, visible app-specific controls, signed build/install evidence and the pending matched-selection timed phone test. The new card is confirmed visible; shield enforcement is not yet passed.
