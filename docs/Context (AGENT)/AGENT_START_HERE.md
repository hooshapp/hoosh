# Disconnect — AI Engineering Agent Start Here

**Start date:** 2026-10-28  
**Read in order:** `PRD.md` → `TSD.md` → current Figma design → existing source repository.  
**Design:** https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1

**Checkout status (2026-11-02):** A shared Expo/React Native shell, accepted type-only Auth/native interfaces with synthetic HTTP fixtures (Plan 00 committed as `0b50900`), and a FastAPI health foundation now exist. See [repository README](../../README.md) for actual setup/check commands. Mobile Auth, product persistence, and native protection are not connected. Legacy iOS source is now present in `apps/mobile/ios/` from commit `fe8f262`; its audit, signing/build validation and reuse remain prerequisites for RN/iOS integration. Source availability alone is not integration acceptance. The shell opens Home as a development preview: RN-09a composes source cards with unavailable inputs and no sample outcomes; Quests, History and Settings now also have source-aligned presentation with unavailable inputs and isolated source examples. It does not claim active protection.

**Engineering ownership:** Ishmum owns main/shared React Native UI, Android, backend/product database and shared testing. Anisha owns all Supabase Auth/project setup (SB-01–03), mobile Auth/onboarding and iOS. Ishmum owns only the Supabase product database work (SB-04/05), not Auth administration. Build against the shared contracts independently, then wire real outputs when ready; mark integration-dependent parts complete only after joint validation. Read [the accepted decisions](../architecture/identity-foundation.md) and [core execution order](../core_plan/README.md) before foundation work.

**Implementation records:** Before starting a plan, read the [knowledge-base workflow](../core_plan_implementation_notes/README.md) and create that plan's notes file. Give every commit its own entry with all changed files, exact line ranges, what/why, validation and remaining work. Keep the plan ledger synchronized. New chats/agents must read the relevant notes and inspect Git/current code before resuming. Plan 04's [implementation record](../core_plan_implementation_notes/plan_04_react_native_integration_notes.md) contains the current RN-01–04 producer status, RN-05 consumer, RN-07 UI-only, RN-08 native presentation preparation, RN-09a–h main/detail/editor UI and RN-10 shared UI/lifecycle hardening, evidence and next step; read it before resuming.

## 1. Founder-provided facts that override generic assumptions

- Disconnect is an existing, released iOS app, not a brand-new proof of concept.
- The team already has Apple's Family Controls **distribution entitlement**.
- The team has **tested iOS blocking, native nudges, timers, and continued restriction of apps**.
- Team reports monitoring and native nudges continue even after the host app is terminated and behave reliably through lock/unlock, restarts and time-zone changes.
- Existing nudges are **generic**; AI-generated personalization has not been implemented yet.
- Research has evolved: **80+ potential-user interviews (team-reported, current), 3–4 full design iterations**. An early PDF describes only 11 interviews and an early survey spreadsheet has 80 responses. Different dates and denominators: do not combine or misstate.
- The Figma file is a **design** and does not prove every screen/feature is implemented.
- The team wants a **shared React Native iOS/Android app**, native Swift/Kotlin integrations, a custom **FastAPI backend**, managed Supabase PostgreSQL/Auth, and near-zero cloud spending until necessary.
- The existing Swift core is valuable: **reuse, wrap, and validate** it rather than rewrite it.
- The intended use is a bootstrapped, accelerator-ready product with measurable traction, not an architecture demo.

## 2. One-paragraph project brief

Build the Figma-designed Disconnect app with React Native + TypeScript for shared onboarding, Home, native-intervention status, suggested/custom quests, history and settings; integrate the team's already-working iOS Screen Time system through a small, tested Swift bridge; research and implement a lawful Android alternative in Kotlin; use FastAPI for authenticated profiles, editable plans, quest/reward logic, event ingestion and accurate aggregate progress; and use Supabase for PostgreSQL and Auth. Keep all device restrictions offline-capable and independent of the React Native JS process or any cloud/LLM call. Do not invent app usage, saved time, reward policy or Android capabilities.

## 3. Copy/paste prompt for your coding agent

