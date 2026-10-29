# Plan 00 — Shared Contracts and Integration Boundaries

**Status:** Complete locally: SC-01–04 implemented and validated at Ishmum's direction; commits pending. M1/M2 runtime work has not started.\
**Owner:** Ishmum owns this foundation implementation; Anisha owns its Auth/iOS producers in subsequent plans. One author per commit.\
**Area:** Shared changes enter `main` early and are merged into the active area branches.\
**Baseline inspected:** `c7a8f73` — `Set up mobile and API foundation`.\
**Last reviewed:** 2026-10-28.

## 1. Outcome and scope

Use the accepted small set of boundaries that lets the two developers work independently. Build on the installed workspace; do not repeat the React Native/FastAPI setup or redesign the product.

The initial delivery milestones are:

- **M1 — Authenticated identity:** mobile signs in directly with Supabase Auth, retrieves its current token, calls FastAPI `GET /v1/me`, and displays the same user identity that the API verified. A product database connection is not required for this milestone.
- **M2 — Persistent profile:** an authenticated user reads/edits their own minimal profile, with actual PostgreSQL isolation and revision checks. App restart/refetch retains the saved value; changing users cannot expose the previous user's data.
- **M3 — Bounded onboarding/main-app extension:** extend onboarding and Settings only after their shared data contract and relevant PM answers are available. Rendering a screen, saving preferences, installing native rules, and completing onboarding are distinct accomplishments.

M1/M2 do not claim a finished onboarding journey, app blocking, Android parity, quests, credits, Dino scoring, measured time saved, AI personalization, or production release readiness.

## 2. Evidence and authority

### Current code

- `apps/mobile/src/app/index.tsx` redirects into the tab preview without an auth guard.
- Auth/onboarding routes contain explicit placeholders; there is no Supabase SDK/session manager.
- `apps/mobile/src/infrastructure/api/client.ts` already accepts an `AccessTokenProvider`, rejects absent credentials for protected requests, and prevents cross-origin paths. It lacks the full error/cancellation/lifecycle handling planned in Plan 04.
- `packages/contracts/src/index.ts` exports accepted Auth lifecycle types from `auth.ts` and draft native policy/availability types from `protection.ts`. Consumer compile scenarios check the public port. Runtime Auth/native implementations are absent.
- `services/api/app/main.py` serves process health/OpenAPI only. JWT verification, database connections, migrations, and product endpoints are absent.
- `docs/OPEN_DECISIONS.yaml` and the PM answer log still contain unresolved product decisions.

### Figma recheck

The current file was re-read through Figma on 2026-10-28: screen inventory, auth/onboarding/Settings copy, annotations, and selected visual renders. It still has no prototype reactions. Navigation inferred from composition must therefore be documented, not described as a tested clickable prototype.

| Evidence | Frame / annotation | Planning implication |
|---|---|---|
| Signup: name, email, password, Google | `18:2` | Email/password is a reasonable development path; Google launch scope remains PD-10. Signup name does not grant any role and is not a canonical profile until persisted through the profile API. |
| Login placeholder says email/username | `27:59` | There is no approved username namespace or lookup flow. Proposed initial implementation uses email-only labeling and records this adaptation. |
| Gender and age are optional | `27:113`, `48:79` | Skipping is not a validation error. Collection/age eligibility remains Q19/PD-17. |
| App choices appear before Screen Time permission | `48:81`, `50:85` | Conceptual preferences do not prove native authorized selection. A later native picker must reconcile actual tokens. |
| Suggested plan uses 10-minute breaks; manual setup uses sessions | `50:87`, `10556:120` | Do not infer a common enforcement policy until Q02–Q08 are answered. |
| Celebration says setup is complete | `50:89` | Never infer active protection from reaching this route; permission/install state is independent. |
| Settings shows sample name/email | `27:157` | Replace with real identity/profile states, not Jordan's example data. Sign-out/recovery/account deletion need additional designed states. |
| Temporary Home recommendations | `10517:138` | Accepting a Home suggestion must not silently attach a recurring quest to the user. |
| +5 vs +20 intervention examples | `10517:234` | Visual examples do not settle credit policy. |
| Per-quest app selection requested | `10565:254` | App-group ownership must stay extensible; do not assume a global-only selection policy. |

Visual authority: [App-UI](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1), particularly [stylebook `10611:12784`](https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=10611-12784). Frames specify intended appearance, not shipped functionality or an automatically approved product policy.

### Relation to existing documents

