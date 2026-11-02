# Plan 03 — Backend Foundation Implementation Notes

**Plan:** [03_backend_foundation.md](../core_plan/03_backend_foundation.md)
**Owner:** Ishmum. Anisha owns Supabase Auth setup and mobile sessions/onboarding.
**Branch:** `task/backend/api-01-05`. **Starting commit:** `2703a23`.
**Last updated:** 2026-11-01.
**Current part:** API-05 implemented/tested. API-01–05 producer scope is complete. Ishmum next prepares SB-04/05 then API-06 database sessions/harness; API-06–10 remain pending. Anisha supplies exact SB-02 trust metadata/current tokens and the mobile Auth/session/root producer for joint RN-05/06 and M1 acceptance. Product profiles/M2 and native enforcement are not implemented. No push requested or performed.

## Resume here

- Latest: **API-05 — Executable OpenAPI and generated HTTP types**, subject `chore(contracts): generate identity API types from OpenAPI`, parent `06f5704`.
- Validation: `npm run check`: passed (269 API, 250 portable mobile and 362 native component tests; TypeScript, ESLint, Ruff, assets and immutable contract checks). `npm run mobile:export`: passed (71 original assets, 38-file UI-fixture isolation). Frozen uv sync, fresh filtered npm ci in an isolated directory and generator check passed; deliberately stale generated output failed without mutation. Repeated full generation preserved both SHA-256 hashes. Evidence: `artifacts/api-05/verification.json`; no live provider calls.
- Next / remaining: API-01–05 producer scope is complete. Ishmum next prepares SB-04/05 then API-06 database sessions/harness; API-06–10 remain pending. Anisha supplies exact SB-02 trust metadata/current tokens and the mobile Auth/session/root producer for joint RN-05/06 and M1 acceptance. Product profiles/M2 and native enforcement are not implemented. No push requested or performed.
- Anisha owns Supabase Auth/session/onboarding; Ishmum backend verification and product DB. No provider, user, redirect, database or native policy was changed. No push/main merge.

## Recording rules

Each commit gets its own header, exact file/line ranges (parent ranges for deletions),
what/why, dependency decisions, actual validation and remaining handoff. Its own
hash stays Pending until a later normal update records the known hash; the unique
commit subject resolves it through Git. Keep historical ranges tied to their commit.
Do not store real tokens, passwords, private signing keys or personal user records.

## Commit entries

### API-01 — Validated Auth settings, safe errors and request correlation

**Hash:** `8ce121d` (recorded during the next part).
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/api-01-05`. **Parent:** `2703a23`.
**Status:** Implemented and deterministically tested; live Supabase and mobile M1 remain unverified.

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. The entry travels with code; resolve its own Pending hash through Git until the next normal update.

| File and lines | What changed and why |
|---|---|
| `docs/core_plan/03_backend_foundation.md`: lines 3–3 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan/03_backend_foundation.md`: lines 439–439 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan_implementation_notes/README.md`: lines 42–44 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `packages/contracts/HTTP_API.md`: lines 128–131 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/.env.example`: lines 1–2 | Document the all-or-none nonsecret trust handoff and bounded defaults; keep future database/migration credentials as unset comments. |
| `services/api/.env.example`: old lines 2–2 at `2703a23` | Document the all-or-none nonsecret trust handoff and bounded defaults; keep future database/migration credentials as unset comments. |
| `services/api/.env.example`: lines 5–7 | Document the all-or-none nonsecret trust handoff and bounded defaults; keep future database/migration credentials as unset comments. |
| `services/api/.env.example`: lines 9–23 | Document the all-or-none nonsecret trust handoff and bounded defaults; keep future database/migration credentials as unset comments. |
| `services/api/README.md`: lines 21–47 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/app/application.py`: lines 1–34 | Assemble the app without reading environment or constructing runtime clients. Order context → CORS → safe unexpected-error boundary so correlation and CORS survive failures/preflights. |
| `services/api/app/core/config.py`: lines 1–3 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/config.py`: lines 5–6 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/config.py`: lines 8–8 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/config.py`: lines 12–40 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/config.py`: lines 44–46 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/config.py`: lines 49–126 | Validate immutable complete project/issuer/audience/asymmetric algorithm trust or explicit local shell; derive fixed JWKS URL and bound token/cache/time/body/key settings. Reject production-without-trust, unsafe URLs, contradictory origins and nonfinite bounds; hide settings input in errors. |
| `services/api/app/core/errors.py`: lines 1–130 | Implement server-owned statuses/messages, canonical error envelopes and bounded whitelisted validation details. Normalize API/framework exceptions without input, arbitrary exception headers or raw messages; preserve 401 Bearer challenge and routing Allow header. |
| `services/api/app/core/request_context.py`: lines 1–64 | Generate per-request UUIDs and private no-store headers with pure ASGI middleware; sanitize unexpected errors inside CORS, log only request IDs and preserve non-HTTP scopes/cancellation/streaming failure semantics. |
| `services/api/app/main.py`: lines 1–2 | Retain the runtime factory/ASGI entry; validate Settings before serving and pass explicit CORS configuration into pure assembly. Store immutable runtime settings for subsequent lifespan wiring. |
| `services/api/app/main.py`: old lines 2–2 at `2703a23` | Retain the runtime factory/ASGI entry; validate Settings before serving and pass explicit CORS configuration into pure assembly. Store immutable runtime settings for subsequent lifespan wiring. |
| `services/api/app/main.py`: lines 5–5 | Retain the runtime factory/ASGI entry; validate Settings before serving and pass explicit CORS configuration into pure assembly. Store immutable runtime settings for subsequent lifespan wiring. |
| `services/api/app/main.py`: lines 11–12 | Retain the runtime factory/ASGI entry; validate Settings before serving and pass explicit CORS configuration into pure assembly. Store immutable runtime settings for subsequent lifespan wiring. |
| `services/api/app/schemas/__init__.py`: lines 1–1 | Establish the wire-schema package separately from domain identity/runtime ports. |
| `services/api/app/schemas/errors.py`: lines 1–76 | Define strict error codes/envelopes, canonical retryability and required bounded validation/conflict details, including safe routing errors for complete HTTP handling. |
| `services/api/tests/conftest.py`: lines 1–11 | Clear inherited runtime configuration from deterministic tests; no provider credentials or accidental live requests are required. |
| `services/api/tests/test_app.py`: lines 3–3 | Reuse the existing liveness/CORS checks against pure assembly, avoiding import of a globally configured runtime app. |
| `services/api/tests/test_app.py`: lines 7–7 | Reuse the existing liveness/CORS checks against pure assembly, avoiding import of a globally configured runtime app. |
| `services/api/tests/test_config.py`: lines 1–141 | Exercise local/production/partial settings, immutable trust, unsafe/contradictory project URLs, algorithm confusion, finite resource bounds, exact CORS origins, JSON environment configuration and actual runtime entry validation. |
| `services/api/tests/test_errors.py`: lines 1–164 | Verify no secret echo/logging, server-generated ID/body parity, CORS on sanitized 500s, safe 401/422/routing errors, bounded field details, environment-free assembly and cancellation/non-HTTP forwarding. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–25 | Refresh current part, validation and the next handoff without overwriting historical entries. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 26–83 | Record this entire per-commit change table, decisions, real validation and unverified live dependencies. |

