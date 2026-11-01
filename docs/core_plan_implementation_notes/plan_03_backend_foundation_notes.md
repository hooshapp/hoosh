# Plan 03 — Backend Foundation Implementation Notes

**Plan:** [03_backend_foundation.md](../core_plan/03_backend_foundation.md)
**Owner:** Ishmum. Anisha owns Supabase Auth setup and mobile sessions/onboarding.
**Branch:** `task/backend/api-01-05`. **Starting commit:** `2703a23`.
**Last updated:** 2026-11-01.
**Current part:** API-01 implemented/tested. Implement API-02 cryptographic verifier against local ephemeral keys; SB-02 actual trust metadata and real-user M1 remain pending. API-06–10 are out of the current authorized sequence.

## Resume here

- Latest: **API-01 — Validated Auth settings, safe errors and request correlation**, subject `feat(api): add identity configuration and structured errors`, parent `2703a23`.
- Validation: `uv run --project services/api pytest services/api/tests -q`: 58 passed; `ruff check services/api`: passed; Ruff format applied. Existing public liveness/CORS tests remain included. No cloud access or live Supabase token was used.
- Next / remaining: Implement API-02 cryptographic verifier against local ephemeral keys; SB-02 actual trust metadata and real-user M1 remain pending. API-06–10 are out of the current authorized sequence.
- Anisha owns Supabase Auth/session/onboarding; Ishmum backend verification and product DB. No provider, user, redirect, database or native policy was changed. No push/main merge.

## Recording rules

Each commit gets its own header, exact file/line ranges (parent ranges for deletions),
what/why, dependency decisions, actual validation and remaining handoff. Its own
hash stays Pending until a later normal update records the known hash; the unique
commit subject resolves it through Git. Keep historical ranges tied to their commit.
Do not store real tokens, passwords, private signing keys or personal user records.

## Commit entries

### API-01 — Validated Auth settings, safe errors and request correlation

**Hash:** Pending; resolve by `feat(api): add identity configuration and structured errors`.
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
| `docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md`: lines 1–20 | Refresh current part, validation and the next handoff without overwriting historical entries. |
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

