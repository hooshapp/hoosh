# Product schema migrations — API-07

This directory is the **single product Alembic history**. The earlier provider-side
`bootstrap_disconnect_runtime_role` record is infrastructure bootstrap, not a
parallel product schema. Do not apply these revisions through dashboard table
edits, Supabase migrations or `metadata.create_all`, and never stamp an existing
database as empty to hide a mismatch.

## Commands from repository root

```sh
# Deterministic review SQL: no environment, credentials or database required.
npm run api:db:migrate -- sql

# Isolated real database; selecting DB tests automatically runs actual Alembic.
npm run api:db:up
npm run api:db:migrate -- upgrade --target test
npm run api:db:migrate -- check --target test
npm run api:db:test

# Explicit additive development upgrade; project must match the ignored .env.
npm run api:db:migrate -- upgrade --target development --project <project-ref>
npm run api:db:migrate -- check --target development --project <project-ref>
```

The runner has no default target or URL fallback. Test execution validates both
explicit TEST_* URLs and the fixture marker before using the migration role.
Development requires APP_ENV=development, the exact explicit project origin/ref,
MIGRATION_DATABASE_URL as postgres, session/direct port 5432 and verify-full with
the private root CA. Runtime URLs/roles cannot become migration credentials.
Passwords/driver exceptions never enter output; no URL is placed in alembic.ini,
command arguments or ConfigParser interpolation. Generic online Alembic requires
the runner's explicit validated connection; offline SQL needs none.

Online operations use one externally owned transaction, a transaction advisory
lock, 5-second lock wait and 30-second statement bound. They inspect PostgreSQL
major/UTF8, prerequisite roles/Auth UUID table and current owned public history
before DDL. An unversioned existing product/public relation is refused for explicit
adoption review. Exactly one repository head is required. Upgrade/check also
verify ownership, RLS, exact predicates/commands, constraints, trigger body/rights,
runtime flags and table/column grants. Alembic's schema diff alone cannot audit
RLS, ACLs, trigger bodies or every CHECK constraint, so these checks are explicit.

## Initial revision `20261102_0001`

Creates only the product table `public.profiles`, plus Alembic's technical version
table. Auth users remain managed and externally referenced; the ORM stub lives
in separate external metadata and cannot enter owned autogeneration. There is no
Auth signup trigger, profile backfill, duplicate email/password data or speculative
onboarding/plan/reward field.

Profiles contain verified Auth UUID PK/FK with ON DELETE CASCADE, nullable text
name, positive integer revision default 1, and server timestamp-with-time-zone
columns. The database accepts only canonical nonempty names of at most 80 Unicode
code points, using the frozen Python 3.12 strip-character set; it does **not** trim
client input or normalize NFC/case. API-09 must validate/strip raw drafts before
SQL. Valid nulls and supplementary/decomposed Unicode remain supported.

An invoker-only, pg_catalog-pinned BEFORE INSERT/UPDATE trigger assigns server
statement timestamps, preserves created_at on update and overrides supplied clock
values. Its direct EXECUTE grants are private. Revision compare-and-swap/increment
is API-09's responsibility, not a hidden database trigger.

RLS is enabled and forced. SELECT/INSERT/UPDATE policies apply only to
disconnect_api, reading transaction-local app.user_id with missing/empty context
denied. UPDATE has both USING and WITH CHECK, so a row cannot be reassigned. No
DELETE policy or grant exists. Explicitly remove every ambient non-owner table
grant before giving runtime only SELECT/INSERT/UPDATE without grant options;
the version table remains owner-only. Even service_role's RLS bypass does not
bypass ACLs. The runtime remains non-owner/non-bypass and cannot read Auth users.

The existing public default privileges were inspected and deliberately preserved
to avoid changing shared Auth/project behavior. They grant broadly to Data API
roles, so **each future table/function migration must revoke unintended ambient
grants, then add its own reviewed access policy**. New objects are private before
the transaction commits; retaining defaults is not a claim they are globally safe.

## Settings revision `20261102_0002` — API-11

Adds only `public.user_settings` and its own server-clock function/trigger, after
the unchanged profile revision. One row per Auth UUID stores bounded activities
and a nullable non-enforcing plan draft as JSONB, with an independent revision.
Explicit grants/default deny, three owner policies and forced RLS mirror profiles.
The migration imports no application models and changes no managed Auth objects,
shared default privileges or profile schema. A shared external FK reference stays
outside the owned ORM metadata.

`check` now compares both owned tables and verifies settings constraint definitions,
policies, clocks and grants. Tests cover a profile-head upgrade preserving profile
data and disposable downgrade of only settings, plus base/head replay. Downgrade
is still exposed only for the guarded disposable target. The API-11 implementation
ran these checks locally; it did not upgrade hosted development or publish routes.

## Recovery and evidence

Review offline SQL and actual target/history before applying. The initial hosted
upgrade inspected an empty owned public schema, so no populated profile data
needed a recovery export; it did not read/export managed Auth records. Future
populated shared changes need a suitable backup/export/recovery plan before DDL.
Use reviewed forward fixes on shared data. Never edit an applied revision or
automatically drop profiles to restore availability.

`npm run api:db:migrate -- downgrade-test --target test` deliberately destroys the
fixture's profile table/clock function and is exposed only for the guarded
disposable target. Development downgrade is rejected **before** reading its
credentials. Local acceptance tests exercise downgrade, removal of empty history,
real fresh upgrade and repeat no-op inside the isolated target; no managed users
are deleted for tests.

Read [Plan 03 notes](../../../docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md)
for exact commits, reviewed SQL and local/hosted evidence. Local Auth-FK cascade
is tested against the minimal fixture; actual managed A/B/cascade smoke remains
API-10/joint work with Anisha's approved disposable accounts. Profile HTTP routes
are still API-08/09, and schema export still publishes only health/identity.

## Hosted settings adoption — 2026-11-07

The pinned development project now runs `20261102_0002`. Before DDL, the existing
head `20261102_0001`, two profiles and absent settings table were inspected; a
private product-row/revision snapshot was saved with mode 600 under the ignored
`services/api/.local/plan03-before-settings-*.json`. The existing additive revision
was applied through `api:db:migrate upgrade --target development --project ...`;
no revision was edited/stamped, no Auth object changed, and no shared downgrade
was attempted. Exact profile data remained unchanged. `check` reported no schema
changes and all security predicates/grants/clocks passed. The actual runtime
login uses client TLS and no-context reads remain default-denied. Final settings
row count is zero because real-account writes remain user-deferred.

This supersedes the earlier statement about API-11 not applying its revision to
hosted development. It does not establish current managed-token settings or app
acceptance. Read the latest Plan 03 notes and
[evidence](../../../docs/core_plan_implementation_notes/artifacts/api-10/hosted-settings-acceptance.json).
The private snapshot remains local for recovery review; it is not a production
backup service or authorization to restore/drop shared data. Runtime routes now
include identity, profile and settings; the initial API-07 route description above
is historical.
