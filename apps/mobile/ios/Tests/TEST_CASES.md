# Legacy Swift iOS pilot test cases

This suite targets the existing SwiftUI study app, not the newer Expo/Figma app.
Study enrollment uses **name and email, without a password or email verification**.
Existing password-account sign-in is an optional legacy route. A test of that route is not a test of study enrollment.

## Reproduction

- Policy/model tests: `python3 apps/mobile/ios/Tests/run_policy_tests.py --output /tmp/ios-policy-results.json`
- Live backend tests (creates two named QA participants): `python3 apps/mobile/ios/Tests/live_supabase_smoke.py --allow-live-writes --output-dir /tmp/ios-audit`
- Native UI: run scheme `DisconnectApp`, test `DisconnectAppUITests.testNewParticipantOnboardingSettingsAndFeedback`, on a fresh dedicated iOS simulator. Use simulator ad-hoc signing (`CODE_SIGN_IDENTITY=-`); `CODE_SIGNING_ALLOWED=NO` prevents the real Keychain path from working.
- The UI test opts into `DISCONNECT_UI_TESTING=1`. Only the Apple picker step is substituted, using a DEBUG + simulator-only branch with an explicit warning. It does not create Apple app tokens or prove protection works.
- Never run live-write tests against a different project accidentally. Configuration comes from the repository's ignored mobile `.env`; no service-role key is used.
- Live fixtures use names prefixed `QA Enrollment Smoke Test` and `example.invalid` contact addresses. Mark their participant rows `is_test=true` using the generated admin SQL after the run. Existing real participant rows must not be changed.

## Account and onboarding

| ID | Scenario and steps | Expected outcome | Evidence | Actual result |
|---|---|---|---|---|
| AUTH-01 | Open a clean installation | Name/email enrollment form; Start study disabled until fields filled | Native UI | PASS: native/model/live as listed |
| AUTH-02 | Submit malformed email, blank name, newline/oversized name | Helpful validation; no account created for invalid input | Native UI + study-enrollment policy | PASS: native/model/live as listed |
| AUTH-03 | Enroll a new named participant | Onboarding opens; Dashboard is not skipped | Native UI + live Supabase | PASS: native/model/live as listed |
| AUTH-04 | Activate new owner with old unowned completion flag | Requires setup; keeps draft answers/plan | account-workspace | PASS: native/model/live as listed |
| AUTH-05 | Relaunch before completion | Resumes onboarding, not Dashboard; preset/custom goal draft, trigger selection and written answers retained | Goal-draft policy + native UI for preset/trigger/written answers | PASS: native/model/live as listed |
| AUTH-06 | Finish setup and relaunch | Same participant resumes Dashboard | Native UI | PASS: native/model/live as listed |
| AUTH-07 | Switch account | Old account's selection/answers/session state never becomes new account's data | account-workspace + backend RLS | PASS: native/model/live as listed |
| AUTH-08 | Refresh expired server token | Same user ID and own-row access preserved | Live Supabase | PASS: native/model/live as listed |
| AUTH-09 | Enter nonexistent email/password | Rejected; no access to another account | Live Supabase | PASS: native/model/live as listed |
| AUTH-10 | Restore corrupt local account archive | Restoration fails without destroying current workspace | account-workspace | PASS: native/model/live as listed |
| AUTH-11 | Auth signup succeeds but first database registration write fails; retry | No onboarding/dashboard until own participant write and readback succeed; retry keeps saved identity | Native UI failure injection + real server retry | PASS: native UI |
| AUTH-12 | Stored verification belongs to another account or only has old global flag | First-time entry stays locked pending current account's server confirmation | study-enrollment-gate | PASS: policy |

| SETUP-01 | Deny Screen Time permission | Clear requirement; cannot continue with a claim of protection | Source + physical test required | NOT TESTED: real permission |
| SETUP-02 | Choose only a category/website, or nothing | Requires at least one individual app | Source + physical picker required | NOT TESTED: real picker |
| SETUP-03 | Complete goal/question/intentions screens | All screens reachable; entered answer saved | Native UI | PASS: native UI |
| SETUP-04 | Skip Calendar/Reminders | Setup can complete; skip event stored; app remains usable | Native UI + event schema | PASS: native UI |
| SETUP-05 | Connect optional services | Real system permission result recorded separately from Connect tap | Live schema/policy; actual permission sheet needs device/simulator fixture | PARTIAL: schema/source; real grant pending |

## App limits, sessions and shields

