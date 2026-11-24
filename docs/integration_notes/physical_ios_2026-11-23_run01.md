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

### Owner-reported physical Apple sign-in pass

Owner reported “passed” after the requested native Apple sign-in, expected
Hoosh destination, Settings identity and terminate/reopen session checks.
Recorded as owner-observed evidence, not independently screen-observed.
Google device handoff, cancellation/retry, logout and installed-app email-link
checks remain pending. This does not establish Screen Time authorization or
enforcement. No credentials or account identifiers recorded.

### Owner-reported physical Google sign-in pass

Owner reported “passed” after logout, Continue with Google, intended account
selection, return to Hoosh dashboard/onboarding and Settings identity check.
Owner-observed evidence only. Provider cancellation/retry, signed-out relaunch
and installed-app email-link checks remain pending. No credentials recorded.

### Owner-reported cancellation and signed-out lifecycle pass

Owner reported all requested checks passed: logout plus terminate/reopen stayed
signed out; Apple and Google cancellation returned to usable sign-in; fresh
Google sign-in succeeded. Current owner-reported session is Google. These are
owner-observed physical checks. Installed-app email confirmation/recovery links
and subsequent Screen Time stages remain pending. No credentials recorded.

### Dashboard organization and direct Screen Time access

Reviewed current shared-app Figma frames Home 22:4, Quests 27:155,
History 27:153 and Settings 27:157 in session
2620bc80-c9df-43e4-86b4-60c9906fd688. Legacy Swift frames remain separate.
Kept source artwork, tokens and main compositions. Grouped secondary Home
preferences/protection, Settings schedule controls and History maintenance
controls into accessible disclosures; opened child state remains mounted when
collapsed. Settings profile editing now opens explicitly and cannot close over
an unsaved draft. Account actions sit below settings. Saved quests use the
existing warm card hierarchy beneath suggestions/custom creation.

Added Settings > Personalization > Screen Time access (App usage access on
Android), a protected explicit route using the existing owner-bound native
permission/selection implementations. iPhone picker opens its own editor route
to avoid nested scrolling. No permission request occurs on entry, and no plan
is applied by navigation or selection. iPhone activation gate remains false.

Signed iPhone Release build succeeded, product/provisioning inspection passed,
and installation plus launch on Anisha succeeded. Data was not cleared. This
is build/install proof; owner physical layout, authorization and picker/save
acceptance remain pending. Browser synthetic layouts reviewed, not authenticated
phone evidence. Final validation results recorded below. No commit or push.

Final current-source component run: 125 suites passed, 993 tests passed,
2 existing platform-specific skips. TypeScript and diff whitespace checks pass.
HTTPS test API health200 verified after installation. No physical permission
acceptance inferred from these checks.

### Physical Screen Time existing-installation review blocker

Owner screenshot IMG_1772 shows an existing-installation review plus premature
selection/status read error. Access controls were mounted before device claim.
The dedicated route now gates children on owned installation readback after
explicit review/claim; pending/error states do not mount authorization/picker.
No automatic takeover, permission request, deletion or activation added.
18 targeted iOS/Android tests and TypeScript pass, including child-mount gating
until explicit claim/readback. Phone build/install and owner review follow.

Corrected Release build and device product inspection passed; update installed
on Anisha without clearing data. Explicit owner takeover confirmation and
subsequent permission/picker physical acceptance remain pending.

### Repeated authorization / refresh flicker follow-up

Owner IMG_1773 confirms owned setup and authorization allowed, but reports
glitching on repeated Review Screen Time access. Removed authorization action
when already allowed, added synchronous action lock, preserved status content
during same-foreground refresh and disabled picker while readback is pending.
Background still invalidates permission-dependent state. 20 targeted component
tests and TypeScript pass, including no reauthorization action when allowed
and stable content during delayed refresh. Physical follow-up remains pending.

Permission-refresh fix: signed Release build/inspection passed and installed
on Anisha without clearing data. Owner must retest app selection/save;
permission success does not establish enforcement.

### Missing new-user questionnaire restoration

Owner reports signup went directly to dashboard. Confirmed integration branch
had SetupResume resume-only behavior and no gender/age/apps questionnaire
components; landing-page retained those screens. Restored original presentation
and local original SVG assets into shared questionnaire.tsx, replacing legacy
Auth/native dependencies with verified-account setup persistence/current routes.
New verified users with confirmed absent server settings and no local progress
now route automatically to questionnaires; established/completed accounts are
not restarted, and pending/error settings are not interpreted as a new user.

Order: gender (Male/Female/Other), explicit age18–80,2–4 most-used app
preferences, required hobbies/custom activity, permission review, existing plan
flow. Each Next/Back persists account/project-scoped progress before transition;
failed writes retain current page. Answers persist through plan completion.
Age/gender and survey app preferences are durable local account data only;
backend schema currently has no demographic fields, so cross-device sync is
not implemented or claimed. Hobbies map into existing revisioned account
settings when the user explicitly saves the plan. Survey app choices do not
pretend to be native protected-app tokens. Screen Time setup links to the
existing native route; protection remains separately gated.