The accepted [identity decision record](../architecture/identity-foundation.md) and TSD §8.3 now keep `GET /v1/me` identity-only and put app profile reads/edits at `/v1/profile`. This keeps M1 independent of database availability and gives identity and profile different failure semantics. The exact [HTTP contract](../../packages/contracts/HTTP_API.md) and synthetic fixtures are recorded; routes are not implemented yet.

Engineering choices below were adopted for the development foundation on 2026-10-28 at Ishmum's direction. Anisha's independent review is not claimed. They do not mark PM questions answered. A later PM decision can change product behavior; revise the affected contract and tests intentionally.

## 3. Responsibility and dependency map

| Boundary | Owner | Consumer / review |
|---|---|---|
| Supabase Auth project/provider/email/redirect/test-account configuration | Anisha owns SB-01–03 end to end, including development project setup | Ishmum consumes public issuer/audience/algorithm/JWKS metadata and verifies it in the API |
| Native mobile auth storage, refresh, auth events, deep links | Anisha | RN owner consumes a small auth surface |
| FastAPI token verification and HTTP response schemas | Ishmum | Auth/RN owner reviews wire contract |
| Database role/grant provisioning | Ishmum, Plan 01 | Plan 03 consumes the runtime/migration credentials |
| Product schema/migrations/repositories | Ishmum, Plan 03 | Anisha consumes API; no direct product-table writes |
| HTTP client, query lifecycle, user-scoped UI cache | Ishmum, Plan 04 | Anisha reviews auth/lifecycle integration |
| Root auth guards/navigation transitions | Anisha | Ishmum coordinates tab registration and account screen handoff |
| Shared UI/assets/tokens | Ishmum | Anisha reuses them in auth/onboarding |
| Swift/Xcode/signing/App Groups | Anisha | Ishmum and Anisha review bridge port changes |
| Kotlin/Android capability evidence | Ishmum | Ishmum and Anisha review bridge port changes |

Do not assign the same file concurrently merely because the features belong to different area branches. Coordinate root layouts, `app.config.ts`, `package.json`, lockfiles, shared schemas, and migration numbers. Area branches are ownership/integration points, not independent products.

Dependency order:

```text
SC-01..SC-04: boundary decisions, contracts, ownership
        |
        +--> Plan 01: development Supabase configuration
        |          +--> Plan 02: live mobile auth
        |          +--> Plan 03: live JWT / later database integration
        |
        +--> Plan 02: auth state/storage/UI tests using controlled adapters
        +--> Plan 03: verifier/routes/schema generation using test keys
        +--> Plan 04: UI/client/cache tests using explicit fixtures

Plan 02 session + Plan 03 identity endpoint + Plan 04 wiring --> M1
Plan 01 DB roles + Plan 03 profile persistence + Plan 04 editor --> M2
Approved onboarding contract + native evidence + PM decisions --> M3
```

The native audit and Android feasibility investigation can begin immediately; neither depends on M1/M2. They are prerequisites for later native integration, not prerequisites for drawing a login form or testing a JWT verifier.

## 4. Canonical identity and HTTP contract

### 4.1 Ownership of identity

- Supabase Auth owns credentials, verification, sessions, refresh tokens, and the authenticated user UUID.
- Mobile calls Supabase Auth directly. FastAPI never receives a password or refresh token in the planned API.
- FastAPI verifies an access token against the configured project's issuer, audience, algorithms, and trusted key source. SDK state in mobile is sufficient for local routing, not proof to the server.
- UUID is the stable account key. Email and display name can change and are not authorization identifiers.
- Never derive ownership or privileges from unverified JWT claims, email matching, signup metadata, client-supplied `user_id`, or a publishable key.
- New development-project configuration should use asymmetric signing with the exact chosen algorithm recorded. Legacy symmetric projects require a separately reviewed verifier adaptation; never silently fall back to HS256 or use an API key as a JWT secret.

### 4.2 M1: `GET /v1/me`

Requires a valid non-anonymous user access token under the initial development scope. Production guest support remains Q17/PD-09.

```json
{
  "user_id": "a46e48ad-c742-4e18-b57d-2c9a56544944",
  "email": "student@example.com"
}
```

- `user_id`: UUID string from verified `sub`.
- `email`: string or `null`, from verified identity claims. Never assume it is present or sufficient to authorize a user.
- No database read/write; no profile row is created; no raw JWT is returned.
- Personal identity responses use `Cache-Control: no-store`. This does not prohibit a user-scoped in-memory UI cache.
- The RN integration compares the verified `user_id` with its current SDK identity before adopting the result. A mismatch is an integration/trust error: reject it, isolate the cache, and surface recovery; do not silently switch accounts.