#### Decisions and relations

- Preserve existing FastAPI/Pydantic/Uvicorn foundation and Plan 00 HTTP semantics. API-01 covers FR-002/009/034 and NFR security/reliability boundaries; no UI/Figma changes or PM provider/guest/age decisions are made.
- Runtime `app.main` validates settings; pure `app.application` accepts explicit CORS origins/lifespan and imports no runtime app. This permits later schema export without dotenv, clients, users or a success stub. Production without trust and every partially configured environment fail before serving; development/test with all four absent is the honest local shell.
- Trust is one canonical HTTPS DNS project origin and exact `/auth/v1` issuer, an explicit audience, and nonempty unique ES256/RS256 allowlist. There is no guessed default algorithm, symmetric fallback, configurable token-controlled URL, service key or password. Both supported asymmetric algorithms will be tested in API-02; actual enabling awaits Anisha's observed SB-02 metadata. Bounds follow the plan's proposed defaults and remain configuration, not promises of provider behavior.
- Keep middleware small and pure ASGI: outer request context covers preflights; CORS surrounds the unexpected-error boundary; known exceptions use FastAPI handlers. This ensures even sanitized unexpected 500s have correlation and allowed-origin headers. Cancellation propagates and begun streaming responses are never replaced with a second response. Incoming IDs, exception messages and Pydantic input/ctx never become public/log fields.
- Error models include the already agreed M2 detail shapes without implementing profile endpoints or touching a database. Safe 404/405/other framework errors are explicitly documented additions (`NOT_FOUND`, `METHOD_NOT_ALLOWED`, `HTTP_ERROR`); client fallback for future codes remains unchanged. Framework CORS preflights stay protocol responses. A 422 HTTPException is normalized to safe validation details too.
- Tests deliberately raise messages/unknown field names containing a synthetic secret marker, verify no echo/logging, check exception-path CORS and actual production runtime assembly, and bound the validation list to ten. No test token or fake identity was installed in production code.
- Official sources reviewed: FastAPI error handlers https://fastapi.tiangolo.com/tutorial/handling-errors/ ; Supabase JWT/signing keys https://supabase.com/docs/guides/auth/jwts and https://supabase.com/docs/guides/auth/signing-keys ; PyJWT verification API https://pyjwt.readthedocs.io/en/stable/api.html . Later parts add network/crypto dependencies only when used.

**Actual validation:** `uv run --project services/api pytest services/api/tests -q`: 58 passed; `ruff check services/api`: passed; Ruff format applied. Existing public liveness/CORS tests remain included. No cloud access or live Supabase token was used.

**Remaining / next:** Implement API-02 cryptographic verifier against local ephemeral keys; SB-02 actual trust metadata and real-user M1 remain pending. API-06–10 are out of the current authorized sequence.

### API-02 — Deterministic asymmetric signature and claim verification

