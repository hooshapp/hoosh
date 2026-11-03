# Disconnect API

**Owner:** Ishmum (API verification and product database). Anisha owns Supabase Auth/project setup (SB-01–03), mobile Auth sessions, providers, redirects and test accounts. She supplies public trust metadata; Ishmum owns database bootstrap/testing (SB-04/05).

From the repository root:

```bash
uv sync --project services/api --frozen
npm run api:dev
npm run api:test
npm run api:lint
```

`GET /healthz`, protected database-independent `GET /v1/me` and revisioned profile `GET/PATCH /v1/profile` are implemented. FastAPI publishes its schema at `/openapi.json` and documentation at `/docs`.

The adopted [M1/M2 contract](../../packages/contracts/HTTP_API.md) specifies identity-only `GET /v1/me`, implemented `GET /v1/profile`, and implemented revisioned PATCH (API-09). Ishmum owns Pydantic/OpenAPI schemas and the sole Alembic history. Derive user IDs from verified Supabase access tokens; no client-provided identity or production auth bypass. Supabase Auth owns credentials and mobile session refresh. The API owns token verification and server-authoritative product mutations.

The JWT verifier, bounded public-key resolver and lazy PostgreSQL unit of work are implemented. The minimal profile model/Alembic schema/RLS and profile GET/PATCH are also implemented. API-11 adds settings data models/storage; its endpoints remain API-12 work. Cloud deployment and Auth/mobile integration remain pending. Configuration is read from `services/api/.env`, independently of the shell working directory. Copy `.env.example` when you need browser CORS or later integration settings.

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
Ishmum and Anisha execute real M1/RN-05/06. SB-05 is verified locally; SB-04 hosted
login is accepted. API-07 migrations/RLS and API-08 GET are accepted as producers; API-09 writes are now implemented. API-10,
real-user Auth/mobile verification and M2 remain open.

## Supabase database preparation — SB-04

Ishmum's [role bootstrap](db/bootstrap/README.md), [development runbook](../../docs/runbooks/supabase-development.md)
and [Plan 01 notes](../../docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md)
record the provisioned non-owner runtime role and separate migration credential.
The backend's ignored public trust configuration and production JWKS resolver
were checked against the real project; its public API keys cannot authenticate
`/v1/me`. Managed-token HTTP verification now passes; actual mobile M1 remains pending Anisha's handoff.

Hosted CA/hostname verification, administrator/runtime password login and runtime
permission checks pass after the URI was corrected privately. The dedicated
runtime password was initialized separately; no shared password reset was performed.
HTTP application engine/session infrastructure is implemented in API-06; API-07 now supplies the minimal profile migration/table/RLS.

## Disposable database checks — SB-05

Read [the fixture guide](tests/support/README.md), then run `npm run api:db:up` and
`npm run api:db:test`. A separate required CI job runs the same pinned PostgreSQL
17.11/role/bootstrap prerequisites without cloud secrets. Default API tests exclude
the marked DB group; selecting it with missing/unsafe configuration fails rather
than silently skipping. `api:db:down` retains the fixture volume; explicit guarded
`api:db:reset` removes only that named test volume. Do not target the shared project.

SB-05 is accepted locally (8 real DB checks); hosted GitHub execution remains
unverified. API-06 now consumes the local role/fixture contract;
SB-04 hosted runtime login/TLS acceptance also passed.
Those SB-04/05 infrastructure parts did not create product schema; API-07 now supplies it.

## API-06 scoped transaction handoff

Read [the DB contract](app/db/README.md) for runtime URL/TLS validation, pool/time
bounds, verified-user context and future synchronous handler usage. One engine
is owned by lifespan; each unit gets a fresh guarded UserSession, transaction-local
UUID binding and one commit/rollback. `UserSessionDependency` finalizes before
HTTP success. No raw SQL/driver/credential error reaches the public envelope.

`npm run api:test`: 337 deterministic tests; `npm run api:db:test`: 24 real local
PostgreSQL tests. The existing database CI job selects all of them. A read-only
hosted SQLAlchemy check confirms the runtime role/TLS/options, with no product DDL
or Auth changes. OpenAPI/type drift remains zero. API-07 now supplies the actual
Alembic history, profiles/FK/grants/RLS. API-08 GET is now implemented; API-09 writes are now implemented; API-10 and joint Auth/M1/M2 stay pending.

## API-07 profile migration handoff