```text
You are the senior full-stack/mobile engineer implementing Disconnect.

READ: docs/Context (AGENT)/AGENT_START_HERE.md, PRD.md and TSD.md in that same folder; docs/core_plan/README.md; docs/core_plan/00_shared_contracts.md; docs/core_plan_implementation_notes/README.md; the relevant plan and its implementation notes. Consult Figma for visual work.
FIRST ACTION: inspect the affected repository code. For iOS native changes, audit the imported Swift source and actual targets before changing them; missing signing/device evidence does not block independent shared UI/Auth/backend foundation work.

Goals:
- Preserve existing approved and tested iOS native Screen Time implementation.
- Implement React Native + TypeScript app matching actual Figma screens and tokens.
- Use a protection-service abstraction with Swift and Kotlin adapters.
- Implement modular FastAPI, Supabase Auth and PostgreSQL with migrations.
- Keep native monitoring/restrictions independent of JS, server availability and AI.
- Implement offline event queue, idempotent batch sync, revisioned plans and reason-based restriction coordination.
- Do not assert Android hard-block parity until supported and compliant.

Do not start by rewriting Swift extension code. Do not substitute Figma imagery/icons or use mock stats as real data. Do not hardcode unresolved session/reward semantics.

For this task:
1. Summarize relevant PRD requirement IDs and Figma frame IDs.
2. Inspect affected code and report existing behavior to reuse.
3. List unresolved decision IDs PD-xx and a safe implementation boundary.
4. Propose a small, reviewable patch; create/update the plan notes file before coding.
5. Implement with relevant tests and validate build/lint/typecheck. Record every commit's file/line changes, reasons and actual checks in the implementation notes.
6. Update the plan ledger and notes checkpoint. Report which checks ran, what remains unverified, blockers and the next task so another agent can resume.

Do not make destructive migrations, reset production databases or overwrite existing app entitlements without explicit authorization.
```

## 4. Recommended implementation order

| Step | Scope | Critical output |
|---|---|---|
| 00 | Existing repository and iOS audit | Working Swift functionality, target config, signing and App Group inventory |
| 01 | Product decisions and contracts | Core sessions/override/rewards defined, TS interface, OpenAPI draft |
| 02a | Android feasibility in parallel | Real-device and Play-policy evidence; capability matrix |
| 02b | Mobile base and iOS adapter | Expo development build + existing extensions preserved and callable |
| 03 | Backend foundational service | FastAPI auth, migrations, profile, plans, revision conflict tests |
| 04 | Onboarding + settings UI | Figma-aligned screens with permission success/denial states |
| 05 | Restriction coordinator + sessions | Overlap-safe rules, native local state, offline behavior |
| 06 | Quests + suggestions | Persistent quests vs temporary home recommendations, recurrence |
| 07 | Events, credits, progress | Outbox, transactional reward ledger, no fabricated metrics |
| 08 | Accessibility, QA and release | Signed physical-device runs; existing App Store upgrade tested |

## 5. Pre-implementation founder decisions

The full table is in **PRD §13**, with IDs `PD-01` to `PD-17`.

**Hard blockers for enforcement logic:**

- `PD-01` Whether planned sessions are per app, combined selected apps, or global.
- `PD-02` What constitutes one session, inactivity break and midnight reset.
- `PD-03` Exact "Open anyway" policy, number/length of extensions, and expiration.
- `PD-04` Whether quests take precedence over allowances (recommended: yes).
- `PD-14` Actual Android intervention and permission strategy.
- `PD-15` Reuse/migration plan from existing native iOS code.

**Hard blockers for real reward/History claims:**

- `PD-05` Quest completion evidence; recommended user-confirmed by default.
- `PD-06` Formal credit earning/spending rules.
- `PD-07` Meaning of Dino health score.
- `PD-11` Which usage measurements are technically and legally available.
- `PD-12` Avoid life-years/gender-based forecast without validation; recommended omit.

AI agents may build UI skeletons, interfaces, adapters, tests, and fixtures before these decisions; **they must not silently ship a guess**.

## 6. Engineering capacity/cost notes from planning conversation

Previous rough planning estimate after reusing iOS native features: **780–1,540 remaining person-hours**, with substantial uncertainty depending on reuse, especially Android feasibility and final scope. It is a planning range, **not** a guaranteed schedule. Rough split discussed: RN UI 240–420h, backend 140–260h, remaining iOS integration 40–120h, Android 220–440h, testing/integration/release 140–300h. Some components may overlap in execution, so don't use these to demand an exact deadline.

