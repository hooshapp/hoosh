# Identity foundation decisions

**Accepted:** 2026-10-28. Ishmum authorized these engineering choices and their
implementation in Plan 00. Anisha is the named Auth/iOS owner; this record does
not claim that she independently reviewed the patch. No PM product answer is implied.

## Scope and authority

M1 proves a real sign-in → verified API identity → matching account UI without a
product database. M2 adds a minimal, revisioned display-name profile with real
PostgreSQL isolation. M3 extends onboarding/main-app behavior only as its product
and native prerequisites become available. These foundations do not prove native
blocking, production Auth, full onboarding, quests, rewards, or release readiness.

| Interface | Adopted decision | Owner / consumer |
|---|---|---|
| Supabase Auth setup | Development project, Auth providers, signing configuration, confirmation/email delivery, redirect allowlists and test accounts (SB-01–03) | Anisha owns end to end; Ishmum consumes public trust metadata |
| Credential/session | Supabase Auth directly from mobile; one SDK/client, one refresh owner; no backend password/token exchange | Anisha produces; Ishmum consumes |
| Identity | Verified Supabase UUID, never email/name/client ID; `GET /v1/me` returns only UUID + nullable email, no database dependency | Ishmum implements; Anisha supplies access token |
| Profile | `GET/PATCH /v1/profile`; nonmutating absent read; explicit create; revision compare-and-swap; nullable display name only for M2 | Ishmum owns schema/API/UI; Anisha consumes for signup/onboarding |
| HTTP schema | Exact [wire contract](../../packages/contracts/HTTP_API.md) now; Pydantic/OpenAPI + generated TS types at API-05; one runtime client | Ishmum produces; Anisha reviews Auth impact |
| Auth lifecycle | Read-only `AuthSnapshot`, token provider, external-store subscription and single-flight revalidation; auth alone owns session generation | Anisha produces in AUTH-02; Ishmum coordinates cancellation/cache boundaries |
| Account action | Separate AUTH-07 sign-out port; current-session scope; immediate private-work invalidation, explicit local erasure/remote uncertainty | Anisha produces; Ishmum wires Settings/cache cleanup |
| Native boundary | Separate bridge availability, permission and installation; active requires authorized + installed revision; no JS/cloud enforcement | Anisha owns Swift; Ishmum owns Kotlin and shared status UI |
| Product database | One Alembic history; runtime nonowner `NOBYPASSRLS` role; repository owner predicates + transaction-local `app.user_id` RLS; no mobile table CRUD | Ishmum owns provisioning, migrations, transactions and actual DB tests |
| Environment | Public mobile config only; API secrets separate; explicitly identified development project, no production signing guesses | Anisha provisions project/Auth; Ishmum configures API and application DB; each owns their local values |
| Test infrastructure | Existing Vitest for portable TS; RN-01 adds shared Jest/RNTL with disjoint globs; pytest + real isolated PostgreSQL when DB work begins | Ishmum produces shared setup; Anisha reuses it |

The HTTP split intentionally supersedes the old TSD §8.3 profile-at-`/v1/me`
sketch. It keeps identity failures separate from database failures. The TSD is
updated with this decision; there is no `PATCH /v1/me` in the M1/M2 contract.

## Ownership of shared files

- **Ishmum:** backend, Supabase database/bootstrap, Alembic revisions, HTTP schema
  exports, API client/cache lifecycle, main RN tabs/Settings, shared UI/test harness,
  Android implementation. Root API/workspace scripts and shared-contract changes
  have one named author, coordinated with Anisha when they affect Auth.
- **Anisha:** Supabase Auth/project setup (SB-01–03), providers, confirmation/email
  delivery, redirect allowlists, test accounts, mobile Auth/storage/refresh, callback/recovery controller, onboarding,
  root Auth provider/route guards, existing Swift audit, Xcode targets/signing/App
  Groups, iOS adapter. Ishmum supplies cache teardown hooks rather than separately
  editing the root guard.
- **Shared configuration/lockfiles:** name the author before overlapping work.
  The developer adding a dependency updates the package manifest and existing
  lockfile together. Review consumer effects and integrate through `main` early.
  Do not create a second migration authority or credential manager.

Legacy iOS source/build configuration is now present under `apps/mobile/ios/` from
commit `fe8f262`. Its import does not complete the source/signing/signed-device audit
or RN bridge integration. Team reports remain context until that acceptance is
recorded. Android capabilities also require measured device evidence before parity claims.

## Independent work and later wiring

Ishmum builds shared RN/Android/backend producers; Anisha builds Supabase Auth,
mobile Auth/onboarding and iOS producers. Both use the accepted ports and controlled
test adapters before wiring the real outputs. Anisha supplies the public project
issuer/audience/algorithm/JWKS metadata; Ishmum supplies the API origin/schemas and
consumer cleanup hooks. Backend JWT verification remains Ishmum's responsibility
for protecting API requests; Supabase Auth administration remains Anisha's.

Live wiring can follow independent module work. Integration-dependent acceptance
parts stay pending until exercised together. An early thin Auth/API smoke check is
recommended when convenient, not a prerequisite that blocks either lane.

## Lifecycle and persistence choices

Auth snapshots contain no raw tokens. Routine refresh keeps the same generation;
account/session replacement and sign-out intent invalidate old work. RN checks
UUID/generation before and after token acquisition and response adoption, aborts
requests, and discards private memory/drafts at account transition. No persisted
API cache is added for M1/M2. A 401 gets one Auth revalidation and at most one
same-generation GET replay; persistent 401 pauses automatic work until explicit
recovery or actual session replacement. No automatic mutation replay.

AUTH-01 starts with serialized native SecureStore, no plaintext fallback or custom
encryption/chunking. Actual-device large-session, persistence and late-refresh
tests are required. Development web uses SSR-guarded, tab-scoped sessionStorage
for PKCE reload continuity. This is not a production web Auth commitment.

Use explicit local-scope SDK sign-out. A resolved action guarantees local erasure,
while reporting remote revocation uncertainty separately. A storage removal failure
locks private UI and offers recovery; it must not claim successful erasure. Validate
the pinned SDK's offline/late-write behavior instead of relying on FIFO alone.

## Product gates retained

- Q17/PD-09/10: production accounts/guest/providers and native ownership at sign-out
  or deletion. Development email/password is the first engineering path.
- Q19/PD-17: age/demographic collection and eligibility. Not in the M2 profile.
- Q02–Q08: actual session accounting, allowance/override and overlapping rules.
- Q09–Q16/Q21: quest/reward/Dino/measurement semantics and dependent product claims.
- Existing Swift access and Android evidence: actual native methods/build integration.

The draft `ProtectionService` supports future adapter discussion, not approved
policy. Auth sign-out does not invoke restriction clearing. The combined release
with installed rules waits for an explicit cleanup/agency/account-ownership protocol.

## Implementation and review

Plan 00 records contracts, types, synthetic fixtures and
[handoffs](foundation-handoffs.md). It installs no Auth SDK, verifier, database,
native adapter or live service. Plans 01–04 implement those producers and consumers.
Changed contract semantics require updating the authoritative types/wire contract,
fixtures and affected plans in the same change; generated schemas follow once present.
Anisha should review the consumed interfaces during her first integration change;
her separate approval is not represented as evidence already obtained.