### 4.3 M2: `GET /v1/profile` and `PATCH /v1/profile`

GET is nonmutating. No existing row is a normal state:

```json
{ "profile": null }
```

An existing row:

```json
{
  "profile": {
    "user_id": "a46e48ad-c742-4e18-b57d-2c9a56544944",
    "display_name": "Jordan",
    "revision": 1,
    "created_at": "2026-10-28T18:00:00Z",
    "updated_at": "2026-10-28T18:00:00Z"
  }
}
```

PATCH accepts only:

```json
{ "expected_revision": 1, "display_name": "Jordan Rivera" }
```

- `expected_revision`: required integer >=0; reject booleans/coercion that defeats strict validation.
- `display_name`: optional in the schema, but at least one mutable field must be supplied; currently it is the only mutable field.
- `null` explicitly clears the name; omission does not clear it.
- Reject U+0000 and unpaired surrogate code points as invalid text before database access; PostgreSQL text cannot store them safely. Do not silently delete characters or turn invalid input into a clear operation.
- The server is the canonical normalizer: apply Python 3.12 `str.strip()` to surrounding whitespace, reject an empty result, then accept at most 80 Unicode code points. This is an adopted engineering bound, not a PM decision. Do not apply Unicode normalization, case conversion, or an independent frontend trimming rule. The client submits its raw draft (or explicit `null` to clear); advisory validation must not reject input that the server would accept. Use server-owned fixtures covering ordinary spaces, nonbreaking spaces, U+0085, U+001C–U+001F, U+FEFF, combining marks, and astral characters. Python `strip()` and JavaScript `trim()` do not recognize exactly the same characters, and JS `.length` counts UTF-16 units rather than code points. Render the accepted normalized response as canonical. Describe the after-normalization limit in the request schema rather than incorrectly claiming a raw-input `maxLength: 80`; bound the raw PATCH body separately to 16 KiB, including streamed input (413 `REQUEST_TOO_LARGE`).
- `expected_revision=0` means create only if absent; insertion returns revision 1. For an existing row, update atomically only when its revision matches, then increment the revision.
- Do not accept an owner UUID, email, role, timestamps, revision assignment, native tokens, or arbitrary onboarding JSON from the client.
- The mutation returns the same `{profile: ...}` envelope. GET/PATCH do not imply onboarding completion.
- Concurrent initial writes, duplicate submissions, retries after a lost response, and two-device updates must not overwrite an unseen newer revision. A retry may conflict; refetch and reconcile rather than blindly replaying a mutation.
- Display name is app-owned profile data. Do not maintain a second authoritative copy in mutable Auth metadata. A pending signup name can be user-scoped draft input and submitted once via this API after authentication/M2 availability.

Future demographic, activity, onboarding-draft, plan, and native-installation data require separate reviewed extensions. Do not attach a free-form JSON blob to this profile as a shortcut.

### 4.4 Error envelope and status semantics

```json
{
  "error": {
    "code": "PROFILE_CONFLICT",
    "message": "Your profile changed. Review the latest version before saving.",
    "retryable": false,
    "request_id": "a46e48ad-c742-4e18-b57d-2c9a56544945",
    "details": { "current_revision": 2 }
  }
}
```

| Status | Code | Expected client behavior |
|---|---|---|
| 401 | `AUTH_REQUIRED` | A protected request has no acceptable bearer credentials. Ask auth for the current state. |
| 401 | `INVALID_TOKEN` | Token is invalid under available trusted keys/claims. Do not retry unchanged credentials indefinitely. |
| 401 | `TOKEN_EXPIRED` | Auth may revalidate once; Plan 04 permits one replay of an idempotent GET for the same session generation. |
| 403 | `FORBIDDEN` | Identity is known but operation is forbidden; token refresh is not a generic remedy. |
| 409 | `PROFILE_CONFLICT` | Preserve unsaved input, refetch current profile, require deliberate reconciliation. |
| 413 | `REQUEST_TOO_LARGE` | Reject a PATCH body exceeding 16 KiB; reduce input, no retry unchanged. |
| 422 | `VALIDATION_ERROR` | Present safe field errors; do not log/display the raw submitted body. |
| 503 | `AUTH_UNAVAILABLE` | Required trust material cannot currently be obtained. Show retry state; do not treat an outage as a signed-out user. |
| 503 | `DEPENDENCY_UNAVAILABLE` | Required database/service is unavailable. Identity/session may still be valid. |
| 500 | `INTERNAL_ERROR` | Safe generic failure and request ID; no SQL, token, or stack trace in the response. |