Bootstrapped cash planning estimate discussed: roughly **$150–$500 first year excluding founder labor and devices** at very low usage, subject to existing Apple membership and provider changes. Services can often start near $0 monthly if free-tier eligible, but **no guarantee of $0**, particularly for production uptime, backups, email and API traffic. Review current prices before purchase. Keep detailed usage local and sync only permissible aggregate/events in batches.

## 7. Current foundation checks

From the repository root:

```bash
npm run check          # workspace types (including contract consumers), lint, tests + API checks
npm run mobile:export  # web export; separate from signed native acceptance
npm run api:test
npm run api:lint
```

These are actual scaffold scripts, not evidence they passed in a particular change.
Plan 03 API-07 supplies Alembic and required PostgreSQL migration/policy checks;
API-08 adds nonmutating own-profile GET. Legacy iOS source exists, but importing it does not prove an audited or
Expo-integrated native build. Signed iOS builds on a physical device and Android device
capability tests remain separate; a web export does not establish native behavior.

## 8. Artifact index

- **[Implementation knowledge base](../core_plan_implementation_notes/README.md)** — shared workflow for per-plan/per-commit file-and-line change records, reasoning, validation and cross-chat handoffs.

- **`PRD.md`** — problem, interview/survey evidence, all Figma flows, functional/nonfunctional requirements, user acceptance criteria, platform parity, product decisions.
- **[`architecture/identity-foundation.md`](../architecture/identity-foundation.md)** — adopted M1/M2 interfaces and named ownership; links to the wire contract and fixture/handoff rules.
- **`TSD.md`** — architecture, native boundaries, Swift/Android requirements, TypeScript interfaces, FastAPI endpoints, Pydantic/SQL examples, event sync, security, database, tests, infra, agent work packages.
- **`OPEN_DECISIONS.yaml`** — machine-readable unresolved founder choices, intentionally unapproved.
- **[`PM_QUESTIONS.md`](PM_QUESTIONS.md)** — 22 PM questions with stable IDs and space to append dated answers, clarifications, and agreed decisions.
- **[`core_plan/README.md`](../core_plan/README.md)** — execution order and index for five detailed foundation plans, with 44 parts (Plan 00 committed as `0b50900`, RN-01–04, API-01–09 and SB-04–05 producers implemented with evidence, 25 parts awaiting acceptance, including RN-05 consumer, RN-07 UI-only, RN-08 native presentation preparation, RN-09a–h UI with live integration pending and RN-10 shared hardening; RN-04 real root wiring pending), cross-plan dependencies, implementation/commit ledgers, and explicit PM/native gates.

**Source of truth:** This is a context-rich implementation baseline. A full repo audit and explicit product policy answers may require updates before coding core session/reward rules. The documents must be revised whenever founder decisions, platform behavior, or existing code evidence contradicts assumptions.

[RN-10 QA and RN-11 readiness](../qa/mobile-accessibility.md): shared accessibility/lifecycle fixes are recorded separately from pending signed-device and live Auth/profile checks. RN-11 currently awaits the real M1/M2 producers.

RN-09a–h independent main-screen and detail/editor UI is implemented. See [UI coverage](../qa/rn09-ui-coverage.md) and Plan 04 notes for exact scope, commits, source adaptations and remaining live/device acceptance. Actual saves, account data, native selection/protection and measured outcomes remain unavailable until their producers are integrated.


Plan 03 API-01–05 now implement backend identity verification and generated wire
contracts; read [Plan 03 implementation notes](../core_plan_implementation_notes/plan_03_backend_foundation_notes.md)
before backend/Auth/RN integration. FastAPI has public `/healthz` and protected
`/v1/me`; the newer API-08 checkpoint below adds profile GET. API-09/10 and real-user/mobile acceptance remain pending. Real Supabase project tokens,
mobile Auth/session/root wiring and live M1/M2 acceptance are not yet verified.
Schema export is environment-free and fail-closed; no fake authenticated account
is registered. App/shared TypeScript remains 6.0.3; its pinned build-only generator
uses an isolated TypeScript 5 peer. Plan 04 phone/UI evidence does not establish
live Auth, persistence or native protection.

