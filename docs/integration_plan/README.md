# Shared-product integration execution index

**Prepared:** 2026-11-15. **Status:** `integration/shared-product` is set up. See the
[foundation checkpoint](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md)
for completed checks and the next step. **Owners:** Ishmum (shared RN, Android, FastAPI/product
database) and Anisha (Auth/onboarding, Supabase Auth, iOS/signing).

## Outcome and scope

Combine Anisha's Auth/onboarding and reusable Swift protection with Ishmum's
account-aware shared app, Android protection and FastAPI backend. Deliver one
normal app journey, not a collection of isolated development demonstrations.
There are five plans, each with six substantial commit-sized increments. IDs are
stable; child fixes stay under their owning increment rather than inventing a new
plan whenever testing finds a defect.

| Plan | IDs | Lead / review | Prerequisites and output |
|---|---|---|---|
| [01 — Auth into the actual app](01_auth_app_integration.md) | INT-AUTH-C01–C06 | Anisha / Ishmum | BASE complete → one session authority and guarded normal app |
| [02 — Onboarding into backend/protection](02_onboarding_backend_protection.md) | INT-ONB-C01–C06 | Anisha UI; Ishmum persistence/Android | AUTH C01–C04 and BASE complete → resumable setup, actual saves, explicit native Apply |
| [03 — Shared foundation reconciliation](03_shared_foundation_reconciliation.md) | INT-BASE-C01–C06 | Ishmum / Anisha | Start here → compatible dependencies, preserved features and agreed composition boundaries |
| [04 — Swift into the shared RN app](04_ios_native_integration.md) | INT-IOS-C01–C06 | Anisha / Ishmum | BASE boundaries; AUTH/ONB handoffs → RN iOS host and real native protection |
| [05 — Combined-app verification](05_combined_app_verification.md) | INT-VERIFY-C01–C06 | Joint, platform owners | Prepare early; accept features as they land → reproducible account/platform evidence |

Execution order differs from file numbering: **03 → 01 → 02 → Android acceptance
in 05**. Anisha can start 04's source/signing audit after BASE-C04 freezes the
interfaces; land iOS changes after BASE-C06. VERIFY-C01 can start after BASE-C04;
its other increments follow their listed prerequisites. Do not hold Android work
for unavailable iOS hardware. Both-platform completion still requires iOS evidence.
AUTH-C05's optional signup-name handoff can run alongside ONB, but ONB completion
must consume its final interface, not introduce a competing profile writer.

## Inspected starting points

| Source | Exact inspected revision | Meaning |
|---|---|---|
| Ishmum `task/react-native/android-protection-lifecycle` | `cee632c2c4c4230d6da240d6de574391bea0c996` | Integration base: working shared screens/API/account boundaries and Android |
| Anisha `landing-page` | `01c7a170e4027af3f96af876cf686f739bd2be2d` | Source of Auth/onboarding, assets and later standalone Swift pilot |
| Merge base of these two heads | `fe8f262170ff57e70018d0a842f9930404ba1e62` | Historical common source; not the functional integration target |

The live heads were read on 2026-11-15. GitHub comparison reported 16 commits
unique to the teammate head and 88 to the base; its file response stopped at 300.
Those counts are not a complete conflict inventory or feature-completion metric.
Local `origin/landing-page` was older than the live head. Recheck refs before
implementation; record any newer source SHA and inspect its delta first.

### Reading these plans from main

The documentation is intended to be shared on `main` without merging either
implementation branch. **Do not start the integration implementation from main's
older app source.** Fetch both source branches, read these plans, and create
`integration/shared-product` from the reviewed Ishmum implementation head listed
above (or its reviewed successor). Carry these documentation files onto that
branch if absent. Anisha can lead the connecting work using the same sequence;
the ownership table identifies the relevant reviewer, not a requirement to wait
for Ishmum to implement every shared change.

