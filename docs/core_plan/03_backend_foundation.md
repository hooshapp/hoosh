# Plan 03 — FastAPI Identity and Profile Foundation

**Status:** Draft implementation plan. The checkout currently implements only `/healthz`; none of the planned endpoints, verifier, database models, or migrations below exist yet.\
**Owner:** Ishmum (backend/database). Anisha reviews Auth contracts and participates in live session checks.\
**Area branch:** `area/backend`; task branches `task/backend/<part>`.\
**Milestones:** M1 = verified identity without a database; M2 = minimal, isolated, revisioned profile persistence.

## 1. Goal and boundaries

Deliver a small FastAPI service that trusts only access tokens from the configured Supabase development project, identifies the user from verified claims, and later persists only that user's minimal profile. Keep authentication, database access, and native protection as separate concerns.

The current app factory, settings, CORS configuration, health response, and eight foundation checks are reusable. Extend them instead of replacing the workspace. Existing Python runtime dependencies are FastAPI, Pydantic Settings, and Uvicorn; the test stack uses `httpx2`, pytest, and Ruff. Add only the dependencies needed by the current part and lock them in `services/api/uv.lock`.

### Traceability

- PRD: FR-002, FR-008/009/034; NFR-001/002/005/006/007/010/012/013.
- TSD: §8 API contracts, §9 relational persistence, §10 event boundaries, §13 security, §15 testing.
- Figma: account/auth `18:2` / `27:59`; Settings `27:157`. Profile API behavior is an engineering adaptation, not implied by a Figma screenshot.
- PM gates: Q17/PD-09/10, Q19/PD-17 for account/provider/demographic scope. Q02–Q16 and Q21 remain blockers for their later product domains, not for M1.

### Intentional adaptation to the TSD

SC-01 adopted **identity-only `GET /v1/me`**, then separate **`GET/PATCH /v1/profile`**, and updated TSD §8.3. The [accepted decision record](../architecture/identity-foundation.md) and exact [HTTP contract](../../packages/contracts/HTTP_API.md) keep the first integration database-independent. Implement that single shape; these routes do not exist yet.

### Out of scope

- Password verification, issuing JWTs, refresh tokens, email delivery, or provider OAuth: Supabase Auth owns those.
- Production login/guest policies, signup age eligibility, demographics, or required providers: PM decisions remain open.
- Saved plan/session policies, quest scheduling, event ingestion, reward ledgers, usage summaries, AI, and calendars.
- Native enforcement, temporary allowance timing, account-deletion/native cleanup, production deployment, or production database changes.

## 2. Canonical HTTP contract

Plan 00 and its [HTTP contract](../../packages/contracts/HTTP_API.md) are the adopted shared design authority, with synthetic fixtures ready for schema tests. Generate TypeScript from the API schema at API-05 once routes exist; keep the exact error/validation/normalization details synchronized.

### 2.1 Identity (M1)

```http
GET /v1/me
Authorization: Bearer <Supabase access token>
```

```json
{
  "user_id": "986b55fa-65ec-457b-971a-2934b8bf51fb",
  "email": "student@example.test"
}
```

- `user_id` is the verified `sub` UUID serialized canonically; it is never taken from a query parameter/body/header such as `X-User-ID`.
- `email` is `string | null`, supplied from the verified claim and used only for display. It is not an authorization key and may lag a provider-side change until token refresh.
- This endpoint performs no profile insertion and requires no database connection. A new account can complete M1 before any product tables exist.
- Responses containing identity/profile data use `Cache-Control: no-store`; tokens and email addresses are not logged.

### 2.2 Profile read (M2)

```http
GET /v1/profile
Authorization: Bearer <Supabase access token>
```

Absent row:

```json
{ "profile": null }
```

Existing row:

```json
{
  "profile": {
    "user_id": "986b55fa-65ec-457b-971a-2934b8bf51fb",
    "display_name": "Jordan Rivera",
    "revision": 1,
    "created_at": "2026-10-28T18:00:00Z",
    "updated_at": "2026-10-28T18:00:00Z"
  }
}
```

GET is nonmutating. `profile: null` means no application profile exists; it does not mean signed out, permission denied, or protected. Missing data and an unavailable database must have different responses.

### 2.3 Profile write (M2)

```http
PATCH /v1/profile
Authorization: Bearer <Supabase access token>
Content-Type: application/json
```

```json
{ "expected_revision": 0, "display_name": "Jordan Rivera" }
```

