# History acceptance — RN09-D02 / RN09C-D01–D02

Read the [measurement policy](../architecture/history-measurement.md), original
Plan04 and its latest implementation notes. Existing part IDs are retained.
Ishmum owns shared/backend/Android; Anisha owns Auth/onboarding/iOS. Further
TalkBack work is user-deferred. PD-12 lifespan forecast remains excluded.

## Automated verification

Run `npm run check`, then the guarded `npm run api:db:up` and
`npm run api:db:test`. The database suite requires the explicitly marked disposable
PostgreSQL17 loopback instance. Never run migration suites concurrently with the
manual device fixture. No hosted token, service-role key or Auth administration is
required for these checks.

The actual database tests cover fixed baseline capture, immutable reported days,
repairable unknowns, replay, selection/zone changes, revision races, zero/increased
usage, real23/25-hour normalization, own-user RLS, privilege/constraint drift and
additive0005→0006 preservation. The first-series race verifies that the losing
request reports the winner's actual revision, rather than a guessed constant.
Native quits are counted once per installation/encounter by event time and nudge
type, including cooldown-no-credit quits.

`test_mobile_history_acceptance.py` launches real TCP FastAPI with its normal
ephemeral test-JWKS verifier and runs the production portable mobile client. Five
nested cases exercise absence, aggregate upload, baseline/7/28-day projections,
A/B/C isolation, committed-response loss, stale replacement and actual API-process
restart. Its42-day inputs are synthetic calculation fixtures, not phone usage.

Component checks mount real account providers/consumers, including Home and History
sharing one query, period/detail navigation, negative/zero-baseline presentation,
offline/account masking, native failure, explicit cancellation/restart, lost setup
response, stopping after selection mismatch, offline local Stop with no HTTP
mutation, and cancellation of late native reads after Stop. Route-dependent native status is
mounted in the actual test Router. Pure decoder cases reject private/native fields,
incoherent arithmetic/coverage and malformed series envelopes.

Run `npm run mobile:check-intervention-engine` with the Android build JDK/compiler
cache populated. This executes the production interval reducer with the same pure
cases used on Android. Build debug app/test APKs and release Kotlin using the
[native runbook](android-interventions.md), then run `interventionChecks` on the
authorized device. Real AtomicFile corruption/size/version/erasure checks are
Android instrumentation, not JVM passes. Never count a Gradle NO-SOURCE task as a
test. Web export/isolation/original-assets and QA Android Hermes export remain
separate compilation checks.

## Physical Android journey

Use the ignored/private local quest-device fixture and QA host documented in
[quest acceptance](quest-lifecycle.md). Keep credentials out of chat, screenshots
and Git. Connect the local account with native quest ownership enabled; this gives
the existing account/native providers, not a managed Auth SDK login. Open **live
History**. The developer gear belongs to the QA host.

1. Save only the synthetic test target through **Review selected apps** → native
   picker → **Use these choices** → **Save selected apps**. Picker confirmation
   alone stages a draft. Verify the editor's saved acknowledgment.
2. Review **Start History** disclosure. **Not now** must leave server revision0
   and no series. Starting without saved apps must not fabricate a baseline.
3. Accept Start. Verify native aggregate cache, verified PUT/GET and the actual UI.
   Only duration/date/count/coverage cross the bridge/API. A retained seven-day
   baseline is legitimate if the reducer has boundary/state witnesses; unavailable
   days must remain unknown. The OS source remains an estimate, not lossless proof.
4. Confirm that baseline overlap cannot show saved hours or a reduction. Choose
   seven/28-day periods and detail navigation; do not seed comparison data into
   the live phone account to manufacture a result.
5. Revoke usage access and refresh: guidance appears and current comparison is
   masked. **Stop History collection** remains reachable; it erases local History
   state while retaining the account's existing series. Restore original permission.
6. Explicitly restart, then cold-restart the host and reconnect the same isolated
   account. Check series/revision/baseline equality and that normal reads did not
   replace the baseline. Protection activation is never part of these actions.
7. Restore original native files/content/modes, accessibility settings, usage mode
   and reverse mappings. Remove only owned temporary UI files; stop owned servers
   and let the fixture remove only its own disposable users/manifest. SDK credentials
   are excluded from backups. Finish the DB suite only after fixture cleanup.

## Observed2026-11-13

Workspace checks:551 portable,757 component(+2 existing skips),673 deterministic
API;270 actual PostgreSQL tests including five nested mobile TCP/restart cases.
After the first-series conflict-read correction, the14 History DB cases pass again.
Four pre-existing lint warnings remain; no lint errors. JVM116 and physical
Pixel8Pro/Android16/API36 instrumentation145 pass. Debug/test APKs, release Kotlin,
production web export/isolation38files/71original SVGs and QA Android Hermes export
pass.

Actual Pixel collection returned seven reported closed days for one synthetic saved
app; native cache was750bytes in the sanitized readback. The account reported a
fixed7/7 baseline and `baseline_overlap`, so comparison savings remained null.
Consent cancellation left revision0/no series. The first attempt with an empty
selection was correctly rejected; acceptance resumed only after confirming the
native checkbox, staged count and editor Save. Usage revocation was explained;
Stop worked while access was revoked. Explicit restart and cold host reconnect
preserved series/revision/baseline. The final shared local-only Stop refinement is additionally verified by offline
and late-read component cases; those new offline cases were not repeated on the
restored phone. No Accessibility service or TalkBack enablement
was needed. Phone baseline/settings/reverse were restored and verified; owned
fixture users/manifest and Metro/API processes were removed.

Development Supabase is verified at `20261114_0006`; before/after count/content
digests match for the prior eight product tables. Runtime TLS/own missing read and
exact no-drift/RLS/ACL checks pass. No managed Auth/user/provider/deletion operation
was performed. See [sanitized evidence](../core_plan_implementation_notes/artifacts/rn-09-history/evidence.json)
and [actual recovered History](../core_plan_implementation_notes/artifacts/rn-09-history/history-recovered.png).

This is bounded debug Android acceptance. Actual prospective7/28-day soak, wider
devices, signed/store builds, Anisha's Auth SDK/iOS and further TalkBack remain
separate; no full Plan04/RN-11 completion or lifespan/causal-savings claim follows.