The server generates a request UUID, returns it in `X-Request-ID`, and uses the same ID in errors/logs. An inbound correlation header is untrusted; do not echo arbitrary text into logs. `details` is optional for general errors and limited to a defined safe structure, not a raw exception payload. For `PROFILE_CONFLICT`, include `details.current_revision` as an integer >=0: 0 means absent at the conflict read; positive values describe the observed stored revision. This is an advisory snapshot, not a revision the client should automatically retry against; always refetch/reconcile. Validation details contain safe field/code pairs only, with the exact allowed fields/codes and ten-entry bound in the [HTTP contract](../../packages/contracts/HTTP_API.md). Success bodies do not need an extra request-ID field.

Malformed/missing bearer syntax maps to `AUTH_REQUIRED`; a bearer value that fails token validation maps to `INVALID_TOKEN` or verified `TOKEN_EXPIRED` as appropriate. A valid Supabase anonymous-sign-in identity is excluded from this initial endpoint scope with `403 FORBIDDEN`. If a profile insert discovers its verified account was deleted after token issuance, that specific missing-owner FK case also maps to safe `403 FORBIDDEN`, not a fabricated invalid signature or a recreation of the Auth user.

`retryable` describes whether a transient condition can justify a bounded retry. A 401 recovery that obtains a different token is not permission to replay every request automatically. No automatic mutation replay is introduced in M1/M2.

Normalize FastAPI validation errors and API-generated failures to the envelope. Network cancellation, offline transport, invalid JSON, and contract-shape mismatch are typed client failures, not fabricated server responses. CORS remains an origin control for browsers, not authentication.

### 4.5 Schema generation

The design contract in this document is the initial agreement. Once routes exist, backend Pydantic models plus exported FastAPI OpenAPI are the canonical executable HTTP schema; Plan 03 owns generation of committed TypeScript HTTP types and drift checks. Do not maintain separate handwritten Python and TypeScript HTTP validators indefinitely.

API-05 owns the output: `packages/contracts/openapi/foundation.openapi.json` and `packages/contracts/src/http.generated.ts`, exported as types. Use a pinned `openapi-typescript` development dependency after verifying compatibility; generate types, not a second competing runtime API client. The export must not require live cloud credentials, DB connectivity, or a real auth bypass. Separate side-effect-free application/route assembly from the normal server entry point: the exporter imports that assembly with explicit unavailable dependencies, calls OpenAPI generation, and never serves requests or imports a globally configured `main.app`. Unavailable dependencies raise the normal unavailable error if invoked; they do not fabricate identities. Normal configured/deployed startup validates required settings, while the existing local shell may run only liveness and honest unavailable protected routes. Partial configuration fails clearly; no environment flag may turn off signature checks and return a user.

Domain ports such as `AuthSnapshot` and `ProtectionService` remain handwritten TypeScript because they are not HTTP schemas. Early UI work can use controlled fixtures described by this contract while schema generation is being implemented. Real API integration waits for the generated shape and schema tests.

## 5. Mobile auth/lifecycle contract

Retain `AccessTokenProvider = () => Promise<string | null>`. The auth owner supplies it; the HTTP client does not store passwords, refresh tokens, or a second copy of the session.

The canonical read-only [auth types](../../packages/contracts/src/auth.ts) now export:

- `AuthIdentity` (UUID and nullable email) and `AuthSnapshot`: `bootstrapping`,
  `signed_out`, `signed_in`, `signing_out`, or `unavailable`. Every state carries
  `sessionGeneration`; signed-in additionally has identity and credential availability.
- `AuthSessionPort`: stable `getSnapshot`, `subscribe`, `getAccessToken`, and
  single-flight `revalidateSession`. Snapshot references remain stable until change;
  subscribe returns an idempotent unsubscribe. The React provider stays inside Auth.
- `AuthUnavailableError`: structural error name/reason/retryability; Auth supplies
  the runtime class, keeping the shared package type-only.
- Separate `AuthAccountActions` for AUTH-07: resolved `signOut()` guarantees local
  credential removal and reports remote revocation as confirmed/unconfirmed/not-needed.
  A local-storage error rejects and locks private UI. AUTH-02 need not stub this later
  action just to provide the session port.

RN re-reads the snapshot after revalidation. No raw access/refresh token belongs in
snapshots, React query keys, URLs, diagnostics, analytics, or saved drafts.

Rules:

1. `null` from the token provider means a known absence of a session. Configuration/storage/bootstrap/network failure is a typed unavailable error, not a fake signed-out result.
2. Auth increments `sessionGeneration` when the effective account/auth session changes, or as soon as sign-out/account-switch invalidation begins. Normal token refresh and duplicate SDK `SIGNED_IN` notifications do not reset the generation.
3. Auth can internally use SDK session identifiers to deduplicate events. Decoding JWT metadata locally for lifecycle correlation is not server verification or an authorization decision.
4. RN reads the current generation before starting user work, checks again after token acquisition, consumes cancellation signals, and checks the generation again before adopting responses. Cancellation alone is insufficient because a response can finish before abort takes effect.
5. Query keys and all user drafts are scoped to account and relevant environment/schema version. A new account cannot inherit the old account's query client or private form state. M1/M2 do not add persisted API caches.
6. One lifecycle transition coordinator composes auth credential teardown and RN cache/request teardown. Keep callback ownership explicit; do not register competing auth listeners in root layout, screens, and API utilities.
7. Auth bootstrap has a visible pending state; no initial flash of private Home or a false completed onboarding state.
8. Temporary refresh/network failure can preserve known identity with degraded credential availability. It does not prove that credentials are usable, and it must not clear native protection.
9. API 401 recovery is owned by auth, single-flight, and bounded. Only an idempotent GET may be replayed once after successful revalidation for the same user/generation; no mutation is silently resubmitted.
10. API 403/409/422/503 does not automatically trigger sign-out. Repeated invalid credentials after revalidation must stop requests and enter the auth owner's recovery path.

After that one recovery attempt still receives 401, pause protected automatic requests for the current account/session generation. Focus/reconnect and ordinary token-refresh notifications must not restart the loop. For this foundation, resume through an explicit user recovery action with one bounded verification attempt, or an actual auth-session replacement; routine token rotation does not clear the pause by itself. Keep the known SDK identity where appropriate rather than falsely signing out because the API's environment is wrong. This small client-side pause requires no extra public credential counter and no raw token in a snapshot/query key.

Use the single public callback path `/auth/callback` for confirmation, recovery, and selected OAuth flows. Adopted development targets are `http://localhost:8081/auth/callback` and the provisional `disconnect-dev://auth/callback`; verify the latter's actual Expo Router/Linking mapping in the audited development build. Starting on `127.0.0.1` requires its own explicitly registered same-origin target and session storage; do not silently cross origins. A verified recovery operation may then navigate internally to `/reset-password`. The reset form itself is not the provider callback/exchange endpoint. SB-03 configures these agreed URLs without waiting for callback implementation; AUTH-04 implements their controller, and joint runtime evidence comes afterwards.

Native session storage begins with a serialized SecureStore adapter, with explicit failure handling and actual-device tests of realistic and enlarged sessions. No plaintext native fallback. If large sessions fail native storage, plan a separate reviewed storage change before claiming persistence is complete; do not build an untested custom chunk/crypto system by default. For development web callbacks, use SSR-guarded tab-scoped `sessionStorage` so the PKCE verifier survives navigation. Closing the tab can end the preview session; production web authentication is outside this release scope. These are adopted engineering starting choices that Plan 02 must validate, not facts about already implemented storage.

Auth sign-out clears application credentials/data and stops account-scoped work. It does not call a global native restriction-clearing function. Q17 must settle what existing restrictions, queued native events, and account ownership do across sign-out/deletion before those features ship together. Do not trap users behind an invented policy; gate that combined release until cleanup/agency behavior is agreed.

Use explicit current-session sign-out (`scope: 'local'`) for the adopted development flow. Verify the selected released SDK clears local credentials even when the remote revocation request fails; current source and older releases can differ. A storage removal failure is not successful local sign-out: keep private UI inaccessible, stop refresh/work, and offer retry/recovery without claiming credentials were erased. Do not call private SDK methods or invent a success event to hide the failure. SDK-supported refresh coordination plus adapter serialization and lifecycle guards must jointly pass the late-write test; FIFO storage writes alone do not prove that a stale refresh cannot resurrect a session.

## 6. Native and environment boundaries

Keep the draft `ProtectionService` port, but annotate what is unverified. Selecting apps, installing a plan, registering a schedule, and reporting capability/status are native adapter operations. A server profile, auth session, or onboarding flag never proves that apps are restricted.

The implemented `ProtectionIntegration` type separates availability (`not_connected`, `connected`, `unsupported`) from permission/install status. Only `connected` exposes the service, and only iOS/Android can be connected. The draft native status union requires `authorized` and a numeric installed revision for an `active` claim; runtime adapter validation is still required. An absent bridge must render a truthful unavailable/preview state, not synthesize `active`. No production success mock or JS timer substitute is permitted. The current interface will need explicit review of signed-out event ownership, selected-app group scope, plan revision, and platform scheduling constraints before implementation.