Relevant teammate sources are available at the pinned
[Auth implementation](https://github.com/hooshapp/hoosh/blob/01c7a170e4027af3f96af876cf686f739bd2be2d/docs/implementation/auth-screens.md),
[onboarding models](https://github.com/hooshapp/hoosh/blob/01c7a170e4027af3f96af876cf686f739bd2be2d/apps/mobile/src/features/onboarding/draft.ts),
[manual plan](https://github.com/hooshapp/hoosh/blob/01c7a170e4027af3f96af876cf686f739bd2be2d/apps/mobile/src/features/onboarding/manual-plan.ts),
[Swift enrollment description](https://github.com/hooshapp/hoosh/blob/01c7a170e4027af3f96af876cf686f739bd2be2d/docs/implementation/legacy-swift-study-enrollment.md)
and [Swift test report](https://github.com/hooshapp/hoosh/blob/01c7a170e4027af3f96af876cf686f739bd2be2d/apps/mobile/ios/Tests/TEST_RESULTS.md).
Reports saying changes are unpushed are historically stale where the pinned remote
tree contains them. Recorded tests are useful leads, not rerun integration results.

## Architecture decisions for these plans

These are the proposed integration implementation baseline, not new PM answers.
They preserve [Plan 00](../core_plan/00_shared_contracts.md), current product ADRs
and later explicitly authorized defaults. Any conflicting newer owner instruction
must be reconciled before its dependent implementation.

1. **One product identity:** ordinary non-anonymous Supabase accounts, keyed by
   project + verified UUID. FastAPI remains the product-data authority. Passwords
   and refresh tokens never go through FastAPI. Anonymous Swift study enrollment
   does not become a production login or an automatic account migration.
2. **One session producer:** adapt Anisha's fuller controller to the existing
   `AuthSessionPort`/`AuthAccountActions`. Keep Ishmum's API/account/query/native
   boundaries as consumers. Retire the competing session implementation only
   after its tested behavior is covered. No second SDK client, refresh listener
   or cross-layer credential cache.
3. **One normal application:** retain the current real Home/Quests/History/Settings
   and their routes. Add Auth/onboarding around them. SwiftUI dashboard/enrollment
   and research views remain separate pilot code unless a specific piece is reused.
4. **Three different truths:** a backend draft is saved data; OS permission is
   authorization; installed native revision/status is protection. None implies
   the others. Saving, navigation, login and onboarding completion never auto-Apply.
5. **Device-local selection/enforcement:** actual app identities/tokens stay native.
   RN gets validated summaries; backend gets only its approved aggregate schemas.
   Native enforcement and expiry must work without JS, Metro, API or an AI model.
6. **Keep established product semantics:** global app selection, per-app elapsed
   allowances, approved bypass/overlap, recurring quest and fixed-baseline History
   policies remain authoritative. The Swift pilot's measured-use budgets, limited
   extra allowance, previous-period History and tone/context features do not
   silently replace them. iOS feasibility and any unavoidable differences are
   explicitly resolved in IOS-C01/C04, not hidden in an adapter.
7. **Minimal persistence:** reuse profile/settings/quest APIs and the one Alembic
   history. Device onboarding progress gets a small versioned account-scoped
   local record. Do not add a generic onboarding JSON table, second backend,
   persistent query cache, sync engine or automatic mutation replay.
8. **Preserve scope:** generated AI, demographic collection policy, lifespan
   forecasting, cross-device allowances, Calendar/Reminders, research telemetry,
   store publication and account deletion rollout are not silently added. Existing
   deferred gates remain visible; functional integration is not a release claim.

## Working method and shared-file ownership

At implementation start create `integration/shared-product` from the inspected
Ishmum head (or its reviewed successor). Work through small reviewed increments
there, or short-lived `task/integration/<part-id>` branches based on its current
head. Do not create five indefinitely diverging ownership branches. No branch
creation, merge, commit, push or hosted change is performed by drafting these docs.

Prefer selective, reviewed ports from the pinned teammate source. A full merge
would import a separate Swift product flow and overwrite foundational RN files.
BASE-C01 must produce the complete file inventory before selecting paths. Preserve
provenance by listing source commits/paths in notes and commit descriptions; do
not represent selective ports as a complete historical merge.

| Shared surface | Integrator / required reviewer |
|---|---|
| `package.json`, lockfile, tooling, `app.config.ts`, Android manifests | Ishmum; Anisha reviews Auth/iOS requirements |
| Root/routes/session composition and callback paths | Anisha; Ishmum reviews private-data/native boundaries |
| API schemas/generated types, product migrations | Ishmum; Anisha reviews consumer mapping |
| Xcode project, Podfile, App Groups, signing, extension embedding | Anisha; Ishmum reviews shared/native port changes |
| Contracts/native adapter interfaces | Joint review; one editor at a time |

Do not overwrite unrelated local changes, regenerate either native project in
place, reset databases, uninstall an existing user app or use another account's
credentials as an implementation shortcut. Existing real-data migration and
device-owner consent boundaries remain in force. Keep this coordination practical:
one shared-file owner per increment, no extra orchestration service.

## Acceptance and evidence rules

- Each increment contains working code, meaningful targeted verification, its
  implementation notes and ledger update. Retain a usable app between commits;
  register routes/features only when their dependencies exist.
- Use `npm run check`, `npm run mobile:export`, `npm run mobile:ui:build` and
  existing native/database commands where applicable. Do not rerun all native
  matrices for a text-only change. A contract/schema/native change requires its
  producer and consumer tests, not just a TypeScript check.
  Reuse exact-head passing evidence where still applicable; use targeted checks
  during an increment and broader checks at the handoff. New code/configuration
  requires rerunning affected checks, not duplicating every old acceptance run.
- Local deterministic A/B fixtures prove fencing logic. Actual accounts prove
  SDK/project/backend wiring. A simulator substitution does not prove an Apple
  picker, OS callback or physical enforcement. Record them separately.
- No tokens, password entries, private account addresses, callback URLs with
  codes, signing secrets or raw selected-app inventories in notes/artifacts.
- TalkBack-specific work remains deferred at Ishmum's instruction. Preserve
  existing semantics/labels; ordinary touch, focus, keyboard and large-text
  functionality remain in scope. Do not book another TalkBack session by default.
- Real-account and iOS acceptance require those resources when reached. The
  planning request does not supply credentials or revoke previous user deferrals.
  Continue independent increments; never mark a pending real check passed.
- A blocked test does not justify another success stub or bypass in the product.

## Completion levels and existing plans

| Claim | Required evidence |
|---|---|
| Foundation ready | BASE-C01–C06; no lost existing functionality |
| Auth/onboarding code integrated | AUTH/ONB code and deterministic integration checks; actual-device status explicit |
| Functional Android integrated build | VERIFY-C02–C04 on the normal packaged app with real accounts and native actions |
| Functional shared iOS integrated build | IOS-C01–C06 and VERIFY-C05, actual signed iPhone journey |
| Both-platform integration accepted | All mandatory integration checks and exact-head CI; open product/release/deferred gates named |
| Store/release ready | Separate deployment/signing/provider/privacy/release decisions and remaining acceptance; not promised here |

These plans finish cross-branch wiring under existing core IDs; they do not rename
or erase those IDs. AUTH maps to AUTH-01–09/13 and RN-04–07; ONB to AUTH-09–12,
API-11/12, RN-07/08/09D; IOS to RN08-D01–D06 and native/iOS handoffs; VERIFY to
AUTH-08, SB-06, API-10, RN-10/11 and existing journey acceptance. BASE coordinates
shared files across all of them. Update only relevant core ledger evidence when
the actual increment lands. Never bulk-mark Plan 01/02/03/04 complete.

## Resume and change control

Read the current context/decision register, this index, the selected plan and its
[notes workflow](../integration_notes/README.md). Inspect Git/worktree and exact
source before editing. Follow the next unfinished ledger row, with its predecessor
handoff. The current checkpoint is [**BASE-C01 in progress**](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md).

Keep six stable increments per plan. Put discovered defects, compatibility fixes
and additional relevant scenarios inside their owning increment. Add a named
follow-up only for a genuinely new feature/policy, with reason and owner; do not
quietly expand scope or pretend unknown OS behavior can be guaranteed by planning.
When changing a settled interface, update its consumer plan and tests in the same
reviewed change, and record the decision in notes rather than relying on chat.