Figma reconnection returned UNAUTHORIZED; no fresh design inspection claimed.
Restoration uses original landing-page implementation/artwork plus prior
reviewed layouts. Focused presentation/resume tests12pass, repository6pass,
full normal route/plan integration96pass before final checks. Updated route
journey specifically requires automatic entry without a Settings detour.

Restoration final validation:129 component suites/1009 tests passed,2 skips;
6 repository unit cases passed. TypeScript, asset integrity and lint(no errors,
4 existing warnings) passed. Signed phone build/product inspection and update
installation succeeded without clearing data. Physical questionnaire visual
and completion acceptance are awaiting owner observation. No commit/push.

### Owner requested onboarding reset instead of account deletion

Added explicit Settings Account > Restart questionnaires. It saves a fresh
questions progress record only for the verified current account, preserving
existing server settings revision for later review/conflict handling. Confirmation
explains that local answers are replaced while credentials, saved server plans,
history and installed protection remain unchanged. No Supabase user deletion,
email change, token extraction, native reset or server plan clearing performed.
Owner must invoke once in each intended test account; neither account is marked
reset until that action succeeds. Phone manifest inspected privately showed no
setup records; no bulk storage deletion was attempted. Raw copy remains ignored.

Restart action validation:102 targeted component cases passed across iOS and
Android; TypeScript passed, lint0errors/4existingwarnings. Signed Release build,
device product inspection and installation succeeded. Neither named test
account is marked reset: owner must invoke signed-in reset for each account.
No commit/push or account deletion performed.

### Inline questionnaire Family Controls permission flow

Owner requested removal of the unnatural Settings detour from permission
questionnaire and verification of Swift functionality. Confirmed shared native
HooshScreenTimeModule imports FamilyControls and requestDeviceAuthorization
checks installed owner/lease before AuthorizationCenter requestAuthorization
for individual. Host entitlement includes Family Controls and matching App
Group; prior signed phone product inspection confirms capability/provisioning.
This does not establish OS prompt acceptance or enforcement timing.

Replaced questionnaire permission link to settings/device with in-place dark
permission card and explicit native request using current verified owner device.
Existing setup review/claim remains explicit via native confirmation on the
same page; no automatic takeover. Approved access presents Continue instead of
request. Native request also returns immediately if already approved. Not now
records deferral; denied/unsupported access never becomes an authorized claim.
Questionnaire most-used-app preferences remain distinct from native selection.
Settings access page remains available for later management.

Exact frame50:85 link received; Figma create_session twice returned UNAUTHORIZED,
and direct page fetch unavailable. Fresh visual parity remains unverified;
existing permission artwork and landing-page styling reused. No fake system
permission dialog or change to activation gate. Owner still needs native prompt/
readback acceptance on installed phone. No commit/push.

Inline permission validation:114 targeted component cases passed across both
platforms, TypeScript and asset checks passed, lint0errors/4existingwarnings.
Native Swift bridge compiled successfully in Release; signed product inspection
and phone update installation succeeded. Fresh Figma comparison and owner
physical permission interaction acceptance remain pending. No commit/push.

### Duplicate post-plan Preferences reviewed screen (IMG_1774)

Owner screenshot is Hoosh SetupDevice/DeviceScreen, not Apple's native picker.
SetupSettingsReview always saved step=permission after plan save, so restored
questionnaire users repeated device review. For verified native iPhone sessions
with questionsCompleted, the saved-account transition now records complete and
shows existing Figma PlanCompletionScreen. Existing permission checkpoints
from that restored questionnaire flow render the same congratulations screen
and persist completion on explicit final action. Legacy and Android device
review/Apply flows remain intact. No implicit permission, selection or plan
activation write occurs, and the iPhone activation gate remains false.

Figma session request still UNAUTHORIZED; requested user reconnection. No fresh
visual match to current frame claimed. Apple FamilyActivityPicker remains
system-owned and is opened only by explicit native Choose apps action. This
removes duplicate app UI, not the system picker or its staged Save semantics.

Completion transition validation:128 targeted component tests passed across
iOS/Android, including explicit legacy-checkpoint recovery and no duplicate
permission UI after save. TypeScript and whitespace checks passed; lint has
no errors. Signed Release/product inspection passed; updated app installed
on Anisha without clearing data. Owner completion-screen acceptance pending.


### November 24 — onboarding Figma alignment follow-up

Compared the restored questionnaire against App-UI frames 27:113, 48:79, 48:81, 50:83 and 50:85; plan/loading/manual/completion references are 50:87, 52:690, 10556:120 and 50:89. Added a shared seven-step dark frame, source-sized typography/cards, page-specific footers, separate permission action row, and account-answer app cards on the suggested plan. Required questions retain no Skip, ages 18–80 and the Other avatar, per owner decisions.

For the restored iOS questionnaire flow, accepting a plan now starts the existing revision-aware settings save directly rather than adding the generic engineering review screen. The loading page represents that real save. Conflicts, uncertain writes and failed local receipts keep explicit recovery; no blind retry. Native permission, installation ownership and protection activation gates remain intact.

