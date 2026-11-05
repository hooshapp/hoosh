# Legacy Swift pilot storage

`20261104_legacy_swift_pilot.sql` was applied to the existing development Supabase
project through its signed-in SQL editor on November 4, 2026, at the owner's request.
This is an additive pilot migration, not a change to the existing Alembic profile
migration history. Reconcile it into the team's migration authority before any
production release. It is not idempotent; do not blindly execute it again.

Existing `public.profiles`, its `disconnect_api` privileges, Auth identities and
Auth provider settings were not changed. The native pilot shares the Auth issuer
and accounts, while keeping its preferences, plan summaries, events, feedback and
research opt-ins in four `legacy_swift_*` tables. No iOS application tokens or
calendar/reminder titles are uploaded. Existing newer-app onboarding data is not
automatically copied: the observed public profile table only has account metadata.

All four tables use RLS. Only `authenticated` has scoped access to its own rows;
`anon` has no access. Profiles allow own-row insert/select/update. Event, feedback
and research rows allow own-row insert/select; events have stable UUIDs for
retry deduplication. No service-role key belongs in the app.

`../tests/sql/legacy_swift_rls.sql` passed against the development project in one
rolled-back transaction, with two existing Auth identities selected internally.
It tested own-row writes/readback, event retry deduplication, four-table cross-user
read isolation, cross-user update denial, forged owner insertion rejection and
anonymous denial. Test payloads were synthetic; no Auth or existing profile rows
were modified. No fixture payloads remained after rollback. Use an isolated test
project with two dedicated test accounts for future automated runs.

Native setup: run `python3 scripts/configure-native-supabase.py` from the repository
root after setting the existing publishable URL/key in ignored `apps/mobile/.env`.
It generates ignored `apps/mobile/ios/DisconnectApp/NativeSupabaseConfig.plist`.
Only those public client values are bundled. A fresh/signed-out launch now shows
sign-in first, followed by onboarding/session setup. Returning configured users
can check Settings → Your account & data. Use the same app account as the newer
app (the dashboard account is separate). The app reports successful sync only after authenticated
write AND preference/plan readback. Phone acceptance is separate from SQL tests.

Session events queue as account-owned atomic files in the App Group without
credentials. They upload on host foreground/manual sync; no background network
collection or reliable exact app-exit event is claimed. The queue is capped at
1000 files and marks overflow. Signing out stops future collection and never
reassigns an earlier account's queued events to a different user.

## Name/email research-pilot enrollment — supersedes password-first pilot UX

The owner now wants participant enrollment without passwords or verification mail.
`20261104_study_enrollment.sql` adds an own-row participant table and admin-only
progress views. The owner applied this script and enabled Anonymous sign-ins.
Existing regular-email verification remains enabled. The native app uses a private
anonymous authenticated ID stored in Keychain; name/email label the study record.
Signing in by typing an existing email is not used as a way to reveal old records.

The researcher can select/export `public.legacy_swift_progress` for participant
summaries and `public.legacy_swift_daily_progress` for daily measured minutes.
Nudge requests and actual choices are separate columns. Selected-app usage is
minute-resolution, and data syncs when Disconnect opens/manual sync succeeds.
An optional is_test flag excludes QA participants from the views.

Both migration scripts and SQL test suites were executed successfully against an
isolated PostgreSQL engine using PGlite in the chat scratch workspace. A live
anonymous signup/participant upsert/readback/refresh test also passed; no verified
email was required. The live synthetic row is clearly named QA Enrollment Smoke
Test and should be excluded (or have is_test set) for research exports. Do not
interpret it as a human participant. Native phone enrollment is a separate check.
