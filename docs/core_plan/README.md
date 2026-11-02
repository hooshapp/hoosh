# Disconnect — Core Development Plans

**Status:** Plan 00 is complete and validated (foundation commit `0b50900`, recorded in its ledger); Plan 04 RN-01–04 producers now supply shared UI/testing, authentic-asset navigation and bounded HTTP and account query/lifecycle producers with recorded evidence; real RN-04 Auth/root wiring, Anisha-owned Plan 01/Auth acceptance, Plan 02, full API-10 and RN-06/11 remain pending; API-10 operational diagnostics/tools and independent checks are implemented; RN-10 shared UI/lifecycle hardening exists with device/live acceptance pending; RN-09a–h main/detail/editor UI exists with live integration pending; RN-05 consumer, RN-07 UI-only and RN-08 presentation/read-consumer preparation exist, with their real integration/acceptance pending. API-01–09 backend identity, contracts, scoped database units, profile migrations/RLS and isolated revisioned profile GET/PATCH are implemented; mobile Auth, database and native adapter integration remain pending.\
**Baseline inspected:** `c7a8f73` — `Set up mobile and API foundation`.\
**Reviewed:** 2026-10-28.\
**Product answers:** [PM_QUESTIONS.md](<../Context (AGENT)/PM_QUESTIONS.md>); no PM question is answered by an engineering default in these plans.

## 1. Start here

Read [Plan 00](00_shared_contracts.md) first, then your area plan and the specific part you are about to implement. Before coding, read the [implementation knowledge-base workflow](../core_plan_implementation_notes/README.md), create that plan's notes file if absent, and read any existing entries. Build on the scaffold; do not reinstall it, rewrite the tested Swift core, create every future table, or complete an entire area before integrating.

There are **44 parts**: 19 implemented parts/producers (SC-01–04, RN-01–04, API-01–09 and SB-04–05) and 25 parts awaiting acceptance (including API-10 with its operational slice implemented, RN-05 consumer, RN-07 UI, RN-08 presentation preparation, RN-09 main-screen presentation with live acceptance pending and RN-10 shared hardening); real RN-04 root integration remains pending. See each ledger/Git reference for commit and validation details. They are reviewable work boundaries, not 44 completed commits or immediately unblocked tasks. Some onboarding/provider/native presentation parts are conditional. Split a concrete part further if its diff is too large, preserving stable IDs and dependencies.

| Plan | Parts | Main owner | Initial result |
|---|---:|---|---|
| [00 — Shared contracts](00_shared_contracts.md) | SC-01–04 (4) | Ishmum implemented at his direction; Anisha owns downstream Auth/iOS | Identity/API/auth lifecycle contracts, ownership, fixture and handoff rules |
| [01 — Supabase Auth/database](01_supabase_foundation.md) | SB-01–06 (6) | Anisha: SB-01–03; Ishmum: SB-04/05; Anisha leads joint SB-06 | Development identity provider; later database roles/test environment |
| [02 — Auth and onboarding](02_auth_onboarding.md) | AUTH-01–13 (13) | Anisha | Session/sign-in and guards; signup/recovery; gated onboarding |
| [03 — Backend foundation](03_backend_foundation.md) | API-01–10 (10) | Ishmum | Verified identity, generated types, isolated/revisioned profiles |
| [04 — React Native integration](04_react_native_integration.md) | RN-01–11 (11) | Ishmum; Anisha owns auth/root guard wiring | Shared UI/tests, account lifecycle, identity/profile screens, truthful feature states |

Plan numbers group ownership; **part dependencies determine execution order**. AUTH-07's basic guards/sign-out can precede callback/signup/recovery completion AUTH-04–06, allowing the first controlled existing-user round trip sooner.

## 2. Milestones

### M1 — Real authenticated identity

Sign in through Supabase Auth → obtain the current access token → call FastAPI `GET /v1/me` → display the matching verified user.

- `/v1/me` returns only `{user_id, email}`; no product database dependency.
- Use two disposable development accounts to prove isolation.
- Include guards, no private-content bootstrap flash, bounded recovery, sign-out, and late-response rejection.
- Signup/email recovery have separate acceptance parts. An early controlled sign-in demonstration is not a production Auth release.
- Record web and each native platform separately. Browser success does not qualify native storage, deep links, or a signed build.

### M2 — Real persistent profile

Load/edit the current user's minimal display-name profile → persist in PostgreSQL → retain the accepted value on refetch/restart → reject stale revisions and cross-user access.