Supabase MCP access is now authenticated and verified. Ishmum's [Plan 01 notes](../core_plan_implementation_notes/plan_01_supabase_foundation_notes.md)
record observed development metadata, real backend JWKS/public-key checks, SB-04
hosted role/login/TLS and SB-05 disposable PostgreSQL 17.11 infrastructure. Hosted
TLS trust/hostname and actual runtime-login permission checks pass after the private
password was corrected. A separate runtime credential was initialized privately;
no shared credential was reset. SB-05
local/CI contract is implemented; 8 real PostgreSQL tests passed locally (hosted
GitHub run unverified). API-06 lazy engine/scoped verified-user transactions are now implemented and
validated. API-07 supplies the profile model/Alembic/RLS and API-08 GET is now implemented; next is API-09 PATCH; Anisha's Auth/root wiring and joint
live identity acceptance remain pending. Actual secrets/certificates stay ignored; never include them in notes.

API-06 details/commit/evidence are in Plan 03 notes and the application DB README.
The current checks are 337 deterministic backend tests and 24 real PostgreSQL
tests; the existing DB CI group includes the new tests. Runtime connections are
lazy and use the dedicated role; request units finalize before HTTP success,
never borrow migration credentials and do not replay failed mutations. API-07 now supplies the minimal product model/RLS/history; schema paths now also include API-08 profile GET.

API-07 is implemented/applied to the inspected-empty development project through
Alembic head 20261102_0001, with local migration/RLS acceptance and private runtime
checks (344 deterministic / 66 real DB tests). Read the Plan 03 notes and migration
guide before further database work. API-07 added no profile backfill/signup trigger or HTTP route; API-08 now adds GET;
managed Auth users/settings were untouched. Actual managed-user cascade/A-B and
Auth/mobile integration remain joint API-10/SB-06 work with Anisha.

Current API-08 checkpoint (2026-11-02): GET /v1/profile is implemented with real
verified-user scope, explicit owner filtering/RLS and exact nullable/UTC responses.
Repeated absence reads do not insert; connection/pool/query failures are safe 503,
not absence. Generated OpenAPI/types include GET only. 374 deterministic / 75 real
PostgreSQL tests pass. API-07 hash is 4d8d1fc; API-09 revisioned PATCH is next.
Earlier checkpoints/counts above are historical. No hosted schema/Auth changes
were needed; actual managed-user tokens and mobile M1/M2 remain joint acceptance.

Current API-09 checkpoint (2026-11-02): strict bounded PATCH and atomic create/CAS
profile writes are implemented; local M2 backend producer checks pass (453
deterministic / 96 real PostgreSQL). Simultaneous requests, deleted-owner FK race,
rollback, raw Unicode/body limits and lost-response replay are tested. Types now
publish PATCH input and nonnullable saved profile. API-08 hash ca275af; next API-10
operational/joint managed-token/mobile evidence. API-07's schema remains unchanged;
no hosted Auth/user or mobile code was changed. RN-07 actual wiring is still open.

Initial API-10 operational checkpoint (2026-11-02): operational code/tools are implemented with
469 deterministic / 102 real DB checks and full workspace passing. See the backend
OPERATIONS.md for diagnostics, private token/login and explicit A/B checks. Actual
process/CORS/no-Origin, hosted public ES256, schema/security drift and runtime TLS/
READ COMMITTED/default deny pass. Full API-10/Plan 03 acceptance stays OPEN: approved
A/B user tokens were unavailable, the browser tool reported no browser available,
and real Anisha Auth/root/RN-07/native journeys remain pending. Counts stay 19/25;
no managed identity or physical-device success is inferred from dependency probes.
API-09 hash c563ff6. The onboarding persistence review is prepared, not an approved
schema/completion endpoint. No hosted Auth/schema or mobile source was changed.

Latest API-10 managed HTTP checkpoint (2026-11-02): approved tokens were supplied
and verified for two distinct actual accounts. Hosted runtime-role HTTP identity,
profile save/clear/conflict/isolation/refetch and true API process restart
persistence pass. Token absence is no longer the blocker for this recorded run.
No token/identity/profile payloads are in artifacts. No Auth user/settings/schema
changed. Browser inventory is empty; real Auth/root/RN-07/native and managed
cascade gates remain open. Full API-10/Plan 03 and application M1/M2 are not accepted
by this HTTP evidence alone. Read the Plan 03 resume checkpoint and operator guide.