Configuration contract:

| Mobile public values | API-only values | Never committed |
|---|---|---|
| API base URL, Supabase project URL, publishable key, non-secret build flags | Issuer, audience, fixed JWKS location, configured algorithm set, DB URL/role, bounded cache/timeout settings | Refresh/access tokens, DB passwords, secret/service-role keys, signing keys/certificates, provider secrets |

Use project-specific development configuration. Publishable keys identify the project, not a user or a database authorization bypass. Never create a production signing identity while guessing the existing app's identifiers.

Offline-installed native restrictions remain local. Backend/Supabase outages must not stop the native engine. Cloud auth outages may prevent new login/API use without implying that device restrictions vanished.

## 7. Product decision gates

| Work | Can proceed | Must wait for |
|---|---|---|
| M1 identity and M2 display-name profile | Interfaces, test accounts, adopted development email flow, verified identity, isolated profile persistence | Production login/provider requirements before publishing (Q17/PD-09/10) |
| Auth forms/recovery | Development flow and missing-state design proposals | Approved launch providers, minimum age/distribution policy before release |
| Demographic onboarding | UI recipe/skip handling in isolated development | Q19/PD-17 and actual reason for collection before storing/launching |
| App picker/permission integration | Port, state presentation, native audit | Existing iOS source/signing; Android capability evidence |
| Suggested/manual plans | Non-enforcing draft UI and contract exploration | Q02–Q08 and native-compatible session/override semantics |
| Quest/reward/Dino/History behavior | Original asset export, presentational recipes, honest empty/unavailable states | Q09–Q16, actual measurements and evidence definitions |
| Sign-out/deletion with installed rules | Credential/cache teardown in M1/M2 without native rules | Q17 and an explicit native cleanup/account-ownership protocol |

No hard-coded demo values enter real user caches, ledger rows, profiles, protection status, or analytics. Fixtures are for tests/story/development entry points and must be impossible to select accidentally in a release build.

## 8. Commit-sized implementation parts

SC-01–04 are implemented locally in this increment. Messages below remain suggested commit boundaries until committed; actual hashes must not be invented. One part is a coherent review unit, not a prohibition on a corrective follow-up or one reviewed foundation-contract commit for the local increment.

### SC-01 — Record the initial architecture contract and scope

**Owner:** Ishmum authors; Anisha reviews.\
**Depends on:** Existing scaffold and Ishmum's authorization to select the engineering defaults. Anisha consumes/reviews their impact during integration. No PM policy needs to be silently resolved.\
**Proposed commit:** `docs(architecture): define identity milestones and integration ownership`

**Files:** `docs/architecture/identity-foundation.md` (or a single ADR), relevant TSD route/ownership sections, `docs/core_plan/README.md` tracker.

**Work:**

- Record M1/M2 scope, the `/v1/me` versus `/v1/profile` route adaptation, the single Supabase identity, and Alembic ownership for public product tables.
- Record exact authors/reviewers for shared layout/config/contracts and native project changes.
- Identify native source/build access as an external input; do not check off a native audit from team reports alone.
- Record each unresolved PM dependency and label development-only assumptions.

**Acceptance:** Ishmum and Anisha can name what they own, which APIs are next, and what is deliberately out of scope. PRD/TSD and the ADR no longer describe conflicting meanings for `/v1/me`.

**Validation:** Review links and route/identity definitions across docs; no tests that merely assert prose text. Contract completion is separate from runtime M1/M2 completion.

**Recovery:** Edit/revise the ADR and its consumers before feature work; do not preserve abandoned contradictory contracts as current guidance.

### SC-02 — Write exact HTTP examples and error semantics

**Owner:** Ishmum authors; Anisha reviews.\
**Depends on:** SC-01.\
**Proposed commit:** `docs(api): specify identity profile and error contracts`

**Files:** Contract document/examples under `packages/contracts/` or `docs/architecture/`; this plan remains the high-level reference.

**Work:**

- Specify successful identity, absent/existing profile, initial profile creation, profile CAS conflict, field validation, 401/403/503, and malformed-response behavior.
- Use synthetic IDs/addresses; no copied real tokens, passwords, JWT payload dumps, or actual user records.
- Record the strict profile rules, UTC timestamps, null versus omitted fields, and validation length semantics.
- Record Pydantic/OpenAPI as executable schema authority once Plan 03 implements routes. Do not add placeholder public success endpoints merely to generate types.

