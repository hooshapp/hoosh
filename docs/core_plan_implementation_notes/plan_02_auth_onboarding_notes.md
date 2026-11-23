# Plan 02 — Auth/onboarding implementation notes

**Integration evidence, 2026-11-23:** [C06 handoff](../qa/integration-handoff.md) records current SDK/account/persistence and 287 isolated PG17 checks, preserved manual QA data and exact-head CI. AUTH parent completion is not inferred: hosted deletion, packaged Auth platform matrix, signed iPhone and release gates remain explicit. Original entries below are historical.

Owner: Anisha for Auth/onboarding/iOS. This shared interface producer is implemented
by Ishmum at his explicit 2026-11-11 request for RN09B-D02–D04. Branch
`task/react-native/rn-09b-lifecycle-integration`, base `b9bf936`.

## RN09B-D02 / AUTH-02 consumer dependency — SDK session producer

Commit message: `feat(auth): connect SDK session authority to private app routes`.
Implementation hash `0bbf714`; resolve detailed file ledger in that commit. Detailed every-file/line ledger
is in the matching latest Plan 04 notes entry; this is a coordinated cross-plan
pointer, not acceptance of all Plan 02 or Anisha’s onboarding work.

Supabase’s installed JS SDK owns sessions, refresh and sign-out. AuthSessionPort
projects immutable identity only; existing account controller owns disposable
queries/forms. Expo SecureStore persists native credentials; web stays in SDK
memory. Missing/invalid config and storage failures lock private routes. SDK local
sign-out clears local credentials before remote revocation; network failure is
reported as unconfirmed remote revocation, not failed local erasure. No automatic
native-rule cancellation, anonymous mode or Auth-provider/project-setting changes.

Validation: full `npm run check` passed: 474 portable, 660 component (+2 preexisting
skips), 628 API; includes 17 new portable SDK/session/storage tests and eight new
root-boundary component results across two presets. Existing 11 lint warnings remain.
`npm run mobile:export` passed 38 isolated files/71 original SVGs before local public
configuration was copied. That export is not real-account or native acceptance.

Corrections during implementation: Expo install rejected unsupported --project-dir;
rerun in mobile workspace installed SDK-compatible SecureStore and dynamic config
was edited explicitly. Typecheck caught nullable AppState and async renderer APIs;
tests caught unawaited v14 events and missing Expo network mock subscription.remove;
corrected the fixture instead of changing working lifecycle production behavior.

Pending: actual signed-in A/B phone/session restart and accessibility acceptance;
provider flows/onboarding completion remain Anisha’s interfaces. The root currently
supports existing accounts through password sign-in only, not signup/OAuth/recovery.
D02’s consumer integration must not be declared fully accepted until actual-account
checks run. See Plan 04 notes for continued D03/D04 and device baseline/restoration.


## RN09B-D02 — Apply secure-session backup exclusions to the existing Android project

Commit message `fix(auth): exclude device credentials from Android backups`.
Own hash Pending; parent `0bbf714`. The existing native project is retained rather
than regenerated. Inspecting the first successful APK build showed Expo's plugin
configuration alone had not edited the checked-in native manifest. Explicitly
reference the installed SecureStore module's supported cloud-backup and device-
transfer rules, including the Android <=30 rule. These exclude encrypted session
preferences; key material already stays in Android Keystore. This prevents broken
credential restoration on a replacement device. No account/native policy change.

Validation: previous full root suite 474/660/628 and focused SDK/root tests passed;
first new SDK/secure storage native debug build passed (518 tasks). The official
pinned JDK was downloaded to a new external directory and its published SHA256
verified after the old cache was found incomplete. After this manifest correction,
`:app:assembleDebug` passed in five seconds (518 tasks). Parsed the actual merged
manifest and verified both backup resource attributes; resource linking passed.
No claim of managed sign-in/phone execution or release signing yet.

Every-file ledger:
- `apps/mobile/android/app/src/main/AndroidManifest.xml`: line 14. Apply both supported SecureStore backup exclusion resources to the retained native app; generated configuration alone does not affect an existing project.
- `docs/core_plan_implementation_notes/plan_02_auth_onboarding_notes.md`: lines 10, 41–61. Record the initial implementation hash, measured native-project backup gap, exact corrective change, actual build evidence and remaining acceptance.
