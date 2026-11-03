# PostgreSQL unit of work — API-06

`Database` owns one lazy SQLAlchemy 2.0 engine per application lifespan. It uses
psycopg 3, a two-connection QueuePool by default, zero overflow, pre-ping and
rollback on return. There is no second driver pool, global Session, startup
connection probe, automatic migration or `metadata.create_all`. `Base.metadata`
registers the owned profile and settings tables and supplies stable constraint
names for the single Alembic history. SQLAlchemy 2.0.55 is the tested maintained 2.0 line; Alembic 1.20.1 is
development/migration tooling only; API-07 now owns the configuration/history.

## Configuration and availability

`Settings.database_url` is a secret, immutable optional runtime URL. It accepts
only PostgreSQL/psycopg, the exact `disconnect_api` role, direct or session-pooler
port 5432, the selected project's naming convention and verify-full with an
existing absolute root-CA path. URI options cannot override role/host/driver
options. Unencrypted access is restricted to APP_ENV=test plus the precise SB-05
loopback/55432/disconnect_test target. Integration fixtures additionally validate
both URLs and the disposable marker before any test DDL/cleanup.

There is deliberately **no migration URL field/fallback** in application Settings.
Bootstrap/Alembic consume their own explicit private migration credential; a lone
MIGRATION_DATABASE_URL never enables the application engine. A missing runtime
URL keeps the database provider unavailable while M1/health still work. Invalid
configured URLs/CA paths fail startup validation. Valid configuration whose DB is
down or rejects its password still starts lazily; `/healthz` and `/v1/me` never
check out a DB connection. A product DB request instead gets safe 503
DEPENDENCY_UNAVAILABLE. No fake identity/data or administrator fallback restores
availability.

The developer's ignored local file also supports private bootstrap tooling. A
deployed runtime should receive only the runtime credential; keep migration/admin
secrets in the separate migration execution environment. Dropping a field from
Settings is not an operating-system boundary against reading a shared local file.

Default bounds are pool wait 2 s, connect timeout 5 s, statement 5 s, lock 2 s and
idle-in-transaction 10 s; `.env.example` lists the bounded settings. Libpq connect
timeout applies per address and includes neither a hard DNS deadline nor a whole
request deadline; do not describe these numbers as an end-to-end SLA. Multiply
pool size by all workers/instances and leave room under the runtime role's total
connection cap. Transaction poolers/port 6543 remain unsupported pending explicit
prepared-statement/session compatibility work.

Client TLS reaches the configured session pooler with CA and hostname validation.
Libpq's client SSL state is the relevant check. PostgreSQL `pg_stat_ssl` describes
the provider's incoming backend connection; in the hosted smoke check it reported
false while libpq verified TLS to the pooler. Do not mislabel that server-side view
as a client TLS result or a proof of end-to-end encryption through the pooler.

## Verified transaction contract

Pass only the immutable `VerifiedIdentity` from the existing signature dependency
into `Database.transaction`. It creates a fresh non-reusable `UserSession`, starts
one explicit transaction and uses a bound `set_config('app.user_id', value, true)`
before handing over the session. Local=true is mandatory: commit/rollback clears
the per-unit value on the reused connection. In-memory authority is tied to that
exact root SessionTransaction and cleared when it ends.

Repository Session execution, ORM flush and commit require that context; a bare
Session or an ended unit fails as an internal invariant rather than returning an
apparently absent profile. Repositories also call `require_user_context`
and filter every query by its UUID. This protects against accidental entry, not
malicious trusted backend code, arbitrary raw Connection SQL or stolen runtime
credentials. API-07 now adds actual RLS USING/WITH CHECK and explicit grants; context binding
alone must never be described as row isolation. Opaque iOS selection tokens stay
on-device; elevated DB credentials never belong in mobile configuration.

The wrapper owns commit/rollback. Calling `session.commit()`/`rollback()` inside
it is rejected to avoid partial commits. Raise the existing domain/API error to
abort; use explicit nested transactions only when a later reviewed algorithm
requires them. Normal exit commits once; body/flush/commit errors and BaseException
paths roll back and release the connection. A failed connection or statement is
never replayed. Pre-ping can replace a dead **idle** connection before work; losing
one during a unit returns an error and rolls back without retrying mutations.

Connection/interface/pool timeout failures become a sanitized dependency 503.
Integrity/programming errors stay available for repository-specific mapping in
API-08/09 and otherwise become the existing safe 500; a broken SQL query is not
misreported as an unavailable database. Driver text/SQL/parameters never enter
public errors. Owned engine/pool logging is disabled because reset failures can
contain driver details despite hide_parameters; the application logs request IDs.

## HTTP and shutdown

Use `UserSessionDependency` on **synchronous** handlers; API-08 profile GET consumes it. Its
`Depends(scope="function")` finalizes the unit before sending success headers;
FastAPI >=0.121.1 is declared (tested lock: 0.162.0). Returning success and then
failing COMMIT must not leave the client believing a write succeeded. Tests prove
this with a real deferred PostgreSQL foreign-key failure. Serialize DTOs inside
the handler, not lazy ORM state after close. Background jobs must own new units;
never retain a request Session or hold a transaction across unrelated network work.

