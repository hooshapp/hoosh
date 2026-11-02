# Foundation handoffs and fixture rules

**Owners:** Ishmum (shared infrastructure/API/RN/Android) and Anisha (Auth/onboarding/iOS).
See [accepted decisions](identity-foundation.md) and [execution waves](../core_plan/README.md).

**Implementation knowledge base:** Both developers follow the [per-plan/per-commit notes workflow](../core_plan_implementation_notes/README.md). Before coding a new plan, create its notes file; keep every commit's file/line changes, reasons, validation and next step there so another agent can resume.

## Producer outputs

| Producer / owner | Output consumed by the other work | Ready when |
|---|---|---|
| Plan 00 / Ishmum, at his direction | Type-only Auth/native ports; HTTP examples; ownership | Type checks and consumer compile scenarios pass; no success mock registered |
| SB-01–03 / Anisha | Named development Auth project, public config, observed issuer/audience/signing/redirect settings | Non-secret runbook + two disposable test-account access procedures; credentials never committed |
| SB-04/05 / Ishmum | Product DB runtime/migration roles, connection setup and isolated PostgreSQL tests | Auth/project metadata comes from Anisha; no provider/redirect/user administration is assigned to Ishmum |
| AUTH-01/02 / Anisha | Secure storage + single SDK owner implementing `AuthSessionPort`; React binding owned inside Auth | Stable snapshot/subscription/token/revalidation behavior and lifecycle/race tests; unavailable states honest |
| RN-01 / Ishmum | Shared form primitives and Jest/RNTL setup | Auth can reuse interactive controls/tests; existing Vitest cases preserved |
| API-01–05 / Ishmum | JWT verifier, exact identity/errors, generated HTTP types/OpenAPI | Deterministic key/error/schema tests pass without cloud; real development JWT smoke separately recorded |
| RN-03/04 / Ishmum | HTTP consumer, per-account memory scope, cancellation/late-result checks, teardown hook | Auth can invoke one coordinated transition without owning query/cache internals |
| AUTH-07 / Anisha | Auth route guards + `AuthAccountActions`, root integration | No private bootstrap flash; sign-out intent locks routes and invokes Ishmum's cleanup; no restriction clearing |
| SB-04/05 + API-06–09 / Ishmum | Separate runtime/migration roles, real test DB, Alembic profile/repository/routes | Two-user RLS + repository isolation, pool reuse and revision races tested on PostgreSQL |
| RN-05/06 then RN-07 / Ishmum with Anisha | M1 identity UI/evidence, then M2 profile UI/evidence | Real providers/database as applicable; UUID/generation checks; conflict/uncertain-write recovery |
| Native follow-ons / Anisha iOS, Ishmum Android | Audited adapter methods/capabilities/installation evidence | Actual source + supported signed/device results, separately per platform |

Anisha can implement Auth with controlled API consumers before FastAPI is ready.
Ishmum can implement verification against local test keys before mobile Auth is ready.
Neither developer invents a different shared wire/session contract for a temporary UI.
Conditional onboarding and native enforcement do not block these initial producers.
The team can wire real implementations after independent producer work is ready;
live integration acceptance remains pending until tested. A small early Auth/API
smoke check is optional and does not require finishing either whole area.

Anisha owns all Supabase Auth setup, including project creation/configuration,
providers, confirmation/email delivery, redirects and test accounts. She gives
Ishmum non-secret issuer/audience/algorithm/JWKS metadata. Ishmum owns API token
verification and product PostgreSQL roles/migrations/repositories, not Auth
administration. He returns the reachable API origin and wire/schema implementation.

## Fixture placement and release isolation

- `packages/contracts/fixtures/*.json`: synthetic HTTP and Unicode-name cases;
  initially documentation/test inputs. Future API schema/normalization tests consume
  them directly. They contain no JWTs, passwords, provider keys or real user records.
- `packages/contracts/type-tests/*.typecheck.ts`: compile-only consumer scenarios,
  included by the contracts typecheck script. Not package exports or app imports.
- Future feature test doubles live beside tests or in test-support directories
  **outside `src/app`**. Inject through the real ports from test entry points;
  do not add a production environment switch returning fake identities/active rules.
- Keep story/preview entry points separate from release routes and import graphs.
  A release route must never import fixture JSON, test adapters or a preview router,
  even behind `__DEV__`. Metro can still include a statically imported module.
- The root contracts package remains type-only. Use `import type`; no runtime
  facade that silently chooses a success stub when native/Auth setup is missing.
- When RN-01 introduces a development preview harness, document the actual separate
  entry/config and inspect a production export's routes/module graph for fixture
  reachability. Repeat when that entry/import graph changes. No release exclusion
  test for a future harness is claimed now. The current shell's visible placeholders
  stay honest previews and contain no pretend authenticated/protected user data.

## Shared test responsibility

Current checks are `npm run check`; it includes both source and compile-only
contracts consumers. Portable API-client tests use Vitest. Python uses pytest/Ruff.
No component or native integration harness is installed by Plan 00.

**RN-01, Ishmum:** install/configure the shared Jest + React Native Testing Library
harness when implementing interactive RN primitives. Use Jest for `*.test.tsx` and
`*.native.test.ts`; explicitly exclude those from Vitest, which owns portable
`*.test.ts`. Exclude support/fixture directories and use nonoverlapping discovery
globs; run both runners through `npm test`. Anisha adds Auth form/guard tests to
that harness instead of installing a second competing setup. Native storage itself
also needs actual-device evidence; mocked SecureStore cannot prove persistence.

Database tests use real isolated PostgreSQL and representative role/RLS rules,
not SQLite as a substitute. Managed Auth live smoke, local test-key verification,
browser preview and signed physical-device results are distinct evidence classes.

## Integration and evidence

Use the existing five areas: `area/auth-onboarding` (Anisha), `area/react-native`
(Ishmum), `area/android` (Ishmum), `area/ios` (Anisha), `area/backend` (Ishmum, including
Supabase application database work). Supabase Auth setup stays in Anisha's
`area/auth-onboarding`; Supabase is not a sixth ownership branch. Task branches start from current area/main state; integrate small working
parts into `main`, then sync all active areas before touching shared files. Git branch
names express ownership, not a separate dependency/inheritance mechanism. One named
author per shared-file change and Alembic revision; review impacts with the consumer.

Use each plan's existing ledger for summary status, actual commit hashes, evidence
and missing input. Maintain the corresponding implementation-notes file for every
commit's detailed file/line changes, reasons, checks and resume checkpoint. Plan 00 SC-01–04 landed together in foundation commit `0b50900`;
its ledger records that actual hash. The planned per-part messages were suggested
boundaries, not separate commits. Keep future part histories and reviews accurate.

When M1/M2 are exercised, their QA record (RN-06/RN-11, AUTH-08, API-10/SB-06 as
applicable) includes:

- commit(s), date, actual command, outcome, local/live environment, and redacted
  project identity/config source;
- platform, OS/device/build/SDK versions; explicitly label browser vs signed native;
- two synthetic accounts A/B: bootstrap, sign-in, sign-out/account switch, late A
  request, missing/null fields, offline/unavailable, bounded 401 recovery;
- M2: absent GET stays absent, create/update/clear survives refetch/restart, concurrent
  first save/stale revision/lost reply recovery, and actual two-user DB/RLS evidence;
- unavailable inputs (Swift source, signing, device, PM answer) and exact next part.

Never save tokens, credentials, live personal data, or raw callback URLs with secrets
in screenshots/logs. A passed typecheck is contract evidence; it is not runtime Auth,
database, native storage or enforcement acceptance.
