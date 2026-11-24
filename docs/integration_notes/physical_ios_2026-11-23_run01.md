# Physical iPhone run 01 — November 23, 2026

Preflight started. Shared app installed and launch command succeeded; initial phone screen and physical functional checks awaiting observation.

## Run identity

- Tester / reviewer: Anisha / joint review pending
- Platform / model / OS (no serial/UDID): iPhone 16 Pro, iOS 26.6.1
- Date and time zone: November 23, 2026, America/New_York
- Branch / source commit / dirty delta: integration/shared-product, 5586148; uncommitted documentation only at preflight
- Version / build / package or bundle ID: shared development1.0.1/build6, com.AnishaDasgupta.DisconnectApp (different source track from Swift pilot1.0.1/build16)
- Artifact and embedded-JS hash / sanitized inspection reference: artifacts/verify-ios-physical-run01.json; current embedded JS aa065377f6eab2b158e81971869c5a817d934b2400d9631bdbd1fa9c09b23cda
- Signing verified / activation gate status: current signed phone product inspection passed; host Apple sign-in and host/enforcing extensions Family Controls/App Group provisioned; activation gate remains false.
- API environment / transport (no secrets):
- Supabase project label (no keys):
- Disposable account labels A/B/F (no email/password/token):
- Harmless target labels T1/T2:
- Existing installation/replacement decision and preserved data: Hoosh 1.0.1 build16 on matching bundle ID; owner explicitly approved replacing this installation. No uninstall/data clear/legacy identity import authorized or performed.
- Original permissions / text / display / network / battery policy:
- Baseline installed native revision/count/deadline / existing rules:
- Readiness blockers: new current-source signed candidate and reachable HTTPS API required. Local API health200 and unauthenticated account endpoints401 verified. Owner approved temporary Cloudflare tunnel; started for this run. Public HTTPS health200 and unauthenticated me/profile/settings401 verified from Mac; phone connectivity not yet verified. Current device build in progress. iOS activation gate remains compiled false.

## Case ledger

Every case starts NOT RUN. For each executed case append its detailed result below, not only a check mark. Delete the other platform's rows in the copied record if useful. Shared P00 and P08 apply to both.

| Case | Status | Evidence / timestamp | Defect / blocker / owner | Final-candidate retest |
|---|---|---|---|---|
| P00 readiness | NOT RUN | | | |
| I00.1 | PASS | Exact installed Hoosh1.0.1/build16 checked; owner approved replacement in chat | Data not cleared; installation pending | |
| I00.2 | PASS | Current source Release build and required device inspection passed; artifact receipt linked | No distribution approval inferred | |
| I00.3 | BLOCKED | Approved tunnel: HTTPS health200 and unauthenticated me/profile/settings401 from Mac | Current-source phone build/install and actual phone HTTP read/write pending | |
| I00.4 | PASS | Owner-approved replacement install succeeded; matching installed version/build checked; no data-clear command | Preservation of functional pilot data not inspected | |
| I00.5 | FAIL | Owner reached intro but reported upward-scroll unlock not working on physical phone | Three-scroll animation/Continue repair in progress; actual phone retest required | |
| I01.1 | NOT RUN | | | |
| I01.2 | NOT RUN | | | |
| I01.3 | NOT RUN | | | |
| I01.4 | NOT RUN | | | |
| I01.5 | NOT RUN | | | |
| I01.6 | NOT RUN | | | |
| I01.7 | NOT RUN | | | |
| I02.1 | NOT RUN | | | |
| I02.2 | NOT RUN | | | |
| I02.3 | NOT RUN | | | |
| I02.4 | NOT RUN | | | |
| I02.5 | NOT RUN | | | |
| I02.6 | NOT RUN | | | |
| I03.1 | NOT RUN | | | |
| I03.2 | NOT RUN | | | |
| I03.3 | NOT RUN | | | |
| I03.4 | NOT RUN | | | |
| I03.5 | NOT RUN | | | |
| I03.6 | NOT RUN | | | |
| I03.7 | NOT RUN | | | |
| I04.1 | NOT RUN | | | |
| I04.2 | NOT RUN | | | |
| I04.3 | NOT RUN | | | |
| I04.4 | NOT RUN | | | |
| I04.5 | NOT RUN | | | |
| I04.6 | NOT RUN | | | |
| I04.7 | NOT RUN | | | |
| I05.1 | NOT RUN | | | |
| I05.2 | NOT RUN | | | |
| I05.3 | NOT RUN | | | |
| I05.4 | NOT RUN | | | |
| I05.5 | NOT RUN | | | |
| I05.6 | NOT RUN | | | |
| I06.1 | NOT RUN | | | |
| I06.2 | NOT RUN | | | |
| I06.3 | NOT RUN | | | |
| I06.4 | NOT RUN | | | |
| I06.5 | NOT RUN | | | |
| I06.6 | NOT RUN | | | |
| I06.7 | NOT RUN | | | |
| I06.8 | NOT RUN | | | |
| I06.9 | NOT RUN | | | |
| I07.1 | NOT RUN | | | |
| I07.2 | NOT RUN | | | |
| I07.3 | NOT RUN | | | |
| I07.4 | NOT RUN | | | |
| P08 joint sign-off | NOT RUN | | | |

