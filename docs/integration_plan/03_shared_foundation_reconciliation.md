# Integration 03 — Shared foundation and source reconciliation

**Lead:** Ishmum. **Reviewer:** Anisha. **Status:** planned. **Start first.**
**Notes when implementation starts:**
`docs/integration_notes/plan_03_shared_foundation_reconciliation_notes.md`.

## Purpose and boundaries

Establish a working integration base without losing the actual app, Android
enforcement, backend contracts or tests. This plan ports shared dependencies,
assets/primitives and compatibility seams. Plan 01 owns live Auth/root changes;
Plan 02 owns onboarding behavior; Plan 04 owns the native iOS host. Do not import
the teammate's placeholder Home/Settings over the working account-aware routes.

Read the [index](README.md), current core Plan 00, both source manifests,
`apps/mobile/src/features/account/session-boundary.tsx`,
`src/infrastructure/auth/{runtime,session}.ts`, `src/infrastructure/native/`,
`apps/mobile/app.config.ts`, root scripts/workflow and original asset manifests.
Resolve paths from `apps/mobile` where `src/` is abbreviated below.

## Source disposition and invariants

| Source group | Disposition |
|---|---|
| Current shared screens, backend, query/account scopes and Android | Retain as the base; adapt narrow interfaces only |
| Teammate Auth/screens/link/storage/controller | Port in Plan 01 with source provenance and existing regression behavior |
| Teammate intro/onboarding/manual-plan UI | Port in Plan 02 after mapping; shared assets/primitives may land here |
| Teammate placeholder tabs/root and removed dependencies | Do not take wholesale; reconcile routes/root in Plan 01 |
| Swift engine/extensions | Audit/reuse in Plan 04; do not replace with freshly generated native output |
| Swift anonymous enrollment/direct research REST/SQL | Keep separate; no product-table or Auth migration in this plan |
| Historic notes/research reports | Preserve history; new notes state actual integration evidence |

Native IDs/credentials, no-backup protections, atomic persistence, event IDs,
source asset hashes, test-host isolation and account-generation fencing must
survive reconciliation. A smaller dependency list is not evidence that missing
functionality was intentionally removed.

## Commit ledger