The [migration guide](alembic/README.md) documents the sole product history,
explicit target/credential guards, offline review, upgrade/check and test-only
downgrade. Head `20261102_0001` is applied to the inspected-empty hosted development
schema and locally validated. The model contains only UUID/name/revision/server
clocks; RLS and private ACLs enforce runtime-only own-user access. Existing Auth
objects/settings and shared default privileges were not changed.

344 deterministic and 66 required real PostgreSQL tests passed, including actual
fresh/repeated/downgrade upgrades, constraints/cascade, A-B isolation with omitted
owner predicates and deliberate ACL/policy/trigger drift rejection. Hosted runtime
read-without-context is denied by RLS and version metadata is private. Actual
managed-user cascade/A-B testing remains joint API-10 work. API-07 itself added
no HTTP route; API-08 GET now uses its transaction guard and explicit owner predicate.


## API-08 own-profile read handoff

`GET /v1/profile` requires the same verified access token as `/v1/me`. It returns
200 with `{profile:null}` for an absent row, or exactly UUID/display_name/revision/
created_at/updated_at. A nullable name is always present, timestamps preserve the
server instant as UTC RFC 3339 with Z, and every private result is no-store. No
owner argument, Auth metadata read, hidden insert or onboarding-completion claim
is accepted. A valid unexpired JWT whose Auth row was deleted can still produce
an absent read; this is not account re-creation or token revocation.

The synchronous handler snapshots the DTO before its function-scoped transaction
ends. Repository entry requires live verified-user context and filters by its UUID
in addition to RLS. Authentication completes before database acquisition. A missing
DB configuration, connection failure, query timeout or full pool produces safe
503 DEPENDENCY_UNAVAILABLE, never `{profile:null}` or sign-out. Unexpected query/
invariant failures remain safe 500. `/healthz` and `/v1/me` stay DB-independent.
The migration prerequisite remains head 20261102_0001; API-08 changes no schema.

`npm run api:test` passes 374 cases and `npm run api:db:test` passes 75 real
PostgreSQL checks. New checks cover real ephemeral signatures and runtime-role
queries, exact/nonmutating absence, A-B connection reuse, owner injection, non-UTC
session timezone, no-context entry, actual lock/statement timeouts and pool outage/
recovery. OpenAPI/types now publish GET only; public ProfileView/ProfileResponse
aliases are generated. JSON Schema checks explicitly require the test-only
RFC 3339 validator, so date-time format checks cannot silently become no-ops.

API-09 now implements strict revisioned PATCH below; API-10 supplies actual managed
Supabase user-token/A-B and mobile evidence with Anisha. No hosted account/provider
or shared schema/default changes were made for API-08. Test signatures are local
only; no production verifier override or synthetic endpoint is registered.


## API-09 revisioned profile save handoff

`PATCH /v1/profile` takes exactly `{expected_revision, display_name}`: strict integer
>=0, plus a required string/null. Null clears; missing fields and extra keys are
422. Reject NUL/unpaired surrogates before DB access; strip with Python 3.12, reject
blank and limit to 80 code points. No NFC/case conversion or client normalizer.
The generated raw input deliberately has no maxLength:80; padded valid names can
exceed that raw length. Successful saves are 200 with a nonnullable persisted
profile, canonical name, revision and UTC server timestamps.

