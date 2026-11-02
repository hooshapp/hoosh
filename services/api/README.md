# Disconnect API

**Owner:** Ishmum (API verification and product database). Anisha owns Supabase Auth/project setup (SB-01–03), mobile Auth sessions, providers, redirects and test accounts. She supplies public trust metadata; Ishmum owns database bootstrap/testing (SB-04/05).

From the repository root:

```bash
uv sync --project services/api --frozen
npm run api:dev
npm run api:test
npm run api:lint
```

`GET /healthz` and the protected database-independent `GET /v1/me` are implemented. FastAPI publishes its schema at `/openapi.json` and documentation at `/docs`.

The adopted [M1/M2 contract](../../packages/contracts/HTTP_API.md) specifies identity-only `GET /v1/me`, then planned `GET/PATCH /v1/profile`; the latter awaits API-06–09. Ishmum owns Pydantic/OpenAPI schemas and one Alembic history when those parts begin. Derive user IDs from verified Supabase access tokens; no client-provided identity or production auth bypass. Supabase Auth owns credentials and mobile session refresh. The API owns token verification and server-authoritative product mutations.

The JWT verifier and bounded public-key resolver are implemented; no database connection, migration, cloud deployment or Supabase project is created by these parts. Configuration is read from `services/api/.env`, independently of the shell working directory. Copy `.env.example` when you need browser CORS or later integration settings.

Dependencies are locked in `uv.lock`. Add them using `uv add --project services/api ...` (or `--dev` for tooling), and commit both the project file and lockfile.

## API-01 configuration and error boundary

The runtime entry is `app.main:app`; it validates `Settings` before serving.
Development/test with all four Supabase trust settings absent preserves `/healthz`.
Production requires all four; any partial configuration fails startup in every
mode. Configure the project URL, exact `<origin>/auth/v1` issuer, audience and
observed asymmetric algorithm list from Anisha's SB-02 handoff. Supported initial
algorithms are ES256/RS256, enabled only by that explicit list; no shared signing
secret or service-role key belongs in this service. See `.env.example` for bounds.

`app.application.create_app` assembles routes without reading environment files,
starting network clients or importing `main.app`. Schema tooling uses this boundary.
No unconfigured/schema path can fabricate a user; the protected endpoint follows
in API-04. Liveness remains independent of provider/database readiness.

Responses receive a fresh UUID `X-Request-ID`, ignoring incoming IDs. Private
responses and safe errors are `no-store`; 401 adds `WWW-Authenticate: Bearer`.
Allowed browser origins can read the request ID through CORS. Validation details
whitelist names/codes and cap the list at ten. General failures never echo request
input or raw exception text; logs use the server request ID. Router errors also
use safe `NOT_FOUND`, `METHOD_NOT_ALLOWED` or `HTTP_ERROR` codes. CORS preflight
responses remain framework protocol responses, with correlation headers.

API-01 checks: `npm run api:lint` and `npm run api:test` (58 cases on 2026-11-01).
No provider/project/account or database state was changed. Live verification still
requires the SB metadata handoff and a real disposable user's access token.

## API-02 signature and claim policy

`SupabaseTokenVerifier` consumes an async public-key resolver and returns immutable
`VerifiedIdentity`. PyJWT 2.15.1 + cryptography are locked through uv. Key metadata,
public-only material, P-256/RSA compatibility and RSA 2048–8192-bit resource bounds
are checked before verification. Token framing is limited to 16 KiB; duplicate JSON
members/nonfinite numbers, malformed key IDs and unsupported JOSE extensions or
token-supplied key URLs are rejected before discovery. Untrusted JSON is checked
only for framing; it cannot authorize a subject.

Signature, exact issuer and single-string audience verification stay enabled in
PyJWT. Temporal checks use an injectable clock with strict finite NumericDate
values, configured skew, future-issue/not-before rejection and positive validity
intervals. Expiration is classified only after other identity/trust checks. Require
`exp`, `iat`, `sub`, `iss`, `aud`, role `authenticated` and boolean `is_anonymous`;
an otherwise valid anonymous session gets 403. Optional email is only a verified
string/null display value; metadata is ignored for authorization. No database/user
lookup is performed, so offline signature verification does not prove immediate
revocation after sign-out/deletion. Local user UUID is serialized canonically.

