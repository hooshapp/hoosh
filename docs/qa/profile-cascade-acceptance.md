# Coordinated development-account deletion acceptance

**2026-11-02 status: pending at Ishmum's request.** A separate disposable account
was selected; accounts A and B must remain intact. No hosted Auth deletion has
been performed. Supabase MCP database access is not an Auth-admin API. This test
must use the supported Auth lifecycle flow, with Anisha coordinating Auth ownership.

The local guarded PostgreSQL suite already checks the profile foreign key,
storage-only cascade, other-owner preservation, post-deletion reads/writes and
isolation. Those fixture checks do not establish managed Supabase lifecycle behavior.

When resuming, follow this sequence:

1. Identify a newly created, explicitly disposable **C** in the development project
   `eaisvwqfbgdkzdfmxkvm`. Verify its UUID differs from A and B without putting any
   UUID/email/password/token in evidence. Do not repurpose A or B.
2. Obtain a current C session through the ordinary Auth flow. Store credentials
   only in an ignored private file. The current interactive login helper accepts
   A/B only: extend it to a dedicated C slot, with preservation tests, before using
   it for C. Do not overwrite either existing slot. Never obtain a service/admin
   secret merely to embed it in the mobile application or evidence.
3. Save C's profile through the real app/API, retain its short-lived access token
   privately, and prove read-back. Record redacted pass/fail checks for A/B too.
   Establish a baseline that detects changes to either control account.
4. Confirm C has no independently valuable data or Storage-owned objects. Resolve
   provider deletion prerequisites through supported provider administration;
   do not delete unrelated data or weaken foreign keys to force the test to pass.
5. Anisha or the authorized operator permanently deletes **only C** through
   Supabase Authentication → Users using the provider's permanent-delete action,
   or its supported Auth-admin API. Record the action and completion without
   private payloads. Do not delete `auth.users` directly with SQL as a substitute
   for managed Auth acceptance. Do not reset settings or credentials.
6. Verify the profile row disappeared using an appropriately authorized read-only
   database check. Verify both A/B remain intact with unchanged profile values.
7. Before C's retained JWT expires, observe the documented split: local JWT
   verification may still accept an already-issued token for `/v1/me`; profile
   GET must return `profile: null`, and a first-create PATCH must fail safely
   with 403 because the real owner foreign key no longer exists. A 401 caused
   solely by token expiry does not prove this behavior. No write may recreate C
   or C's Auth identity. New sign-in must fail via the Auth provider.
8. Exercise actual Auth-owner session teardown and the mobile private subtree:
   C's cache/draft disappears and late reads/saves cannot reach another account.
   Provider JWT expiry/revocation behavior and the application Auth contract must
   be reported separately; do not promise instant JWT revocation from the cascade.
9. Record sanitized evidence, exact environment, commands and remaining limits in
   Plan 03/API-10 and Plan 04/RN-07 notes/ledgers. Destroy private C credentials.
   Do not mark full application M1/M2 accepted until real Auth/root journeys pass.

Do not execute these destructive steps while this acceptance remains deferred.
Provider lifecycle and Storage prerequisites were checked against the official
[Supabase user-management guide](https://supabase.com/docs/guides/auth/managing-user-data)
on 2026-11-02. Repository behavior and local fixture evidence remain separate.