A scoped ASGI boundary enforces 16384 actual raw bytes, including streamed bodies,
without trusting Content-Length. It accepts UTF-8 application/json or application/*+json
objects and rejects duplicate keys/nonfinite constants/invalid JSON as safe 422.
Size/JSON checks precede Auth; typed fields and identity validate before database
acquisition. The synchronous handler then owns one existing verified-user unit,
builds its DTO inside it and commits before returning success. No Session survives
the request, no privileged credential is used, and no failed mutation is replayed.

Expected 0 uses PostgreSQL INSERT ON CONFLICT DO NOTHING RETURNING. Positive
expectations use one UPDATE with explicit verified owner/revision predicates and
RETURNING, incrementing atomically; API-07's invoker trigger owns timestamps.
A miss reads only that owner's current revision and returns 409 (0 means absent).
The engine explicitly pins READ COMMITTED for the fresh post-miss snapshot.
The int32 revision never wraps: storage exhaustion returns 409 with its current
revision and requires a reviewed forward migration; larger expectations also
conflict safely. Preserve drafts and refetch/reconcile, including a lost success
response. Never automatically resubmit a mutation after 401/503 or a conflict.

Only SQLSTATE 23503 with the exact public.profiles owner FK is mapped to safe 403;
other integrity/programming failures retain safe 500 and outages remain 503.
Deleted-account inserts do not recreate Auth or revoke an unexpired stateless JWT;
an update whose row already cascaded away is an absent-row conflict. A successful
write racing with a later account deletion can itself be cascaded, as normal FK
semantics require. No account-lifecycle guarantee beyond that is claimed.

453 deterministic / 96 PostgreSQL checks pass: Unicode/strict input and streamed
limits, two simultaneous creates and same-revision edits on distinct connections,
a real blocked insert versus Auth deletion, scoped A/B conflicts, replay and full
rollback after mutation. Full workspace types/lint/assets/contracts and all 612
mobile tests pass. No migration, hosted schema/Auth setting/user, or mobile code
was changed. Next API-10/joint work supplies operational and real managed-token/
mobile M1/M2 evidence with Anisha; locally accepted producers do not finish those.


## API-10 operations and acceptance handoff

The [operator guide](OPERATIONS.md) documents privacy-safe structured diagnostics,
loopback startup, explicit read-only/managed-account/disposable-write checks,
private token acquisition and the exact remaining gates. `api:acceptance` does not
read user tokens or write profiles by default. `api:acceptance:login` signs in to
an approved existing account with hidden prompts and stores only a verified access
token in the ignored private file; it does not administer Auth or own app refresh.
Anisha can consume the HTTP API without database credentials.

Current checks: 469 deterministic / 102 real PostgreSQL tests, full workspace,
frozen lock and unchanged generated schemas. Actual app.main startup/network CORS/
no-Origin/log checks and hosted JWKS/schema/runtime TLS checks passed. At the initial operational checkpoint no approved A/B tokens were available;
the managed follow-up below resolves HTTP verification. Computer-use reported no browser available; real
Auth/RN-07/root/native journeys remain pending. API-10 operational work is
implemented, but full API-10/Plan 03/M1/M2 acceptance is open. No new route,
migration, hosted Auth user/provider or mobile code was introduced here.

The [onboarding persistence review](../../docs/architecture/onboarding-persistence-review.md)
prepares the follow-on contract conversation without storing demographics/opaque
native selections or declaring server-side onboarding completion.

Managed-account follow-up: both supplied real tokens now pass local verification
and actual HTTP A/B identity/profile journeys using the hosted runtime DB role.
Revisioned writes, stale replay conflicts, isolation, clear/name restoration and
refetch passed; both profiles remained unchanged after a true API process restart.
This resolves the missing-token gate for this run. No Auth user/settings or schema
changes were made. Full application/browser/native/lifecycle acceptance remains
open; see OPERATIONS.md and the separate managed acceptance artifact/notes.

API-10 browser/startup follow-up now accepts actual Opera GX Fetch/CORS protocol
without a browser connector, and runtime-factory Auth-only/unconfigured modes.
`api:acceptance --expect-profile-unavailable` verifies both real identities while
profile GET/PATCH safely return dependency 503; an impossible positive revision
prevents accidental writes if the DB recovers. Current validation: 473 deterministic
/ 104 PostgreSQL and full workspace. Deliberate connection-failure faults stay on
the disposable DB after a hosted bad-password experiment triggered a temporary
provider circuit breaker; no credential reset or weakened TLS was used. See the
operator guide/evidence for recovery and exact remaining authenticated-app/native/
lifecycle gates. No mobile Auth implementation was taken over from Anisha.


## API-11 — Settings contract/storage (no endpoints yet)

One `user_settings` row per Auth UUID stores activities and an optional non-enforcing
plan draft with its own revision and server clocks. See the
[contract](../../packages/contracts/HTTP_API.md#settings-data-contract--api-11-endpoints-reserved-for-api-12)
and [migration guide](alembic/README.md#settings-revision-20261102_0002--api-11).
Schema models/fixtures validate explicit omit/null/empty/partial sections, Unicode,
timezones and numeric/storage bounds. The locked tzdata dependency supports hosts
without system timezone data. No settings route or new generated endpoint type is
published; API-12 supplies GET/PATCH and the coordinated safe error extensions.

The repository head is now `20261102_0002`, tested on guarded local PostgreSQL 17.
Profiles and the original applied revision are unchanged. This commit does not
upgrade hosted development, change Auth/users/native behavior or install plans.
Use the explicit migration workflow when deliberately adopting the new head on
a shared development target; older-head diagnostics are not current-head proof.
