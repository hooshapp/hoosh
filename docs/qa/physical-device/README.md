# Physical-device integration verification

Prepared November 23, 2026. Branch: `integration/shared-product`.
**Android lead: Ishmum. iPhone lead: Anisha. Shared API/auth fixes: joint.**

This is the execution companion to [Integration 05](../../integration_plan/05_combined_app_verification.md), not a new implementation plan or renumbering of C01–C06. Android results feed VERIFY-C04; iPhone results feed IOS-C06 and VERIFY-C05; joint closeout feeds VERIFY-C06. Existing V01–V24 journey IDs remain authoritative.

## Start here

1. Read this file and the readiness section of your platform guide.
2. Copy the [run record](run-record-template.md) to a new dated file under `docs/integration_notes/`. Each tester uses a separate record.
3. Ishmum follows [Android](android.md); Anisha follows [iPhone](iphone.md). Work in parallel after shared readiness. Neither must wait for the other platform's unrelated blocker.
4. Finish one stage, record each case, then proceed. Fixes remain under the original owning integration increment; do not mark an entire stage passed because one example worked.
5. At the end use the joint sign-off below. A document or test script is not an executed test.

## Current starting position

- Android emulator core journey and latest Google/Apple OAuth happy paths passed within their recorded limits. These are not physical Android passes.
- iOS simulator Release build, Google OAuth and 486 component tests passed; two Android-only cases skipped. Native Apple opened its sheet but required simulator Apple Account setup. These are not physical iPhone passes.
- Latest simulator Settings still showed unavailable distracting-app/device readback. Account draft saves succeeded. Investigate the warning on the actual signed product; do not infer it is fixed.
- **iPhone protection activation remains compiled off pending physical elapsed-expiry feasibility acceptance.** Anisha can start install/auth/UI/permission checks. Do not attempt production Apply tests by simply switching the gate on. See iPhone stage I03.
- The current local API is loopback-only. Android USB reverse can support tethered API testing; iPhone needs a reachable, approved HTTPS API. A disconnected laptop is not a hosted backend.
- Current binaries are development/internal artifacts. Store signing, distribution entitlements and field backend readiness are separate gates.

## Shared test setup — P00 (V19)

1. Agree on one reviewed source commit. Record `git rev-parse HEAD`, branch, build/version, artifact SHA256, platform configuration and any uncommitted source used to build. A later fix creates a new candidate: retain old results and rerun affected/dependent cases on the new artifact.
2. Verify the normal app is embedded/standalone: no Metro, preview menu, synthetic account, fixture login or legacy Swift dashboard. Read public configuration names/presence only; never publish secret values.
3. Confirm approved Supabase project, enabled providers, native callback scheme, actual signing identities and API environment. Both testers use the same intended backend/schema, or explicitly document separate environments. Never reset a shared/production database for these tests.
4. Have a developer verify schema compatibility, API health, normal unauthenticated API rejection and account FK prerequisites in the chosen development environment. A healthy API alone does not prove authenticated reads/writes. If a fresh real Auth user cannot save, report it; do not disable JWT/RLS or manually change hosted identities to obtain a pass.
5. Prepare separate **disposable** A and B accounts per tester, distinct verified identities. Use a fresh account F for signup/recovery. Keep passwords/codes/links in the device/browser, not chat or evidence. Apple Hide My Email can produce a relay identity; do not assume it is the Google account.
6. Use an owned spare phone and two nonessential installed target apps T1/T2. Record only harmless test labels in shared evidence; no personal app inventories. Do not target emergency, authenticator, work-critical or Hoosh itself.
7. Record original font size, display scale, network, notification and protection permissions, battery policy, existing Hoosh installation/data and selected apps. Preserve original state. Confirm replacement risk before installing; never clear app data/uninstall as the default repair.
8. Record device model/OS, time zone and automatic clock setting. Use a stopwatch/second device for elapsed tests, screen recording when appropriate and ordinary OS navigation. Never read SecureStore/Keychain/session storage.

**Exit:** artifact + backend + test identities + safe targets + installation decision recorded. Any missing prerequisite is BLOCKED, not FAIL or PASS.

## How to record a case

Use **NOT RUN / PASS / FAIL / BLOCKED / DEFERRED / N/A**. PASS requires the expected observation on the named build/device. BLOCKED names the missing dependency. DEFERRED names an owner and follow-up. N/A needs a documented platform capability decision; it must not hide a required feature.

For every case record: case ID and V IDs, actual steps, expected and actual result, run time/zone, artifact, evidence reference, defect ID, cleanup and retest result. One recording may cover several cases if timestamps identify each action. Redact emails, notifications and third-party content. Never attach passwords, tokens, verification URLs, raw headers, Apple keys or device identifiers/provisioning files.