Source/type/lint and targeted flow validation are recorded in the task. Browser access was unavailable for this chat: exact rendered visual parity and the installed physical-device flow still require review. Do not treat source geometry or automated checks as proof that every rendered screen matches pixel-for-pixel.

Validation: 126 targeted tests passed across iOS and Android Jest projects, including questionnaire input requirements, real settings-save contracts, Figma plan presentation and completion routing. Added tests confirm a plan acceptance initiates only one save and never automatically retries a persisted uncertain write. TypeScript passed; lint has zero errors and four existing warnings. Asset validation passed 71 original SVGs, 59 integration files and 31 current plan SVGs. iPhone Release build and signed host/extension packaging inspection passed; physical journey remains owner acceptance pending.

Final alignment build installed successfully on the approved connected iPhone. Automatic launch was unavailable because the phone was locked. No account reset, uninstall or protection activation was performed.

### November 24 — restart availability and manual alternative

Owner reported Restart questionnaires disabled. The button unnecessarily required successful API identity/settings queries for an account-local operation; the phone tunnel was unreachable while the local API remained healthy. Restart now uses the current authenticated account scope and the existing account-fenced local repository, without requiring an API read. An available settings revision is retained; unavailable settings never become a fabricated revision. Local questions can load and save under that same current scope, while remote settings writes retain identity/revision checks. No account deletion, global reset or native permission change.

A fresh HTTP/2 temporary tunnel returned health 200. Rebuilding the approved physical iPhone app with its reachable endpoint. Verified the existing Set up on my own branch: active days/hours/overnight/session editors, invalid-input blocking, Save my plan, and returning to the unchanged suggestion. 118 targeted iOS/Android tests passed, including new offline restart coverage; TypeScript passed; lint zero errors with four existing warnings. Manual layout was previously implemented from Figma frame 10556:120; no new pixel-perfect device claim.

### November 24 — replace iPhone app questionnaire with native targets

Owner explicitly changed the design: replace the multiple-choice app question on iPhone with the native Family Activity picker. That question now handles existing Family Controls authorization/ownership checks, explicit permission request if needed, and explicit native picker opening. Confirmed nonempty picker choices are committed and read back through the owner-bound selection transaction. Next requires confirmed targets; cancel, empty choices and unconfirmed save do not advance. No Settings detour.

The app-question answer stores only a validated native target count plus the selection revision; opaque tokens remain native. It does not claim to know app names. Existing multiple-choice answers remain readable for prior checkpoints/Android; Android UX is unchanged. Gender, age, hobbies and required-answer policy remain intact. The later Screen Time page checks saved targets and authorization without requiring a duplicate picker. Saving targets never starts protection.

Targeted component/flow checks and local progress codec checks passed; physical Apple picker acceptance still requires owner review on the installed phone.

### November 24 — button order and remove duplicate iPhone permission

Owner screenshot showed Back wrapping onto two lines in the narrow hobbies footer. Questionnaire actions now stack full-width, Continue/Next above Back. On iPhone, hobbies Continue completes questionnaire answers directly without showing the duplicate Screen Time page. Existing iPhone index-4 checkpoints resume hobbies; older checkpoints without native targets return to the actual app-selection question. Android retains its permission step because it has not requested permission in the app question.

Re-fetched Figma 52:690 screenshot/design context and reused its original loading-screen component/assets. The native-target questionnaire now shows a brief local schedule-preparation transition after hobbies before the suggestion; loading is numbered 5/7, suggestion 6/7 and completion 7/7. This is a presentation transition for the starting schedule, not an AI request. Manual plan alternative remains available. Device review pending updated installation.

### November 24 — progressive loading ring

Owner requested a slower loading experience with the central circular border filling completely. Figma motion context for 52:690 has no authored keyframes, so owner-directed motion uses a 4.2-second clockwise native-transform ring fill plus a 0.3-second completed hold. Kept the original track, centered dinosaur, glow, sparkle/star and stage cards. The dynamic border replaces the static partial arc and its fixed tip. The suggestion transition now follows successful animation completion rather than an independent one-second timer. Cancellation/unmount never advances. Reduce Motion shows the completed ring without the sweep. This remains a local plan presentation transition, not a claim of live AI generation.

14 focused iOS/Android component tests passed, including completion/cancellation and plan/manual transitions; TypeScript passed. Physical visual review remains owner acceptance pending installation.

### November 24 — prevent loading from advancing early

Owner still observed a brief loading page after successful previous installation. Found a code path that used zero fill duration plus only a 300ms hold when iOS reports Reduce Motion. This could explain the report; device accessibility preference was not directly observed. Updated normal fill to 5.5 seconds plus a 0.5-second full hold. Reduce Motion retains the same six-second presentation without the sweep. Added an independent elapsed-time floor after animation completion, so early native completion cannot navigate immediately. Cleanup cancels the deadline and animation.

Tests cover immediate completion, cancellation, no navigation before 5999ms, navigation at 6000ms, and Reduce Motion duration. Focused tests and TypeScript passed. Owner should verify actual fill visually; no claim that the phone’s accessibility setting was inspected or changed.
