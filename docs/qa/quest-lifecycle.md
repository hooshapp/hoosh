# Quest lifecycle acceptance — RN09B-D02/D03/D04

Date2026-11-11. Owner Ishmum; Auth/onboarding/iOS integration with Anisha.
[Contract](../architecture/quest-occurrence-lifecycle.md),
[implementation notes](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md).

## Implemented scope

The original quest list/editor now connects explicit first-date Schedule/Update,
Apply saved schedule, device-first Stop, single-occurrence cancellation and explicit
post-end completion. Account and installed device states are displayed separately;
+50 self-reported credits are server-confirmed once, per quest. Save alone never
activates. Native choices/policy prerequisites use existing Apps/Sessions editors.
Native ownership requires matching SDK and verified API identity. Takeover is an
explicit confirmation, preserving private histories with rules stopped on return.
Reads/reconnects/remounts never install/replay/resume. Local Stop can survive a
failed account update; an explicit Check reads uncertain receipts before retry.

## Reproducible independent checks

```bash
npm run check
npm run mobile:export
npm run api:db:up
npm run api:db:test
npm run api:db:down
npm run mobile:check-intervention-engine
```

Use the documented pinned JDK/SDK for native Gradle builds:
`:app:assembleDebug :app:assembleAndroidTest :hoosh-usage:compileReleaseKotlin`.
Install only the authorized development APK and its test APK with `adb install -r`
(no data clear). Run existing `UsageProbeInstrumentation` with
`-e probe interventionChecks`. This uses isolated synthetic cache stores, not
private credential/session backups. Do not claim it exercises real shared UI.

The existing isolated HTTP driver now runs eight write scenarios and two cold
restart scenarios through the production portable client, real TCP FastAPI, normal
ephemeral-JWT verifier and PostgreSQL owner RLS. It includes schedule persistence,
separate definitions, isolation, committed lost response, future-completion rejection
and immutable/idempotent cancellation. Test accounts/keys are ephemeral fixture data;
this does not implement or certify Supabase SDK login. Backend frozen-clock/real DB
tests separately exercise completed +50 once, opposite outcomes, races and cascade.

Component tests use actual editor/hooks/controller and strict fixture boundaries,
including native-stop-before-delete. Both platform presets test portable rendering;
they establish neither iOS device execution nor screen-reader speech.

## Actual D03c independent evidence

- Full root:536 portable,698 component (+2 existing skips),643 deterministic API;
  lint0errors/11existing warnings, types/Ruff/generated contracts/assets pass.
- Guarded PostgreSQL:233 tests pass, including ten nested mobile HTTP scenarios.
- Pure JVM:90 cases; actual Pixel8Pro/Android16/API36:104 native instrumentation cases.
- Debug/test APK builds and Android library release Kotlin compilation pass.
- Production web isolation:38JS/HTML files;71originalSVG assets retained.
- Known native phone files and settings match original private baseline; no
  permissions/TalkBack/font/animation settings were changed. No screenshots,
  sign-in credentials or password-field inspection. Temporary API/Metro and reverse
  ports were removed; dedicated DB fixture stopped with volume retained.
- Existing development schema0004 remains verified. No hosted Auth/credential/user
  administration or managed-account deletion in this increment.

## D04 coordinated acceptance still required

Anisha owns the actual sign-in/onboarding integration and reviews the already-added
D02 SDK/root foundation. Managed-account sign-in/restore/refresh/signout/replacement,
A/B SDK isolation and actual app HTTP/native journeys remain pending. Anisha confirmed
iOS bridge/build is unavailable; no iOS or production-signed acceptance is claimed.

Once the coordinated build is ready, manually sign in on the phone using dedicated
approved disposable accounts, keeping credentials off chat/source. Verify that Save
leaves protection unchanged, then choose only the installed synthetic intervention
target through the native Apps picker. Save session policy and a near-future dated
quest; review the prominent in-app disclosure and let the device owner enable only
Disconnect protection in Android Settings. Native enabled state must be confirmed
before Schedule can dispatch.

Check account-then-native acknowledgement, actual pause/start/end with JS and API
unavailable, one-app allowance/reentry, reason overlap, single cancellation, Stop,
settings revocation, update while active, process reconstruction and no automatic
resume after sign-in/reconnect/remount. For an uncertain response, Check must read
before another write; after offline Stop the UI must show device-stopped even if the
account update is pending. Do not reset credentials or create/delete Auth users to
force a pass. Separate account-deletion acceptance keeps its own explicit authorization.

Run TalkBack/large-text/focus/IME/foreground checks on these new combined controls
with the user's fresh listening assistance. Confirmation dismissal must return to
its own trigger, not the last row or an unrelated button. Check end/completion and
once-only credit, without inferring success from the timer. Restore only task-changed
phone settings/files and remove task-owned reverse ports/servers afterward. Signed
Android app/store-policy acceptance and Anisha's signed iOS upgrade/bridge tests
remain distinct from debug APK and library compilation.
