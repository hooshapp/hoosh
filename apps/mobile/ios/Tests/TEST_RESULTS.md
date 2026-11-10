# Swift iOS pilot audit — November 4, 2026

## Result

**PASS for the automated onboarding/UI/model/database scope below. Not a physical Screen Time certification.** No physical device was used, and no build was installed on a phone during this audit. Source changes remain local and unpushed.

| Layer | Actual result |
|---|---|
| Shared Swift policies/models | **13 suites passed**, zero failures |
| Native tests on iPhone 17 Pro / iOS 26 simulator | **5 passed**, zero failures; one obsolete launch template explicitly skipped |
| Live Supabase HTTP checks | **36 passed** against the configured project |
| Isolated PostgreSQL-compatible integration/RLS tests | **4 suites passed**, using the exact migration SQL; fixtures rolled back |
| Generic iOS signed Debug build | **BUILD SUCCEEDED**, without connecting to a phone |
| Shield/action/monitor bundle validation | **PASS**: embedded, signed, correct extension points and Family Controls entitlement |
| Browser dashboard automation | **Unavailable**: browser-control tool timed out. No claim of live dashboard UI inspection. Actual authenticated API writes/readbacks were tested instead. |

Environment: Xcode 26.0.1 (17A400), dedicated iPhone 17 Pro simulator running iOS 26.0. Standalone model tests use the host Swift 6.1.2 compiler; native app/tests use the Xcode 26 toolchain. The simulator system appearance was Dark; the app intentionally retains its established white UI with readable black text.

## Registration-reliability follow-up

First-time study entry now **awaits** saving the participant row and reading it back for the authenticated account. A successful Auth signup alone cannot open onboarding. A failed registration write shows a retry screen, retaining the Keychain session; retry does not create another account. Existing password-account users must supply study name/email instead of silently skipping named enrollment. Missing participant details now throw an explicit error rather than returning success.

Verification is keyed to the exact account ID. A legacy installation-wide flag or another account's proof cannot unlock this gate. This updated gate requires an online confirmation once per account; later confirmed returns can use protection offline while cloud work queues for the next online app opening.

The native test deliberately injected a first registration-write transport failure after actual Auth signup. It asserted that onboarding and Dashboard were absent, retried, then completed the same real-server onboarding/feedback/interview walkthrough. All five native tests passed (one obsolete launch template skipped). Thirteen policy/model suites passed, including the new registration gate. Sanitized native diagnostics confirmed the server receipt matches the workspace/research owner, enrollment is verified, cloud readback succeeded, and one feedback entry is saved. The successful legacy password-login path remains untested; its naming requirement was corrected in source.

Latest evidence: `ios-enrollment-gate.xcresult`, `ios-enrollment-gate-proof.json`, and `ios-enrollment-gate-test-summary.json` in the outputs directory. The audit/test code still substitutes only the unavailable Apple picker; the injected failure is DEBUG + simulator-only and cannot activate on an iPhone.

## Native walkthrough: passed

1. A clean install showed name/email enrollment, with Start study disabled when empty.
2. Malformed email produced the expected validation message.
3. A new **real Supabase study identity** was created using a labelled QA name and an `example.invalid` contact. No password is required by the chosen study model; ordinary email confirmation settings were not changed.
4. Successful enrollment opened onboarding rather than Dashboard.
5. The app-selection screen displayed the explicit **simulator-only picker substitution** warning. Real Apple authorization/selection/enforcement was not simulated as a passing result.
6. A reading goal and an extra trigger question were selected, then a written intention was entered.
7. The app was terminated and reopened before setup completion. It returned to onboarding; selected goals, selected trigger questions and the written intention were restored.
8. Calendar/Reminders could be skipped; completion opened Dashboard.
9. Settings showed Protection first, without the removed Account & data card or developer footer. Preference disclosures were reachable.
10. Direct tone was selected and its selected accessibility state was asserted.
11. A completed participant resumed Dashboard after another cold launch; enrollment was not shown again.
12. Feedback was entered, submitted and confirmed saved.
13. Interview consent was enabled, name/contact entered, and Join Interview List submitted. The app read back the saved record/answers before reporting success; the form reset its consent toggle after success.

### Native app database proof

After the walkthrough, the QA simulator's nonsecret diagnostics showed:

- Enrollment verified: true.
- Route: dashboard; onboarding completed: true.
- Cloud status: **“Synced and read back successfully.”**
- Reading goal, extra trigger, written answer and Direct tone saved as expected.
- Feedback entries confirmed by authenticated server readback: **1**.
- Selected-app usage: 0 in this QA simulator because it has no actual selected apps or Screen Time measurements. This is not a claim about the real participant's usage.

No credentials or Keychain values were extracted. Only the dedicated QA simulator's application preferences were inspected for the above booleans/counters and expected test-answer equality.

## Regression coverage: passed at policy/model level

- Per-app daily/session limits, remaining-budget clamping, one extra allowance per app/day.
- Duplicate/out-of-order/stale callbacks and monotonic cumulative usage accounting.
- Local-day rollover and normalized research day keys, including DST/date-only cases.
- Quarter-session checkpoint calculations for 5, 15 and 30 minutes.
- Complete bounded reviewed sentences, keyword boundaries, recent-message rotation and singular/plural timing.
- Tone, friction style and persuasion preferences change the questionnaire-message pool.
- Alternation of questionnaire/context sources, stale-context fallback and preserved source turns.
- Upcoming due-time priority; grouped overdue and grouped undated reminders; long-list “and N more” behavior; snapshot expiry.
- Day-two Settings tips: at most three, one per session, at least two hours apart, no later-day catch-up.
- Questionnaire/plan/history encoding, immutable stable-ID retry, account workspace isolation, corrupt-data preservation.
- MAX cumulative usage per session rather than adding duplicate checkpoints.

## Live database coverage: passed

Two clearly labelled API QA participants were created, plus QA identities from native walkthrough runs. Live checks covered:

- Enrollment availability and unchanged ordinary-email verification settings.
- Own-row participant insert/upsert and exact name/contact readback.
- Questionnaire/named-plan save and exact JSON readback.
- Event duplicate retry and immutable configuration-history duplicate retry/readback.
- Feedback and interview JSON save/readback.
- Cross-user denial on all six pilot tables and rejection of a forged event owner.
- Participant denial on all nine private researcher views, including connection records.
- Refresh-token identity preservation and subsequent own-row database access.
- Rejection of a nonexistent email/password login.

No fabricated selected-app usage/session events were uploaded. Synthetic API events are labelled `qa_audit_fixture`. Researcher view joins/aggregations were exercised in the isolated SQL suite; live admin view contents were not inspected through the unavailable dashboard browser.

## Issues found and repaired

- Replaced navigation links with competing save gestures with explicit save-then-navigate actions for goals, triggers and intentions.
- Added persisted goal/custom-goal drafts and restored trigger/intention answers on interrupted setup. Empty goal/trigger selections no longer silently advance to defaults.
- Corrected app-selection copy and continuation validation to require supported individual apps; displayed protection counts now count individual apps.
- Added a working keyboard Done control for root entry/dashboard fields and interactive scroll dismissal on Feedback. UI tests prove feedback/interview submit controls are reachable.
- Added distinct accessibility identifiers/selected traits to nested choices; removed the container identifier that overrode descendant choices.
- Applied the established light appearance consistently to avoid white-on-white/black-field behavior under device Dark Mode.
- Made interview saves verify returned record ID and full answers; record explicit interview consent. A previous feedback success no longer hides an interview error.
- Made live reviewed questionnaire-message choices honor tone/style/persuasion preferences.

The first unsigned simulator attempt could not save a session to Keychain. This was a **test-signing setup issue**, resolved using simulator ad-hoc signing. Authentication storage was not stubbed or bypassed. Intermediate UI runs also exposed navigation, keyboard and accessibility-selector problems; the final recorded run is clean.

## Not verified / still needs device testing