| ID | Scenario | Expected outcome | Evidence | Actual result |
|---|---|---|---|---|
| LIMIT-01 | Two apps have different limits | Independent rule IDs, limits, usage ledgers | daily-limit-policy + session-policy | PASS: policy; device pending |
| LIMIT-02 | Increase/decrease daily limit | Previously used minutes preserved; limits clamp validly | Policy + physical callback test required | PASS: policy; device pending |
| LIMIT-03 | Change session length during active session | Current grant does not reset; new duration applies next session | session-policy + source | PASS: policy; device pending |
| LIMIT-04 | Start session with less daily allowance remaining | Duration clamps to remaining allowance | session-policy | PASS: policy; device pending |
| LIMIT-05 | Daily allowance exhausted | Initial/session shield; optional extra 10 minutes only once per app/day | session-policy + device UI required | PASS: policy; device pending |
| LIMIT-06 | Restart same app during session | Same grant retained; no fresh allowance | session-policy; device test required | PASS: policy; device pending |
| LIMIT-07 | Duplicate, out-of-order or old callbacks | No double-counted minutes or stale session completion | session-policy | PASS: policy; device pending |
| LIMIT-08 | Midnight/local date changes | New daily ledger; old research rows remain distinct | daily/session/SQL date tests; real midnight test required | PASS: policy; device pending |
| LIMIT-09 | Lock phone/leave selected app | Only Apple measured selected-app activity counts | Requires physical usage test | NOT TESTED: device |
| LIMIT-10 | Force-quit Disconnect/reboot phone | OS monitor/shield continues and recovers correctly | Requires physical lifecycle test | NOT TESTED: device |
| SHIELD-01 | Open selected app initially | Custom reflection and correct session duration button | Requires physical device | NOT TESTED: device |
| SHIELD-02 | Reach session end | Custom Disconnect shield, not default Restricted page | Previously owner-observed; must regression-test on device | NOT TESTED this run |
| SHIELD-03 | End session from notification or Settings | Grant removed; selected app shield returns | Policy/action source; device test required | NOT TESTED: device |
| SHIELD-04 | Bundled extensions | Configuration/action/monitor extensions embedded and signed | Signed bundle verification | PASS: signed bundle |

## Nudges and productivity connections

| ID | Scenario | Expected outcome | Evidence | Actual result |
|---|---|---|---|---|
| NUDGE-01 | Sessions of 5/15/30 minutes | Milestones 2/3/4, 4/8/12, 8/15/23; no extra wall-clock schedule | session-policy | PASS: policy/model |
| NUDGE-02 | Questionnaire keyword match | Reviewed complete relevant sentences; no raw malformed fragments | nudge-library | PASS: policy/model |
| NUDGE-03 | Repeated checkpoints | Exhaust pool before repetition; grammar correct for 1 minute | nudge-library | PASS: policy/model |
| NUDGE-04 | Both context and questionnaire available | Alternates sources; independent shield/notification turns | balanced-nudge-selection | PASS: policy/model |
| NUDGE-05 | Missing/invalid/stale task context | Questionnaire fallback; pending context turn preserved | balance + local-productivity tests | PASS: policy/model |
| NUDGE-06 | Upcoming calendar event | Local title in reminder; past/expired event ignored | local-productivity-nudge | PASS: policy/model |
| NUDGE-07 | Reminders due at different times | Earliest upcoming due reminder takes priority | local-productivity-nudge | PASS: policy/model |
| NUDGE-08 | Multiple overdue reminders | Comma-separated group; explicit overdue wording | local-productivity-nudge | PASS: policy/model |
| NUDGE-09 | Multiple undated reminders | Comma-separated group; no invented due date | local-productivity-nudge | PASS: policy/model |
| NUDGE-10 | Long task list/title | Bounded complete sentence; “and N more”/count fallback; no cut-off title | local-productivity-nudge | PASS: policy/model |
| NUDGE-11 | Date-only reminder | Due through end of local day, not overdue at midnight that morning | local-productivity-nudge | PASS: policy/model |
| NUDGE-12 | Complete reminder in Apple Reminders | Next context refresh removes it; no claim of instant background synchronization | Needs EventKit device test | NOT TESTED: EventKit refresh |
| NUDGE-13 | Second-day Settings tips | At most 3 on day two; one per session; >=2h apart; no late catch-up | day-two-settings-tips | PASS: policy/model |
| NUDGE-14 | Tip tapped on cold/warm launch | Opens Settings after normal account/onboarding gate | Routing source + native UI route test pending | NOT TESTED: notification tap |
| NUDGE-15 | Focus/notification permission off | No guaranteed banner; shields independent; request accepted != seen | Requires system notification/device tests | NOT TESTED: OS delivery |
| NUDGE-16 | Cloud AI unavailable/offline | Reviewed local messages still usable; no per-open cloud dependency | Source + local tests; offline device test required | PARTIAL: local logic; real offline run pending |
| NUDGE-17 | Data privacy | No calendar titles in research events, cloud AI request or plan; Apple tokens remain local | Source + configuration tests | PASS: source/model privacy checks |
| NUDGE-19 | Change tone/friction/persuasion style | Reviewed questionnaire-message pool changes to reflect chosen preferences | nudge-library | PASS: policy/model |
| NUDGE-18 | Google calendar synced to iPhone | EventKit can read synced calendar with permission; no direct Google OAuth built | Needs Google sync device test | NOT TESTED: Google sync |