- `GET /v1/profile` is nonmutating and returns `{profile:null}` when absent.
- `PATCH /v1/profile` creates with expected revision 0 or performs a revision-checked update; reconcile conflicts and ambiguous saves.
- Backend owns normalization, transactions, runtime RLS context, migrations, and executable HTTP schemas. Mobile does not write product tables through Supabase.
- A profile is not onboarding completion, app selection, or proof of active protection.

### M3 — Bounded onboarding/main-app extension

Expand local resumable onboarding and shared screen presentation within agreed contracts. Full plan save/install, sessions, quests, rewards, metrics, and server-side onboarding completion need subsequent plans and PM/native evidence. M1/M2 foundations do not imply release readiness.

## 3. Dependency-safe execution order

These are dependency waves, not fixed dates or equal-workload requirements. Ishmum and Anisha build their own producers against Plan 00, then wire the real implementations when the required outputs are ready. Integration-dependent parts remain pending until that wiring is tested. A short early M1 smoke check is useful but is not a prerequisite for independent module development. Consume specific producer outputs rather than waiting for whole plans.

| Wave | Ishmum | Anisha | Handoff / gate |
|---|---|---|---|
| 0 — complete | SC-01–04 decisions, fixtures, ports and handoffs implemented, validated and committed as `0b50900`; sync the shared foundation | Consume accepted port; review Auth/iOS impact during integration | Integrate shared contracts through `main`; no guessed product policy or independent review claim |
| 1 | RN-01 shared UI/testing; API-01–05 with local test keys; Android investigation | SB-01–03 Supabase Auth/project setup; AUTH-01/02 with controlled adapters; AUTH-03 consumes RN-01 and her SB-03 for live tests; audit the imported Swift source | Callback configuration follows the contract, not completed callback code. API producers do not wait for mobile acceptance. |
| 2 | RN-03 client, RN-04 lifecycle; RN-02 assets/navigation independently | Supply AUTH-02 real provider; integrate AUTH-07 guards/sign-out with RN-04 cleanup hooks | Producer ports first; AUTH-08/RN-06 are downstream evidence, not inputs. |
| 3 — when producers are ready to wire | RN-05 identity surface → RN-06 joint M1 | Exercise sign-in/sign-out/recovery handshake; AUTH-04–06 can progress alongside this proof | Needs AUTH-01/02/03/07, SB-03, API-04/05; not all future Auth work |
| 4 | SB-04/05 → API-06–09 → RN-07 profile | Finish AUTH-04–06, then AUTH-08; AUTH-09 consumes the profile/draft contract when agreed | SB-06 records M1/Auth evidence without blocking earlier producers. M2 uses real PostgreSQL and separate runtime/migration identities. |
| 5 | RN-08/09 presentation, RN-10 accessibility, RN-11 profile/platform handoff; API-10 evidence | Native Auth acceptance with audited signed builds; conditional AUTH-10–13 only with prerequisites | Record missing device/source/product evidence. Never promote a web result to native release readiness. |

Database preparation and other independent RN/Android parts may proceed before the M1 join when their own prerequisites are met; this table does not require Ishmum to wait for completed Auth screens. Investigate Android feasibility early alongside these foundations as Ishmum's schedule allows. Native investigations do not depend on Supabase, and shared UI/backend work does not depend on finished native enforcement. Revise shared native assumptions before large implementation if the investigations reveal a gap.

## 4. Single ownership at integration boundaries

| Boundary | Producer | Consumer |
|---|---|---|
| Supabase Auth/project/provider/email setup | SB-01–03, Anisha | Ishmum consumes trust metadata for API verification; he owns SB-04/05 product database setup |
| Session/refresh/storage | AUTH-01/02, Anisha | RN/API client consumes snapshot/token provider; no second session manager |
| Callback URLs | Plan 00 contract + SB-03 config, Anisha | AUTH-04 controller; later joint delivery/exchange checks |
| HTTP schemas | API Pydantic/OpenAPI, exported by API-05 | `packages/contracts/src/http.generated.ts`; RN imports types |
| Component/native test harness | RN-01 | Auth tests reuse it; Jest/Vitest globs do not overlap |
| Account generation | Auth coordinator | RN observes it, cancels/clears local scope, rejects late results; never writes Auth's counter |
| Product schema | API-07 and subsequent Alembic revisions | SB supplies roles/test infrastructure; no competing dashboard/Supabase table history |
| Protection state | Audited Swift/measured Kotlin adapters | UI consumes actual capability/install evidence |
| Root layout/config/lockfiles | One named author per PR | Ishmum and Anisha review and sync `main` before overlapping edits |