| Area | Current status |
|---|---|
| Apple Screen Time permission sheet and real individual-app picker | **Not tested this run**; simulator substitutes this step only |
| Actual per-app usage thresholds, pause on lock/other-app use, custom initial/session-end shields and Home Screen appearance | **Not tested this run**; source/policies/build checks do not prove OS callbacks |
| Force-quit/reboot/midnight recovery | **Policy coverage passed; physical behavior not tested** |
| Real banner delivery, Focus/denied notifications, End session action and tip-to-Settings notification tap | **Not tested this run** |
| Second-day tips over real days | **Timing policy passed; multi-day delivery not tested** |
| Actual EventKit permission grants, reminder completion refresh, Google-to-Apple sync | **Selection/message policies passed; real data integration not exercised in this simulator walkthrough** |
| Offline transport interruption and recovery in the app | **Stable queued models/server retry passed; actual airplane-mode app recovery not tested** |
| Successful optional legacy password-account sign-in | **Not tested**; new study enrollment is password-free; invalid password credentials were rejected |
| Other screen sizes, accessibility text sizes, real Apple app-label rendering | **Not tested**; visual walkthrough covered the iPhone 17 Pro simulator |

Existing implementation boundaries: nudges use reviewed local personalization, not fresh cloud AI generation for every open. Calendar/reminder context is a cached on-device snapshot, refreshed by Disconnect, with four-hour expiry; completing a reminder does not immediately update it in the background. User-defined scheduled blocking hours and direct Google OAuth are not implemented in this pilot. Historical pre-enrollment/whole-phone Screen Time totals are not collected, as requested.

## Test-data housekeeping

Browser controls were unavailable, so automatic admin marking could not be performed. Run `apps/mobile/ios/Tests/mark_qa_participants.sql` in Supabase SQL Editor **after this audit**. It only marks names beginning `QA Enrollment Smoke Test ` with `example.invalid` contacts as `is_test=true`, excluding them from the researcher views without deleting any data. The owner was asked to run this helper; until confirmed, QA rows may remain visible in researcher views.

## Evidence

Machine-readable evidence and screenshots are retained in:
`/Users/anishadasgupta/Documents/Codex/2026-11-02/do-x20/outputs/`

- `ios-policy-results.json`
- `ios-native-test-summary.json` and `ios-audit-final.xcresult`
- `ios-native-sync-proof.json`
- `ios-live-database-results.json`
- `ios-database-isolated-results.log`
- `ios-signed-bundle-check.log`
- Numbered walkthrough screenshots `01-...png` through `09-...png`.

Detailed reproducible scenarios are in `TEST_CASES.md`; executable regression tests and native test source are retained in this iOS folder and `scripts/tests/`.

## History redesign verification — 2026-11-04

PASS: all 14 pure Swift model/policy suites, including the new History comparison/deduplication suite. PASS: signed generic iOS build; shield/action/monitor bundle validation. PASS: dedicated simulator `DashboardHistoryUITests.testThreePageHistoryNavigation` (13.652 seconds): three pages, back navigation, week/month selection. Existing QA profile reused; no new enrollment. Screenshots retained in `history-ui.xcresult` attachments. Evidence: Codex task outputs `history-policy-results.json`, `history-ui.xcresult`; build log `work/history-redesign-build.log`.

Not tested here: actual Apple DeviceActivity report data and native app-token title rendering on a physical iPhone; server/cache History integration with real quit activity. No new database migration or live fixture writes were needed. The History count query uses existing owner-scoped events; actual usage comparisons remain in Apple's local report extension. No lifetime estimate or initial-study baseline is fabricated: comparison is with matching completed days of the previous period, and the projection is explicitly one year at the same daily pace with at least three comparable completed days.

## First-day defaults and day-two personalization

- **Passed on a fresh iOS 26 simulator against Supabase.** Named study enrollment, one registration-write failure followed by retry, questionnaire and setup, reopening to the dashboard, and both feedback and interview submissions. The app reported a successful profile and progress readback.
- **Passed with an injected notification route.** The returning participant opened the follow-up sheet, saw the deferred questions and both Apple connection controls, and saved the form. The simulator injected the stored route; it did not deliver a Screen Time notification.
- **Passed in Swift policy tests.** Three independent 30-minute daily allowances and 10-minute sessions, existing limits preserved, the first-day cap shield suppressing extra time, Eastern midnight and the 6 PM cutoff, invitation cooldown and retry, both context sources in one snapshot, and fallback to questionnaire messages.
- **Passed in isolated database tests.** Researcher views, participant ownership, plan/answer storage, and connection status records.
- **Requires iPhone verification.** Real protected-app picker and 30/10 plans synced from its selections, automatic shield transitions at session/daily limits, actual day-two notification delivery and tap, and real EventKit permissions and context.