| Part | Intended commit | State / prerequisite |
|---|---|---|
| INT-BASE-C01 | `chore(integration): establish audited source baseline` | Inventory and automated checks recorded in `59e4da9`; interactive startup pending. [Baseline checkpoint](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md) |
| INT-BASE-C02 | `build(mobile): reconcile integration dependencies and config` | Checks passed in `d07a108`. [C02 checks](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md#int-base-c02--dependency-and-configuration-reconciliation) |
| INT-BASE-C03 | `feat(mobile): reconcile shared onboarding and auth assets` | Checks passed in `e411344`. [C03 notes](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md#int-base-c03--shared-artwork-and-ui-compatibility) |
| INT-BASE-C04 | `refactor(mobile): establish integration composition seams` | Checks passed in `b4db69a`. [C04 notes](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md#int-base-c04--app-composition-and-native-handoff) |
| INT-BASE-C05 | `test(mobile): protect existing features during integration` | Checks passed in `05a6c6e`. [C05 evidence](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md#int-base-c05--retained-product-and-account-boundaries) |
| INT-BASE-C06 | `chore(integration): verify shared foundation handoff` | Local checks passed; commit and GitHub run pending. [C06 handoff](../integration_notes/plan_03_shared_foundation_reconciliation_notes.md#int-base-c06--reproducible-foundation-handoff) |

### INT-BASE-C01 — Complete inventory and reproducible baseline

1. Create the integration branch from the reviewed current base. Record branch,
   clean/dirty status, exact source SHA and teammate SHA in notes. Preserve existing
   untracked workspace/icon folders; they are not source to import automatically.
2. Fetch the teammate ref at implementation time if needed; compare its live delta
   with the pinned source before adopting it. Use a full local `git diff --name-status`
   and commit log from the actual merge base; the previous 300-file remote response
   is insufficient. No trial merge in the active working tree.
3. Produce a concise path disposition manifest in the notes/artifacts: keep, port,
   adapt, pilot-only. Include renamed/deleted files, generated types, migrations,
   binary assets, native targets, root/package files and tests. Account for each
   source group, not every generated package-lock line in prose.
4. Record current passing commands and outstanding failures from existing receipts;
   run a clean reproducibility baseline in the integration checkout. Distinguish
   preexisting failures/toolchain absence from regressions. Never copy ignored env,
   Keychain values, signing assets, `node_modules` or build outputs between branches.
5. Establish a simple integration artifact/notes location and provenance format.
   Keep original author/source references for selectively ported code.

**Validation/exit:** complete inventory, identified shared-file conflicts, retained
base boots/tests at its previous scope. Only branch/baseline tooling or necessary
reproducibility fixes accompany this commit; source ownership is reviewable.
**Failure:** do not reset or overwrite user work to obtain a clean baseline. Isolate
work in a worktree if necessary and record its relationship to the base.

### INT-BASE-C02 — Dependency, build and configuration reconciliation

The inspected base uses Expo `~58.0.21`, RN `0.88.1`, React `19.3.0` and Supabase
`^2.119.0` before reconciliation. Landing-page uses the same Expo/React line,
RN `0.88.0` and pinned Supabase `2.118.0`.

1. Keep the base's compatible RN/toolchain versions initially. Choose one exact
   Supabase SDK release after running both branches' real-SDK session/logout/link
   regressions against it; prefer the base resolved release if it passes. Do not
   downgrade merely to match a manifest comment or assume patch compatibility.
2. Add only consumed dependencies: AsyncStorage, crypto/URL support, browser/Apple
   adapters, SVG or gradients where imported by the selected UI. Resolve them
   against the existing Expo SDK. Preserve React Query, Expo Network/Image,
   component test presets, codegen and standalone build tooling from the base.
3. Regenerate the single root lockfile with the declared Node/npm versions. Check
   for duplicate React/RN/Supabase runtimes and unexplained lockfile churn. Keep
   workspace aliases/TS/Babel/Metro/Jest/Vitest resolution coherent for local modules.
4. Merge `app.config.ts` and native configuration explicitly. Preserve Android
   development package `com.hoosh.disconnect.dev`, manifest access disclosure,
   secure-storage backup exclusions, network policy, native modules and release
   guards. Add only needed Auth plugins; do not replace the plugin array wholesale.
5. List public environment names and disabled-provider switches in `.env.example`
   and relevant runbooks. Align scheme `disconnect-dev` and callback routes with
   Plan 01; production domain/bundle changes belong to owner-controlled setup.

**Validation:** fresh `npm ci`, typecheck, targeted storage/SDK tests, Android
manifest/module compile and standalone packaging guard. Inspect resolved versions.
**Exit:** one compatible dependency graph; no SDK or native-config regression.
Do not run `expo prebuild --clean` on tracked native projects.

### INT-BASE-C03 — Shared primitives, assets and test compatibility

1. Import original Auth/intro/onboarding/manual-plan assets and manifests, retaining
   Figma node/source/hash provenance. Check case-sensitive paths, SVG support,
   font registrations, image loading and production asset inclusion.
2. Compare shared buttons/fields/screen/safe-area/token changes. Adapt feature UI
   to existing primitives when possible; preserve supported busy/disabled/error,
   keyboard, icon and test behavior. Keep feature-specific dark Auth styling local
   rather than changing the warm main-app theme globally.
3. Resolve different test mock assumptions, native module registration and web
   suffixes. A fake Auth provider or picker may exist only in the isolated host/test
   tree and must remain unreachable from exported normal app routes.
4. Add only missing primitives actually consumed by the upcoming ports. Do not
   create a parallel design system or rewrite every screen for cosmetic consistency.
5. Preserve existing icon/asset work and build checks; don't automatically import
   user-untracked icon directories or remove artwork because a branch lacks it.

**Validation/exit:** asset integrity, isolated UI build and relevant component tests
pass; old screens retain their behavior. No new half-functional public routes.

### INT-BASE-C04 — Composition and native handoff seams

1. Define the final dependency direction with types/tests: one Auth producer → API
   client/account controller → verified native owner → shared weekly/quest/reward/
   History consumers. Public Auth routes must be outside private provider mounts.
2. Prepare `createAppRuntime` to accept the selected Auth port/actions rather than
   construct another client when Plan 01 supplies one. Preserve test injection,
   disposal, immutable snapshots and existing API recovery behavior. Keep the old
   working producer until Plan 01 switches atomically; never run both.
3. Define the narrow profile/signup-name handoff and onboarding progress repository
   seams needed by Plans 01/02. Use existing generated `ProfilePatch`, `SettingsPatch`
   and `PlanDraft`; implementation of the onboarding converter belongs to Plan 02.
4. Freeze native method groups against actual `ProductNativePort`, selection,
   weekly, quest, protection-reader and event decoders. Document which parts are
   Android-specific in representation: `decodeInterventionProtectionRead` currently
   requires Android/overlay capability constants; History HTTP/native decoders
   require `android_usage_events_v1`. If iOS needs a representation-neutral port,
   change it additively with Android consumer regressions; do not cast an incomplete
   permission-only bridge to the full product port.
5. Establish one adapter registry per platform. Unsupported groups stay absent
   and render unavailable; missing weekly support must not disable working quests.
   Do not invent universal parity flags or successful no-op writes.

**Validation:** root/provider dependency tests and contract-shaped fakes verify
one instance, no nested refresh owners, stale-scope rejection and missing-group UI.
**Exit/handoff:** names, types and owners are ready for AUTH/ONB/IOS, with no cycle
requiring all three implementations before any one can start.

### INT-BASE-C05 — Preserve existing end-to-end components and boundaries

1. Run the actual account-aware Home/Quests/History/Settings and editors through
   existing test hosts; ensure imported UI/primitives don't replace data consumers.
2. Cover root mount/unmount, API unavailable vs signed-out, failed `/v1/me`, same-
   user refresh, owner replacement and old async responses. Keep query invalidation,
   dirty drafts, uncertain saves, request IDs/receipts and native Stop behavior.
3. Exercise existing weekly + recurring-quest coexistence, reward/outbox replay
   guards and History unavailable states using existing deterministic suites.
   Add regressions only where reconciliation changes behavior or uncovered a defect.
4. Verify Android native module availability in debug and embedded-JS packaging.
   Preserve all QA isolation checks and reject runtime fallback to synthetic owners.
5. Do not rerun the entire physical Android matrix solely because assets changed.
   Native source/config changes do require the affected compile/behavior checks.

**Exit:** no lost base feature or undocumented behavioral change. If a regression
is found, fix it in this increment; do not mark the foundation complete and assign
it to an unspecified future integration plan.

### INT-BASE-C06 — Reproducible handoff and baseline publication readiness

1. Run `npm run check`, `npm run mobile:ui:build`, `npm run mobile:export` and
   relevant Android build/standalone checks on the integrated foundation. Database
   changes are not expected; verify generated HTTP contracts stayed unchanged.
2. Inspect final diff for accidental pilot SQL, secrets, native ID changes,
   missing test files, duplicate frameworks and unrelated deletions.
3. Update the source disposition manifest to actual landed paths/source SHAs.
   Record exact build/package versions and new foundation SHA in notes.
4. Hand off explicit module/runtime interfaces and remaining tasks to AUTH/ONB/IOS.
   Add source mappings to their notes when they start rather than copying large
   implementation histories into all files.
5. When publication is authorized, push and verify the Foundation workflow at the
   exact head. Local checks alone are not GitHub verification. No main merge or
   store deployment is implied by this preparation increment.

**Exit:** reproducible working foundation plus honest handoff. Auth/onboarding/iOS
are still planned until their respective increments actually land.

## Rollback and definition of done

Revert individual integration code commits on the integration branch where safe;
keep installed native stores/schema compatible and existing protection readable.
Dependency rollback includes the lockfile and relevant native lock metadata.
Never restore an older database or uninstall a real app as a code rollback.
BASE is done when its six ledger rows have code/evidence references, all preserved
features remain intact and no other plan needs to guess the composition contract.