**Hash:** `bdd62a6` (recorded during the next part).
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/api-01-05`. **Parent:** `8ce121d`.
**Status:** Implemented and deterministically tested; live Supabase and mobile M1 remain unverified.

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. The entry travels with code; resolve its own Pending hash through Git until the next normal update.

| File and lines | What changed and why |
|---|---|
| `docs/core_plan/03_backend_foundation.md`: lines 3–3 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan/03_backend_foundation.md`: lines 439–440 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/README.md`: lines 48–72 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/app/core/auth.py`: lines 1–195 | Implement bounded bearer/JWT/JOSE parsing, explicit configured asymmetric verification, public JWK compatibility/strength checks and strict verified identity/clock/anonymous policy. Resolver and wall clock are injectable; no issuing, password, refresh or test-identity path. |
| `services/api/app/core/identity.py`: lines 1–31 | Define frozen UUID/email verified identity, typed public verification key and narrow async resolver/verifier ports for production and isolated tests. |
| `services/api/app/core/json_data.py`: lines 1–40 | Reject duplicate members, non-object JSON, nonfinite numbers, invalid UTF-8 and recursion failures in caller-bounded JWT/JWKS inputs without trusting claims. |
| `services/api/pyproject.toml`: lines 9–9 | Add maintained PyJWT crypto support for asymmetric token verification; avoid adding a competing Auth SDK or password store. |
| `services/api/tests/auth/__init__.py`: lines 1–1 | Keep deterministic Auth test support explicitly outside production modules. |
| `services/api/tests/auth/support.py`: lines 1–81 | Generate ephemeral EC/RSA signing material in memory, synthetic A/B claims and deterministic settings/resolver; never write keys/tokens to disk or import from runtime. |
| `services/api/tests/auth/test_token_verifier.py`: lines 1–225 | Exercise both asymmetric algorithms, trusted identity/immutability, required/types/issuer/audience/role/anonymous/time claims, expiration ordering, JOSE/base64 limits, key binding, private/weak/mismatched keys and fail-closed unavailable verification. |
| `services/api/uv.lock`: lines 36–58 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `services/api/uv.lock`: lines 77–126 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `services/api/uv.lock`: lines 134–134 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `services/api/uv.lock`: lines 149–149 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `services/api/uv.lock`: lines 294–302 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `services/api/uv.lock`: lines 372–385 | Lock PyJWT 2.15.1, cryptography 50.0.2 and their required transitive wheels for reproducible Python 3.12 installation. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–20 | Refresh current part, validation and the next handoff without overwriting historical entries. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 28–28 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 84–129 | Record this entire per-commit change table, decisions, real validation and unverified live dependencies. |

`services/api/tests/__init__.py` was also created in API-02 as an empty (0-byte) test-package marker. It has no line range; this coverage correction was recorded during API-05.

#### Decisions and relations

- Backend ownership only: implement verification of Anisha's future access tokens, not login/session issuance/refresh/provider administration. Reuse API-01 error codes/configuration and preserve the type-only mobile Auth port.
- ES256/P-256 and RS256 are supported Supabase asymmetric options; the actual allowlist remains absent until explicitly configured from SB-02. Verify against the fixed configured list, bind kid and algorithm to the resolved public key, enforce use/key_ops/public-only material, and bound RSA key strength/size/exponent. No HS/none fallback, embedded JWK, token URL or algorithm autodetection grants authority.
- Bound tokens before decoding, validate all base64url segments and strict JSON framing, and reject duplicate/nonfinite input. Unverified payload parsing checks syntax only; no identity/role/time decision is trusted before signature and issuer/audience verification. Critical headers and token-controlled key/certificate URLs are unsupported. PyJWT strips b64=True while encoding; the initial test was corrected to insert that untrusted header directly and prove rejection before any resolver call.
- PyJWT signature, issuer and audience checks stay on. Only its time checks are delegated to our explicit NumericDate/clock policy so fake-clock tests do not patch library internals. NumericDate permits finite integral/fractional JSON numbers, excludes bool/string, bounds representable UTC range and checks iat/nbf/exp ordering and skew. Expiration is emitted only after all other trust/type checks. There is no invented provider token lifetime; the configured issuer controls expiry, with stateless revocation limits documented.
- Require authenticated role, UUID subject and explicit boolean is_anonymous. Valid anonymous identities are excluded with 403 for this M1 endpoint; public/elevated API keys fail 401. This implements the plan's development endpoint boundary, not a launch guest-policy decision. Optional verified email stays display-only; user/app metadata cannot override identity or privilege.
- Tests generate private keys and signed claims only in test memory. They verify A/B canonical identity, null/missing email, both algorithms, invalid claims/signatures/headers/keys, algorithm confusion and clock/expiration behavior. Test support lives in tests, with a package marker to avoid unrelated namespace resolution. No bypass was registered in a running app.
- Current official API reference reviewed: https://pyjwt.readthedocs.io/en/stable/api.html and https://supabase.com/docs/guides/auth/jwt-fields . The existing plan's signing policy is implemented with the locked package version; online provider integration remains separate.

**Actual validation:** `ruff check services/api`: passed; `pytest services/api/tests -q`: 194 passed. ES256 and RS256 signatures use ephemeral keys, controlled resolver and fixed clock; there were no live network/cloud checks. Dependency lock resolved PyJWT 2.15.1 and cryptography 50.0.2.

**Remaining / next:** Implement API-03 async bounded project-pinned discovery/cache/rotation. Actual SB-02 metadata and live tokens remain pending; no protected route is exposed until API-04.

### API-03 — Bounded project-pinned JWKS resolution and lifespan

