# Integration release audit — November 25, 2026

Scope: current local checkout and installed iPhone build, checked against Ishmum's combined-app handoff. No hosted deployment, hosted migration, account deletion or data reset was performed. A separate personal note from Ishmum has been requested; this audit does not assume it contains the same checklist.

## Confirmed now

- Ishmum's FastAPI service exists. The normal runtime entry is `app.main:app`. His November 23 handoff explicitly requires a reachable HTTPS API and production provider/callback/signing configuration before field distribution.
- The mobile API client uses one explicitly configured origin. Missing configuration fails; it does not select another API or return synthetic authenticated account data. Current targeted client/transport checks: 71 passed.
- The installed iPhone bundle contains the configured temporary Cloudflare development origin. Live `/healthz` returned 200; `/v1/me` without credentials returned 401. Health is liveness only, not a complete authenticated journey.
- The running QA product database is loopback PostgreSQL, with the isolated-test marker and Alembic revision `20261124_0009` verified read-only. Supabase provides real Auth; product settings/quests/wallet data for this QA service are local.
- The running local-only bridge verifies Supabase identities before creating their UUID references in that isolated database. This helper is not a production entry point.

## Required before a public release

| Integration | Current result | Required result |
|---|---|---|
| Permanent API hosting | Not demonstrated; phone depends on this Mac and temporary tunnel | Managed HTTPS service running the normal API, stable URL, deployment configuration, monitoring and restart/recovery |
| Hosted product database | Current live QA is local; hosted current-head schema not verified | Read-only inspect intended target, review/apply required migrations through 0009, use restricted runtime role and verified TLS; deliberately choose treatment of QA data |
| Mobile environment | Current artifacts are internal QA | Build both platforms with the stable API and intended public Supabase configuration; verify embedded values without exposing credentials |
| Provider/release configuration | User already accepted development onboarding/auth; distribution-specific acceptance is separate | Correct release bundle/application IDs, provider callbacks and signing configuration; verify installed release on both devices |
| Native protection/rewards | Current candidate built and installed; new active-use/Accept behavior still awaits phone proof | Physical pause/resume, reminder, reblock, immediate +30 and replay checks; Android physical acceptance separately |
| iPhone measured History | `use-history.ts` still excludes iOS native history collection | Implement and verify supported actual report presentation within the existing designs; do not treat unavailable metrics as completed integration |
| Calendar / personalized AI | Handoff lists deferred product scope; not certified connected | Confirm intended launch scope and implement/verify promised integrations before representing them as available |

## Different meanings of fallback

There is no alternate-API fallback in the current mobile client. A temporary transport to the same API is a development-hosting dependency. The owner-approved starting/example onboarding suggestion, used when measured usage cannot supply a plan, is a separate product decision. It must remain labeled appropriately and must not become fabricated History or savings.

## Sources

- `docs/qa/integration-handoff.md`, particularly Reproduce and resume and V24.
- `services/api/README.md`, runtime ownership and pending cloud deployment.
- `docs/integration_plan/06_dashboard_user_experience.md`, local QA bridge, migration, reporting and no-API-fallback notes.
- `apps/mobile/src/infrastructure/api/config.ts` and `client.ts`.
- `apps/mobile/src/infrastructure/auth/runtime.ts`.
- `apps/mobile/src/features/history/use-history.ts`.

Prior handoff test counts are historical; the 71 API-client checks and read-only runtime observations above were performed for this audit. A release is not certified by this document.