The identity-only `/v1/me` plus separate `/v1/profile` is adopted in [SC-01's decision record](../architecture/identity-foundation.md), [the HTTP contract](../../packages/contracts/HTTP_API.md), and TSD §8.3. No product decision or runtime endpoint was changed by adopting the contract. [Handoffs and fixture rules](../architecture/foundation-handoffs.md) identify the exact producer outputs.

## 5. Working through a part

1. Read prerequisites and current PM answers. Separate code dependencies from live-test/device dependencies.
2. Mark the selected part **In progress**; create its task branch from the updated area branch. Do not create every task branch in advance.
3. Implement one coherent change with relevant tests. Keep unavailable integrations honest and fixtures outside release entry/import paths.
4. Run focused and applicable shared checks. Record mock, actual database, live provider, browser, emulator, and signed-device evidence separately.
5. Review shared contracts/files with Anisha and integrate working increments into `main` frequently.
6. Update that part's existing ledger with actual commit hash, evidence, limitations, and next unlocked part. Maintain the plan's implementation-notes file with a separate section per commit covering every changed file/line range, what/why, actual validation and remaining work. The ledger summarizes status; notes preserve implementation detail and handoff context. Do not claim completion in either until supported by code/evidence.

When blocked, name the exact missing input for that part and continue independent work. Corrective commits are allowed; record them rather than pretending checks passed first time. Production publishing is a separate action/gate, not an automatic consequence of merging a foundation part.

## 6. Product and external gates

| Missing input | Must wait | Can continue |
|---|---|---|
| Launch account/provider/age choices | Final login policy, demographics, provider/store promises | Controlled development email flow and minimal profile |
| Session/override/quest decisions | Enforcement and dependent data contracts | Non-enforcing forms and honest empty states |
| Rewards/Dino/measurement rules | Real credits, scoring, streaks, saved-time/forecast claims | Original assets, layouts, unavailable states |
| Imported Swift source/signing audit and signed-build evidence | iOS migration/signed integration acceptance; source import `fe8f262` alone is insufficient | Shared UI, backend, development web Auth, Android investigation |
| Android capability evidence | Android enforcement/parity claims | Shared UI and feasibility work |
| Native sign-out/deletion ownership | Shipping account transitions with installed rules/events | Credential/cache teardown without native rules |
| Later onboarding/plan schema | Server completion, cross-device resume, plan installation | Minimal profile and explicitly local draft preparation |

See each plan's Q01–Q22 / PD-xx mappings. Recommendations are not answers attributed to the PM.

## 7. Native and deployment plans to draft next

Detailed Swift/Kotlin implementation plans should follow source audit and capability evidence. Inventory actual code, targets/signing, reusable behavior, limits, and signed-device regressions before defining adapter/coordinator commits.

After local M1, a small **development deployment plan** can provide one shared HTTPS API URL. Cover strict startup settings, secret injection, environment/issuer consistency, M2 connection budget, liveness/readiness meaning, bounded costs, smoke checks, and reversible rollout. Full production infrastructure and store releases follow actual native, privacy/account-lifecycle, email, dependency, and operational evidence. No deployment or cloud provisioning happened while drafting.

## 8. Validation and starting point

Each plan includes goals, files, owners, proposed commits, dependencies, tests/acceptance, edge cases, recovery, and an implementation ledger. Plan 00 records its local implementation; the others remain pending. Linked technical guidance must be rechecked against the package/project versions selected during implementation.

Documentation checks cover local links, stable part IDs, matching ledgers, dependency ordering, canonical contract names/paths, and scaffold boundaries. Plan 00 additionally checks its actual type-only package and consumer compile scenarios. RN-01–04 add the UI, asset/navigation, HTTP/query producers and test evidence recorded in their notes. The 36 remaining parts await acceptance, with RN-05 consumer, RN-07 UI, RN-08 native presentation preparation, RN-09a/b/c/d Home/Quests/History/Settings presentation and RN-10 shared hardening distinguished from live acceptance and remaining live feature integration; no live Auth/cloud/database/device result is claimed from contract or UI primitive work.

**Next work from the committed Plan 00 foundation:** Ishmum starts RN-01 (shared UI/test harness) and/or API-01 (testable API configuration/errors), with Android investigation independently. Anisha owns SB-01–03 (Supabase Auth/project setup) and AUTH-01/02 (mobile Auth). She can develop configuration/storage tests against injected settings before live setup is complete. Ishmum owns SB-04/05 when adding product database persistence. Wire M1/M2 when their producer outputs are ready; record actual integration evidence separately from module completion.

RN-10 evidence and the current RN-11 prerequisite audit are in [mobile accessibility QA](../qa/mobile-accessibility.md). RN-11 cannot be accepted before the real Auth/identity/profile milestones; portable tests and JS exports do not supply those producers.

RN-09a–h independent main-screen and detail/editor UI is implemented. See [UI coverage](../qa/rn09-ui-coverage.md) and Plan 04 notes for exact scope, commits, source adaptations and remaining live/device acceptance. Actual saves, account data, native selection/protection and measured outcomes remain unavailable until their producers are integrated.


## Backend M1 producer checkpoint — 2026-11-01

API-01–05 supply validated configuration, safe errors/correlation, real asymmetric
verification, bounded JWKS caching/lifespan, protected database-independent `/v1/me`
and generated wire types/CI drift checks. See [Plan 03 notes](../core_plan_implementation_notes/plan_03_backend_foundation_notes.md).
Deterministic keys/transports establish producer behavior; real Supabase-issued
tokens, Anisha's mobile Auth/root producer and joint RN-05/06 acceptance remain
unverified. API-01–05 performed no cloud Auth configuration or database migration.
The later checkpoints record completed SB-04/05 and API-08/09; API-10 is next.

## Database infrastructure checkpoint — 2026-11-01

Ishmum's SB-04 hosted role bootstrap, actual runtime login, verified TLS and
permission denials pass after the private administrator password was corrected.
SB-05 isolated PostgreSQL 17.11 is implemented/verified (8 real DB tests, guarded
fresh-volume rebuild, required CI definition). See [Plan 01 notes](../core_plan_implementation_notes/plan_01_supabase_foundation_notes.md).
API-06 now consumes this verified hosted-role/local-fixture contract. Product
schema/reads/writes are now API-07–09; API-10 and Anisha's Auth/mobile producers/M1 integration remain pending.
Read-only observations do not accept SB-01–03.

API-06 is implemented and validated (337 deterministic backend / 24 real DB tests,
read-only hosted engine check). That API-06 part created no table/history/RLS; API-07 now supplies them and API-08/09 expose GET/PATCH. API-10 is next. The guarded transaction producer does not accept real
Auth/mobile M1/M2 or Anisha-owned work on their behalf. See Plan 03 notes.

API-07 is implemented as a producer: 344 deterministic and 66 real DB checks,
actual empty-development Alembic upgrade/check and runtime no-context/metadata
denials. Only the minimal profile schema and technical history were created;
Auth/project settings/shared defaults were preserved. Profile GET/PATCH are now API-08/09; API-10 and
actual managed-user A-B/cascade/joint M1/M2 remain pending. See Plan 03 notes.

API-08 is implemented locally: signed-token own-profile GET, explicit absence,
UTC wire shapes, safe DB failures and generated contracts (374 deterministic /
75 PostgreSQL tests). API-07 is committed as 4d8d1fc. API-09 revisioned saves are now implemented; next is API-10 evidence. Real managed tokens, mobile Auth/root wiring and M1/M2
acceptance still require the joint handoff; a read endpoint does not finish M2.

API-09 completes the local M2 backend producer: strict bounded JSON/name/revision
input and atomic create/CAS updates with scoped conflicts, no automatic replay and
exact owner-FK handling. Current checks: 453 deterministic / 96 real PostgreSQL;
full workspace types/lint/contracts and 612 mobile tests pass. API-08 hash ca275af.
Next API-10 records operational and joint managed-user/mobile acceptance; RN-07
still needs actual profile consumer wiring and Anisha's Auth/root producer.

API-10 operational implementation is available: safe correlated diagnostics,
private token/login and explicit HTTP acceptance tools, current hosted dependency
checks and an onboarding persistence review. 469 deterministic / 102 real DB
checks pass; configured-process/CORS/no-Origin HTTP and hosted public trust/schema/
runtime TLS checks pass. At the initial operational checkpoint no account tokens or browser were available.
The managed follow-up below resolves the HTTP token checks; full API-10 still
awaits actual browser and Auth/mobile/device journeys. Counts remain 19/25; no joint
M1/M2 or Anisha-owned work is accepted by these independent checks.

API-10 managed HTTP follow-up: two supplied tokens now verify and pass actual A/B
identity, profile writes/clear/conflict/isolation/refetch and process-restart
persistence on the hosted runtime role. The missing-token gate is resolved for
this run. Browser inventory is empty and real Auth/root/RN-07/native/cascade
acceptance remains joint work. Counts stay 19/25; application M1/M2 and full
API-10/Plan 03 remain open. Operational commit: 188c5dd.
