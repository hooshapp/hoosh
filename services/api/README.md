# Disconnect API

**Owner:** Ishmum (API verification and product database). Anisha owns Supabase Auth/project setup (SB-01–03), mobile Auth sessions, providers, redirects and test accounts. She supplies public trust metadata; Ishmum owns database bootstrap/testing (SB-04/05).

From the repository root:

```bash
uv sync --project services/api --frozen
npm run api:dev
npm run api:test
npm run api:lint
```

Only `GET /healthz` is implemented. FastAPI publishes its schema at `/openapi.json` and documentation at `/docs`.

The adopted [M1/M2 contract](../../packages/contracts/HTTP_API.md) specifies identity-only `GET /v1/me`, then `GET/PATCH /v1/profile`; none is implemented yet. Ishmum owns Pydantic/OpenAPI schemas and one Alembic history when those parts begin. Derive user IDs from verified Supabase access tokens; no client-provided identity or production auth bypass. Supabase Auth owns credentials and mobile session refresh. The API owns token verification and server-authoritative product mutations.

There is no database connection, JWT verifier, migration, cloud deployment, or Supabase project created by this scaffold. Configuration is read from `services/api/.env`, independently of the shell working directory. Copy `.env.example` when you need browser CORS or later integration settings.

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
