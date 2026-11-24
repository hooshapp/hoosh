# Integration 05 — Combined normal-app verification and handoff

**Physical execution companion:** [shared readiness and sign-off](../qa/physical-device/README.md), [Android step-by-step](../qa/physical-device/android.md), [iPhone step-by-step](../qa/physical-device/iphone.md), [run-record template](../qa/physical-device/run-record-template.md), and [progress ledger](../integration_notes/physical_device_verification_notes.md). Follow these under the existing V IDs/C04–C06; simulator results do not mark the phone cases passed.

**Leads:** Ishmum (Android/backend), Anisha (Auth/iOS), joint acceptance.
**Status:** C01 readiness prepared with current independent checks; C02–C06 journey acceptance remains open. Physical iPhone acceptance remains deferred. **Notes:**
`docs/integration_notes/plan_05_combined_app_verification_notes.md`.

## Outcome and limits

Prove the combined app works through its real root, real accounts, real backend
and supported native protection. Reuse existing tests/evidence for unchanged
components; concentrate new testing on integration seams and actual packaged
journeys. An isolated host, injected SDK, mocked picker, successful export or old
branch CI does not substitute for the normal-app acceptance required here.

Begin C01 once BASE-C04 supplies the composition contract. C02 needs integrated
Auth; C03 needs integrated onboarding; C04 needs the Android flow; C05 needs iOS.
Android can reach its functional milestone without waiting for iOS. C06 records
the exact scope accepted and any remaining gates; it cannot declare both-platform
completion if a mandatory C05 scenario is still pending.

Read current QA runbooks: `normal-account-app.md`, `profile-cascade-acceptance.md`,
`rn09-settings-acceptance.md`, `android-standalone.md`, `android-layout-coverage.md`,
`android-protection-lifecycle.md`, `quest-lifecycle.md`, `history-measurement.md`,
`home-rewards.md` and `home-recommendations.md` under `docs/qa/`. Read Anisha's
pinned `docs/qa/auth-foundation.md` on the source branch and the current core
Plan 03/04 notes. New integration reports supplement these; a proposed future
test/script path is not an existing runnable tool.

Current repeat steps and evidence boundaries: [combined verification runbook](../qa/combined-app-verification.md).

## Environments and account prerequisites

| Resource | Requirement / evidence boundary |
|---|---|
| Disposable local DB | Existing guarded fixtures/migration runner, one Alembic head, no production reset |
| Supabase development project | Correct public issuer/audience/keys/callback config, normal accounts; no anonymous pilot bypass |
| Accounts A and B | Two distinct disposable, owner-approved accounts; credentials entered privately, UUIDs only in private fixtures |
| Fresh signup account | Owner-created through normal flow for confirmation/recovery; no real participant password reset |
| Account C | Only for separately authorized permanent deletion acceptance; prior deferral remains in effect |
| Android | Owned emulator plus physical phone where required, actual consent for protection access, test targets only |
| iOS | Correct Xcode/provisioning/App Groups, supported signed iPhone, native permissions granted by owner |
| API reachability | Stable, correct-project API URL reachable from test device; TLS and trust config as existing runbooks specify |
| Standalone build | Embedded JS/assets, known signature/hash/configuration, no QA host or synthetic default owner |

First validate env **names/presence**, not secret values. Keep credentials in the
existing ignored files/platform stores. Use `npm run api:acceptance:login` for
private A/B token refresh when needed; never copy a service-role/project API key
into a user access-token field. A test helper does not replace SDK sign-in testing.

Expired/unavailable accounts block only real-account rows. Continue deterministic
checks and leave real acceptance pending. The user previously deferred manual
accounts, Auth/tokens and hosted deletion; planning does not cancel that deferral.
Request current test-resource availability only when the relevant implementation
and independent preparation are ready. No account creation/reset/deletion or
native permission grant occurs merely because this plan is written.

