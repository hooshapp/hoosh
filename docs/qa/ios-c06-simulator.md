# C06 — isolated simulator and local API checkpoint

Date: November 21, 2026. Branch `integration/shared-product`.

## Observed results

Tests ran on a newly created iPhone 17 / iOS 27.2 simulator named
**Hoosh C06 Release QA**. No physical phone or existing pilot simulator was
installed over, erased or queried during this simulator pass.

| Check | Result / boundary |
|---|---|
| Normal Release startup, Metro absent | Passed: introduction rendered from embedded Hermes JS; no listener on port 8081. |
| Intro Skip | Passed: opened real signup screen. |
| Intro upward swipes | Inconclusive: Device Hub drag/scroll automation did not establish delivery of the native gesture. Do not mark the five-swipe behavior passed from this run. |
| Empty signup | Passed: required name/email errors, focus and native software keyboard appeared. |
| Native text editing | Passed: synthetic name and invalid email could be entered; invalid-email feedback appeared. No account was submitted or created. |
| Signup → login → recovery → login | Passed in the normal app using accessible controls. |
| Empty recovery | Passed: invalid-email message; no reset email sent. |
| Terminate/relaunch | Passed: returned to login without repeating the already-skipped introduction. |
| Protected Settings deep link while signed out | Passed: after system Open confirmation, remained on login without displaying private Settings. This is not an account A/B test. |
| Native dark-screen status bar | Found black system text on dark canvas. Explicit native-stack styles fix it; rebuilt/reinstalled Release shows white readable system text. |
| Root/layout integration regression | 94 tests passed across Android and iOS projects; typecheck and focused lint passed. |
| Real account/settings/onboarding save | Passed for one real-authenticated account against the isolated local DB; see signed-in continuation. Profile writes and hosted DB remain untested. |
| Real Google/Apple login and callback | Not performed in this pass; visible buttons are not provider acceptance. |
| Large-text navigation and standard Home width | November22 continuation: repaired and verified on Release simulator; all-page/compact-device/VoiceOver acceptance remains open. |
| Actual Screen Time access, blocking, continuous foreground expiry, revoke, reboot | Physical-device acceptance remains deferred. Activation remains false. |

The status-bar change is limited to native Stack options in the root, auth and
onboarding layouts. Warm private screens retain dark system text; dark public and
onboarding screens use light system text. No Figma layout or native protection
policy changed. The initial rebuild hit Expo's five-second module-scan timeout;
the retry succeeded without editing third-party code or lowering a check.

Source parent: `4f26c995ff102c623de59a9cd9718910d4e0cf22` plus the staged C06 delta.
The current [simulator product receipt](../integration_notes/artifacts/ios-c06-simulator-product.json)
includes source hashes for the three layout changes. The earlier signed device
receipt predates this JS-only visual fix; it remains evidence of the unchanged
native signing configuration, not proof of this newer UI running on a phone.
Screenshots remain local under `.native-dev/qa/ios-c06/simulator/`, including
`login-statusbar-fixed.jpg` and recovery/validation views. Build and test logs:
`/tmp/hoosh-c06-simulator-rebuild.log`, `/tmp/hoosh-c06-simulator-root-tests.log`,
`/tmp/hoosh-c06-simulator-types.log`, `/tmp/hoosh-c06-simulator-lint.log`.

## Local backend requested by the owner

No development API was running or configured locally. Reused the existing
`services/api` FastAPI application; no replacement service or hosted deployment.
The isolated backend is **http://127.0.0.1:8000**. The simulator already uses this
public API setting; a physical phone cannot use it to reach the Mac.

