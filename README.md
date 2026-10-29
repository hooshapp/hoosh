# Disconnect

Shared React Native app and FastAPI service for Disconnect. Product context starts in [project context](<docs/Context (AGENT)/AGENT_START_HERE.md>); pending product answers belong in [PM questions](<docs/Context (AGENT)/PM_QUESTIONS.md>). Detailed development plans and their execution order are in [docs/core_plan/README.md](docs/core_plan/README.md). The [implementation knowledge base](docs/core_plan_implementation_notes/README.md) records the required per-plan, per-commit change notes and how to resume work across agents/chats.

## What works now

- Expo / React Native / TypeScript workspace with Home, Quests, History, Settings, auth, and onboarding routes.
- Figma-derived colors and Space Grotesk 300/400/500/700. Screens are explicit placeholders, not completed Figma implementations.
- Shared native-protection types and a tested API client with an injectable access-token provider.
- RN-01 shared screen/form/state primitives, iOS/Android component tests and an isolated developer UI specimen entry; see [component usage](apps/mobile/src/components/ui/README.md).
- RN-02 original local icon/Dino inventory and floating four-tab navigation with measured safe-area clearance; see [navigation](apps/mobile/src/components/navigation/README.md) and [asset provenance](apps/mobile/assets/README.md).
- FastAPI process health endpoint, OpenAPI documentation, explicit browser CORS configuration, and tests.
- Reproducible npm and uv lockfiles, linting, type checking, and CI checks.

The shared React Native/FastAPI foundation does not yet implement authentication, profiles, database tables, saved plans, native protection, rewards, usage measurements or AI. Imported legacy iOS behavior is separate and still requires audit/integration. The shell has no auth guard and exposes no private data. Do not publish this preview as a working protection app.

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

### Run the API

```bash
npm run api:dev
```

- Liveness: `http://127.0.0.1:8000/healthz`
- Interactive API docs: `http://127.0.0.1:8000/docs`
- Schema: `http://127.0.0.1:8000/openapi.json`

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

1. Start from the committed Plan 00 contracts (`0b50900`) and RN-01/02 shared UI/navigation foundation. Ishmum can continue RN-03 client hardening, API foundation (API-01), and Android investigation as separate parts; inspect the current plan notes/branch before starting.
2. Anisha owns Supabase Auth/project setup (SB-01–03) and builds the single Auth/session producer (AUTH-01/02); both sides use controlled tests before live integration. Audit the imported Swift source and investigate Android feasibility independently.
3. When the producer outputs are ready, connect real sign-in → identity-only `GET /v1/me` → matching account UI (M1), without requiring a product database.
4. Add isolated PostgreSQL persistence and `GET/PATCH /v1/profile` with revision/conflict handling (M2). Full onboarding/plans/native installation follow their approved contracts and evidence.

Native restrictions must remain independent of React Native timers, backend availability, and AI generation.
