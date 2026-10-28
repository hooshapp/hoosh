# Disconnect

Shared React Native app and FastAPI service for Disconnect. Product context starts in [docs/AGENT_START_HERE.md](docs/AGENT_START_HERE.md); pending product answers belong in [docs/PM_QUESTIONS.md](docs/PM_QUESTIONS.md).

## What works now

- Expo / React Native / TypeScript workspace with Home, Quests, History, Settings, auth, and onboarding routes.
- Figma-derived colors and Space Grotesk 300/400/500/700. Screens are explicit placeholders, not completed Figma implementations.
- Shared native-protection types and a tested API client with an injectable access-token provider.
- FastAPI process health endpoint, OpenAPI documentation, explicit browser CORS configuration, and tests.
- Reproducible npm and uv lockfiles, linting, type checking, and CI checks.

Authentication, profiles, database tables, saved plans, native protection, rewards, usage measurements, and AI are not implemented. The shell has no auth guard and exposes no private data. Do not publish this preview as a working protection app.

## Structure

```text
apps/mobile/
  src/app/                  Expo Router routes; route groups separate ownership
    (auth)/                 Teammate: sign-in / account flows
    (onboarding)/           Teammate: onboarding and plan setup
    (tabs)/                 You: Home, Quests, History, Settings
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

This starts Metro for an Expo development client. An actual device requires a matching native development build. Native directories and signing are intentionally not generated yet: first obtain and audit the released Swift source, production identifiers, extension targets, and App Groups. Do not run `expo prebuild --clean` over that working project.

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
```

`check` runs TypeScript, ESLint, API-client tests, Ruff, and API tests. `mobile:export` verifies the web bundle and routes. Generated output and local environments are ignored by Git. Signed native builds and physical-device tests remain separate release requirements.

### Dependency notes

The initial SDK 58 dependency tree reports 8 npm audit findings (3 high, 5 low), inherited from Expo tooling: Zod 3 in `@expo/cli` and `deepmerge` in `@expo/config`, plus their parent packages. The installed stable Expo CLI still requires Zod 3, and `deepmerge` has no newer published version at setup time. Do not apply `npm audit fix --force`: the suggested change downgrades the Expo SDK. Recheck upstream compatible fixes before release. ESLint 9 is retained because the Expo React plugin's current peer range excludes ESLint 10.

## Working independently

Agree on shared interfaces before separate feature implementations. The auth owner supplies `AccessTokenProvider`; the API owner verifies Supabase tokens server-side when protected endpoints are added. Onboarding and Settings must use one approved plan contract. Both native adapters implement `ProtectionService` and report real capabilities/status. No native adapter is registered by the current scaffold.

Use the agreed area branches (`area/auth-onboarding`, `area/react-native`, `area/android`, `area/ios`, `area/backend`) with task branches such as `task/auth/login`. Merge working increments into `main` frequently, then bring `main` back into each active area. This repository currently has no commits; create the shared foundation commit before branching from it.

Coordinate edits to the root navigation, `app.config.ts`, dependency lockfiles, and shared contracts. The backend/database owner authors migrations; the iOS owner retains control of Xcode targets and signing. All product rules in the PM log remain unresolved until explicitly answered.

## Next integration

1. Obtain and audit the existing iOS source; separately investigate Android feasibility.
2. Configure a development Supabase project and implement mobile auth with session persistence.
3. Agree on the onboarding/plan contract and add authenticated profile/plan APIs and migrations.
4. Connect onboarding → saved plan → Home → confirmed native installation status.

Native restrictions must remain independent of React Native timers, backend availability, and AI generation.