If behavior fails: stop dependent mutations, save a sanitized recording/error and timestamps, note network/foreground app/permission state, then assign the defect. Do not repeatedly tap Apply/Feed, reinstall, change clocks or grant extra permissions to force success. Correct the implementation/configuration, identify the new build and rerun the failure plus its neighbors. An unexpected protective lock needs the owner's normal Stop/recovery path, not blind resets.

## Test controls and measurement

- Prefer all seven days with a currently active review window that does not cross midnight for initial timing. Then test boundaries separately.
- Use two allowances per selected app per day and the shortest **supported, selectable** duration (prefer one minute where available). Record the actual saved/installed values, zone, selection and revision. Do not bypass limits or substitute pilot minute-cap rules.
- Record allowance start, expected elapsed deadline, observed nudge/callback/shield time and drift separately. Returning late to see a shield does not prove expiry while the target stayed foreground. A developer should arrange sanitized native timing evidence where needed.
- Record actual delay. Do not silently invent a grace period: if observed timing differs from the required behavior, keep the case open for an explicit engineering/product decision.
- Offline means all internet paths off; a stopped API is only API-outage testing. App swipe-away, OS process death and Android Force stop are different tests. Label each accurately.
- Never clock-jump to claim an actual midnight/DST/long-duration pass. Schedule real overnight/day-boundary checks; controlled tests remain supporting evidence.

## Execution stages and dependencies

| Stage | Android | iPhone | V IDs / exit |
|---|---|---|---|
| 00 Readiness/install | A00 | I00 | V19–20; correct artifact, reachable backend, preserved data |
| 01 Auth/account | A01 | I01 | V01–05; actual provider/link/session outcomes |
| 02 Setup/persistence | A02 | I02 | V06–08; real saves/readbacks, no auto activation |
| 03 Access/selection | A03 | I03 | V09–10; actual permission and Save/Cancel; iOS timing prerequisite |
| 04 Protection/overlap | A04 | I04 | V11–12; real target behavior and reason-scoped Stop |
| 05 Product/rewards | A05 | I05 | V13–15; exact-once balances, qualified measurements |
| 06 Ownership/lifecycle | A06 | I06 | V16–20; A/B separation, no budget reset or automatic resume |
| 07 Usability/soak/closeout | A07 | I07 | V21; repeatable daily use and evidence handoff |

## Joint sign-off — P08 (VERIFY-C06)

1. Review both run records against V01–V21; link every required case to platform-specific evidence. Preserve optional/deferred V22–V24 separately: account deletion, expanded speech/accessibility work and unresolved product/store/AI features do not become completed through this guide. If chosen for release, they need their own acceptance.
2. Compare saved account values across phones only where the feature is account-scoped. Selected apps, OS permissions and installed protection are device-local. Logging into a second phone must not silently apply another device's rules.
3. Reproduce each fixed defect on the final candidate; record both source commits/artifact hashes. Do not carry a timing pass from a different native implementation or signing configuration.
4. Restore original permissions/text/network/battery settings and stop only the synthetic rules created during this run. Preserve test data required for retests. Remove task-owned USB reverse mappings. Record anything intentionally left active and who will stop it.
5. Update Integration 04/05 notes and capability matrix. Distinguish tested functionality, unavailable-by-design features, blocked mandatory functionality and actual release/distribution readiness. Never mark a gated iPhone protection build accepted for enforcement.
6. Both testers sign with date, exact artifact and remaining blockers. Required failures/blocked/not-run cases keep that platform's acceptance open. A scoped platform pass is not both-platform release approval.
7. User reviews/stages/commits/pushes; no automatic push. Suggested stage-documentation commit: `docs(qa): record physical device <platform> stage <number> results`. Fix commits describe the actual fix under its owning increment.

## Existing reference runbooks

[Auth](../normal-account-app.md) · [iOS packaging and physical gates](../ios-shared-standalone.md) · [Android packaging](../android-standalone.md) · [Android lifecycle](../android-protection-lifecycle.md) · [Quests](../quest-lifecycle.md) · [Rewards](../home-rewards.md) · [Recommendations](../home-recommendations.md) · [History](../history-measurement.md) · [Simulator parity](../ios-android-parity.md).

Historical QA-host/seeded-fixture instructions in older documents are supporting developer procedures. For this integration acceptance use the normal app, real Supabase login and actual API/native flow. Do not use the emulator-only smoke/initializer runner on a personal phone.