The ONB-C06 [fixture evidence and physical walkthrough](../integration_notes/plan_02_onboarding_backend_protection_notes.md#int-onb-c06--end-to-end-verification) feed VERIFY-C03 through C05. The normal-route suite covers both plan choices and interrupted completion. Real-account settings acceptance and physical intervention verification remain open. iPhone acceptance depends on the signed Plan 04 Screen Time bridge.

## Mandatory journey matrix

Use IDs below in notes/evidence so each scenario has an owner, build/SHA, environment,
actual outcome, limitations and repeat command/steps. A single journey can cover
multiple rows; don't add redundant infrastructure to duplicate the same proof.

| ID | Journey / fault | Expected observation | Owner / increment |
|---|---|---|---|
| V01 | Fresh signup → confirmation → sign-in | One SDK identity; matching `/v1/me`; no private flash before session | Anisha / C02 |
| V02 | Login invalid/offline/rate-limited | Neutral bounded error; no stale private data or false signed-out success | Anisha / C02 |
| V03 | Recovery warm/cold/cancel/expired/reused | Only correlated reset allowed; callback URL cleaned; normal app correctly gated | Anisha / C02 |
| V04 | Each enabled provider success/cancel/restart | Configured signed-platform callback works; unsupported provider disabled | Anisha / C02/C05 |
| V05 | Restore, refresh, storage unavailable, logout interrupted | No duplicate refresh/late resurrection; recoverable private gate | Joint / C02 |
| V06 | New/returning account setup, manual/suggestion/defer | Reviewed values survive restart; existing server settings preserved | Joint / C03 |
| V07 | Profile Save, clear, conflict, lost response | Correct owner/revision; explicit reconciliation; no silent overwrite | Ishmum / C03 |
| V08 | Settings Save and reopen/restart | Canonical saved activities/plan; omission/null semantics preserved | Joint / C03 |
| V09 | Native picker stage/cancel/Save/restart | Saved set/revision changes only on Save, tokens/IDs remain native | Platform owner / C03–C05 |
| V10 | Permission deny/revoke/regrant or missing bridge | Truthful unavailable/recovery; generic content remains usable | Platform owner / C04/C05 |
| V11 | Review → explicit Apply → intervention → bypass expiry | Installed readback and real supported behavior, independent of JS/API | Platform owner / C04/C05 |
| V12 | Weekly + two quest overlap, edit and scoped Stop | Other reasons preserved; active snapshots/revisions correct | Platform owner / C04/C05 |
| V13 | Completion/reward/Feed response loss and restart | One durable receipt/award; balances server-owned, no duplicate credits | Ishmum / C04; iOS producer C05 |
| V14 | History start/coverage/baseline/unavailable | Fixed-baseline policy and source/coverage labels; no fabricated zero/savings | Ishmum / C04; capability check C05 |
| V15 | Recommendation Accept/Skip/reopen | Durable cooldown/replay-safe quest; separate explicit Schedule/Apply | Ishmum / C04 |
| V16 | A logout → B login while A responses/actions are delayed | No A profile/settings/quests/rewards/History/drafts/toasts/native events in B | Joint / C02/C04/C05 |
| V17 | A rules retained after logout, B device claim | No silent transfer/Apply; confirmed claim stops old rules, private history stays A | Platform owner / C04/C05 |
| V18 | Offline/reconnect, JS/native process death, permission loss | Authoritative native recovery, no automatic mutation replay or budget reset | Platform owner / C04/C05 |
| V19 | Packaged normal app with Metro stopped | Correct public config, modules/assets/startup, account API and native flow | Platform owner / C04/C05 |
| V20 | Upgrade from each shipped/internal source actually in use | Secure reauth/migration, owner isolation, compatible native stores | Joint / C02/C04/C05 |
| V21 | Small screen, large text, keyboard/back/navigation | Controls reachable; errors/dirty confirmation/layout still functional | Platform owner / C03–C05 |

Separate explicitly deferred rows: **V22** hosted disposable-C deletion cascade and
local cleanup/other-device acknowledgment; **V23** further TalkBack-specific pass;
**V24** unresolved product features (demographics, lifespan, generated AI, calendars,
shared-device budgets) and store/OEM/wider reliability matrices. Preserve existing
tests and open core gates; don't label these completed or quietly add them to
every integration commit. If any becomes a chosen release requirement, readiness
must reflect it before distribution rather than claiming this scope covered it.

## Commit ledger

| Part | Intended commit | State / prerequisite |
|---|---|---|
| INT-VERIFY-C01 | `test(integration): establish normal-app acceptance fixtures` | Readiness passed: reused A/B/fault harnesses, current118 component/88 unit checks, public config/API/package preflight and [V01–V24 manifest](../integration_notes/artifacts/verify-c01-readiness.json). BASE-C04 already passed; not full-app/device acceptance. |
| INT-VERIFY-C02 | `test(integration): verify account and session isolation` | Independent automated slice passed:299 checks, including new real-SDK refresh/logout/new-client restore race; [evidence](../integration_notes/artifacts/verify-c02-auth-isolation.json). Real-account/provider/OS-storage acceptance remains open. |
| INT-VERIFY-C03 | `test(integration): verify onboarding and persistence recovery` | Independent slice passed:228 component,68 portable and144 real PG17/API tests; [evidence](../integration_notes/artifacts/verify-c03-persistence.json). Manual DB data preserved/restored. Real managed-account/device/native acceptance remains open. |
| INT-VERIFY-C04 | `test(android): accept integrated packaged app journeys` | Core emulator journey passed: exact corrected standalone APK, real A/B/no-B-install/A restoration with retained allowances, weekly/two-quest overlap/scoped Stop, offline expiry/recovery, permissions, rewards/Feed, recommendation and qualified History state. [Normal receipt](../integration_notes/artifacts/verify-c04-normal-android.json), [connected tests](../integration_notes/artifacts/verify-c04-connected-checks.json). Physical/OEM/TalkBack/field distribution deferred; installed Android provider callbacks not repeated. |
| INT-VERIFY-C05 | `test(ios): accept integrated signed app journeys` | Owner-deferred: requires physical signed iPhone; prior packaging/simulator checks are not enforcement acceptance. |
| INT-VERIFY-C06 | `chore(integration): record exact-build acceptance and handoff` | Scoped handoff recorded: final local checks and exact C04 CI passed; [report](../qa/integration-handoff.md), [receipt](../integration_notes/artifacts/verify-c06-handoff.json). Overall integration partial; C05/remaining platform and release gates explicit. |

### INT-VERIFY-C01 — Minimal repeatable environment and fixtures

1. Inventory existing harnesses before creating any new one. Reuse core API
   acceptance, DB migration suites, normal-root injection points and native runners.
   Extend them only to cover the combined flow that was previously missing.
2. Add a small scenario/evidence manifest keyed to V01–V24 with status vocabulary:
   planned, running, passed, failed, blocked, explicitly deferred, not applicable.
   Include platform/build/source SHA, API schema head, test data ownership and
   cleanup state. No large new test framework/dashboard needed.
3. Prepare distinct A/B fixtures with visibly different profile/settings/quest data;
   deterministic fixtures first, real disposable account setup privately when
   supplied. Record which tests are isolated vs hosted vs actual SDK native.
4. Validate API/project alignment, endpoint reachability, certificate verification,
   time zone and installed app identity before input. Don't print `.env` or capture
   password screens/system app inventories. Use synthetic native targets.
5. Prepare interruption/delayed-response injection only in isolated tests or owned
   test builds, unreachable from release. Ensure guards catch the test host/bypass
   in production export. Record non-destructive cleanup actions in advance.

**Exit:** reproducible scenarios and safe fixtures, with independent checks runnable
even if real accounts/iPhone are pending. Preparation is not journey acceptance.

### INT-VERIFY-C02 — Real Auth, identity and session isolation

1. Execute V01–V05 on normal routes: email account lifecycle, confirmation/recovery,
   enabled providers, API identity match, restart/foreground and local logout.
2. Exercise successful login with API offline, expired credentials, actual storage
   unavailability and refresh during background/return. Compare resulting gates
   with the one-controller invariants; no private-data success inferred from SDK UI.
3. Run V16 with delayed A identity/profile/settings/quest/native results while B
   becomes current, plus same-user/new-session replacement and ordinary refresh.
   A request may finish server-side, but its result must not enter B's cache/UI.
4. Verify sign-out during SDK refresh and failed remote revocation, plus interrupted
   cleanup/reopen. Stored credentials stay cleared and private access closed;
   native rules retain their independent ownership/policy.
5. Test session-key upgrade cases and public/private deep-link/back navigation.
   Provider/OS-specific rows not actually exercised remain pending by platform.
6. Fix integration defects in the owning AUTH increment/notes, with source commit
   and targeted regression. Do not loosen callback or identity guards to make a
   manual walkthrough pass.

**Evidence/exit:** real SDK + matching backend account proof, clean A/B separation,
bounded refresh/logout behavior. Tests with injected accounts are retained as
regressions but explicitly cannot complete real-account rows.

### INT-VERIFY-C03 — Setup, profile and settings persistence

1. Execute V06–V09/V21 through both new signup and existing-account entry, suggested
   and manual setup, permission deferral and current stored settings review.
2. Confirm server readback after profile/settings Save and actual cold restart.
   Use the existing profile/settings HTTP acceptance harness for independent
   revision/Unicode/null/omission/ownership checks; no raw SQL UI workaround.
3. Create conflict in an owned second client, then verify both Keep my edits and
   Use latest without automatic overwrite. Simulate response loss after committed
   save: reread/reconcile before another write and show truthful status.
4. Interrupt at every boundary listed in ONB-C06. Verify local-progress failure
   cannot roll back saved data, missing progress cannot overwrite existing values,
   and native selection state is never reconstructed from labels/cloud counts.
5. Reenter from Settings after setup; confirm both flows use the same canonical
   cache, selection and weekly controller. Back/dirty-exit/keyboard behavior must
   work without the isolated screen host's navigation shortcuts.
6. Include supported migration from actual existing local drafts and deliberately
   incompatible/corrupt data. No implicit transfer between projects/accounts.

**Evidence/exit:** normal app writes/readbacks and device local recovery pass;
onboarding-finished, preferences-saved and protection-installed remain distinct.

### INT-VERIFY-C04 — Complete Android packaged journey

1. Build the current integrated normal app with embedded JS/assets and public
   configuration using existing standalone tooling. Record APK SHA/signing/config
   and source; stop Metro and remove Metro-specific reverse ports for this run.
2. Use real A/B sign-ins and the normal onboarding/root. Configure an API reachable
   from the phone: existing dev endpoint/explicit API USB tunnel is valid for a
   development test, but label it. A field-distributed build needs a deployed HTTPS
   backend; local loopback/tunnelling is not evidence of off-computer availability.
   Never weaken release network policy to obtain an accidental pass.
3. Execute V10–V19 on owned Android targets: selection, actual disclosure/owner
   grant, Save/Apply, opening pause, allowance expiry, weekly/quest overlap, scoped
   Stop, retained rules/logout and confirmed account claim.
4. Verify connected Home/Quests/History/Settings: real reward receipt/Feed/replay,
   recommendation Accept/Skip, actual coverage-qualified measurements or expected
   insufficient-data state. Don't fake a seven-day baseline to make a screenshot.
5. Reuse prior native lifecycle evidence where unchanged; run integration-specific
   deltas through process death, offline reboot, permission loss/regrant and app
   return. Force-stop limitations stay explicit; a stored rule isn't proof of active
   enforcement. Do not repeat long matrices for an unrelated Auth layout change.
6. Check current compact/large-text/keyboard regressions in the normal root. Restore
   test-only device settings/fixtures and connections; preserve unrelated user
   protection/data. Any failed core journey is fixed and rerun before acceptance.

**Exit:** an exact packaged normal Android build works with real accounts/backend
and native protection. Field deployment/store signing/OEM reliability remain
separate claims; deferred accounts keep this milestone pending, not passed.

### INT-VERIFY-C05 — Complete signed iOS packaged journey

1. Install the exact integrated RN iOS build on a supported signed iPhone. Verify
   actual shared root, server identity and setup; no Swift pilot enrollment route,
   native second session client or DEBUG simulator picker substitution.
2. Execute supported V01–V21 with iOS-specific provider callbacks, permission,
   app picker, installed revision, schedule/quest overlap, supported native shield
   actions and elapsed allowance proof from IOS-C01/C04.
3. Exercise no-Metro startup, lock/unlock, host termination, offline/reconnect,
   reboot, scheduled and midnight/DST boundaries where practical. Separate tested
   physical transitions from deterministic clock-policy tests; no changing a
   personal phone's calendar/date without a specific test reason and restoration.
4. Confirm A/B native ownership, retained installation, explicit claim, stable event
   retry and measurement capability labels. Unsupported History/events do not
   appear as zero, successful quit or parity with Android.
5. Inspect signatures/embedded extensions/App Groups/profiles and declared usage
   descriptions. Internal development installation is not TestFlight/store approval.
6. Reconcile any pilot policy difference not resolved in Plan 04. A different
   daily-cap demonstration cannot pass a mandatory elapsed-policy row. Keep exact
   capability/product blockers visible; do not close them in a documentation sweep.

**Exit:** real signed shared-app iOS functional journey accepted within declared
capabilities. If no iPhone/provisioning/required native behavior, C05 remains pending;
Android acceptance and independent final reporting can still proceed.

### INT-VERIFY-C06 — Exact-head checks, readiness report and maintainable handoff

1. Run final affected automated checks against the actual integration head:
   `npm run check`, `npm run mobile:ui:build`, `npm run mobile:export`, existing
   migration/RLS suites, native packaging checks and platform builds as affected.
   Keep the one Alembic history; pilot SQL never enters product migrations by accident.
2. When authorized to push, verify all GitHub Foundation jobs for that exact head,
   not another branch/previous commit. Capture workflow URL/SHA/results and retain
   native/device evidence separately; Linux CI cannot certify signed iOS behavior.
3. Produce a concise report linking V01–V24 evidence, exact build hashes, passed
   platform milestones, known defects and deferred/blocked rows with owner/reason.
   Include API deploy/TLS and provider/build configuration needed to reproduce.
4. Update integration ledgers, corresponding core-plan evidence and entry points.
   Preserve historical results and original IDs. No rounded percentage or bulk
   "all done" assertion that hides account/iOS/deletion/product/release gaps.
5. Review diff/artifacts for private identifiers, secret URLs, credentials/signing
   material, raw tokens/inventories and active QA bypasses. Remove test-only build
   overrides from normal sources; preserve isolated regression tooling.
6. Record rollback compatibility: native storage versions, retained installations,
   secure session-key change, public API/schema compatibility and minimum supported
   build. Prepare a concrete merge/release handoff; do not automatically merge main,
   deploy backend, publish app or delete hosted accounts as a verification side effect.

**Done:** reproducible scoped acceptance with exact-head checks and no hidden
mandatory failure. Reporting can be complete while iOS/accounts are pending, but
the overall integration milestone must remain partial in that situation.

## Defects and pause/resume discipline

Record a failing scenario immediately with sanitized reproduction and owning
increment. Fix it there; add a regression for meaningful behavior, then rerun the
failed scenario and affected neighbors. Don't restart every acceptance suite or
append another plan for each failure. On interruption leave notes with installed
build, device settings/permissions changed, services/processes still running,
fixture cleanup status, last passed scenario and exact next action. Restore or
explicitly hand off any test-only setup before ending the work.