- `expected_revision = 0`: insert only if absent, with stored revision 1.
- `expected_revision >= 1`: update only the current user's row matching that revision, then increment exactly once.
- At least one mutable field must be supplied. Initially the only mutable field is `display_name`; `user_id`, timestamps, and revision are server-controlled.
- Apply the canonical server normalization from Plan 00: Python 3.12 `str.strip()`, reject an empty result, then enforce 80 Unicode code points. `null` clears; omission is unchanged. The frontend sends the raw draft and treats the returned normalized value as canonical; it must not assume JS `trim()`/`.length` has identical behavior. Shared server-owned fixtures cover whitespace-set differences and astral/combining characters. Describe the after-normalization bound accurately in OpenAPI and bound raw PATCH input to 16 KiB, including streamed bodies, with 413 `REQUEST_TOO_LARGE`; do not advertise a misleading raw-input `maxLength: 80` when longer whitespace-padded input is accepted after normalization.
- For a stale/missing row or competing initial insert, return `409 PROFILE_CONFLICT` with safe `details.current_revision` (0 if absent); the client refetches. Do not silently overwrite.
- Retried PATCH after an unknown network outcome can return a conflict if the first call committed. Refetch/reconcile before another write; this foundation does not add an idempotency-key ledger for profile edits.

### 2.4 Error envelope

```json
{
  "error": {
    "code": "PROFILE_CONFLICT",
    "message": "Your profile changed. Reload it and try again.",
    "retryable": false,
    "request_id": "f942887f-3218-44f1-a8db-04b975152f24",
    "details": { "current_revision": 2 }
  }
}
```

| HTTP | Code | Meaning / client handling |
|---|---|---|
| 401 | `AUTH_REQUIRED` | Missing/malformed bearer credentials; authenticate. |
| 401 | `INVALID_TOKEN` | Untrusted/invalid token; bounded session recovery, never anonymous fallback. |
| 401 | `TOKEN_EXPIRED` | Expired access token; Auth owns refresh; at most one controlled retry of a safe request. |
| 403 | `FORBIDDEN` | Valid identity not permitted by the endpoint's stated policy. |
| 413 | `REQUEST_TOO_LARGE` | Raw PATCH body exceeds the 16 KiB bound; reject before unbounded parsing. |
| 422 | `VALIDATION_ERROR` | Safe field errors only; no input echo containing secrets. |
| 409 | `PROFILE_CONFLICT` | Refetch and reconcile; no automatic overwriting retry. |
| 503 | `AUTH_UNAVAILABLE` | Required trust material could not be obtained/validated because the provider is unavailable. Keep the user's local session; retry later. |
| 503 | `DEPENDENCY_UNAVAILABLE` | Database/pool unavailable; do not translate to missing profile. |

Generate a request UUID server-side for correlation and return `X-Request-ID`. Do not trust an arbitrary client request ID as a log field without validation. Return `WWW-Authenticate: Bearer` on 401 responses. Unknown exceptions use a generic internal-error envelope; stack traces remain server-side and redacted.

## 3. Authentication design

### 3.1 Trusted configuration

Anisha owns SB-01–03 Supabase Auth/project setup and supplies the public trust metadata. Ishmum consumes and verifies that handoff; he does not configure Auth providers, redirects, mail or users. Read the actual project metadata from her SB-02 output. Validate a single HTTPS issuer/origin, expected audience, exact asymmetric algorithm allowlist, and bounded cache/network settings at startup. Derive JWKS from the issuer; do not accept a URL from token `jku`, `x5u`, `iss`, request headers, or payload fields. A legacy symmetric project requires a separate explicit migration/compatibility decision, not an automatic downgrade.

Suggested development tuning defaults are engineering proposals, not service guarantees: token size ceiling 16 KiB; clock skew 30 seconds; JWKS cache TTL 300 seconds; connect timeout at most 2 seconds and overall fetch budget 5 seconds; maximum response body 256 KiB; maximum usable keys 16; unknown-key refresh cooldown 30 seconds; bounded negative-key cache 64 entries for 60 seconds. Test with a fake clock and actual issued tokens before finalizing them. An HTTP client's per-operation timeout is not by itself a whole-request deadline: enforce and test the resolver's overall budget, including a slowly streaming response.

### 3.2 Verifier boundary

Create a small `TokenVerifier` protocol, an immutable `VerifiedIdentity` result, and a production Supabase verifier implementation. Tests inject a controlled key resolver/clock; there is no `DEV_AUTH_USER`, `verify_signature=False`, arbitrary test token, or hidden production bypass.

1. Enforce bearer format and token size before network work.
2. Parse only the header to select a candidate key. Reject missing/invalid `kid`, unsupported `alg`, malformed structure, and unsupported critical header parameters. Header inspection does not authenticate the payload.
3. Resolve a compatible signing key from the configured public key set, checking key type/use/algorithm and rejecting ambiguous duplicate IDs.
4. Use maintained PyJWT plus cryptography to verify the signature and configured issuer/audience/algorithm. Require expiration, issued-at, subject, and the expected authenticated role; check `nbf` when present. Parse the subject as a UUID and reject token classes such as public/elevated API keys as user sessions.
5. Verify timestamps within the agreed skew and reject unreasonable/future claims. Use optional email only after the token passes validation. Do not authorize from user-editable metadata.
6. The selected M1 development endpoint excludes Supabase anonymous-sign-in identities: valid anonymous credentials receive `403 FORBIDDEN`. This is an explicit initial endpoint scope boundary, not a decision that the eventual product cannot have guest UI. A public/secret API key without valid authenticated-user claims is not such an identity and must fail authentication.

