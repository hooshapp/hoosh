# Disposable PostgreSQL — SB-05

Run from the repository root with Docker running and the locked uv environment:

```sh
npm run api:db:up
npm run api:db:test
npm run api:db:down
# Deliberately destroy only the labeled fixture's volume, when a clean start is needed:
npm run api:db:reset
```

The Compose project is `disconnect-db-tests`, database `disconnect_test`, volume
`disconnect_db_test_data` and published address `127.0.0.1:55432`. PostgreSQL
17.11-bookworm is pinned by its multi-platform digest to match the managed major
observed through MCP. Public passwords in Compose/fixtures are **local test-only**;
they must never be copied to a managed connection. Nothing reads the main API
`.env` or falls back to its runtime/migration URLs for test connections.

`up` copies `services/api/tests/.env.example` to an ignored `.env` if absent, without
overwriting existing values, then waits for container health. `down` stops the
stack but retains its test volume. `reset` validates exact volume/project/scope
labels before Compose removes this volume; it has no arbitrary target option.
Initialization SQL only runs for empty storage, so after changing bootstrap SQL
deliberately reset this fixture and prove it starts empty again.

The required `database` pytest group validates APP_ENV=test, both explicit test
URLs, exact database/port/roles, loopback and a database scope marker before any
test SQL. It rejects extra libpq options/hostaddr/service, mismatched targets and
managed URLs before connecting; localhost alone is insufficient. Missing/broken
configuration **fails**, never skips or substitutes SQLite. Driver errors are
redacted. Explicit local sslmode=disable belongs only to this loopback fixture;
hosted connections instead require verify-full with the downloaded CA.

Default `npm run api:test` remains deterministic and excludes this separately
marked group; `npm run api:db:test` and the required `database` CI job run it.
CI creates the same Compose image/SQL/role prerequisites without cloud credentials.
Use `uv run --project services/api pytest services/api/tests -o addopts= -m database`
for direct invocation. Shell APP_ENV/TEST_* values deliberately override the local
test file, which allows CI configuration and ensures accidental unsafe values fail.

`bootstrap.sql` creates only minimal `auth.users(id uuid)` and a fixture marker.
It is not a Supabase Auth emulator. The reviewed production role bootstrap is
mounted separately, followed by test-only runtime access. No profile table or
Alembic history is pre-created: API-06 now adds connection/session/context fixtures,
and API-07 now adds actual migrations and table/RLS tests. SB-05 baseline checks establish
real logins, minimum role flags/permissions, repeatable bootstrap and rejection
of unsafe existing role/ownership/public grants; they do not prove hosted Auth,
API persistence, cascade behavior or row isolation.

API-06 extends the same required group to 24 tests with real SQLAlchemy runtime-role
transactions, connection reuse, failure cleanup, pool/statement timeouts, stale and
lost connections, function-scoped HTTP finalization and shutdown. Its randomly
named `test_support` probe tables are explicitly cleaned after target/marker
validation; they are not product models or migrations. See
[application DB contract](../../app/db/README.md). API-07 now extends the group to real profile/RLS acceptance below; hosted Auth
semantics remain separate.

If Docker is unavailable, this group is unavailable locally; keep CI required and
provision an explicitly separate disposable target before changing the contract.
Do not edit guards to point cleanup at the shared development project. For port
conflicts stop the conflicting local service or deliberately update the entire
guard/Compose/example/CI contract together; never silently switch endpoints.

## API-07 migration prerequisite

Every selected database test now depends on a session fixture that validates the
isolated target and runs actual Alembic upgrade to the single head. A failed
migration fails the group; there is no manually pre-created profile table or stamp.
Fresh Docker bootstrap adds only test-only anon/authenticated/service_role role
prerequisites and deliberately broad default grants, so tests prove the migration
removes ambient access even for a bypass role. Existing volumes from API-06 need
the deliberate labeled `api:db:reset`/`api:db:up` cycle for these prerequisites.

The group now has 66 real DB tests, including actual fresh/repeated upgrades,
disposable downgrade/re-upgrade, drift/tamper rejection, no-context/A-B RLS,
Unicode/revision/FK constraints, server clocks and selective Auth-deletion cascade.
Auth accounts are seeded/deleted only in this guarded local fixture and cleaned
by exact UUIDs. No shared/managed Auth user is created or deleted. See the
[migration guide](../../alembic/README.md) for private hosted commands and recovery.

## RN-09l production mobile HTTP acceptance

The required database group now includes `db/test_mobile_settings_acceptance.py`.
Install the pinned Node toolchain and `npm ci` as well as Python dependencies;
the database CI job does the same. The test reuses `support.http.running_process`
(the API-12 restart fixture, now shared) to run actual FastAPI TCP processes with
normal JWT verification against ephemeral public signing keys and the guarded
local DB. No production verifier override or Auth route is added.

The existing portable mobile client, account scopes and settings projections run
through the dedicated developer Vitest config in `apps/mobile/dev/profile/acceptance`.
Seven scenarios run before process termination and one cold-client recovery check
after restart. The parent independently checks persisted settings/profile SQL,
then existing random-user cleanup removes only local fixture rows. Child JWTs
stay in a private process environment; raw subprocess output is withheld, and
transient JSON reports are deleted even on failure. No real credentials, hosted
URLs or API development `.env` are used.

Run through `npm run api:db:test`, or focus the named database test with explicit
`-o addopts= -m database`. Missing Node/dependencies is a failed prerequisite,
not a skipped success. The [RN-09l matrix](../../../../docs/qa/rn09-settings-acceptance.md)
separates this local HTTP/DB evidence from real Auth, hosted and native/device gates.