## Research storage and Settings UI

| ID | Scenario | Expected outcome | Evidence | Actual result |
|---|---|---|---|---|
| DB-01 | Save name/email and repeat upsert | Exactly one own participant; no verification wait for study enrollment | Live Supabase | PASS: live API/native as listed |
| DB-02 | Save questionnaire and named app plan | Exact own-row JSON readback; no opaque Apple tokens uploaded | Live + configuration tests | PASS: live API/native as listed |
| DB-03 | Change settings while offline | Immutable timestamped snapshot queued with stable UUID; retry doesn't duplicate | Model/SQL tests; actual offline transport retry needs simulator/device verification | PARTIAL: model/server retry, not airplane mode |
| DB-04 | Submit feedback | Message/rating/context saved and confirmed | Live + native UI | PASS: live API/native as listed |
| DB-05 | Join Interview List | Name/contact/type/notes/consent saved in `legacy_swift_research`; toggle alone doesn't submit | Live + native UI | PASS: live API/native as listed |
| DB-06 | Selected-app usage aggregation | MAX cumulative sample per session; no duplicate checkpoint totals | verified-study-progress + SQL | PASS: model/isolated SQL |
| DB-07 | No measured data / before enrollment | Missing is NULL/not measured; no fabricated historical baseline or whole-phone data | SQL suites | PASS: isolated SQL |
| DB-08 | Cross-user reads and forged writes | Reads yield no peer rows; writes rejected | Live + isolated SQL RLS | PASS: live API/native as listed |
| DB-09 | Researcher views | Exist and deny participant/public access; named analytics available to admin | Live permissions + isolated SQL exact joins | PARTIAL: SQL/API privacy, no admin browser |
| DB-10 | Calendar/Reminder choices | Connect request, result, observed status, errors and skip are separate events | SQL tests + source | PASS: source/SQL; grant UI pending |
| DB-11 | Notification outcome | Requested, accepted/failed and user actions distinct; never claim seen | Source + event schema | PASS: source; actual banner delivery pending |
| UI-01 | Settings landing | Protection first; no Account & data or developer footer | Native UI | PASS: native UI |
| UI-02 | Preferences/profile explanations | Condensed expandable sections retain choices and information | Native UI | PASS: native UI |
| UI-03 | Enrollment/sign-in/app-label fields | White background, black entered text in Dark Mode; secure password field | Native screenshots/source | PASS: auth screenshots; app label uses same style |
| UI-04 | Label selected apps | Label saved with own rule; researcher session/plan views use it | Live plan + model; Apple label interaction needs device | PARTIAL: model/live plan, no real picker |
| UI-05 | Dynamic Type/small screen | Controls and disclosures reachable without overlap | Visual/device coverage still required | NOT TESTED: other dimensions |

## Interpretation

An optional calendar-context snapshot expires after four hours and refreshes when Disconnect refreshes context. Completed reminders are not removed instantly in the background.

A policy test proves application logic, not Apple's callback delivery. A successful database API test proves actual server persistence/RLS, not inbox delivery or a physical Screen Time session. The simulator picker substitute must never be reported as Screen Time authorization or enforcement passing. See `TEST_RESULTS.md` for the actual run status and remaining work.

## History redesign — 2026-11-04

Reference behavior: Figma App-UI `27:153` (stats), `10570:192` (progress), `10570:193` (time reclaimed). Retain the legacy SwiftUI theme. Reference numbers are illustrations, never fixtures in the app.

- H01: Navigate stats → progress → reclaimed, back twice; change week/month. Both filters must remain reachable and no Victory card appears.
- H02: Count only actual recorded shield quits and successful nudge session ends. Deduplicate event IDs and repeated session-end IDs. Exclude older/future events; scope cache and query to current participant.
- H03: Compare matching completed days of this and the previous calendar period. Exclude today's partial usage from comparisons; include it in time-so-far. Handle DST and different month lengths.
- H04: Missing days must show unavailable, never zero. Explicit reported zero is valid. A zero baseline has no percentage. Increased usage shows an increase and no invented time saved.
- H05: An 80% measured reduction fills eight of ten circles. Clamp increases to zero filled circles. One-year same-pace estimate requires at least three complete paired days and positive reduction; label its assumption. Do not infer lifetime from uncollected age/lifespan.
- H06: Empty selection or denied permission shows actionable explanatory copy; actual Apple report values require a signed physical iPhone. Report computes selected-app durations locally; does not export report data.
- H07: Saved app-name headings render black; native token title fallback uses light environment. Verify the Apple-rendered label on a physical phone.

Automated: `history-progress.swift` tests H02–H05 models; `DashboardHistoryUITests.testThreePageHistoryNavigation` tests H01 and empty-selection navigation using the existing dedicated QA simulator profile. H02 REST/cache integration, H06 real report delivery, and H07 native token rendering still need device verification. No new participant is created by the History UI test.