Do not derive allowed algorithms from token headers or mix symmetric/asymmetric verification opportunistically. PyJWT exposes verification and claim requirements, but the application must set its own trust policy. [PyJWT verification API](https://pyjwt.readthedocs.io/en/stable/api.html)

### 3.3 JWKS resolution, rotation, and outage semantics

Use an app-lifespan-scoped asynchronous `JwksResolver` with `httpx2.AsyncClient`, immutable cached key sets, an `asyncio.Lock` to coalesce refreshes, and monotonic cache expiration. The installed package exposes async streaming, TLS verification, and disabled redirects; promote it from dev-only to a locked runtime dependency when used. Enforce the complete resolution budget with Python 3.12 `asyncio.timeout`, including waiting for a refresh lock, connecting, and reading the bounded body. Per-I/O client timeouts alone cannot enforce that whole budget. Keep pure signature/claim validation separate from network resolution, use an async verification dependency, close the client in app lifespan, and test that cancellation releases locks/response streams without poisoning the next request. This async Auth network boundary does not require an async database stack. [Python deadline/cancellation semantics](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout)

| Situation | Result |
|---|---|
| Matching compatible key in an unexpired cache | Verify locally; no Auth network call per request. |
| Cold/expired cache and JWKS fetch succeeds | Replace cache atomically, then verify. |
| Unknown `kid`, refresh allowed, fresh fetch still lacks key | 401 `INVALID_TOKEN`; bounded negative cache. |
| Unknown `kid` within cooldown and current fresh set lacks key | 401; avoid attacker-driven fetch amplification. Document temporary rotation propagation tradeoff. |
| Fetch required but HTTPS timeout, malformed response, excessive body, or provider failure prevents trusted resolution | 503 `AUTH_UNAVAILABLE`; never grant access. |
| Token is structurally/cryptographically invalid independently of provider availability | 401, not 503. |
| Cache expired during provider outage | Fail closed with 503; no unlimited stale-key acceptance. |

Ignore remote redirects rather than following an unexpected key endpoint. Bound concurrency and request time; do not create one network client per token. Supabase's discovery endpoint and SDK caches can affect rotation propagation, so document how to invalidate this service's caches during incident recovery. [Supabase signing-key behavior](https://supabase.com/docs/guides/auth/signing-keys)

### 3.4 Revocation boundary

Offline signature validation cannot promise immediate rejection after sign-out, user deletion, password changes, or provider-side session revocation. M1 intentionally accepts otherwise valid, unexpired access tokens under its recorded policy. Mobile sign-out removes the local session and account data; it does not retroactively invalidate every copied JWT. Future sensitive endpoints may require an additional online session/user check with its own outage policy. Do not implement an expensive Auth request on every endpoint while claiming offline validation. [Supabase session semantics](https://supabase.com/docs/guides/auth/sessions)

## 4. Database design for M2

### 4.1 Driver and execution model

Prefer **synchronous SQLAlchemy + psycopg 3**, with synchronous FastAPI handlers/dependencies for blocking database work. This is a small two-person service, and the simpler transaction model is sufficient for the initial load. Do not place blocking calls inside an `async def` utility expecting FastAPI to offload them automatically. Async remains an option when measured concurrency justifies it. [FastAPI execution model](https://fastapi.tiangolo.com/async/)

This choice concerns database work. The small async JWKS dependency above has a separate purpose: cancellable network discovery with an actual whole-operation deadline. It does not require async SQLAlchemy, another database driver, or an extra application service.

Use one process-scoped engine, request-scoped sessions, explicit transaction boundaries, and disposal on shutdown. Start with a bounded development pool, proposed `pool_size=2`, `max_overflow=0`, finite checkout/connect/statement timeouts, and `pool_pre_ping=True`; include every worker/instance in the total connection budget. Roll back and close on every exception. Do not layer a separate psycopg pool beneath SQLAlchemy's pool. [SQLAlchemy pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)

SB-04 chooses direct or session-pooler access and TLS trust. Transaction-pooler mode is not the initial default. If later selected, verify the actual pooler's constraints, disable incompatible prepared statements, and prove that all user context remains transaction-local. Psycopg exposes preparation controls; avoid blindly copying asyncpg-specific flags. [Psycopg preparation controls](https://www.psycopg.org/psycopg3/docs/advanced/prepare.html)

### 4.2 First product table

Only create the agreed minimal `public.profiles` table:

| Column | Rule |
|---|---|
| `user_id` | UUID primary key referencing `auth.users(id)`; account deletion cascade is a storage rule, not an implemented deletion UI. |
| `display_name` | Nullable text, trimmed by the API; DB length constraint agrees with the approved 80-code-point bound. |
| `revision` | Integer >=1, incremented by accepted profile writes. |
| `created_at`, `updated_at` | Server-generated UTC instants; clients cannot set them. |

Do not duplicate email/provider/password data into this table. Do not insert arbitrary onboarding JSON, age/gender defaults, plan semantics, selected application tokens, or reward fields merely to mirror a demonstration Settings screen. Auth `user_metadata` is not the application profile authority; profile initialization from signup metadata must be an explicit, validated user action rather than automatic trust.

### 4.3 Least privilege and row isolation

The runtime role provisioned in SB-04 must be a non-owner with no bypass privilege. Alembic grants only the required table operations and enables RLS; mobile `anon`/`authenticated` roles receive no product table CRUD grants in this API-owned model. Database policy and repository filtering are both tested.

At the start of each profile transaction, set a transaction-local verified-user context using a **bound parameter**, e.g. `set_config('app.user_id', <verified UUID>, true)`. A small RLS expression reads this context with `current_setting(..., true)` and treats missing/empty context as no user. Define both `USING` and `WITH CHECK` policies scoped to the API runtime role; every repository query also filters by the verified `user_id`.

This custom connection does not automatically receive Supabase Data API claims: `auth.uid()` is not magically populated by verifying a JWT in Python. Either use the explicitly chosen application context consistently, or change the connection/claims model and tests before using `auth.uid()` policies. Never set session-level context that can leak through a reused pool connection. PostgreSQL supports transaction-local configuration, and row policies must be designed for the actual runtime role. [Transaction-local settings](https://www.postgresql.org/docs/current/functions-admin.html), [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

This is defense against programming mistakes under a trusted backend connection, not proof that stolen runtime database credentials cannot impersonate another user. Keep credentials private and SQL parameterized; do not expose arbitrary SQL or a user-controlled context setter.

## 5. Commit-by-commit implementation

All parts include their own relevant tests; API-10 is the final integration evidence pass, not the first time tests are written. Commit hashes remain pending until implementation.

### API-01 — Add validated Auth settings, errors, and request correlation

**Proposed commit:** `feat(api): add identity configuration and structured errors`\
**Depends on:** Plan 00 error/config contract; Anisha's SB-02 metadata for live configuration only. Ishmum can implement configuration/errors and local-key tests before that handoff.\
**Files:** `app/core/config.py`, `app/core/errors.py`, `app/core/request_context.py`, `app/main.py`, `.env.example`, `tests/test_config.py`, `tests/test_errors.py`.

**Steps:**

1. Add project-pinned issuer/audience/algorithm settings and bounded tuning values; reject contradictory or partial configuration.
2. Preserve an explicit local unconfigured shell state: `/healthz` can run without cloud credentials, but any protected route returns `AUTH_UNAVAILABLE`. Normal configured/deployed startup requires complete Auth configuration; partial settings fail clearly. Separate side-effect-free route/application assembly (proposed `app/application.py`) from runtime `app/main.py`, which validates settings and wires production dependencies. The schema exporter imports only the assembly with explicit unavailable providers, never globally configured `main.app`; it neither serves an auth bypass nor requires cloud configuration.
3. Implement the shared error envelope, safe validation-error serialization, request-ID middleware/header, and 401 challenge behavior.
4. Add CORS exposure for `X-Request-ID` and only the headers/methods needed by the approved frontend. CORS is a browser constraint, not API authentication.
5. Keep liveness independent of provider/database health. A future readiness endpoint must state what it actually checks and use bounded operations; do not alter `/healthz` into a dependency probe.

**Acceptance/tests:** valid/missing/partial/wrong-project settings, unsafe issuer URL, unsupported algorithms, malformed request IDs, no token echo, consistent validation errors, and the existing CORS/liveness tests pass. In a shell configuration, a protected endpoint can never return a made-up identity.

**Recovery:** revert the route exposure/config change if deployment cannot start; never restore availability by disabling verification. Changing error codes needs contract regeneration and client review.

### API-02 — Implement deterministic signature and claim verification

**Proposed commit:** `feat(auth): verify Supabase access-token signatures and claims`\
**Depends on:** API-01; shared `MeResponse`/error decisions. No live provider dependency.\
**Files:** `app/core/auth.py`, `app/core/identity.py`, `tests/auth/test_token_verifier.py`, dependency project/lock files.

**Steps:**

1. Add pinned-compatible PyJWT crypto support and the verifier/key-resolver interfaces.
2. Implement bearer/token parsing, algorithm and key compatibility checks, signature/claim validation, UUID conversion, and immutable identity result.
3. Generate ephemeral test key pairs inside tests; keep private test keys out of production configuration. Tests must not share production secrets.
4. Make the verifier consume an injected resolver and clock/skew configuration; preserve one production trust path.

**Acceptance/tests:** valid token; invalid signature; wrong issuer/audience; expired/future token; missing `exp`/`iat`/`sub`; bad UUID; incompatible algorithm; `none`/HS256 confusion; missing `kid`; oversized malformed token; elevated/public API-key token; unexpected role; optional email; untrusted metadata. Both ES256 and another algorithm need tests only if actually supported by the configured scope; do not expand the allowlist just to increase coverage.

**Recovery:** revert the verifier implementation on failed checks. No bypass/debug user identity may be merged as a substitute.

### API-03 — Add bounded JWKS discovery and rotation handling

**Proposed commit:** `feat(auth): resolve and cache project-pinned signing keys`\
**Depends on:** API-02; SB-02 for live discovery.\
**Files:** `app/core/jwks.py`, app lifespan wiring, `tests/auth/test_jwks.py`, project/lock files.

**Steps:**

1. Add the async lifespan-scoped HTTPS resolver with TLS verification, fixed origin, no token-supplied URLs/redirects, bounded streaming response/key limits, per-I/O settings, an `asyncio.timeout` whole-resolution deadline, and explicit close semantics. Do not simulate cancellation of blocking network work by abandoning unbounded background threads.
2. Add atomic cache refresh, monotonic TTL, and an async lock to coalesce cold/expired fetches. A cancelled/failed refresh leaves no half-updated cache or permanently held lock; waiting callers retain their own bounded deadlines.
3. Add bounded unknown-key refresh/negative caching and finite backoff/cooldown; use a fake clock in tests rather than sleeps.
4. Map trust-source failure to `AUTH_UNAVAILABLE`; preserve independent invalid-token failures as 401.
5. Record operational defaults and the rotation/revocation tradeoff in the Auth runbook.

**Acceptance/tests:** cold/hot/expired cache; known key during an unexpired-cache outage; required-refresh outage; malformed/oversized JWKS; duplicate key IDs; key rotation; unknown key still absent; unknown-key storms do not create unbounded calls/memory; concurrent cold requests coalesce; lock-wait/body-trickle cancellation obeys the complete budget; cancelled refresh permits a later successful request; client closes on shutdown. Use controlled clocks/transports; a live fetch is supplementary, never required by deterministic CI.

**Recovery:** clear/restart the process-scoped cache after corrected trusted configuration. During outage fail protected requests honestly rather than caching an invalid identity or extending stale keys forever.

### API-04 — Publish the protected identity endpoint

**Proposed commit:** `feat(api): expose database-independent authenticated identity`\
**Depends on:** API-01–03. SB-03 metadata/accounts enable an optional direct live-token smoke test; completed mobile Auth/RN integration is not a commit prerequisite.\
**Files:** `app/api/v1/__init__.py`, `app/api/v1/dependencies.py`, `app/api/v1/me.py`, `app/schemas/identity.py`, `app/main.py`, `tests/api/test_me.py`.

**Steps:**

1. Wire the production verifier through an async dependency that awaits bounded key resolution, then performs pure signature/claim checks. Keep blocking database work in the later synchronous handlers/dependencies; do not call a synchronous network fetch from the event loop. Measure crypto cost before introducing any extra offload layer.
2. Implement `GET /v1/me` exactly as the shared identity contract, with no database imports/connections or profile writes.
3. Set non-cacheable identity responses; preserve public liveness and structured auth errors.
4. Publish the tested endpoint/schema to the mobile owner. A direct provider-issued A/B token smoke check is useful once SB-03 is ready; full mobile evidence follows at RN-06/AUTH-08/SB-06, after API-05 generates the types they consume.

**Acceptance/tests:** Deterministically signed A/B fixtures return their own claim UUID; missing/wrong/expired credentials fail; forged `X-User-ID`/body/query identity cannot select another account; DB unavailable/unconfigured does not break a valid identity request; Auth discovery outage is 503 when keys are required. Test dependency overrides remain confined to tests; run at least one full signed-token route test without overriding production verification. A live direct-token check can be recorded separately; this producer commit is complete without a finished mobile consumer.

**Producer exit:** a real verification path protects `/v1/me` and the contract is ready for API-05/consumer integration; no identity is fabricated on failure. The full live M1 round trip is a later joint acceptance gate, not a circular prerequisite for schema generation.

**Recovery:** Keep the endpoint unavailable or revert the route wiring if verification fails. Preserve liveness and safe error responses; never replace the verifier with a development user to make the consumer work.

### API-05 — Publish generated HTTP types and contract checks

**Proposed commit:** `chore(contracts): generate identity API types from OpenAPI`\
**Depends on:** API-04; Plan 00 generated-contract ownership.\
**Files:** proposed `scripts/export-openapi.py`, `packages/contracts/openapi/foundation.openapi.json`, `packages/contracts/src/http.generated.ts`, shared package exports/scripts, API schema tests, root scripts/CI.

**Steps:**

1. Export OpenAPI through the side-effect-free assembly from API-01, without importing runtime `main.app`, reading real secrets, opening network clients, creating users, or connecting to a database. Explicit unavailable dependencies can never return a success identity. Test strict normal production startup separately from schema construction.
2. Use the Plan 00 pinned `openapi-typescript` approach to generate TypeScript types at the exact agreed path and commit reproducible output. Keep the existing runtime HTTP client; do not introduce a competing generated client. Native/auth domain ports remain handwritten.
3. Ensure generated public responses contain no internal claims, tokens, debug fields, or privileged settings.
4. Add a check that regeneration leaves the working tree unchanged and that successful/error responses match the shared contract examples.

**Acceptance/tests:** fresh checkout can regenerate identical output; TypeScript imports remain type-only where appropriate; `npm run typecheck` and API response-schema tests pass. Coordinate the export migration so frontend imports do not break halfway through a merge.

**Recovery:** restore the previous schema/types together, or ship an additive compatible adjustment. Do not hand-edit generated files to hide a server mismatch.

### API-06 — Add the database engine and isolated integration-test harness

**Proposed commit:** `feat(db): add scoped PostgreSQL sessions and integration fixtures`\
**Depends on:** API-01 configuration/error boundary and SB-04/05. M1 remains usable independently.\
**Files:** `app/db/engine.py`, `app/db/session.py`, `app/db/base.py`, database config, test fixtures/markers, project/lock files, CI/test scripts.

**Steps:**

1. Add compatible SQLAlchemy, psycopg, and Alembic dependencies. Choose tested stable versions at implementation time and pin through the lockfile.
2. Separate runtime and migration URLs. The application must not use migration credentials as fallback.
3. Construct a bounded engine with remote TLS trust, pre-ping, finite timeouts, and shutdown disposal. Create sessions per unit of work, not a global mutable Session.
4. Implement a transaction wrapper that binds verified user context before product SQL and rolls back/closes on all failures.
5. Add fixtures against the disposable SB-05 database for real runtime-role connection/context tests. API-06 can prove pool/transaction behavior with controlled SQL before product tables exist; API-07 adds the Alembic configuration and required migration execution before repository/policy tests. Do not depend on a nonexistent history in this first database commit.
6. Guard cleanup targets explicitly; tests lacking a test URL must fail/skip only under a clearly named local opt-out, while required database CI checks must fail rather than silently skip.

**Acceptance/tests:** connection lifecycle; pool exhaustion/timeout; rollback after error; unavailable DB returns a dependency error; context missing fails closed; connection reused from A to B has no A context; app shutdown closes resources; protected identity endpoint still works with DB disabled.

**Recovery:** disable not-yet-integrated profile routes if DB setup fails; keep M1 working. Do not increase pool limits or grant privileges until the actual failure is understood.

### API-07 — Create the minimal profile table and its access policy

**Proposed commit:** `feat(db): migrate minimal profiles with runtime row isolation`\
**Depends on:** API-06; agreed M2 profile contract; SB runtime role exists.\
**Files:** `alembic.ini`, `alembic/env.py`, `alembic/versions/<revision>_profiles.py`, `app/models/profile.py`, DB policy/migration tests.

**Steps:**

1. Initialize one Alembic history rooted in the actual current database state; inspect first rather than stamping a populated database as empty.
2. Create only `public.profiles` with UUID FK, nullable bounded display name, revision constraint, and server timestamps.
3. Enable RLS and define API-role-specific own-user `USING`/`WITH CHECK` policies based on transaction-local context. Grant only SELECT/INSERT/UPDATE to runtime; reserve DELETE for a future explicit lifecycle workflow.
4. Revoke unintended product-table access from public/mobile roles and check default privileges for future migrations. Do not modify managed Auth table structure or add a signup trigger.
5. Review generated SQL for ownership, search path, extensions, and destructive operations. Each future migration adds its own grants/policies; RLS enabled alone is not a sufficient review.
6. Wire actual Alembic upgrade execution into the isolated fixtures/CI now that the configuration/history exists. The schema integration group must fail when upgrade fails; it must not silently use pre-created product tables. A repository entered without its verified-user transaction wrapper fails as an internal invariant error rather than treating RLS's empty result as a genuinely absent profile.

**Acceptance/tests:** empty-database upgrade reaches one head; repeated upgrade is a no-op; profile FK rejects nonexistent Auth UUIDs; constraints reject invalid revision/name; API role is not owner/bypass; missing context cannot read/write; A cannot read/update/insert B even if a repository predicate is accidentally omitted in a targeted negative test; mobile Data API roles have no CRUD access. Verify account FK cascade only in the disposable fixture and later managed-development smoke context.

**Recovery:** before any populated shared database change, inspect migration SQL and take an appropriate recovery snapshot/export. Test downgrade only on disposable data. On populated development/production, prefer a forward fix; never automatically drop profiles as a rollback shortcut. [Alembic migration workflow](https://alembic.sqlalchemy.org/en/latest/tutorial.html)

### API-08 — Implement nonmutating own-profile reads

**Proposed commit:** `feat(api): read the authenticated user's profile`\
**Depends on:** API-07 plus API-04/05 authentication/schema-export handoffs.\
**Files:** `app/repositories/profiles.py`, `app/schemas/profiles.py`, `app/api/v1/profiles.py`, route wiring, API/repository tests, generated HTTP types.

**Steps:**

1. Implement GET with verified user scope and transaction-local context.
2. Return `{profile:null}` for a genuinely absent row, with no hidden insertion or metadata import.
3. Serialize timestamps in UTC and expose only the agreed fields.
4. Map a failed query/pool to 503 rather than an empty profile; keep identity success separate from profile failure in the client contract.

**Acceptance/tests:** absent row remains absent after repeated GETs; own row returned; A/B isolation; malformed/missing token rejected before database access; DB outage/timeout is not reported as first-run onboarding; no SQL details or other user's values in errors.

**Recovery:** Disable profile reads if their scope cannot be trusted, while leaving identity independent. A DB failure returns unavailable, not an empty successful profile; repair connection/repository logic without deleting or recreating user rows.

**Recovery:** keep GET disabled until migrations are applied. A backend rollback must remain compatible with the existing table and generated response shape.

### API-09 — Implement revision-safe profile creation and edits

**Proposed commit:** `feat(api): save profiles with optimistic concurrency`\
**Depends on:** API-08; Plan 00 field/concurrency contract.\
**Files:** profile schemas/repository/routes, validation/concurrency tests, generated types.

**Steps:**

1. Validate strict PATCH input with extra fields forbidden and at least one mutable field supplied. Reject NUL and unpaired surrogate code points as safe 422 field errors before database encoding. Apply Plan 00's canonical server whitespace/length rule once; do not create a conflicting client normalizer or silently drop invalid characters.
2. Use atomic insert-if-absent for expected revision 0; concurrent inserts produce exactly one row/accepted initial revision.
3. Use a scoped `UPDATE ... WHERE user_id = verified_id AND revision = expected` with `RETURNING`; increment revision and timestamp in the same transaction.
4. On no matching row, obtain only that user's current revision and return a safe 409. No read-then-unconditional-write race.
5. Treat integrity violations individually. A missing Auth FK can indicate deletion after token issuance; return safe `403 FORBIDDEN` for that profile write, never recreate Auth users or leak SQL details. Only classify the specific owner-FK violation this way; unrelated constraint/connection errors retain their own categories. Test the concurrent deletion race and document that this does not retroactively invalidate the otherwise unexpired JWT at `/v1/me`.
6. Keep requests idempotence-aware: a lost response after commit triggers refetch/reconciliation. Do not automatically repeat non-idempotent writes after 401/503 without the client's revision safeguards.

**Acceptance/tests:** create/update/clear; blank/overlong/whitespace-set/Unicode boundary; NUL/unpaired surrogate rejection; missing/extra/body user ID; negative/boolean/invalid revisions; two simultaneous creates; two simultaneous same-revision updates (one succeeds, one conflicts); response-lost replay; A/B forged identity; missing-row update conflict; deleted-owner FK race; rollback leaves no partial write; safe conflict details belong only to current user.

**M2 backend exit:** A and B can independently read/edit their profiles, a missing profile is explicit, conflicts preserve data, and runtime-role/RLS tests prove isolation.

**Recovery:** Disable the write path while preserving verified reads and existing rows. Reconcile ambiguous writes using the stored revision; correct schema/logic with a forward fix instead of resetting profiles or replaying unconfirmed writes.

### API-10 — Complete operational checks and cross-app handoff

**Proposed commit:** `docs(api): record identity and profile integration evidence`\
**Depends on:** API-04/05 for M1; API-06–09 and RN-07 for M2 live profile evidence. Coordinate with SB-06; RN-11 consumes the tested backend behavior and is not a prerequisite for this producer/evidence record.\
**Files:** `services/api/README.md`, runbooks, CI, actual evidence notes; no extra product domains.

**Steps:**

1. Record reproducible local startup and check commands; verify startup with the new Auth configuration and, separately, profile/database configuration.
2. Add concise redacted diagnostics: request ID, error category, endpoint, duration, JWKS cache/fetch outcome, pool failure category. Do not log bearer headers, full claims, email, display names, passwords, or SQL parameter values.
3. Verify the browser CORS path and native development-client path separately; a successful web preview is not physical-device proof.
4. Run A/B M1 and M2 journeys with a real development project and the actual runtime DB role. Record environmental limitations and outstanding device tests.
5. Document `/healthz` as process liveness and the exact status of readiness/dependency diagnostics. Deployment planning may add a bounded `/readyz` later; this plan does not require an always-on background dependency checker.
6. Establish the follow-on onboarding persistence contract review. Do not add generic JSON blobs or enforcement policies to finish a checklist.

**Acceptance/tests:** all automated checks pass, no managed-project credentials are required by deterministic CI, generated contracts are synchronized, signed/native limitations are explicit, and Anisha can call the API using the real Auth session without knowing backend database credentials.

**Recovery:** Leave the failing scenario and owning part open, record reproducible evidence, and fix the affected increment. Do not mark the whole milestone passed, loosen authentication, or reset a shared database to finish a handoff checklist.

## 6. Required test matrix

| Category | Essential cases | Evidence |
|---|---|---|
| JWT trust | Wrong signature/project/audience/algorithm, malformed/missing claims, expired/future token, UUID/role validation | Deterministic signed-token tests, not only mocked dependencies |
| Key discovery | Cold/hot/expired cache, rotation, unknown kid storm, malformed JWKS, HTTPS failure, cooldown/coalescing | Fake transport + clock; supplementary live fetch |
| Endpoint identity | Missing credentials, real A/B identities, forged user headers, DB disabled | Route tests + redacted live M1 |
| Profile privacy | Runtime role, missing context, A/B reused connection, malicious user ID/body, missing row | Real PostgreSQL role/policy tests |
| Concurrency | Parallel initial insert, same-revision update, replay after lost response | Concurrent PostgreSQL transactions |
| Failure mapping | Auth outage versus invalid token, DB outage versus missing profile, generic unexpected exception | Error-schema tests and client-handling checks |
| Schema lifecycle | Empty upgrade, repeated upgrade, tested disposable downgrade, one migration head | Isolated database CI |
| Contract drift | OpenAPI export, generated TS, shared error examples | Reproducible generation check |

## 7. Commands and validation policy

Existing commands remain the baseline:

```bash
npm run api:lint
npm run api:test
npm run typecheck
```

The implementation adds clearly named database setup/test and OpenAPI-generation scripts in API-05/06. Document their exact commands when they exist; do not claim illustrative command names are already runnable. Every API part should run focused tests plus applicable existing checks. Database-changing parts must run the real PostgreSQL group, not substitute SQLite. Live development checks are manual/supplementary and must not put refresh/access tokens in CI secrets merely to run deterministic tests.

## 8. Cross-plan dependency map

| This plan needs | Supplied by | Unblocks |
|---|---|---|
| Identity/error/settings contract | Plan 00 | API-01/02 and parallel mobile mocks |
| Actual signing metadata | SB-02, Anisha | Configured verifier and live JWT tests |
| Mobile real session | AUTH client/session/sign-in parts | Live API-04 / M1 integration |
| Runtime role and test database | SB-04/05, Ishmum | API-06–09 / M2 |
| Generated API shapes | API-05 and endpoint updates | Frontend safe typed requests |
| Minimal profile endpoints | API-08/09 | Account display/edit, later validated onboarding name persistence |

Auth can finish its session work without profiles. The main frontend must not classify a 503 profile failure as a signed-out session or silently erase a local onboarding draft. Native enforcement never waits for this API.

## 9. Progress ledger

| Part | Status | Actual commit | Evidence / notes |
|---|---|---|---|
| API-01 | Pending | — | — |
| API-02 | Pending | — | — |
| API-03 | Pending | — | — |
| API-04 | Pending | — | — |
| API-05 | Pending | — | — |
| API-06 | Pending | — | — |
| API-07 | Pending | — | — |
| API-08 | Pending | — | — |
| API-09 | Pending | — | — |
| API-10 | Pending | — | — |

## 10. Sources and verification notes

Official references checked 2026-10-28. Cache bounds, pool sizes, schema split, and commit sequencing above are this plan's proposed engineering decisions; verify them against the selected package versions and real project during implementation.

- [Supabase JWT guidance](https://supabase.com/docs/guides/auth/jwts)
- [JWT claim reference](https://supabase.com/docs/guides/auth/jwt-fields)
- [Signing keys and rotation](https://supabase.com/docs/guides/auth/signing-keys)
- [Session lifecycle](https://supabase.com/docs/guides/auth/sessions)
- [PyJWT verification API](https://pyjwt.readthedocs.io/en/stable/api.html)
- [PyJWT JWKS usage](https://pyjwt.readthedocs.io/en/stable/usage.html#retrieve-rsa-signing-keys-from-a-jwks-endpoint)
- [FastAPI synchronous/asynchronous execution](https://fastapi.tiangolo.com/async/)
- [Python 3.12 deadline/cancellation](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout)
- [SQLAlchemy PostgreSQL dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [SQLAlchemy pooling](https://docs.sqlalchemy.org/en/20/core/pooling.html)
- [Psycopg prepared statements](https://www.psycopg.org/psycopg3/docs/advanced/prepare.html)
- [Alembic tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [PostgreSQL row policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Transaction-local settings](https://www.postgresql.org/docs/current/functions-admin.html)