Ephemeral private signing keys and tokens exist only inside tests. No issuer,
algorithm or test identity is implicitly enabled for the running server. API-03
adds the real resolver and API-04 exposes the protected route. Live provider-issued
token verification and actual session integration remain pending.

API-03 supplies the lifespan-scoped production JWKS resolver. See [backend Auth
policy](AUTH.md) for exact bounds, rotation/backoff/revocation semantics and test
coverage. The public identity route is introduced separately in API-04.

## API-04 identity producer

`GET /v1/me` accepts exactly one Authorization bearer header, uses the configured
production verifier and returns only `{user_id, email}` with explicit nullable
email and `Cache-Control: no-store`. It does not trust query/body/X-User-ID owner
input, read a product table or insert a profile. Missing credentials fail 401;
unconfigured/required discovery failure is 503; verified anonymous scope is 403.
An API key is not an authenticated-user access token. `/healthz` remains public.

Local route tests use the actual runtime factory, cryptographic verifier and async
resolver with only HTTPS transport replaced; no identity dependency override or
signature bypass is installed. API-04 passes 244 backend tests. A warm local
200-iteration-per-algorithm measurement is recorded in Plan 03's `api-04` artifact;
it is CPU-only evidence on this Mac, not a deployed latency or network SLA. It does
not justify adding another crypto offload layer now.

The default `npm run api:dev` disables raw Uvicorn access logs, which otherwise
include complete query strings. Use the same `--no-access-log` (or a deliberately
sanitized structured logger) in deployments: rejecting credentials in a query
must not itself log them. Application error logs use only server request IDs.

M1 handoff still requires Anisha's exact SB-02 trust metadata, a disposable real
user token, mobile session/root guard composition and RN-05/06 acceptance. No live
Supabase account, profile persistence, protected UI or installed restriction is
claimed by these deterministic producer checks.

## API-05 schema and generated contract handoff

Run `npm run api:generate` to export the environment-free app and produce committed
HTTP types; `npm run api:check-contracts` checks exact bytes without rewriting.
Root `npm run check` and the API CI job enforce drift. The exporter never imports
`main.app`, constructs `Settings`, enters lifespan, creates a network client or
connects a database. A deliberately invalid production environment is tested to
prove this separation; normal runtime startup validation remains strict.

Pydantic error variants expose code-discriminated required details and literal
retryability in OpenAPI/TypeScript. The schema documents middleware request-ID,
private no-store and 401 Bearer headers. Health retains the exact required literal
response used by existing mobile consumers. Shared synthetic identity/error
fixtures validate against Pydantic and exported JSON Schema; profile success
fixtures stay future M2 inputs. Only implemented routes are generated.

The private `packages/api-codegen` workspace pins openapi-typescript 7.13.0 with its
TypeScript 5.9.3 peer, while mobile/contracts keep 6.0.3 and the root npm lockfile.
See its README for the scoped build-only audit finding and local-input boundary.
No new runtime HTTP client or mobile Auth integration is installed. Generated
`MeResponse` is structurally compatible with the existing AuthIdentity projection;
real response parsing and account-generation checks remain essential.

Next: Anisha supplies SB-02/03 metadata/current token and the session/root producer;
Ishmum and Anisha execute real M1/RN-05/06. Ishmum can prepare SB-04/05 and API-06
for later product persistence. API-06–10, cloud verification and M2 remain open.

## Supabase database preparation — SB-04

Ishmum's [role bootstrap](db/bootstrap/README.md), [development runbook](../../docs/runbooks/supabase-development.md)
and [Plan 01 notes](../../docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md)
record the provisioned non-owner runtime role and separate migration credential.
The backend's ignored public trust configuration and production JWKS resolver
were checked against the real project; its public API keys cannot authenticate
`/v1/me`. Real user-token/mobile M1 remains pending Anisha's handoff.

Hosted CA/hostname verification passes. Hosted password login and permission
checks remain pending correction of the private administrator URI; no password
reset was performed. HTTP application database engines/sessions are still API-06
work; no profile table or product migration has been created.