**Hash:** `35ba307` (recorded during the next part).
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/api-01-05`. **Parent:** `bdd62a6`.
**Status:** Implemented and deterministically tested; live Supabase and mobile M1 remain unverified.

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. The entry travels with code; resolve its own Pending hash through Git until the next normal update.

| File and lines | What changed and why |
|---|---|
| `docs/core_plan/03_backend_foundation.md`: lines 3–3 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan/03_backend_foundation.md`: lines 440–441 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/AUTH.md`: lines 1–78 | Document ownership, complete runtime/assembly separation, numeric bounds, atomic cache and failure/cancellation policies, rotation/revocation limits, incident cache reset and remaining live evidence with official references. |
| `services/api/README.md`: lines 73–76 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/app/application.py`: lines 10–10 | Initialize the explicit unavailable verifier during pure assembly, preserving failure safety outside an active configured lifespan and for schema export. |
| `services/api/app/application.py`: lines 22–22 | Initialize the explicit unavailable verifier during pure assembly, preserving failure safety outside an active configured lifespan and for schema export. |
| `services/api/app/core/auth.py`: lines 174–175 | Reject unpaired surrogate display email before public JSON serialization, so a malformed signed claim cannot turn an authenticated identity response into an encoding failure. |
| `services/api/app/core/jwks.py`: lines 1–186 | Implement fixed HTTPS discovery with TLS/no redirects/proxies, bounded identity-encoded streaming, strict atomic public-key validation, immutable positive cache, coalesced refresh, finite failure/cancellation backoff and bounded non-sliding negative LRU. Entire lookup including lock wait has an asyncio deadline; shutdown closes the sole owned client. |
| `services/api/app/main.py`: lines 1–1 | Keep only the Uvicorn entry and runtime factory export; schema tools/tests can import assembly/factory without global environment startup. |
| `services/api/app/main.py`: lines 3–3 | Keep only the Uvicorn entry and runtime factory export; schema tools/tests can import assembly/factory without global environment startup. |
| `services/api/app/runtime.py`: lines 1–31 | Move validated runtime construction into an import-safe factory; lifespan installs one real resolver/verifier only for complete settings and restores unavailable verification before resource close. |
| `services/api/pyproject.toml`: lines 8–8 | Promote existing HTTPX2 to a bounded runtime dependency; remove redundant dev-only declaration. |
| `services/api/pyproject.toml`: old lines 15–15 at `bdd62a6` | Promote existing HTTPX2 to a bounded runtime dependency; remove redundant dev-only declaration. |
| `services/api/tests/auth/test_jwks.py`: lines 1–431 | Verify real async/cache paths with local keys, fake clocks and mock streams: coalescing/storm memory, fixed URLs, rotation/retirement, expiry/outage/backoff, malformed/private/oversized/redirect/compressed discovery, lock/trickle deadline, cancellation/recovery and configured/unconfigured/schema lifespans. |
| `services/api/tests/auth/test_token_verifier.py`: lines 76–76 | Extend both algorithm matrices with malformed Unicode email rejection. |
| `services/api/uv.lock`: lines 133–133 | Record HTTPX2 runtime ownership without changing the previously locked HTTP client/version. |
| `services/api/uv.lock`: old lines 140–140 at `bdd62a6` | Record HTTPX2 runtime ownership without changing the previously locked HTTP client/version. |
| `services/api/uv.lock`: lines 148–148 | Record HTTPX2 runtime ownership without changing the previously locked HTTP client/version. |
| `services/api/uv.lock`: old lines 155–155 at `bdd62a6` | Record HTTPX2 runtime ownership without changing the previously locked HTTP client/version. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–20 | Refresh current part, validation and the next handoff without overwriting historical entries. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 28–28 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 86–86 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 130–179 | Record this entire per-commit change table, decisions, real validation and unverified live dependencies. |

#### Decisions and relations

- Promote the existing maintained HTTPX2 client to runtime, retaining the installed async streaming/mock APIs confirmed locally and its official package https://pypi.org/project/httpx2/ . Runtime defaults verify TLS, disable redirects/environment proxies and limit the connection pool to four/two. Only the validated issuer-derived endpoint is fetched, without any user credential. Per-resolution asyncio.timeout covers lock waiting, request and body consumption; no detached thread/task simulates cancellation.
- Cache immutable key sets atomically after full validation. Known unexpired keys require no fetch. Expired sets never receive stale extension on failure. Refresh lock coalesces concurrent callers; successful short positive TTLs still trigger needed expiry refresh even inside unknown-key cooldown. A provider failure/cancel marks a finite attempt cooldown; it does not leave a lock held or a half-written cache. External cancellation propagates and closes the response stream; later requests succeed after cooldown.
- Unknown IDs have a 64-entry LRU, 60-second non-sliding expiry capped by positive TTL and 30-second refresh cooldown. Repeated hits only update recency, not expiration, avoiding an accidental sliding suppression of rotated keys. Fresh-cache unknowns within policy return INVALID_TOKEN; required trust fetch failures return AUTH_UNAVAILABLE. Valid empty or solely unsupported-algorithm public sets lack the requested key and deny it; malformed metadata/private material/duplicate IDs fail source validation. Bound all 16 advertised entries rather than only usable ones to constrain parsing work.
- Request identity encoding and reject compressed responses before decoding, as well as wrong media/status, excess declared/actual streamed size, invalid/truncated length and malformed JSON. This keeps body limits meaningful under a malicious/broken source. Other advertised algorithms are never enabled; configured algorithms still require public compatible key data. Header URLs cannot redirect this client.
- Extract runtime factory from main to prevent tests/schema tools importing a globally configured app. Pure assembly always starts unavailable. Configured lifespan creates exactly one resolver, installs the real verifier, restores unavailable state before closing; local shell/schema lifespans create none. Health remains independent and performs no initial key fetch. Secret settings are not required by deterministic tests.
- Add signed-email Unicode scalar rejection found while reviewing response encoding; this closes a potential malformed-claim 500 without changing normal string/null display semantics.
- Document process-local TTL/cooldown and upstream rotation propagation as engineering tradeoffs, not instant revocation. A restart clears this worker cache only; Supabase discovery may have edge caching. Stateless access JWTs do not become retroactively revoked merely because the mobile session signs out. Sources: https://supabase.com/docs/guides/auth/signing-keys and https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout .

