# Development environment map

**Backend/DB author:** Ishmum, 2026-11-01. Anisha owns the future project/Auth
mapping and mobile values. This file records names/purposes, never credentials.

| Location / setting | Owner / purpose |
|---|---|
| `services/api/.env`: `APP_ENV` | Ishmum; development only on this machine |
| `SUPABASE_PROJECT_URL` | Public project origin; verified against MCP |
| `SUPABASE_JWT_ISSUER` | Exact project origin + `/auth/v1` |
| `SUPABASE_JWT_AUDIENCE` | Expected M1 audience `authenticated`; actual user issuance proof pending |
| `SUPABASE_JWT_ALGORITHMS` | Explicit JSON list `["ES256"]`, observed public JWKS; no auto-enabling keys |
| `CORS_ALLOWED_ORIGINS` | Explicit browser origins; not authentication |
| `DATABASE_URL` | Provisioned `disconnect_api` connection consumed by API-06; never an admin/service key |
| `MIGRATION_DATABASE_URL` | Explicit bootstrap/Alembic admin connection; never runtime fallback |
| `TEST_DATABASE_URL`, `TEST_MIGRATION_DATABASE_URL` | SB-05 disposable local database only; no fallback to managed URLs |
| `apps/mobile/.env` | Anisha supplies project URL/publishable key; Ishmum API origin, no DB/elevated key |

All actual `.env` files are Git-ignored; examples contain placeholders only. Local
credential-bearing files should be mode 0600. TLS root certificates use ignored
local paths; remote connections must verify host/trust. Copy the real connection
mode/host from Dashboard → Connect, not a regional guess. Personal MCP tokens and
user access/refresh tokens are not application database passwords or backend trust
configuration. Auth session storage/refresh belongs to Anisha's client producer.

Current target/ref and observed facts: [development runbook](../runbooks/supabase-development.md).
Before any future production environment, deliberately separate project, accounts,
URLs, credentials and callback allowlists; this development map is not production
configuration or a promise of zero cloud charges.

SB-05 implements the two TEST_* variables in a separate ignored
`services/api/tests/.env`, copied from its tracked example without overwriting
existing values. Explicit shell test values override that file and are validated.
It is loopback/55432/disconnect_test only; root APP_ENV=test and a fixture marker
are mandatory. Remote verify-full requirements do not permit cloud URLs in tests.

API-06 validates the runtime URL as SecretStr, with no migration-URL field/fallback.
DB_POOL_SIZE, DB_POOL_TIMEOUT_SECONDS, DB_CONNECT_TIMEOUT_SECONDS,
DB_STATEMENT_TIMEOUT_MS, DB_LOCK_TIMEOUT_MS and DB_IDLE_TRANSACTION_TIMEOUT_MS
are bounded backend settings (defaults in the API example). Remote trust remains
in URL sslmode=verify-full/sslrootcert; test plaintext is confined to the exact
disposable target. Deployment must give the application only its runtime secret;
local bootstrap tools sharing the ignored developer file do not define production
secret-access isolation.
