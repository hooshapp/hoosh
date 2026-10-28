# Disconnect — AI Engineering Agent Start Here

**Start date:** 2026-10-28  
**Read in order:** `PRD.md` → `TSD.md` → current Figma design → existing source repository.  
**Design:** https://www.figma.com/design/ukmD2ZidJ9UR2XxUkvdPoJ/App-UI?node-id=0-1

**Checkout status (2026-10-28):** A shared Expo/React Native shell, type-only integration contracts, and a FastAPI foundation now exist. See [`../README.md`](../README.md) for actual setup/check commands. Auth, database access, and native protection are not connected. The released Swift source is not present in this checkout; its audit and reuse remain prerequisites for iOS integration. The shell opens Home as a development preview and does not claim active protection.

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

READ: PRD.md, TSD.md, AGENT_START_HERE.md, and the Figma design.
FIRST ACTION: inspect the existing repository and current iOS native source before changing anything.

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
4. Propose a small, reviewable patch and the files it touches.
5. Implement with tests and validate build/lint/typecheck.
6. Report which tests ran, what remains unverified on physical devices, any policy risk and the next task.

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

## 7. Core test commands — adapt to actual repository

```bash
# JavaScript/TypeScript workspace, after dependencies installed:
pnpm typecheck
pnpm lint
pnpm test

# Python API, after environment created:
pytest -q
alembic upgrade head

# iOS: open native project in Xcode and validate extension targets
# plus an actual signed TestFlight build on a physical device.
# Android: test on physical Pixel and Samsung, including permitted
# background behavior; no simulator-only compliance sign-off.
```

These are **suggested** commands; do not report that they passed until they actually run in the real repo.

## 8. Artifact index

- **`PRD.md`** — problem, interview/survey evidence, all Figma flows, functional/nonfunctional requirements, user acceptance criteria, platform parity, product decisions.
- **`TSD.md`** — architecture, native boundaries, Swift/Android requirements, TypeScript interfaces, FastAPI endpoints, Pydantic/SQL examples, event sync, security, database, tests, infra, agent work packages.
- **`OPEN_DECISIONS.yaml`** — machine-readable unresolved founder choices, intentionally unapproved.
- **[`PM_QUESTIONS.md`](PM_QUESTIONS.md)** — 22 PM questions with stable IDs and space to append dated answers, clarifications, and agreed decisions.

**Source of truth:** This is a context-rich implementation baseline. A full repo audit and explicit product policy answers may require updates before coding core session/reward rules. The documents must be revised whenever founder decisions, platform behavior, or existing code evidence contradicts assumptions.