**Actual validation:** `ruff check services/api`: passed; `pytest services/api/tests -q`: 223 passed. Async tests exercise 100 coalesced cold callers, 200 unknown IDs/64-entry limit, fake-clock rotation and non-sliding negatives, actual 30/40ms lock/trickle deadlines, stream close/cancellation recovery and app shutdown. HTTPX2 stays locked at 2.16.0; no cloud/discovery call was made.

**Remaining / next:** Implement API-04 protected GET /v1/me through the production async verifier. Live SB metadata/token checks and mobile RN-05/06 remain separate; no database/profile routes yet.

### API-04 — Database-independent protected identity endpoint

**Hash:** `06f5704` (recorded during the next part).
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/api-01-05`. **Parent:** `35ba307`.
**Status:** Implemented and deterministically tested; live Supabase and mobile M1 remain unverified.

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. The entry travels with code; resolve its own Pending hash through Git until the next normal update.

| File and lines | What changed and why |
|---|---|
| `docs/core_plan/03_backend_foundation.md`: lines 3–3 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan/03_backend_foundation.md`: lines 441–442 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `docs/core_plan_implementation_notes/artifacts/api-04/local-verification.json`: lines 1–29 | Record 200 warm in-memory crypto samples per supported algorithm with Python/package/platform metadata; no keys/tokens, live provider or deployed latency claim. |
| `package.json`: lines 18–18 | Disable raw Uvicorn access logs in the default dev command so query-string credential mistakes do not enter access logs; preserve existing API bind/reload behavior. |
| `services/api/README.md`: lines 77–102 | Update the implementation status, exact evidence, dependency boundary and handoff described in this entry. |
| `services/api/app/api/v1/__init__.py`: lines 1–1 | Establish the versioned identity route package; no profile/database routes are created. |
| `services/api/app/api/v1/dependencies.py`: lines 1–29 | Declare OpenAPI bearer security, reject absent/duplicate/malformed Authorization headers and delegate only the bearer JWT to the lifespan-owned verifier. Caller owner headers/query/body never enter identity authority. |
| `services/api/app/api/v1/me.py`: lines 1–27 | Publish exact database-independent GET /v1/me with explicit operation ID, public response schema and safe 401/403/503/500 response contracts; map only verified UUID/email. |
| `services/api/app/application.py`: lines 10–10 | Register the identity router in pure assembly; its unavailable default provider fails closed if invoked by unconfigured or schema assembly. |
| `services/api/app/application.py`: lines 37–37 | Register the identity router in pure assembly; its unavailable default provider fails closed if invoked by unconfigured or schema assembly. |
| `services/api/app/schemas/identity.py`: lines 1–10 | Define extra-forbidden UUID identity plus required nullable email, with no claims, tokens or profile state in the public response. |
| `services/api/tests/api/__init__.py`: lines 1–1 | Keep route acceptance fixtures inside tests rather than a runtime auth bypass. |
| `services/api/tests/api/test_me.py`: lines 1–217 | Exercise production factory/verifier/JWKS paths with ephemeral signed A/B tokens, token-only owner authority, malformed/duplicate credentials, bad scope/signatures/expiry, outages, no database imports, CORS/error privacy and exact schema/security. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–20 | Refresh current part, validation and the next handoff without overwriting historical entries. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 28–28 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 86–86 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 132–132 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 180–224 | Record this entire per-commit change table, decisions, real validation and unverified live dependencies. |

#### Decisions and relations

- Expose only the agreed M1 identity endpoint, not profiles/onboarding state or a database dependency. The response contains canonical verified UUID and required string/null email. No body, query or X-User-ID owner input is used, and forged incoming request IDs are replaced by server UUIDs.
- Use FastAPI HTTPBearer only for security declaration/credential extraction context with auto_error=False; our raw-header count/parser owns consistent AUTH_REQUIRED behavior, including duplicate Authorization headers and query-only tokens. The async dependency awaits the real configured verifier; no extra network client or account state is constructed per request.
- Pure schema/local assembly keeps the unavailable provider. Missing headers fail 401; a bearer presented without configured trust fails AUTH_UNAVAILABLE. Actual signatures with expired/invalid claims fail the existing safe 401 classifications, and verified anonymous identities fail the explicit M1 403 scope boundary. Public liveness remains 200 during discovery outage.
- Route tests do not override the identity dependency. They mint ephemeral signatures against current test wall-clock claims, configure the real runtime factory and replace only HTTPS transport. Tests prove A/B identity/cache behavior, no owner-spoofing, no DB imports even under unusable DB configuration, safe errors/no token/email echo, exposed correlation for allowed CORS and no grants to unknown origins.
- CPU-only local measurements show sub-millisecond warm validation in this environment, so keep pure crypto inline rather than adding speculative thread/offload complexity. Artifact records exact versions/platform/scope and no keys/tokens. Network/deployment/physical-device performance remains separate.
- Disable raw Uvicorn access logging in the default dev command and document the deployment flag: even rejected query-token mistakes otherwise enter framework access logs. This is independent of our already-safe application logs. No mobile Auth session or cloud account was configured.
- API-04 is a complete independent producer for API-05 schema generation; a real Supabase token smoke check and mobile M1 are explicitly later evidence, avoiding circular dependency on finished frontend Auth.

