# Disconnect

Shared React Native app and FastAPI service for Disconnect. Product context starts in [project context](<docs/Context (AGENT)/AGENT_START_HERE.md>); pending product answers belong in [PM questions](<docs/Context (AGENT)/PM_QUESTIONS.md>). Detailed development plans and their execution order are in [docs/core_plan/README.md](docs/core_plan/README.md). The [implementation knowledge base](docs/core_plan_implementation_notes/README.md) records the required per-plan, per-commit change notes and how to resume work across agents/chats.

## What works now

- Expo / React Native / TypeScript workspace with Home, Quests, History, Settings, auth, and onboarding routes.
- Figma-derived colors and Space Grotesk 300/400/500/700. Home, Quests, History and Settings have Figma-derived presentation with explicit unavailable data.
- Shared native-protection types and a tested API client with an injectable access-token provider.
- RN-01 shared screen/form/state primitives, iOS/Android component tests and an isolated developer UI specimen entry; see [component usage](apps/mobile/src/components/ui/README.md).
- RN-02 original local icon/Dino inventory and floating four-tab navigation with measured safe-area clearance; see [navigation](apps/mobile/src/components/navigation/README.md) and [asset provenance](apps/mobile/assets/README.md).
- RN-03 account-scoped HTTP producer with safe typed errors, whole-operation deadlines and bounded Auth-owned GET recovery; see [client contract](apps/mobile/src/infrastructure/api/README.md).
- RN-04 memory-only account query scopes, guarded mutations and native/web lifecycle adapters; see [integration contract](apps/mobile/src/infrastructure/query/README.md). Real Auth/root wiring remains coordinated work.
- RN-05 account identity/header consumer is prepared and tested independently; [handoff and missing live prerequisites](apps/mobile/src/features/account/README.md). Settings/root wiring and real identity acceptance remain pending.
- RN-07 display-name editor UI is prepared with a developer-only Figma example; [implemented presentation and deferred data work](apps/mobile/src/features/account/PROFILE_UI.md). No profile persistence or live integration is claimed.
- RN-08 protection status mapper/UI and read-only native-port consumer are prepared; [native evidence rules and deferred integration](apps/mobile/src/features/protection/README.md). No native adapter is registered or active protection claimed for this checkout.
- RN-09a [Home presentation](apps/mobile/src/features/home/README.md) is routed with honest unavailable states; its interactive Figma sample stays in `mobile:ui`. Quests/History/Settings presentation is implemented; live data/actions across all four tabs remain pending.
- RN-10 shared accessibility/layout/lifecycle hardening with [QA evidence and RN-11 prerequisites](docs/qa/mobile-accessibility.md); signed-device/live acceptance remains pending.
- FastAPI liveness plus verified `GET /v1/me` and isolated revisioned profile GET/PATCH, bounded JWT/JWKS verification, safe errors and generated OpenAPI/HTTP types; see [backend status](services/api/README.md). Real user-token/mobile integration remains pending.
- API-10 privacy-safe diagnostics and explicit [operational/acceptance tools](services/api/OPERATIONS.md); real managed-user/mobile acceptance remains pending.
- Reproducible npm and uv lockfiles, linting, type checking, and CI checks.

Mobile authentication is not yet connected. The backend identity producer is implemented; mobile profile integration, saved plans, native protection, rewards, usage measurements and AI remain pending. API-07 supplies the minimal profile table/RLS. Imported legacy iOS behavior is separate and still requires audit/integration. The shell has no auth guard and exposes no private data. Do not publish this preview as a working protection app.

## Structure

```text
apps/mobile/
  src/app/                  Expo Router routes; route groups separate ownership
    (auth)/                 Anisha: sign-in / account flows
    (onboarding)/           Anisha: onboarding and plan setup
    (tabs)/                 Ishmum: Home, Quests, History, Settings
  src/components/ui/        Shared UI primitives
  src/design/               Figma-derived tokens
  src/features/             Feature integration notes and future domain modules
  src/infrastructure/api/   API client; auth supplies current tokens
  src/infrastructure/native/ Native adapter boundary
packages/contracts/         Shared type-only integration contracts
services/api/
  app/api/                  HTTP routes
  app/core/                 Configuration; future JWT verification
  app/db/                   Database ownership and migration boundary
  tests/                    API integration checks
docs/                       Product requirements, technical baseline, PM answers
```

The API uses the same Supabase PostgreSQL database intended for Auth. No second database or custom authentication service has been introduced.

## Local setup