**Acceptance:** Anisha can build auth consumers and Ishmum can build verifier/repositories without guessing wire shapes. Error recovery distinguishes bad credentials, service outage, and conflicts.

**Validation:** Cross-read concrete examples against this plan, Plan 03, and RN consumer expectations. Later executable schemas must validate these examples; they are not substitute proof of an implemented API.

**Recovery:** Change the documented contract in one reviewed patch; keep fixture additions and consumer updates in the same integration increment when semantics change.

### SC-03 — Add the auth lifecycle port and review native availability

**Owner:** Ishmum implemented the shared types at his direction; Anisha owns AUTH-02/07 runtime producers and reviews integration effects.\
**Depends on:** SC-01/SC-02 for identity shape.\
**Proposed commit:** `feat(contracts): define auth lifecycle and native availability ports`

**Files:** `packages/contracts/src/auth.ts`, `packages/contracts/src/index.ts`; a small availability type next to existing protection contracts; contract README.

**Work:**

- Introduce the discriminated `AuthSnapshot` and `AuthIdentity` types, typed unavailable errors/result categories, `AccessTokenProvider`, and `revalidateSession` ownership.
- Preserve type-only package exports unless a reviewed runtime helper is actually needed.
- Define `sessionGeneration` behavior and what events invalidate private work.
- Clarify native bridge availability independently from permission/install status. Keep the current native policy port draft; do not pretend the audit is complete.
- Give auth and RN developers explicit test-adapter interfaces without wiring them into production routes.

**Acceptance:** Both workspaces type-check against one lifecycle contract; a token refresh is distinct from account switching, and missing native code cannot be represented as installed protection.

**Validation:** `npm run typecheck`; consumer-oriented compile fixtures for exhaustive state handling. Runtime lifecycle/race tests belong to AUTH and RN parts, not tests that simply mirror a type declaration.

**Recovery:** For a contract change, update both consumers or retain a clearly bounded compatibility adapter in the same reviewed increment. Never suppress type errors with broad casts to unblock unrelated branches.

### SC-04 — Establish fixtures, ownership checks, and integration handoffs

**Owner:** Ishmum authors; Anisha reviews.\
**Depends on:** SC-01..SC-03.\
**Proposed commit:** `docs(development): define fixture isolation and milestone handoffs`

**Files:** Development/testing notes, feature/contract READMEs, plan trackers; minimal existing CI/script adjustments only if needed for the agreed checks.

**Work:**

- Define where controlled auth/HTTP/native fixtures live and how release bundles exclude their entry points.
- Assign RN-01 the shared Jest/React Native Testing Library setup; pure TypeScript tests keep Vitest. Auth form/guard tests consume that setup rather than independently adding another harness. Keep native/component and pure-TS test globs disjoint, and preserve the existing API-client tests.
- Record the exact output each developer provides: auth provider, API routes/schema, DB role/connection, profile repository, native capability evidence, and UI integration acceptance.
- Define the M1/M2 evidence record: commands, synthetic test cases, local/live environment, device/build versions, commit hashes, and unverified items. Do not capture secrets in screenshots/logs.
- Document area/task branch merge flow, one migration author per revision, and contract-change review by Ishmum and Anisha.
- Ensure docs point to actual scaffold scripts. Do not install another package manager, test runner, auth service, database, or state library just for planning symmetry.

**Acceptance:** Each developer can begin independent work with explicit prerequisites and know when a live service/device is required. No cyclic dependency requires the whole other plan to finish first.

**Validation:** Dependency and link audit; compare prerequisites to the runnable scaffold. Existing software checks need not be rerun merely because documentation was added.

**Recovery:** Change the handoff contract/fixture strategy openly and update dependents; do not merge a development bypass into production as a temporary fix.

## 9. Cross-plan edge-case ledger