## Detailed case result — copy per case

- Case ID / V IDs / guide stage:
- Candidate hash / phone / run time and zone:
- Preconditions (owner, permission, selection, saved vs installed revision, network):
- Exact steps and synthetic input values:
- Expected result:
- Actual result / PASS, FAIL, BLOCKED, DEFERRED, N/A:
- Sanitized recording/screenshot reference and action timestamp:
- Before/after account data and installed native state:
- Side effects / cleanup performed:
- Defect ID, severity, assignee and blocked dependent cases:
- Fix source commit / rebuilt artifact:
- Retest steps/result/evidence (retain original failure):

## Timing evidence — repeat for each timing case

| Case / target | Reason(s) / native revision | Session count before→after | Start time | Requested elapsed deadline | Native callback time if safely observable | Shield actually observed time | Drift | Foreground / network / host state | Result |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | NOT RUN |

Record clock/zone and stopwatch duration. Native callback and shield timestamps are separate. If unavailable, say so. Do not infer an exact-time pass from checking the app after expiry. No raw boot/identity signals or native tokens in evidence.

## A→B→A state evidence

| Checkpoint | Visible account label | Saved draft/quest/wallet label | Active native owner label / revision | Count / deadline retained? | Explicit claim or Apply? | Expected/actual |
|---|---|---|---|---|---|---|
| B before claim | | | | | | |
| B claim canceled | | | | | | |
| B claim confirmed | | | | | | |

Do not store raw account IDs, lease handles, app tokens or credential-bearing payloads here.

## Defect and retest queue

| ID | Failure / affected V IDs | Severity / owner | Reproduction and evidence | Fix commit / candidate | Retest and regression result | Open/closed |
|---|---|---|---|---|---|---|
| | | | | | | |

Priority order: credential/privacy or account separation → lost/unexpected protection → timing/budget/duplicate money-like credits → persistence/auth → layout/usability. Stop dependent tests while a blocking failure is open; continue independent work.

## Cleanup and platform sign-off

- Synthetic plans/quests stopped? Retained intentionally active rules and owner:
- Original permissions, text, network and battery settings restored?
- Task-created USB mapping/servers removed or intentional owner assigned?
- App/account data preserved; no unapproved uninstall/deletion performed?
- Required cases passed / failed / blocked / not run:
- Deferred long-duration/accessibility/store cases, owners and dates:
- Capability differences requiring explicit product decision:
- Platform acceptance: OPEN / SCOPED PASS (scope and exact artifact):
- Tester signature/date:
- Other-platform/shared reviewer signature/date:
- Joint VERIFY-C06 status and links:

A SCOPED PASS does not certify all devices, hosted deletion, missing product features or store distribution. Do not sign iPhone enforcement accepted while its activation gate is still off.

## Installation checkpoint

Owner approved the temporary Cloudflare route and replacement of installed Swift pilot. Current normal phone product built/inspected, HTTPS URL embedded, signatures/provisioning passed and installation/launch command succeeded. No credential, permission, activation, account or native store changed by explicit test commands. Initial screen and authenticated API/write remain unverified; no overall I00/I01 pass. Device Hub explicitly reports screen sharing unavailable for iOS26.6.1 (requires27+ on this Mac). Continue owner-observed direct phone testing. Keep Mac/tunnel running for the active test; stop tunnel at test end. No commit/push.

## Physical defect — intro scrolling

Owner reports that upward scrolling on physical iPhone intro does not unlock as
expected. New requested behavior: three distinct upward scrolls, each animated,
then explicit Continue into welcome. Prior distance/five-gesture behavior is
superseded. Original arrow was static; native gesture failure cause was not
directly observed because phone screen sharing is unavailable. No overall intro
physical pass is claimed from earlier simulator/model tests.

Repair uses native touch start/end coordinates without responder competition,
counts each completed upward gesture once, animates arrow translation/opacity
for three increments and reveals Continue only after the third animation.
Skip and accessible non-gesture Continue remain; first-launch flag is saved only
on explicit exit, not merely displaying the intro. Existing art files unchanged.
Focused cross-platform cases, real native touch-event paths and progress/storage
checks passed. Live Figma connection requires reauthentication; existing exported
layout/art retained, no new exact live-Figma verification claimed.
Build/simulator/physical retest results to follow.

### Intro repair installed — continuation

