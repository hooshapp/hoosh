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

## D04a isolated Android device fixture

The existing profile QA host now offers **Connect quest device QA**. This verifies
`/v1/me` and binds the real Android port under a separate `qa-quest` owner. It does
not claim the device or install rules on connection. Apps/Sessions use the existing
product editors; account takeover, Save, Schedule, Apply and Stop remain explicit.
This fixture is independent of Anisha's managed Auth/onboarding integration.

Run the database suite **before** starting the device fixture:

```bash
npm run api:db:up
npm run api:db:test
uv run --project services/api python scripts/quest-device-fixture.py --duration-minutes 45
```

The last command stays running, uses only the marked local PG17 database and the
normal ephemeral-JWT verifier, and creates two generated disposable users with
settings and a saved quest. It refuses an existing fixture artifact or unknown
schema. Optional lifetimes are15/45/90minutes. Its ignored0600manifest is
`services/api/.local/quest-device-fixture.json`; keep its token values private and
use only the QA host's secure input. Credentials are memory-only in this host.
The fixture neither reads hosted `.env` nor creates Supabase Auth users. Ctrl-C or
SIGTERM stops its API, removes the manifest and deletes only its successfully
inserted local users. Do not run the database suite concurrently: its migration
tests rebuild fixture tables. The database CLI now refuses check/down/reset while
the private device artifact exists. Direct pytest invocation must observe the
same separation. If the process is killed without cleanup, inspect its ownership
before recovery; do not remove another operator's private artifact blindly.

For a native development build, run the QA Metro entry with
`env -u CI npx expo start apps/mobile/dev/profile --dev-client --localhost --port 8091`
and reverse only8091/8765 to the authorized device. Connect fixture A, choose only
the synthetic test target, save session policy and a near-future one-off quest,
then review the disclosure and enable the protection service. A DB row, saved
selection or enabled Settings toggle does not alone prove service connection.

During live native start/expiry/reboot checks, use guarded screenshots and native
count/receipt readback. Ordinary `uiautomator dump` can suppress the service under
test; concurrent sessions also left a stale registration in this run. Do not
overlap UI automation. Android documents this default and the instrumentation
opt-out [in UiAutomation](https://developer.android.com/reference/android/app/UiAutomation#FLAG_DONT_SUPPRESS_ACCESSIBILITY_SERVICES).
A dedicated emulator reboot cleared the stale session; no service-code change was
made to conceal that harness failure. Do not infer SDK/session acceptance from a
successful fixture connection, or speech acceptance from a screenshot.

The actual Expo argument boundary rejected nullable nested Map values before
Kotlin dispatch. The Android adapter now sends bounded metadata JSON and native
decoding enforces byte/depth/node/container/string limits before the existing
strict schema. App identities remain native. The shared typed interface and iOS
adapter are unchanged. Missing apps/policy/service now produces actionable setup
feedback rather than falsely declaring an uncertain write; an existing uncertain
receipt still requires review.

### D04a observations and remaining gates

Dedicated API36 arm64 emulator checks observed actual shared Save/Schedule/Update/
Apply acknowledgement, persisted native pause after reboot with API disconnected
and host JS unopened, Open anyway, one-minute allowance expiry and Return home.
A fresh03:46–03:49UTC occurrence started the pause offline; after its end, the
native pause window was absent. The account remained at zero credits until the
shared confirmation was activated: then50credits/one completion. An identical
API replay preserved that total. Stop with API disconnected and service access
revoked removed native versions/disabled the receipt while account state remained
enabled. Reconnecting and Check did not resume rules; explicit Stop acknowledged
both sides and retained the completion.

Scroll a control fully above the Android navigation area before tapping; a
partially visible completion node initially caused the test helper to tap Home.
No completion was recorded for those failed taps. One idle-emulator screenshot
was black while the pause window persisted; end acceptance uses native window
absence after the deadline, not that screenshot. These are recorded harness limits.

Final source passes538portable/719component(+2skips)/650API/233PG/90JVM;
final APK passes106native instrumentation checks on both phone and emulator.
Live timed UI used the bridge build before the final pre-parser guard and removal
of temporary native trace logging; the full timed UI was not repeated on that final
APK. Phone restoration passed before final isolated instrumentation; the phone
disconnected before its final baseline recheck. No new physical speech acceptance
or managed SDK journey is claimed. See the
[sanitized evidence and screenshots](../core_plan_implementation_notes/artifacts/rn-09b-quest-device/evidence.json).
Anisha's review/Auth/iOS, combined physical accessibility and signed/store checks
remain required; this does not complete D02/D03/D04 or Plan04.
