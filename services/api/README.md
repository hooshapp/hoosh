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