- Built PostgreSQL **17.11**, matching the repo's disposable-major guard, under
  `.native-dev/toolchains/postgresql17`. Docker/PG17 were not installed. Official
  [source](https://www.postgresql.org/ftp/source/v17.11/) archive SHA256 was verified
  against its published checksum before extraction/build. Local compilation used
  `--without-icu --without-readline --without-zlib`; no system package was replaced.
- New cluster `.native-dev/pg17-c06` listens only on `127.0.0.1:55432`, max20
  connections, SCRAM authentication. Only the `disconnect_test` disposable target
  was initialized; existing databases and managed Supabase tables were untouched.
- Reused `tests/support/bootstrap.sql`, `db/bootstrap/roles.sql` and
  `tests/support/runtime.sql`, with UTF8 and the existing isolation marker. API
  uses restricted `disconnect_api`, never the migration/admin identity.
- Existing guarded migration runner applied head **20261114_0007**. Runtime role,
  forced RLS and absence of mobile/public CRUD verified. **287 database tests
  passed**, 682 non-database cases deselected; migrations then checked/upgraded
  again before starting the API. No API ran against the fixture during that suite.
- Actual public JWKS was fetched over verified HTTPS for the already-pinned
  Supabase development project; ES256 matches the recorded handoff. Issuer and
  accepted `authenticated` audience follow the existing runbook. Normal production
  JWT verifier is used, with no fixture signer, fabricated SDK session or bypass.
- Ignored `.native-dev/c06-backend.env` holds API configuration and only its local
  runtime DB URL. Mode0600; admin credential is separate. Existing test-only
  credentials come from the repo fixture examples, never a hosted password.
- Actual HTTP checks: `/healthz` **200**; `/v1/me`, `/v1/profile` and `/v1/settings`
  without credentials **401**. Both listeners were inspected and are loopback only.
  [Readiness receipt](../integration_notes/artifacts/ios-c06-backend-readiness.json).

This is an isolated **local development/test database**, not the hosted product
store. Its test-only `auth.users` prerequisite does not automatically replicate
Supabase accounts. For real account **writes**, approved test-user IDs must exist
in that local FK fixture; do not bypass JWT verification, grant runtime Auth-table
writes, or weaken RLS to compensate. No live account writes are claimed yet.
User credentials/verification codes must be entered privately in the simulator.
Real sign-in was requested as a handoff after backend readiness.

## Start/stop later

From the repository root, inspect whether the ports are already in use first.
Never start a second cluster/server over an unrelated listener or reset data.

```sh
.native-dev/toolchains/postgresql17/install/bin/pg_ctl \
  -D .native-dev/pg17-c06 -l .native-dev/c06-db/server.log \
  -o '-h 127.0.0.1 -p 55432 -k /Users/anishadasgupta/hoosh/.native-dev/c06-db -c max_connections=20' \
  -w start

services/api/.venv/bin/python -m uvicorn app.main:app --app-dir services/api \
  --env-file .native-dev/c06-backend.env --host 127.0.0.1 --port 8000 --no-access-log
```

Stop this uvicorn process with Ctrl-C; stop only this cluster using
`pg_ctl -D .native-dev/pg17-c06 -m fast -w stop`. Do not delete the cluster or reset
fixtures with account data without reviewing ownership/cleanup. Database acceptance
must run with this API stopped because it mutates its disposable schema/data.
`.native-dev/` and the private native Supabase plist are now explicitly excluded
from Git; binaries, credentials, profiles and screenshots are not staged.


## Signed-in simulator continuation

The owner signed into an existing account privately. The normal Home and Settings
routes rendered with real Supabase authentication against the loopback API.
Activities and manual-plan controls were exercised with synthetic test choices;
time editing reached the review screen with the changed end time.

The first account save returned403 because this new isolated PostgreSQL fixture
had no `auth.users` FK row for the hosted-authenticated test identity. The existing
API correctly refused the write. The single account UUID was read only from the
isolated simulator's `hoosh.setup.<project>.<uuid>` AsyncStorage **key**, without
reading credentials/session tokens or copying questionnaire contents. After
checking PG17/database/isolation marker, one matching ID-only Auth fixture row was
inserted locally. No hosted Auth table changed, no runtime permission or JWT/RLS
check was relaxed, and no password/token was read or logged.

The app's Check latest settings → Keep my edits → Save recovery then succeeded.
The app showed preferences saved and the database contained one settings row at
revision1. The Screen Time step remained unavailable in the simulator. Finish for
now reached completion with an explicit pending-Screen-Time message; Let’s start
opened normal Home. After termination/relaunch, the signed-in session and saved
activity/day/hour/session draft were restored. Settings showed the same saved
values; native Apply stayed disabled. History explicitly showed iPhone usage
unavailable, without invented saved time or completed native protection.

This verifies one real-account local-save/recovery/relaunch journey, not hosted
product persistence, a second-account isolation check, provider signup/confirmation,
physical permission/enforcement or all layouts. The simulator was left on Home;
local API/DB remain running. New local screenshots: `saved-completion.jpg` and
`history-unavailable.jpg`. No account deletion/sign-out or physical-device action.


## Settings edit and API-outage continuation

Stopped only the owned local uvicorn process, leaving PostgreSQL and device
networking unchanged. Refresh/navigation retained prior confirmed draft values;
no successful write or active protection was asserted. Restarted the same API
with its existing private config. The normal Settings session editor then loaded,
changed the draft count, enabled Save and reported Draft saved after submission.
Restored the original count through the same editor and saved again. Local DB
revision advanced from1 to3, matching the two successful saves. No protection
Apply, credit action, hosted mutation or plan reset occurred. Screenshot:
`.native-dev/qa/ios-c06/simulator/settings-save-verified.jpg`.

This is **API service outage/recovery**, not a full device-offline, lost-write-ACK
or OS lifecycle test. Account A/B handoff awaits the owner's answer about a second
approved account. The simulator remains signed in on the session editor with the
original count restored; API and DB remain running. No runtime source changed;
only evidence/docs updated, diff checks passed. No commit/push.


## Account-switch attempt — November 22

Signed out A and observed login with private Settings hidden. Google OAuth opened
a visible account chooser. The owner reported choosing another Google account,
but subsequent Settings still displayed A's email and saved draft. **A distinct B
identity has not been established**, so neither isolation success nor data leakage
is concluded. Account linking, provider selection and SDK identity require further
inspection. No credentials were read. Supabase dashboard browser access was
unavailable in this chat. Targeted callback/controller/account-scope unit checks
passed66 cases across3 files; this does not supersede the unresolved live result.
No second-user local fixture row was inserted and no A data changed in this attempt.
Next: verify two distinct Supabase Auth user IDs and their linked providers, then
repeat with a confirmed distinct B account; do not unlink identities or delete users
as a shortcut. Physical tests and full C06 acceptance remain pending.


### November 22 — distinct-account simulator isolation verified

The earlier repeated identity was resolved when the owner confirmed the entered
email belonged to A. No session-switch or account-linking defect was established.
The owner then signed into a genuinely different account B privately. Settings
showed the different email; Home/Settings showed no saved activities, days, hours
or session draft from A. Setup offered Start setup rather than A's completed
progress. Returned B to Home without creating/editing its plan. Read-only local
DB check confirmed A's sole settings row remains at revision3 unchanged.

This passes observed A sign-out→B login UI/data/setup separation on the packaged
simulator with real Supabase Auth and the local API. It does not prove native
installation/journal takeover, B writes, a return-to-A login, hosted persistence
or physical protection. No credentials read, no identity deletion/unlinking, no
new Auth fixture inserted for B and no native permission changed. Screenshot
`second-account-empty-home.jpg` remains ignored locally. Updated sanitized backend
receipt and these two notes; no runtime change, documentation diff checks passed.
Everything stays staged/uncommitted. B remains signed in on Home; local services
remain running. Physical C06 acceptance remains deferred.


### November 22 — native layout continuation

Source parent: `e3a94e4` plus this layout delta. Continued on the same isolated
Hoosh C06 Release QA simulator with B still signed in. Maximum Dynamic Type
(`accessibility-extra-extra-extra-large`) exposed tab labels wrapping into single
letters and a navigation bar covering most of the viewport. Definite item widths
replace percentage flex bases; moderate accessibility text uses two columns and
font scales above1.8 use full-width rows. Native font scaling remains enabled.
The rebuilt standalone Release displayed complete labels at maximum text size;
Home→History activation worked. `accessibility-medium` displayed a readable
2-by-2 bar. Restored the original `large` text setting and returned to Home.

Standard Home then exposed horizontal overflow of the overview cards. Explicit
zero flex bases and shrink with the existing193:149 growth ratio now keep both
columns inside the content width. A second Release build/install visibly showed
both right card edges and the Credits value inside the viewport. No product data
or protection policy changed; B remains signed in without saved plan edits.

Validation:88 focused navigation/Home tests across the Android and iOS Jest
projects passed, including clearance/draft retention at font scales1.5/2/3.1.
Mobile TypeScript and focused lint passed. Full mobile lint had no errors and four
pre-existing warnings in usage-probe/use-usage-permission-action. Both Release
builds succeeded; final product inspection passed embedded Hermes, registration,
extensions/signatures and preview/pilot isolation checks. Updated simulator receipt
contains current source hashes. Signed-device receipt remains older native-signing
evidence, not proof of these UI changes on a phone.

Local ignored evidence: `large-text-navigation-before.jpg`,
`large-text-navigation-fixed.jpg`, `moderate-text-navigation-fixed.jpg`,
`home-width-before.jpg`, `home-width-fixed.jpg`. Final build log:
`/tmp/hoosh-c06-layout-build.log`; inspector log:
`/tmp/hoosh-c06-layout-inspection.log`.

Limits: automated Device Hub scrolling still did not establish gesture delivery,
so intro swipe and complete large-text scroll-to-footer acceptance remain open.
Compact hardware size, all-screen layouts, VoiceOver/TalkBack, provider signup/email
confirmation in this packaged build, B writes/return-to-A, hosted persistence and
native owner/journal takeover are not passed by this continuation. Actual Screen
Time authorization, enforcement, foreground expiry and lifecycle still require a
spare physical iPhone; activation remains compiled false. No phone queried or
installed; no credentials read; local API/DB configuration unchanged. No commit/push.


### November 22 — compact-device continuation and C06 closeout

Source `08b37669ee1f414961fe51430a0735e67e39c545`. Created an isolated
**Hoosh C06 Compact QA**, iPhone SE(3rd generation)/iOS18.6, UUID
`2AB64AEC-C582-4987-8A88-5BE6340BA8B7`. Installed the same standalone Release
package. Its embedded JS SHA and recorded runtime source hashes match the current
simulator receipt/current checkout. No runtime source changed in this continuation.

Observed: fresh intro startup, Skip→signup, empty signup→name error with focused
field/keyboard above the obstruction, synthetic name/invalid email editing→email
validation, signup→login→forgot password, and empty recovery→invalid-email message.
No password entered, no signup submitted with valid credentials, no account/reset
email requested. Provider buttons are present but no provider acceptance inferred.

At maximum accessibility text, recovery title/body wrap and require scrolling.
Device Hub drag/scroll did not establish gesture delivery on this simulator either;
therefore intro advancement and full footer reachability remain inconclusive.
Default `large` text was restored and verified via simctl, then a cold restart
returned to default-size login without repeating intro. The simulator remains
signed out at login. The original Release QA simulator retains B; no account,
selection or plan data was changed there. No physical phone queried/installed.

Local ignored screenshots: `compact-signup-validation.jpg`,
`compact-login-default.jpg`. No additional automated suites were run for this
pure evidence/docs checkpoint; existing package source hashes were checked and
Git whitespace checks passed. Current complete/pending requirements are now
centralized in [C06 closeout checklist](ios-shared-standalone.md#c06-closeout-checklist).
C06 remains open; iOS has no C07. Mandatory physical enforcement/owner/lifecycle
acceptance cannot be substituted by simulator checks. No activation-gate change,
commit or push.
