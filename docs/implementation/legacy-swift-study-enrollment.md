# Legacy Swift research-pilot enrollment and progression

November 4, 2026. Owner superseded the password-first requirement with name/email
only, prioritizing participant-level study data. The original SwiftUI design and
session policy are retained. Fresh install: name/email → Start study → questionnaire
and app/session setup → dashboard. Returning on the same phone resumes its saved
private device session. Existing password-account entry remains an optional path;
the newer app's email-confirmation setting was not changed.

## Identity and data

`StudyParticipant`, `StudyEnrollmentCard`, `NativeSessionModels`, `NativeSupabase`
and `NativeAppFlow` create and remember a Supabase anonymous authenticated identity.
Name/email are unverified participant labels, not credentials or a public lookup
mechanism. Tokens stay in host Keychain. A typed email cannot retrieve someone
else's data; a second device needs researcher assistance to link records. Existing
account workspaces still keep answers, selected apps and usage separate locally.

The owner enabled anonymous sign-ins and applied
`services/api/sql/20261104_study_enrollment.sql` manually after browser control
became unavailable. Read-only API verification observed anonymous sign-ins enabled
and existing email confirmation still required. The new participant table uses
own-row RLS, while `legacy_swift_progress` and `legacy_swift_daily_progress` are
researcher-only views. Existing public profiles and their backend privileges were
not changed. Participant name/email save/readback is independent of finishing the
questionnaire, so enrollment can be recorded before completion.

## Measurements and interpretation

- Selected-app usage: cumulative native active-use minute checkpoints for each
  session, captured at quarter milestones, session end/expiry, and host sync. The
  views MAX each session's checkpoints before summing: retries/snapshots do not
  multiply usage. This is selected-app, minute-resolution observation, not an
  entire-device Screen Time report. Sessions without a later checkpoint/sync can
  temporarily have incomplete usage; pre-enrollment history is not backfilled.
- Session start/end and extra-time events include timestamps and a local random
  session ID, not an Apple application token. Day-by-day usage uses the session's
  local-calendar day.
- Nudge requests are labeled requests, not confirmed delivery or views. Actual
  shield quit/continue choices and notification End session actions are counted
  separately. They do not prove that every earlier shield rendered successfully.
- Disconnect's own observed foreground visits/duration are separate from other
  apps' usage. Force-quitting can omit a final foreground-duration observation;
  no exact app-open/close feed for other apps is invented.
- Offline events remain in per-account atomic files and upload on host open or
  manual sync. No guarantee of live streaming while Disconnect stays closed.
  Overflow is exposed as telemetry_gap_detected. An app exit pauses native usage;
  it does not supply a reliable external-app-close callback that ends a session.

## Verification

- Swift enrollment tests passed for input validation, anonymous response decoding,
  null verified-email compatibility, persistence model and older password sessions.
- Exact migration scripts and both SQL test suites passed in an isolated PGlite
  PostgreSQL database. Checks include owner enrollment insert/upsert/readback,
  cross-user ownership, denial of participant access to private researcher views,
  restricted QA flags, minute/visit deduplication, daily progression and QA exclusion.
- Live API smoke test passed: no-password/no-email-confirmation anonymous signup,
  own participant insert and repeated upsert/readback, private researcher view
  denied to participant, refreshed token keeps the same participant ID. No real
  participant credentials/answers were read or logged. One clearly named synthetic
  QA participant remains; supplied researcher queries exclude that name, and an
  optional admin helper marks is_test=true.
- Signed iPhone build succeeded; embedded shield/action/monitor checks and diff
  whitespace checks passed. Installation attempt lost its wired device connection;
  the device list then reported a disconnected tunnel. The owner was asked to
  reconnect/unlock. Installation of this new enrollment build and phone acceptance
  are pending; do not describe it as installed yet.

The isolated PostgreSQL tests are not a claim that the native UI or timed Screen
Time behavior passed on the phone. Custom session-end shield, locked/away behavior,
force quit, reboot and midnight remain device acceptance work.

No commit/push/release. Browser controls timed out; no account tokens were extracted
from the dashboard and no elevated key was placed in the client.

## Cable reconnected — installed build

The owner reconnected the cable. `devicectl device install app` and process launch
both completed successfully for the study-enrollment build on November 4, 2026.
The owner was asked to enter name/email and tap Start study. Actual phone enrollment
and verified Supabase sync are pending that observation; no timed-shield result
is inferred from installation. No phone data reset/uninstall performed.

## Owner phone enrollment and sync verified — November 4

Owner entered name/email and reported Dashboard opens. Selected nonsecret phone
diagnostics confirmed route dashboard, enrollment status enrolled, participant
name/email save/readback flag true, and profile/plan sync status “Synced and read
back successfully” with a verified timestamp. No queue-overflow or monitoring
error was recorded. Raw copied preferences were deleted after extracting only
status/count/date fields; no participant identity or answers printed.

At this verification, registered-app count and configured shield count were zero.
Enrollment and cloud profile sync passed; selected-app usage collection and the
custom timed session-end shield still require selecting/protecting an app and
completing a timed device test. Dashboard navigation alone is not proof of those.