Lifespan resets the provider/verifier to unavailable and disposes the engine in a
worker thread, including later startup/Auth-close failure paths. Normal server
shutdown must drain requests first: `dispose` closes idle connections, not arbitrary
in-flight work. Closed resources reject new units; sync database cancellation is
bounded by server/driver limits, not simulated by abandoned worker tasks.

## Actual validation and next step

`npm run api:db:up` then `npm run api:db:test` exercises the **real** guarded SB-05
runtime role. Checks include A/B connection reuse, commit/rollback/BaseException,
missing context, manual-finalization rejection, deferred commit failure/HTTP
timing, pool exhaustion, statement timeout, lost idle/active connections, shutdown,
lazy outage behavior and M1 with database disabled/unavailable. Test-only random
tables live in `test_support`, are cleaned through the guarded target and never
replace future product migrations. CI uses this same required group, not SQLite
or skipped missing credentials. Schema export still constructs no engine/client.

API-07 now supplies the minimal profile model, real Alembic upgrade and explicit
FK/grants/RLS/server-clock invariants. See [migration contract](../../alembic/README.md).
API-08 now adds explicit-owner, nonmutating profile GET and UTC DTOs inside the
unit. The required group has 75 real DB tests; 374 deterministic backend tests also
pass. API-09 now supplies revisioned writes; API-10 adds real-account/mobile evidence.
Anisha's Auth/mobile/root producer and real-user M1/M2 acceptance stay separate.

Sources checked 2026-11-01: [SQLAlchemy pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html),
[Session transactions](https://docs.sqlalchemy.org/en/20/orm/session_basics.html),
[FastAPI function scope](https://fastapi.tiangolo.com/advanced/advanced-dependencies/),
[psycopg connections](https://www.psycopg.org/psycopg3/docs/api/connections.html).


API-09 write units explicitly use READ COMMITTED, so the own-revision SELECT after
an atomic insert/update miss obtains a fresh statement snapshot. PATCH validates
the public body/identity first, then opens Database.transaction directly in the
synchronous handler and commits before returning its snapshotted DTO. This avoids
opening a Session during FastAPI body validation while preserving API-06 unit
ownership/rollback/no-replay guarantees. Conflicts and owner-FK 403 abort the unit;
only the exact owner FK is reclassified. Current checks: 453 deterministic / 96 DB.


API-10 emits fixed failure categories correlated to the request across the sync
worker boundary. Pool timeout, cancellation, unavailable lock and connection/error
categories contain no SQL/params/driver text. Missing SQLSTATE stays a generic
connection failure rather than guessing from a password-bearing message. Error
mapping, rollback and mutation no-replay behavior are unchanged. Current checks:
469 deterministic / 102 DB; managed identity/mobile gates remain separate in the
[operator guide](../../OPERATIONS.md).

## API-11 settings storage

`UserSettings` adds one independent owner/revision resource with activities and
an optional plan-draft JSONB document. See the [wire/data contract](../../../../packages/contracts/HTTP_API.md#settings-http-contract--api-12).
API-12 exposes scoped GET/PATCH using these models and the same verified-user
units. No native install, session engine or onboarding completion is introduced.
The external Auth FK reference is shared outside owned metadata; settings does
not require a profile row. No mobile product-table grants or additional pool.

The new head is `20261102_0002`. Migration verification covers both product tables,
including exact PG17 constraint fingerprints and shared row-policy/server-clock
checks. These fingerprints are tied to the frozen SQL predicates and tested by
deliberately weakening constraints; they do not replace domain validation tests.
Canonical custom text and structural/time/numeric bounds are checked in PostgreSQL.
Python also validates timezone catalog membership and sorts weekdays. The locked
tzdata dependency supports environments without system timezone data.

API-11 was upgraded/checked only against the guarded local PostgreSQL fixture.
Hosted development was not upgraded or inspected in this commit. A hosted target
on the previous head must receive the deliberate guarded additive upgrade before
new-head drift diagnostics/settings endpoints can be accepted. Existing private
token inputs and the user-deferred hosted account-deletion check are unchanged.


API-12 settings writes use one INSERT ON CONFLICT DO NOTHING or owner/revision
UPDATE ... RETURNING, setting only supplied section columns. There is no prior
read/merge; omitted data stays in PostgreSQL. A miss performs a fresh READ COMMITTED
own-revision query for SETTINGS_CONFLICT. Only the exact settings owner FK maps
to 403; unrelated integrity failures remain errors and roll back. Settings GET
snapshots UTC DTOs inside the live unit, and writes commit before returning.
Real two-connection races, deleted-owner FK wait, deferred-commit failure and a
fresh HTTP process read after restart are tested on the guarded local database.