Signed rebuild/product inspection and non-destructive phone install passed.
Only the device-local intro seen flag was removed while app process was absent;
all other manifest entries preserved and no credential values inspected/output.
Phone launch succeeded. Temporary HTTPS health200 remains reachable.
124 component and13 unit checks, types/lint/assets passed; compact simulator
actual3drags→Continue→welcome→signup passed. Physical owner retest remains pending.
Commit suggestion: `fix(intro): animate three upward swipes before continuing`.
No commit/push.

### Follow-up: green arrow fill during touch

Owner rejected the release-triggered fade/translation as insufficient. Live Figma
reauthentication succeeded; inspected frames1:2 and6:34. They retain centered52px
pixel arrow and second-frame gradient bar; motion tool returns no keyframe nodes.
User-specified interaction therefore drives implementation: native touchMove and
web wheel/touch update a clipped green-tinted copy of the exact original arrow,
bottom-to-top, accumulating one third per completed swipe. Canceled movement
returns to earned progress; no distance bypass of three-swipe gate. Bottom bar
tracks the same value; prior whole-arrow fade/translation removed.
32 focused component cases passed; types/lint checked. Phone build/install/retest
evidence recorded separately; no exact authored Figma motion timing claimed.

Green-fill signed build/inspection/install and launch succeeded; intro-only flag reset. Physical smoothness/fill retest pending. Commit suggestion: `fix(intro): fill the arrow green during each upward swipe`.

### Follow-up: physical phone reports no swipe response

Owner confirms nothing changes on upward swipe after green-fill build. Previous
physical attempt remains FAIL; model/simulator evidence did not prove this phone.
Replaced passive touch observers with a stable native PanResponder that claims
vertical movement in capture phase before children, retains pre-grant movement
and forwards live movement to green fill. Taps remain unclaimed. Tests exercise
actual responder capture/grant/move/release and cancellation. 28 current intro
cases passed across both presets; focused lint passed. Physical retest pending.

### Recording diagnosis: accessibility path disabled gestures

Owner's12.8-second recording shows Continue on the initial white-arrow frame,
no progress changes, then Control Center. Continue on first frame identifies the
reduce-motion/screen-reader alternative branch in current code. That branch
explicitly disabled the swipe surface and ignored live animation movement.
This explains prior failed swipe attempts independently of native capture.
Removed reducedMotion from gesture-disable condition; reduced-motion green fill
uses immediate values rather than animated movement while keeping accessible
Continue available. No OS accessibility setting changed. Added actual responder
regression with Reduce Motion=true; physical acceptance still awaits retest.
Raw recording/frames stay outside tracked evidence.

### Physical visual failure: arrow square and incomplete bar

Owner confirmed three swipes now register but supplied screenshot of solid green
square covering arrow, poor transition and incomplete bottom bar. Previous visual
acceptance remains FAIL. Original PNG has opaque pixels, so tinting it colors its
background. Green overlay now uses original transparent vector via existing
expo-image renderer; original base art is unchanged. Fixed-size inverse-translated
clip reveals arrow without animating layout height. Bar uses native-driver scale
from33/67/100 percent and release no longer resets fill before committing gesture.
32 intro tests and types passed; physical visual smoothness still requires owner
observation on new artifact.

Vector/native-driver build inspection and install passed. Intro-only flag reset. Launch blocked because phone locked; owner must unlock/open Hoosh for physical visual retest. No visual pass claimed.

### Arrow orientation/alignment follow-up

Owner screenshot shows green SVG points right over upward grey PNG. Figma rotates
original vector -90degrees; green overlay had omitted that transform. Both layers
now share exact original52x52 vector and same -90degree rotation; central slot
unchanged. Added source/style/orientation equality regression.34 intro cases
passed. Physical alignment remains pending until installed-candidate observation.

### Completion copy follow-up

Owner confirmed arrow now looks good. New request: Continue only after scroll
completion; hide keep-scrolling text once complete. Removed early reduced-motion
Continue while keeping Skip; reduced-motion swipes still supported. Third
completed swipe (and normal-mode animation settling) reveals Continue in place
of instruction. Progress remains100percent.34 intro tests passed, types/lint
checked; phone build/retest recorded separately. Prior owner arrow approval is
scoped to screenshot and does not close remaining physical app checks.

### Intro accepted on physical iPhone; Android source parity check

Owner reports “perfect” and reached sign-in after completion-copy update. This
passes owner-observed physical intro three-swipe/arrow/Continue flow only;
sign-in and later native stages remain pending. Same shared Introduction,
IntroScreen, native IntroSurface and progress files resolve on Android; no
platform-specific Android override.17 Android intro component tests passed.
Standalone Android build result recorded separately; no Android device was
connected for a new visual/physical pass at this checkpoint.

Android standalone rebuild passed at 2026-11-23 22:32 Eastern. Embedded
Hermes/assets, signature, native registration and alignment checks passed.
APK SHA-256: `adbfb5b3b79f74537587448259f962f971fe48ff669059adf4992a36094674c6`.
This verifies packaging of the shared fixes; Android physical visual acceptance
remains pending. No commit or push performed.
