# Hoosh

Shared React Native app and FastAPI service for Disconnect. Product context starts in [docs/AGENT_START_HERE.md](docs/AGENT_START_HERE.md); pending product answers belong in [docs/PM_QUESTIONS.md](docs/PM_QUESTIONS.md). Detailed development plans and their execution order are in [docs/core_plan/README.md](docs/core_plan/README.md).

## What works now

- Expo / React Native / TypeScript workspace with Home, Quests, History, Settings, auth, and onboarding routes.
- Figma-derived colors and Space Grotesk 300/400/500/700. The three first-launch intro screens are implemented; signup/login include Supabase email/password, confirmation/recovery, guarded routing and session handling; main tabs remain explicit placeholders.
- Shared native-protection types and a tested API client with an injectable access-token provider.
- FastAPI process health endpoint, OpenAPI documentation, explicit browser CORS configuration, and tests.
- Reproducible npm and uv lockfiles, linting, type checking, and CI checks.

Supabase Auth is wired in the mobile app; live positive-flow and native acceptance remain pending. Profiles, product database tables, saved plans, native protection, rewards, usage measurements, and AI are not implemented in the new React Native/FastAPI application. Private tabs require an authenticated session; backend identity verification remains separate. Do not publish this preview as a working protection app.

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

The intro/forms and API health endpoint can render without Supabase configuration; real account actions require public client configuration and guarded tabs remain closed when it is missing. See [development Auth setup](docs/runbooks/supabase-development.md).

### Run the shared UI preview

```bash
npm run mobile:web
```

Expo prints the local URL, normally `http://localhost:8081`. Web is a convenient screen/navigation preview; it does not validate iOS/Android native behavior.

```bash
npm run mobile
```

This starts Metro for an Expo development client. An actual device requires a matching native development build. The provided Swift project is preserved separately in `apps/mobile/ios/`; see [its source audit](docs/architecture/existing-ios-audit.md). React Native native directories and signing remain unconfigured; qualify the original identifiers, extension targets and App Groups before integration. Do not run `expo prebuild --clean` over that working project.

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

Agree on shared interfaces before separate feature implementations. Anisha supplies `AuthSessionPort`/`AccessTokenProvider`; Ishmum verifies Supabase access tokens server-side when protected endpoints are added. The [accepted contracts](docs/architecture/identity-foundation.md) and [handoffs](docs/architecture/foundation-handoffs.md) are recorded; Plan 00 is implemented in foundation commit `0b50900`. Onboarding and Settings must use one approved plan contract. Both native adapters implement `ProtectionService` and report real capabilities/status. No native adapter is registered by the current scaffold.

Use the agreed area branches (`area/auth-onboarding`, `area/react-native`, `area/android`, `area/ios`, `area/backend`) with task branches such as `task/auth/login`. Create area branches from the shared foundation on `main`, merge working increments back frequently, and bring updated `main` into each active area.

Anisha owns Supabase Auth end to end: development project setup, providers, confirmation/email delivery, redirects, test accounts and mobile sessions (SB-01–03 and Plan 02). Ishmum owns Supabase product database roles/test infrastructure (SB-04/05), migrations and backend API verification. Both build against the contracts, then wire real outputs when ready; integration acceptance remains pending until tested.

Coordinate edits to the root navigation, `app.config.ts`, dependency lockfiles, and shared contracts. Ishmum authors backend/database migrations; Anisha controls Xcode targets and signing. All product rules in the PM log remain unresolved until explicitly answered.

## Next integration

1. Start from the committed Plan 00 contracts (`0b50900`). Ishmum starts shared RN primitives/tests (RN-01), API foundation (API-01), and Android investigation as separate parts.
2. Anisha owns Supabase Auth/project setup (SB-01–03) and builds the single Auth/session producer (AUTH-01/02); both sides use controlled tests before live integration. Use the imported Swift source audit to plan bridge/signing validation and investigate Android feasibility independently.
3. When the producer outputs are ready, connect real sign-in → identity-only `GET /v1/me` → matching account UI (M1), without requiring a product database.
4. Add isolated PostgreSQL persistence and `GET/PATCH /v1/profile` with revision/conflict handling (M2). Full onboarding/plans/native installation follow their approved contracts and evidence.

Native restrictions must remain independent of React Native timers, backend availability, and AI generation.

## Landing introduction increment

On `landing-page`, first launch shows the original three-screen scrolling introduction with a five-gesture fallback, Skip/reduced-motion paths and a local seen flag. Later launches open the signup form; no account/protection status is inferred. See [AUTH-10a scope and validation](docs/implementation/landing-intro.md). Authentication has a separate session/route guard; the remaining onboarding screens are separate work.

## Existing iOS reuse source

The owner-provided standalone Swift project is retained in [apps/mobile/ios](apps/mobile/ios/IMPORT.md). See [its source audit](docs/architecture/existing-ios-audit.md) for reuse boundaries. It is not yet wired to React Native; copying it does not establish a signed build, device behavior or live Firebase/AI health.

### Signup and login UI increment

The Figma forms now call Supabase for email/password login/signup and include confirmation, resend, recovery, secure native/tab-scoped web storage, session handling and guarded routing. Apple native and Apple/Google browser sign-in adapters are implemented. Google is enabled in local development, with live web sign-in/reload/signout verified; Apple remains disabled pending provider setup. See the [provider runbook](docs/runbooks/social-auth-development.md). See [scope](docs/implementation/auth-screens.md), [setup](docs/runbooks/supabase-development.md) and [validation boundaries](docs/qa/auth-foundation.md). Google development web acceptance passed; complete email confirmation/recovery flows, native acceptance and API identity integration remain pending.


### Product name

The current product name is **Hoosh**. App display configuration, shared signup/
login/Home/loading/error copy and browser title use Hoosh. Google consent branding
and the Supabase email sender display name are saved as Hoosh. The existing bundle
IDs, App Groups, URL scheme, session-storage keys and workspace package names retain
their legacy values for continuity. The preserved Swift import and live App Store
listing have not been renamed or released by this change. See
[branding scope](docs/implementation/hoosh-branding.md).
