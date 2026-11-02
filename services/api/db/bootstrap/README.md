# Product database access — SB-04

Ishmum owns this infrastructure bootstrap; Anisha owns Supabase Auth. This does
not create product tables, edit managed Auth objects, add signup triggers or
configure providers. API-07 will own product DDL/grants/RLS in one Alembic history.

`roles.sql` creates a passwordless `disconnect_api` LOGIN with bounded connections,
no elevated flags, no role memberships and no owned database objects. It grants
only CONNECT to the selected database and USAGE on `public`, then rejects unsafe
ambient CREATE/Auth-table grants. Repeated runs validate rather than downgrade an
unexpected existing role. If a check fails, run the entire file in a transaction
so no partial grants/role remain. Do not fix it by changing shared PUBLIC grants
or managed roles without understanding their consumers.

Use the dashboard administrator only for bootstrap/migrations (`MIGRATION_DATABASE_URL`),
never as `DATABASE_URL`. This early development exception avoids inventing a
migration role before its hosted privileges are tested. Do not grant the runtime
role membership of postgres, service_role, authenticator or a migration owner.
Later product-table grants belong to the migration that creates each table.

## Hosted application procedure

1. Confirm the development project/ref using [the runbook](../../../../docs/runbooks/supabase-development.md).
   Inspect its existing roles/tables before applying anything. Review `roles.sql`.
2. Execute the complete file as an explicit administrator in one transaction.
   When using MCP, DDL goes through `apply_migration`; its provider-side record is
   **infrastructure bootstrap only**, not a second product schema history.
3. Run `verify.sql`; require no elevated flags, memberships, object ownership,
   persistent CREATE or managed Auth table CRUD. Keep only nonsecret evidence.
4. Set the new role's password through a private direct database connection using
   interactive `psql` **`\password disconnect_api`**. Do not type a password in
   SQL, shell arguments/history, chat/MCP calls or tracked files. A role without a
   password is intentionally not a working hosted login yet. Do not rotate an
   existing credential as part of a routine bootstrap rerun.
5. Copy the exact host/port/mode from Dashboard → Connect. Direct IPv6 is preferred
   when reachable; this machine failed direct DNS, so session pooler is the next
   candidate. Use `disconnect_api.<project-ref>` for its pooler username; direct
   uses `disconnect_api`. Never guess the pooler cluster index from the region.
6. Download the project root certificate from Database settings into an ignored
   local path. Require `sslmode=verify-full` plus `sslrootcert=/absolute/path/...`
   (or the driver's verified system trust only if explicitly proven for that
   endpoint). Do not downgrade to require/prefer/disable to mask a failure.
7. Store the two distinct URLs only in ignored `services/api/.env` with mode 0600.
   Run `check-permissions.sql` through an actual runtime login with ON_ERROR_STOP,
   not SET ROLE from an administrator, whose session authority can still elevate.
   Test valid TLS and intentionally wrong trust/hostname before accepting SB-04.
   Never put a raw connection URI in a command argument or error report.

For the newly created passwordless role, a local alternative to interactive psql
is `uv run --project services/api python scripts/configure-db-access.py --project
<development-ref> --root-cert <downloaded-local-ca-path> --initialize-runtime-password`.
It reads only the ignored local administrator URI, pins project/role/session mode
and verify-full, generates a random runtime password, hashes it client-side using
SCRAM and saves the runtime URI privately. It refuses initialization when a runtime
URL already exists. Omit the initialization flag for later non-rotating checks.
It never prints raw driver errors, URIs or passwords. If a network/commit failure
interrupts provisioning, verify the saved credential with the non-initializing
check before any deliberate recovery/rotation; file and database commit cannot
form one atomic distributed transaction.

Public TEMP rights inherited from PostgreSQL's PUBLIC defaults are **not persistent
schema/table creation rights**. They are reported, not revoked globally: doing so
could affect managed services. No runtime-owned persistent relations are allowed.
This role/context design protects against application mistakes, not stolen runtime
credentials or arbitrary SQL execution. API-06/07 supply transaction-local user
context and RLS; no profile access is available before then.

## Verification and recovery

`verify.sql` is a catalog-only inspection; it does not fetch Auth rows or password
hashes. `check-permissions.sql` uses rollback-only permission probes and requires
the true login identity. SQL must run with errors stopping the script. Retain the
reported PostgreSQL version and distinguish local fixture versus hosted evidence.

If a fresh role fails validation, roll back the bootstrap transaction and inspect
the target; never grant BYPASSRLS/ownership. If hosted access fails, check the
dashboard's actual mode/username/host, password and CA independently. Do not reset
the project's administrator password, rotate signing keys or change Auth settings.
Coordinate credential rotation explicitly: update the private runtime secret,
restart/dispose application pools and prove the old password fails. A bad runtime
configuration must not fall back to the migration URL. Recovery does not require
dropping tables, Auth accounts or an established role.

References checked 2026-11-01: [connection modes/TLS](https://supabase.com/docs/guides/database/connecting-to-postgres),
[roles](https://supabase.com/docs/guides/database/postgres/roles),
[psql password command](https://www.postgresql.org/docs/17/app-psql.html).