Use Node 24 (`.nvmrc` pins the tested version), npm 11, and [uv](https://docs.astral.sh/uv/getting-started/installation/). Python 3.12 is managed by uv; the system Python is unchanged.

From the repository root:

```bash
nvm use
npm ci
uv sync --project services/api --frozen
```

The UI shell and API health endpoint work without Supabase credentials or a database.

### Run the shared UI preview

```bash
npm run mobile:web
```

Expo prints the local URL, normally `http://localhost:8081`. Web is a convenient screen/navigation preview; it does not validate iOS/Android native behavior.

```bash
npm run mobile
```

This starts Metro for an Expo development client. An actual device requires a matching native development build. The legacy iOS source is now present under `apps/mobile/ios/` from commit `fe8f262`; its identifiers, extension targets, App Groups and signing still need auditing before RN integration. A matching Expo native build has not been established by importing that source. Do not run `expo prebuild --clean` over that working project.

### Interact with populated UI on an Android phone

```bash
npm run mobile:qa:android
```

Scan the terminal QR in compatible Expo Go on the same Wi-Fi. This separate
**Disconnect UI QA** project has 19 component pages, local drafts and state
controls; no account, saved data or protection is connected. See the
[native QA runbook](apps/mobile/dev/native/README.md) for phone setup and the
separate actual-app navigation run. [The QA record](docs/qa/mobile-accessibility.md)
tracks actual Android observations and remaining device/integration acceptance.

### Run the API

```bash
npm run api:dev
```

- Liveness: `http://127.0.0.1:8000/healthz`
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Schema: `http://127.0.0.1:8000/openapi.json`
- Identity: `GET /v1/me` requires a verified access token; no profile/database dependency.

`/healthz` reports only that the API process is responding; it does not claim database readiness or device protection.

Optional local configuration:

```bash
cp services/api/.env.example services/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Environment files are ignored by Git. The mobile shell does not yet make API calls; its API client is ready for feature integrations. Browser CORS origins must be explicitly listed in the API environment file. A physical phone needs a reachable development host, not `127.0.0.1` on your computer; configure the address and bind the development API appropriately when testing on a trusted local network. Use HTTPS for deployed APIs.

Never put database passwords, service-role keys, signing credentials, or AI provider keys in `EXPO_PUBLIC_*` variables.

## Checks

```bash
npm run check
npm run mobile:export
npm run mobile:ui:build
npm run mobile:ui
npm run mobile:check-assets
```

`check` runs TypeScript, ESLint, portable API-client tests, iOS/Android component tests, original asset integrity, Ruff, and API tests. `mobile:export` verifies the web bundle/routes and rejects leaked developer specimen markers and missing original navigation assets. `mobile:ui` serves the separate developer preview on port 8091; it is not an app route. Generated output and local environments are ignored by Git. Signed native builds and physical-device tests remain separate release requirements.

### Dependency notes

The SDK 58 + RN-01 test-tooling tree reports 16 npm audit findings on 2026-10-29 (3 high, 13 low). The high findings remain in the existing Expo CLI/Zod chain; low findings include `deepmerge` and added Jest/testing-tool ancestors. The reported automatic fixes downgrade Expo, Jest or compatible testing packages. Do not apply `npm audit fix --force`; recheck compatible upstream fixes before release. React Native is aligned to the SDK-recommended 0.88.1 patch. ESLint 9 is retained because the Expo React plugin's current peer range excludes ESLint 10.

## Working independently

Agree on shared interfaces before separate feature implementations. Anisha supplies `AuthSessionPort`/`AccessTokenProvider`; Ishmum verifies Supabase access tokens server-side when protected endpoints are added. The [accepted contracts](docs/architecture/identity-foundation.md) and [handoffs](docs/architecture/foundation-handoffs.md) are recorded; Plan 00 is implemented in foundation commit `0b50900`. Onboarding and Settings must use one approved plan contract. Both native adapters implement `ProtectionService` and report real capabilities/status. No native adapter is registered by the current scaffold.

Use the agreed area branches (`area/auth-onboarding`, `area/react-native`, `area/android`, `area/ios`, `area/backend`) with task branches such as `task/auth/login`. Create area branches from the shared foundation on `main`, merge working increments back frequently, and bring updated `main` into each active area.

Anisha owns Supabase Auth end to end: development project setup, providers, confirmation/email delivery, redirects, test accounts and mobile sessions (SB-01–03 and Plan 02). Ishmum owns Supabase product database roles/test infrastructure (SB-04/05), migrations and backend API verification. Both build against the contracts, then wire real outputs when ready; integration acceptance remains pending until tested.

Coordinate edits to the root navigation, `app.config.ts`, dependency lockfiles, and shared contracts. Ishmum authors backend/database migrations; Anisha controls Xcode targets and signing. All product rules in the PM log remain unresolved until explicitly answered.

## Next integration

1. API-01–09 backend identity/schema/database/profile producers are implemented; read [Plan 03 notes](docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md). RN-05/06 still need real Supabase/Auth/session and coordinated root wiring. SB-05 is verified locally; SB-04 hosted runtime login/TLS is accepted. GET/PATCH M2 backend behavior and API-10 operational tools are accepted locally; joint managed-user/mobile evidence remains pending.
2. Anisha owns Supabase Auth/project setup (SB-01–03) and builds the single Auth/session producer (AUTH-01/02); both sides use controlled tests before live integration. Audit the imported Swift source and investigate Android feasibility independently.
3. When the producer outputs are ready, connect real sign-in → identity-only `GET /v1/me` → matching account UI (M1), without requiring a product database.
4. Add isolated PostgreSQL persistence and `GET/PATCH /v1/profile` with revision/conflict handling (M2). Full onboarding/plans/native installation follow their approved contracts and evidence.

Native restrictions must remain independent of React Native timers, backend availability, and AI generation.

RN-09b/c/d add [Quests](apps/mobile/src/features/quests/README.md), [History](apps/mobile/src/features/history/README.md) and [Settings](apps/mobile/src/features/settings/README.md) presentation. Real routes remain honest about unavailable services; Figma sample identity/outcomes stay in the isolated developer gallery. Live Auth/API/native integration and signed-device acceptance remain pending.

RN-09a–h independent main-screen and detail/editor UI is implemented. See [UI coverage](docs/qa/rn09-ui-coverage.md) and Plan 04 notes for exact scope, commits, source adaptations and remaining live/device acceptance. Actual saves, account data, native selection/protection and measured outcomes remain unavailable until their producers are integrated.

## Supabase product database infrastructure

Ishmum's [Plan 01 notes](docs/core_plan_implementation_notes/plan_01_supabase_foundation_notes.md)
record the live public-key checks and dedicated hosted runtime role. Hosted
runtime login, verified TLS and denied privilege checks pass; the new runtime
credential is saved privately and no shared password was reset. The [isolated PostgreSQL guide](services/api/tests/support/README.md)
provides `npm run api:db:up`, `api:db:test`, `api:db:down` and guarded `api:db:reset`.
A separate required CI job runs real DB checks without managed-project secrets.
Default `api:test` stays deterministic; API-10 profile integration evidence and
Anisha's Auth/mobile integration remain separate unfinished work.

API-06 now supplies the lazy bounded SQLAlchemy/psycopg engine, guarded verified-user
transactions and synchronous function-scoped dependency. See [the DB contract](services/api/app/db/README.md)
and [Plan 03 notes](docs/core_plan_implementation_notes/plan_03_backend_foundation_notes.md).
337 deterministic backend tests plus 24 real PostgreSQL checks passed; hosted
runtime/TLS connectivity was checked read-only. The minimal table/RLS/migration are supplied by API-07;
profile GET is now API-08; PATCH is now implemented by API-09. No mobile/Auth/native feature was added.

API-07 now provides the minimal profile model, server-clock invariants and single
Alembic history with explicit runtime grants/RLS. See [migration guide](services/api/alembic/README.md)
and Plan 03 notes for the reviewed SQL and applied empty-development upgrade.
344 deterministic / 66 real PostgreSQL tests pass. No Auth user/configuration was
changed; real managed A-B/cascade and app wiring remain joint work. API-08 GET and API-09 PATCH are implemented below; API-10 is next.

API-08 now exposes authenticated `GET /v1/profile`: exact own profile or explicit
`{profile:null}`, without insertion or Auth metadata import. UTC timestamps,
no-store headers and generated HTTP types are verified. Current checks: 374
deterministic backend / 75 real PostgreSQL tests. API-09 now adds PATCH; actual
managed-user/mobile M1/M2 acceptance remains joint work. No cloud change was
required for this read endpoint.

API-09 now adds authenticated revision-safe `PATCH /v1/profile`: strict 16 KiB
JSON input, canonical Unicode name validation, atomic initial create and matching
revision edits/clear, and own safe conflicts. Concurrent/lost-response writes
cannot overwrite unseen revisions. Current checks: 453 deterministic backend /
96 real PostgreSQL tests; full workspace checks also pass. No new migration or
hosted Auth change was needed. API-10 and actual managed-user/mobile M1/M2 remain
joint acceptance; the app profile UI is not connected by this backend change.

API-10 now provides correlated request/JWKS/database diagnostics and private
operator login/HTTP checks. Read the [operator guide](services/api/OPERATIONS.md)
for reproducible commands and the exact remaining acceptance matrix. Current
checks: 469 deterministic backend / 102 PostgreSQL tests plus full workspace;
actual configured-process/CORS/no-Origin HTTP and hosted dependency checks pass.
Approved user tokens, actual browser execution and real Auth/profile/native
integration remain pending; Plan 03 is not fully accepted. No hosted schema or
Auth administration changes were needed.