| Scenario | Required outcome | Primary plan |
|---|---|---|
| Signup succeeds but confirmation produces no session | Remain outside authenticated routes; show confirmation/retry path, not success as a logged-in user | 02 |
| Duplicate signup or email delivery failure | Provider-safe UX without leaking account existence or creating duplicate app profiles | 02 / 01 |
| OAuth/reset callback after restart, twice, or in another browser | Explicit PKCE/verifier/recovery handling; no arbitrary redirect or token logging | 02 |
| SDK emits token refresh while identity request is in flight | Same account generation remains valid; refresh is single-owner | 02 / 04 |
| A request finishes after A signs out and B signs in | No A data enters B's cache, screen, draft, or error state | 04 |
| Token valid but Supabase JWKS/DB temporarily unreachable | Correct 503/retry behavior when needed; valid cached trust may be used only within its policy; no forged success | 03 |
| Logout revokes refresh token but access JWT has not expired | Do not claim immediate cryptographic revocation; document bounded access-token behavior and sensitive-operation exceptions | 03 / 01 |
| Profile absent | GET remains nonmutating; UI handles missing state; explicit first PATCH creates revision 1 | 03 / 04 |
| Two first saves race or response is lost | At most one owner row, no silent overwrite; conflict/refetch handles ambiguity | 03 / 04 |
| Connection pool reuses a request's session | User context is transaction-local and cannot carry across requests; actual two-user DB test proves this | 03 |
| Refresh token cannot be securely persisted | Explicit error/recovery, no plaintext fallback or invented restart persistence | 02 |
| Permission denied, revoked, or native bridge missing | Honest status; onboarding/account state does not claim restriction installation | 02 / 04 / native follow-on |
| App offline with installed native rules | Rules keep operating; new cloud operations show offline/pending state | Native follow-on / 04 |
| PM changes session scope or provider requirements | Revise affected future contract/part; M1 identity schema does not encode guessed session rules | 00 / affected plan |

## 10. Completion and tracking

Plan 00's local implementation is complete when the authorized engineering decisions, stable types, fixtures/ownership and dependent references agree and the checks pass. Ishmum explicitly authorized choosing the defaults; Anisha's separate review has not occurred and is not claimed. This does not complete M1/M2, commit the patch, or implement Anisha's Auth/iOS producers.

| Part | Status | Actual commit | Validation / remaining evidence |
|---|---|---|---|
| SC-01 | Complete locally | Pending | See implementation evidence below |
| SC-02 | Complete locally | Pending | See implementation evidence below |
| SC-03 | Complete locally | Pending | See implementation evidence below |
| SC-04 | Complete locally | Pending | See implementation evidence below |

### Local implementation evidence (2026-10-28)

- Ownership clarification (2026-10-28, Ishmum): Anisha owns Supabase Auth/project
  setup SB-01–03; Ishmum owns application database roles/test infrastructure SB-04/05.
  Anisha leads joint SB-06 with Ishmum's backend evidence. Build producers separately
  against these contracts and record integration acceptance when real wiring occurs.
- SC-01: [accepted decisions](../architecture/identity-foundation.md); named ownership;
  TSD identity/profile/database boundaries reconciled.
- SC-02: [wire contract](../../packages/contracts/HTTP_API.md), 22 synthetic HTTP cases
  and 28 Unicode/type/name cases. No success endpoint was added.
- SC-03: [Auth ports](../../packages/contracts/src/auth.ts),
  [native availability/status](../../packages/contracts/src/protection.ts), type-only
  public exports and [consumer compile scenarios](../../packages/contracts/type-tests/interfaces.typecheck.ts).
- SC-04: [handoffs, fixture isolation and shared-test ownership](../architecture/foundation-handoffs.md),
  feature/native/API READMEs, updated execution tracker and actual command references.
- Validation passed: `npm run check` (workspace TypeScript + consumer compile cases,
  ESLint, 5 Vitest API-client tests, Ruff and 3 pytest API tests); focused contracts
  typecheck after the final compile-fixture refinement. Fixture audit passed for
  22 HTTP examples and 28 name cases using Python 3.12; 67 local Markdown links and
  all 44 stable part IDs resolve. `git diff --check` is clean. Mobile source imports
  no fixture/type-test modules. No live Auth, database or signed-device evidence is
  claimed; source/fixture contracts are this part's scope.

If an implementation part is waiting on PM input or a device/source, mark the specific part blocked with the exact missing input; continue independent parts. Do not mark an entire area finished because its screens compile.

## 11. Official technical references

These references support technical constraints; architecture/ordering choices in this plan are engineering recommendations, not claims that documentation prescribes this exact app design.

- [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native) — SDK session and foreground refresh integration.
- [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts) and [signing keys](https://supabase.com/docs/guides/auth/signing-keys) — issuer/key discovery, asymmetric keys, and cache/rotation considerations.
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions) — access/refresh lifetime and sign-out revocation limits.
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — native storage, possible payload rejection, and platform persistence caveats.
- [FastAPI OpenAPI features](https://fastapi.tiangolo.com/features/) — schema-based API documentation and client generation.

Recheck SDK/provider behavior when implementing; record the installed versions and live project settings instead of copying example code blindly.
