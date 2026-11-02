# Supabase development — observed handoff

## Ownership and status — 2026-11-01

Anisha owns project/Auth administration (SB-01–03), providers, redirects, email,
accounts and SB-06 joint Auth evidence. The observations below are Ishmum's
read-only backend consumption of the existing project, **not acceptance of those
parts**. Ishmum owns the database sections, SB-04/05 and backend verification.

| Public observation | Value / evidence |
|---|---|
| Project reference | `eaisvwqfbgdkzdfmxkvm` |
| Development API origin | `https://eaisvwqfbgdkzdfmxkvm.supabase.co` |
| Region/status | `us-east-1`, `ACTIVE_HEALTHY` from authenticated MCP |
| PostgreSQL | Managed 17.11 (`170011`) |
| Exact issuer / derived JWKS | Origin + `/auth/v1`; issuer + `/.well-known/jwks.json` |
| Public signing mode | ES256, EC signing key observed through verified HTTPS |
| Expected M1 audience | `authenticated` from the accepted contract; a real user token is still required to verify issuance |
| Initial product inventory | No public tables and no existing `disconnect_api` role |
| Direct connectivity here | Database hostname DNS lookup failed; no claim that all networks fail |

Backend-only ignored `services/api/.env` now contains the four complete public
trust settings, development mode and exact local browser origins. It contains no
user access token. The **actual production JWKS resolver** resolved the observed
ES256 key over HTTPS locally; this proves trust-source compatibility, not signed
user identity, signup/login, refresh, mobile routing or live M1 acceptance.
Do not copy the local `.env` to Git. See [environment map](../architecture/environment-map.md).

## Product database — Ishmum / SB-04

The reviewed bootstrap and exact hosted procedure are in
[`services/api/db/bootstrap`](../../services/api/db/bootstrap/README.md).
Use `disconnect_api` only as runtime identity; use the project database admin only
for explicit bootstrap/migration operations during this initial development stage.
The roles must remain separate. API-06 now owns the lazy bounded application engine and verified-user units;
API-07 now owns the profile table/grants/RLS through Alembic.

Hosted role creation/catalog evidence and real password-login/TLS evidence are
recorded separately in [Plan 01 implementation notes](../core_plan_implementation_notes/plan_01_supabase_foundation_notes.md).
Do not treat MCP's administrator execution or SET ROLE as a runtime login proof.
No database password, signing secret, service key or managed Auth record belongs
in this runbook. Credentials/root certificates are supplied privately through the
dashboard and ignored local files. Session-pooler host must come from Connect;
TLS verification is mandatory. The downloaded project CA passed TLS 1.3/hostname
verification, and wrong trust/hostname checks failed before authentication. The
initial password was rejected, then corrected privately. Actual administrator and
runtime logins now pass with verify-full; the runtime password is a separately
generated secret saved only in the ignored API .env. True runtime permission
probes, a wrong-password rejection, a non-rotating recheck and rollback-only admin
DDL passed; no probe table remains. No shared credential was reset.

## Auth/project sections — Anisha's handoff pending

Project ownership/access recovery, confirmed environment designation, current tier
limits, email/provider/redirect settings, disposable A/B accounts and real issued
token claims still need Anisha's dated SB-01–03 handoff. No Auth setting/user was
changed here. SB-06 joint mobile M1 remains pending its real producers.

Supabase pause/availability and signing-key rotation must be coordinated with
Anisha; [the backend Auth runbook](../../services/api/AUTH.md) describes cache,
rotation and stateless-token revocation limits. Never restore availability by
disabling verification. Database recovery must not reset the shared development
project or touch managed Auth.

## Isolated database — Ishmum / SB-05

The pinned PostgreSQL 17.11 Compose stack and [test guide](../../services/api/tests/support/README.md)
are implemented. `npm run api:db:up`, `api:db:test`, `api:db:down` and `api:db:reset`
operate only on the named local fixture. Exact port is loopback 55432, database
`disconnect_test`, volume `disconnect_db_test_data`. Both test URLs and APP_ENV=test
are required, targets/marker are checked before SQL, and reset verifies volume
labels. No managed project URL or secret is used by CI or fixture cleanup.

Local real PostgreSQL acceptance: eight checks passed, including actual runtime
login/denials, repeated bootstrap, five unsafe existing-role/ambient-grant cases
and rejected wrong password. Empty initialization and labeled reset/rebuild passed.
The SB-05 baseline had 307 deterministic tests; API-06 now has 337 deterministic
tests and 24 checks in the separately required marked DB group. Actual SQLAlchemy/session/context infrastructure is now implemented in API-06;
API-07 now supplies real Alembic/product schema/RLS rather than a fake pre-created profile table.

## API-06 application connection check

A read-only SQLAlchemy/psycopg smoke check used the configured hosted runtime role,
verified client TLS to the session pooler and confirmed the bounded server options.
No synthetic Auth user, product SQL, hosted fixture, migration or Auth setting was
created. Libpq confirmed client TLS; server pg_stat_ssl reports the provider's
pooler/backend leg (observed false), which is not a check of this client's TLS.
The runtime startup/liveness/missing-token checks opened zero DB connections,
and lifespan disposed its owned engine. See Plan 03 notes for exact API-06 evidence.

## API-07 actual product migration — 2026-11-02

Immediately before migration the hosted owned public tables, product Alembic
history and profile clock function were absent; managed auth.users.id was UUID.
The reviewed additive SQL created only public.profiles, its policies/clock trigger
and public.alembic_version. Upgrade and check passed at 20261102_0001 using the
explicit private migration URI/verified TLS. Runtime profile reads without context
return no rows; runtime cannot read history. Every new object revoked ambient
non-owner privileges, including Data API roles, while shared defaults were
inspected and preserved. No managed Auth user/provider/redirect was changed.

Use [the migration guide](../../services/api/alembic/README.md) and API-07 notes/SQL
evidence; do not reapply product schema through dashboard/Supabase migrations or
stamp legacy state. Local downgrade/fresh-upgrade/constraints/server clocks/A-B
RLS and fixture Auth-delete cascade passed (66 real DB checks, 344 deterministic).
Managed-account A-B/cascade still requires Anisha-approved disposable users and
joint API-10 evidence. API-08 own-profile GET is next; HTTP routes remain unchanged.
