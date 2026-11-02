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
The roles must remain separate. API-06 will add actual application connections;
API-07 will create product tables/grants/RLS using Alembic.

Hosted role creation/catalog evidence and real password-login/TLS evidence are
recorded separately in [Plan 01 implementation notes](../core_plan_implementation_notes/plan_01_supabase_foundation_notes.md).
Do not treat MCP's administrator execution or SET ROLE as a runtime login proof.
No database password, signing secret, service key or managed Auth record belongs
in this runbook. Credentials/root certificates are supplied privately through the
dashboard and ignored local files. Session-pooler host must come from Connect;
TLS verification is mandatory. The downloaded project CA passed TLS 1.3/hostname
verification, and wrong trust/hostname checks failed before authentication. The
saved administrator password was rejected; hosted login acceptance remains pending
its private correction. No shared credential was reset.

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