**Actual validation:** `pytest services/api/tests -q`: 244 passed; `ruff check services/api`: passed. Full signed-token route tests use the production factory/verifier/resolver with only test HTTPS transport substituted. Local 200-iteration crypto means: ES256 0.0595 ms, RS256 0.0423 ms (Mac arm64, warm test resolver; not a deployed/network SLA).

**Remaining / next:** Implement API-05 reproducible OpenAPI/TypeScript outputs and drift checks. SB-02/03 actual metadata/tokens and RN-05/06 real mobile sign-in remain unverified; profiles/database are API-06 onward.

### API-05 — Executable OpenAPI and generated HTTP types

**Hash:** Pending; resolve by `chore(contracts): generate identity API types from OpenAPI`.
**Date:** 2026-11-01. **Owner:** Ishmum. **Branch:** `task/backend/api-01-05`. **Parent:** `06f5704`.
**Status:** Implemented and deterministically tested; live Supabase and mobile M1 remain unverified.

#### Changed files and logical changes

Ranges refer to this commit; deleted ranges refer to its parent. The entry travels with code; resolve its own Pending hash through Git until the next normal update.

| File and lines | What changed and why |
|---|---|
| `.github/workflows/checks.yml`: lines 37–42 | Install only the pinned build-time generator workspace in the API job; check the exporter with Ruff and fail CI when schema/types drift after deterministic tests. |
| `.github/workflows/checks.yml`: lines 44–44 | Install only the pinned build-time generator workspace in the API job; check the exporter with Ruff and fail CI when schema/types drift after deterministic tests. |
| `.github/workflows/checks.yml`: lines 46–47 | Install only the pinned build-time generator workspace in the API job; check the exporter with Ruff and fail CI when schema/types drift after deterministic tests. |
| `README.md`: lines 19–19 | Replace obsolete health-only status with the implemented identity producer and state live Auth, database and native boundaries; point the next developer to Plan 03 notes and dependent work. |
| `README.md`: lines 22–22 | Replace obsolete health-only status with the implemented identity producer and state live Auth, database and native boundaries; point the next developer to Plan 03 notes and dependent work. |
| `README.md`: lines 98–98 | Replace obsolete health-only status with the implemented identity producer and state live Auth, database and native boundaries; point the next developer to Plan 03 notes and dependent work. |
| `README.md`: lines 141–141 | Replace obsolete health-only status with the implemented identity producer and state live Auth, database and native boundaries; point the next developer to Plan 03 notes and dependent work. |
| `apps/mobile/src/infrastructure/api/decoders.ts`: lines 10–10 | Clarify that wire types now come from generated OpenAPI while existing runtime decoding still validates untrusted response JSON; no mobile session/root wiring changes. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7–7 | Refresh the checkout checkpoint, implemented producer count and Plan 03 handoff so another agent resumes with accurate ownership and outstanding integration dependencies. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130–130 | Refresh the checkout checkpoint, implemented producer count and Plan 03 handoff so another agent resumes with accurate ownership and outstanding integration dependencies. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 137–147 | Refresh the checkout checkpoint, implemented producer count and Plan 03 handoff so another agent resumes with accurate ownership and outstanding integration dependencies. |
| `docs/core_plan/03_backend_foundation.md`: lines 3–3 | Record API-01–05 producer completion, known commit hashes, validation and generator compatibility decision; leave API-06–10 and live milestones explicitly pending. |
| `docs/core_plan/03_backend_foundation.md`: lines 442–443 | Record API-01–05 producer completion, known commit hashes, validation and generator compatibility decision; leave API-06–10 and live milestones explicitly pending. |
| `docs/core_plan/03_backend_foundation.md`: lines 468–477 | Record API-01–05 producer completion, known commit hashes, validation and generator compatibility decision; leave API-06–10 and live milestones explicitly pending. |
| `docs/core_plan/04_react_native_integration.md`: lines 738–746 | Record backend identity/schema producer availability without claiming RN-05/06 Auth/root integration or RN-07 database acceptance. |
| `docs/core_plan/README.md`: lines 3–3 | Update the cross-plan index to 13 implemented producers and 31 awaiting acceptance; explain remaining live M1 and database dependencies. |
| `docs/core_plan/README.md`: lines 12–12 | Update the cross-plan index to 13 implemented producers and 31 awaiting acceptance; explain remaining live M1 and database dependencies. |
| `docs/core_plan/README.md`: lines 122–132 | Update the cross-plan index to 13 implemented producers and 31 awaiting acceptance; explain remaining live M1 and database dependencies. |
| `docs/core_plan_implementation_notes/artifacts/api-05/verification.json`: lines 1–39 | Record exact test counts, deterministic output hashes, fresh-install/drift/export checks and scoped build-tool audit; distinguish all local evidence from unverified cloud/mobile/database work. |
| `package-lock.json`: lines 1506–1509 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 5687–5762 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 7226–7235 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 8048–8054 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 8211–8217 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 11048–11060 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 15884–15893 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 17945–17954 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 18622–18631 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 20295–20301 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 20914–20920 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package-lock.json`: lines 20983–21069 | Lock the private generator workspace and its TypeScript 5 peer/dependency graph under the existing single npm lockfile while preserving app/contracts TypeScript 6. |
| `package.json`: lines 20–20 | Expose reproducible generation and immutable contract checks, include drift in the full check command and lint the environment-free exporter. |
| `package.json`: lines 24–24 | Expose reproducible generation and immutable contract checks, include drift in the full check command and lint the environment-free exporter. |
| `package.json`: lines 29–31 | Expose reproducible generation and immutable contract checks, include drift in the full check command and lint the environment-free exporter. |
| `packages/api-codegen/README.md`: lines 1–28 | Document local-only generation, peer isolation, fresh filtered install, schema/type review and the three observed moderate build-only audit findings with compatible-fix follow-up. |
| `packages/api-codegen/generate-http-types.mjs`: lines 1–33 | Generate deterministic AST-derived TypeScript from the committed local schema, reject external references and detect missing/stale output without rewriting it in check mode. |
| `packages/api-codegen/package.json`: lines 1–15 | Create a private build-only workspace with exact openapi-typescript 7.13.0/TypeScript 5.9.3 pins and generate/check scripts; no runtime client. |
| `packages/contracts/HTTP_API.md`: lines 169–177 | Declare implemented Pydantic/OpenAPI authority and generated HTTP types while retaining handwritten Auth/native domain ports and explicitly future M2 profile endpoints. |
| `packages/contracts/README.md`: lines 33–57 | Explain generated public aliases, exact regeneration/drift commands, compiler isolation and the continued need for runtime response/account checks. |
| `packages/contracts/fixtures/http-v1.json`: lines 4–4 | Correct fixture metadata to distinguish validated identity/error examples from planned profile success examples; synthetic payloads remain unchanged. |
| `packages/contracts/openapi/foundation.openapi.json`: lines 1–550 | Commit deterministic OpenAPI for only health and verified identity, with strict public models, code-discriminated errors, security and required middleware response headers. |
| `packages/contracts/src/http.generated.ts`: lines 1–301 | Commit generated paths/operations/components and wire responses from the exact pinned schema tool; expose no profile route or internal token/claim fields. |
| `packages/contracts/src/index.ts`: lines 28–34 | Replace the handwritten liveness interface with generated aliases and export generated identity/error/schema types; preserve existing Auth/native port exports. |
| `packages/contracts/type-tests/http.typecheck.ts`: lines 1–38 | Compile consumer compatibility and negative examples with the app compiler: required nullable email, no token/owner body/profile endpoint, and precise error detail/retry narrowing. |
| `scripts/export-openapi.py`: lines 1–44 | Export canonical sorted schema through pure application assembly; offer byte-check/stdout modes without importing runtime main, reading Settings, entering lifespan or constructing clients. |
| `services/api/README.md`: lines 14–14 | Document actual identity implementation, schema tooling and producer handoff; correct old no-verifier claims and keep cloud/mobile/database acceptance separate. |
| `services/api/README.md`: lines 16–16 | Document actual identity implementation, schema tooling and producer handoff; correct old no-verifier claims and keep cloud/mobile/database acceptance separate. |
| `services/api/README.md`: lines 18–18 | Document actual identity implementation, schema tooling and producer handoff; correct old no-verifier claims and keep cloud/mobile/database acceptance separate. |
| `services/api/README.md`: lines 103–129 | Document actual identity implementation, schema tooling and producer handoff; correct old no-verifier claims and keep cloud/mobile/database acceptance separate. |
| `services/api/app/api/health.py`: lines 4–5 | Make existing literal health fields required in Pydantic/OpenAPI and explicitly supply them without changing public JSON; give liveness a stable operation ID. |
| `services/api/app/api/health.py`: lines 10–12 | Make existing literal health fields required in Pydantic/OpenAPI and explicitly supply them without changing public JSON; give liveness a stable operation ID. |
| `services/api/app/api/health.py`: lines 15–15 | Make existing literal health fields required in Pydantic/OpenAPI and explicitly supply them without changing public JSON; give liveness a stable operation ID. |
| `services/api/app/api/health.py`: lines 18–18 | Make existing literal health fields required in Pydantic/OpenAPI and explicitly supply them without changing public JSON; give liveness a stable operation ID. |
| `services/api/app/application.py`: lines 13–13 | Declare the shared safe 500 response and install middleware-aware OpenAPI headers in pure assembly without runtime initialization. |
| `services/api/app/application.py`: lines 15–15 | Declare the shared safe 500 response and install middleware-aware OpenAPI headers in pure assembly without runtime initialization. |
| `services/api/app/application.py`: lines 23–23 | Declare the shared safe 500 response and install middleware-aware OpenAPI headers in pure assembly without runtime initialization. |
| `services/api/app/application.py`: lines 41–41 | Declare the shared safe 500 response and install middleware-aware OpenAPI headers in pure assembly without runtime initialization. |
| `services/api/app/core/errors.py`: old lines 12–12 at `06f5704` | Build safe error payloads through the discriminated schema validator and emit details only for validation/conflict variants, preserving existing HTTP behavior. |
| `services/api/app/core/errors.py`: lines 48–56 | Build safe error payloads through the discriminated schema validator and emit details only for validation/conflict variants, preserving existing HTTP behavior. |
| `services/api/app/core/openapi.py`: lines 1–39 | Describe server request correlation on each declared response, no-store on private/error responses and Bearer challenge on 401; cache the assembled schema. |
| `services/api/app/schemas/errors.py`: lines 4–4 | Expose strict code-discriminated general/unavailable/validation/conflict variants with literal retryability and required bounded details so wire types reflect runtime guarantees. |
| `services/api/app/schemas/errors.py`: lines 7–7 | Expose strict code-discriminated general/unavailable/validation/conflict variants with literal retryability and required bounded details so wire types reflect runtime guarantees. |
| `services/api/app/schemas/errors.py`: lines 52–52 | Expose strict code-discriminated general/unavailable/validation/conflict variants with literal retryability and required bounded details so wire types reflect runtime guarantees. |
| `services/api/app/schemas/errors.py`: old lines 55–55 at `06f5704` | Expose strict code-discriminated general/unavailable/validation/conflict variants with literal retryability and required bounded details so wire types reflect runtime guarantees. |
| `services/api/app/schemas/errors.py`: lines 55–100 | Expose strict code-discriminated general/unavailable/validation/conflict variants with literal retryability and required bounded details so wire types reflect runtime guarantees. |
| `services/api/pyproject.toml`: lines 16–16 | Add jsonschema as a test-only dependency for validating shared fixtures against executable exported JSON Schema. |
| `services/api/tests/api/test_schema.py`: lines 1–182 | Verify environment-free deterministic export, nonmutating drift checks, exact public routes/security/headers, shared fixtures and strict Pydantic/JSON-Schema agreement for valid and malformed responses. |
| `services/api/uv.lock`: lines 36–44 | Lock jsonschema and its test-only dependency graph reproducibly; retain existing runtime package versions. |
| `services/api/uv.lock`: lines 150–150 | Lock jsonschema and its test-only dependency graph reproducibly; retain existing runtime package versions. |
| `services/api/uv.lock`: lines 166–166 | Lock jsonschema and its test-only dependency graph reproducibly; retain existing runtime package versions. |
| `services/api/uv.lock`: lines 275–301 | Lock jsonschema and its test-only dependency graph reproducibly; retain existing runtime package versions. |
| `services/api/uv.lock`: lines 467–515 | Lock jsonschema and its test-only dependency graph reproducibly; retain existing runtime package versions. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–20 | Refresh current part, validation and the next handoff without overwriting historical entries. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 28–28 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 86–86 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 134–134 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 184–184 | Record the preceding committed part hash in this normal update. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 67–67 | Correct the original API-01 creation scaffold coverage to lines 1–25 at that commit. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 116–117 | Record the API-02 empty test-package marker omitted by line-only diff tooling; it has zero bytes and no invented source line. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 226–226 | Separate the final historical API-04 entry from the new API-05 record. |
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 227–334 | Record this entire per-commit change table, decisions, real validation and unverified live dependencies. |

#### Decisions and relations

- Generate only implemented health/identity routes from pure assembly. Invalid production environment variables, forbidden Settings/client constructors and main-import checks demonstrate that schema export does not run runtime startup or fabricate an identity. Runtime configuration validation remains strict. Generated output includes the declared safe 500 response plus middleware request-ID/no-store/Bearer headers.
- Refactor the existing error schema into a code-discriminated union. General and unavailable errors cannot acquire arbitrary details; validation/conflict variants require their reserved bounded shapes and canonical boolean retryability. Validate the same synthetic identity/error fixtures against Pydantic and Draft 2020-12 JSON Schema with format checks. Profile success examples remain planned M2 inputs; no profile endpoint/database is generated or implemented.
- Preserve existing health JSON while making its literals required in the executable schema. Expose generated public aliases and compile-only TypeScript consumer checks; retain handwritten Auth/native domain ports and the existing runtime client/decoders. Static generated types do not authenticate a session or validate arbitrary network JSON. No root guard/session composition is changed.
- Installing the generator alongside the app initially failed peer resolution: openapi-typescript 7.13.0 requires TypeScript 5 while the app/contracts use 6.0.3. Use one private build-only workspace pinned to 5.9.3 under the existing root lockfile. Actual dependency resolution and a fresh filtered install confirm isolation; no force/legacy-peer flags, app compiler downgrade or second lockfile. The API CI job installs only this tool workspace.
- The scoped build-tool audit reports three moderate findings (zero high/critical) in openapi-typescript / Redocly / minimatch. The offered major downgrade was not forced. Only trusted repository-local schema input is accepted and external references are rejected; the tool is not imported by application runtime. Track a compatible upstream fix. This is not an audit-clean claim for the full mobile tree.
- Check both generated files by exact bytes without rewriting them in check mode, and include the checks in root validation and API CI. Repeated generation is byte stable; a fresh isolated install reproduces output and detects deliberately stale types without repairing them silently. Ruff includes the exporter. Add jsonschema only to the Python development group.
- Update the backend/root/agent/plan/contract handoffs together so later agents see the identity producer is available while real Supabase metadata/tokens, mobile Auth/root integration and database work remain outstanding. Correct the API-01 notes scaffold coverage to its original lines 1–25 and explicitly record the empty API-02 tests package marker (no invented line range). Historical source ranges remain tied to their original commits.
- No cloud Auth configuration, provider/user/redirect, database migration, native restriction, PM answer or push/main merge was performed. Deterministic signed keys/transports prove producer behavior, not live M1 acceptance.

**Actual validation:** `npm run check`: passed (269 API, 250 portable mobile and 362 native component tests; TypeScript, ESLint, Ruff, assets and immutable contract checks). `npm run mobile:export`: passed (71 original assets, 38-file UI-fixture isolation). Frozen uv sync, fresh filtered npm ci in an isolated directory and generator check passed; deliberately stale generated output failed without mutation. Repeated full generation preserved both SHA-256 hashes. Evidence: `artifacts/api-05/verification.json`; no live provider calls.

**Remaining / next:** API-01–05 producer scope is complete. Ishmum next prepares SB-04/05 then API-06 database sessions/harness; API-06–10 remain pending. Anisha supplies exact SB-02 trust metadata/current tokens and the mobile Auth/session/root producer for joint RN-05/06 and M1 acceptance. Product profiles/M2 and native enforcement are not implemented. No push requested or performed.
