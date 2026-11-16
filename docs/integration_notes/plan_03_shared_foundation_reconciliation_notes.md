# Plan 03 — Shared foundation reconciliation

**Checkpoint:** INT-BASE-C04 checks complete. **Next part:** INT-BASE-C05 and parallel iOS source/signing audit. **Owner / reviewer:** Ishmum / Anisha per the shared plan. Anisha requested starting the integration. **Branch:** `integration/shared-product`. **C01 commit:** `59e4da9`. **C02 commit:** `d07a108`. **C03 commit:** `e411344`. **C04 commit:** Pending.

**Read on resume:** [execution order](../integration_plan/README.md), [foundation plan](../integration_plan/03_shared_foundation_reconciliation.md), and [notes workflow](README.md). Update this checkpoint and the owning ledger after each increment.

| Reference | Revision |
|---|---|
| App baseline, Ishmum's Android protection branch | `cee632c2c4c4230d6da240d6de574391bea0c996` |
| Anisha's committed landing-page source | `01c7a170e4027af3f96af876cf686f739bd2be2d` |
| Shared guide copied from origin/main | `ea0eb55c267ed3875af5cbf075cae619c8b89275` |
| Common implementation ancestor | `fe8f262170ff57e70018d0a842f9930404ba1e62` |

## INT-BASE-C01 — Establish the audited source baseline

Created a separate worktree from Ishmum’s implementation tip and brought over the five integration plans, their index and the notes workflow from main. The [path inventory](artifacts/base-c01-path-inventory.tsv) records 1,363 changes across both committed source trees relative to their common ancestor, including additions, deletions and rename pairs. Its dispositions are preliminary routing by path, to be reviewed before each selective port.

- **BASE-C02–C06:** Compare the root lockfile, manifests and native development configuration, then reconcile shared assets and interfaces and verify the foundation.
- **AUTH:** Reconcile the two root layouts and session producers. Port Anisha’s public routes and controller while preserving the working account/API and native ownership boundaries.
- **ONB:** Port Anisha’s onboarding and plan UI against the existing settings and selection contracts. Her working tree also contains uncommitted suggested-plan, Android reader and documentation changes. Review that diff and its two new suggestion files before porting. The chart’s shared cap and the Android engine’s per-app allowance semantics need reconciliation before Apply.
- **IOS / VERIFY:** Keep the standalone Swift work and unrelated local DashboardTypography.swift edit in the source checkout. Use the signed-host plan when its prerequisites are met and verify the packaged Android and iPhone journeys at their respective gates.

### Validation and next action

At C01, the source checkout was on `landing-page` with working edits. The integration branch now resides in the main repository checkout. Baseline checks run in the integration worktree with its own dependencies. The [commit inventory](artifacts/base-c01-commit-inventory.txt) records the divergence (`<` is landing-page and `>` is the retained baseline).

| Check | Result |
|---|---|
| `npm ci` | Passed on Node 24.13.0 and npm 11.6.2. The repo pins Node 24.20.0 in `.nvmrc`. |
| `npm run typecheck`, `npm run lint` | Passed with four existing mobile lint warnings. |
| `npm run mobile:check-assets`, `npm run mobile:check-standalone`, `npm run mobile:export` | Passed. |
| `npm test` | 553 Vitest tests passed. 807 Jest tests passed and two were skipped. |
| `npm run api:lint`, `npm run api:test`, `npm run api:check-contracts` | Passed. The default API suite ran 682 tests and deselected 287. Generated contracts matched. |

Interactive startup, connected sign-in, live database checks and signed-device runs remain unverified in this checkout.

## INT-BASE-C02 — Dependency and configuration reconciliation

Fetched landing-page at `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1` for this increment. The delta since the C01 inventory adds the suggested-plan implementation and related notes. Use that committed revision as the starting source when the onboarding port begins.

- Pinned the retained Supabase SDK to 2.119.0 after the landing-page qualification run. The lockfile changes only the workspace dependency declaration. Retained Expo ~58.0.21, React 19.3.0 and React Native 0.88.1, with the base Query, Secure Store, Image, Network and build/test tooling.
- Both app configs already use `disconnect-dev`. Retained the Android development application ID, backup rules and blocked permission declarations. The reviewed landing-page callback forms are `disconnect-dev://auth/callback`, `http://localhost:8081/auth/callback` and `http://localhost:8090/auth/callback`. Apply route-specific callback handling in AUTH-C03.
- Documented the three public provider switches with false defaults in the example env. Add native Apple, browser, crypto or other dependencies with the corresponding imports and tests in the feature increments. The Apple entitlement and platform signing configuration are part of the iOS handoff.

### Checks

- Regenerated the root lockfile and ran a clean install with the pinned Node 24.20.0 and npm 11.19.0.
- Ran seven landing-page auth suites from an isolated source snapshot against the integration dependency tree. All 48 tests passed, including the real-SDK local logout and late refresh test, callback correlation and storage.
- Integration typecheck passed after regenerating the ignored Expo Router declarations from the current branch with `expo customize tsconfig.json`. The original workspace still had generated route types from landing-page.
- All 553 integration mobile unit tests and all six Android standalone configuration guard tests passed. `npm ls` reported only the selected React, React Native, Supabase JS and Supabase Auth versions.
- Android `:app:processDebugMainManifest` and `:hoosh-usage:compileDebugKotlin` passed with the existing deprecation and manifest warnings. Inspected the merged debug manifest for application ID, Usage Access, overlay exclusion, Secure Store backups, network policy and URL scheme. Confirmed the corresponding public Expo configuration.
- Device permission behavior and hosted provider sign-in remain part of the later acceptance steps.

Next, **INT-BASE-C03** brings over the original Auth and onboarding assets and reconciles the shared UI primitives and test setup.

## INT-BASE-C03 — Shared artwork and UI compatibility

**Date:** 2026-11-15. **Branch:** `integration/shared-product`. **Starting revision:** `d07a108`. **Commit:** Pending. **Plan:** [C03](../integration_plan/03_shared_foundation_reconciliation.md#int-base-c03--shared-primitives-assets-and-test-compatibility).

- Copied the complete `apps/mobile/assets/{auth,intro,onboarding}` trees from Anisha’s landing-page `b6d61df5c8a2c1eacbe28a38e06b84b5bcd368d1`. The original SVGs, PNGs and five manifests retain their source frame/node IDs and recorded hashes. The new `apps/mobile/assets/integration-assets.json` pins exact paths and SHA-256 hashes for all 59 files, including originals whose hashes were absent from the source manifests. No preexisting design assets changed.
- Extended `scripts/check-design-assets.mjs` to verify the imported bytes and exact path casing alongside the original asset checks. The existing production export check still verifies the current navigation artwork.
- Added the 38 display assets to the existing isolated gallery in `apps/mobile/dev/ui/asset-gallery.tsx`. The gallery excludes full-frame and vector-source originals. The product bundle gets the artwork through real screen imports when those routes are ported.
- Both branches use the same four registered Space Grotesk weights. Keep the shared Button press guard, controlled Field behavior, Screen safe areas and local dark theme. Auth and onboarding retain their keyboard, focus and error ownership when ported. Use existing `DesignArtwork`/`expo-image` for local artwork where it reproduces the source, and the available PNG renders for Auth/intro/plan art. Landing-page's SVG XML helper and test mocks were reviewed as source references. Prefer static SVG imports and the shared safe-area mock in the receiving screens. Signed-device decoding and layout remain acceptance checks.

### Verification

- All 59 imported paths/hash checks and all 71 existing asset checks passed. Independently compared the hashes in each of the five source manifests.
- The isolated Vite build contains all 38 display assets byte-for-byte. The production web export retained all eight navigation originals and passed isolation across 38 app JavaScript/HTML files.
- Typecheck passed. Lint passed with the same four existing warnings. No app route, native project, dependency or test mock changed.
- All 50 targeted Jest checks passed for Button, Field, Screen, RouteButton and Settings across the two configured projects.

Next, **INT-BASE-C04** defines how the root layout, auth session, onboarding and native adapters connect. Once those interfaces are agreed, begin the iOS source and signing review alongside Android work. Native integration and signed-device acceptance remain later steps.

## INT-BASE-C04 — App composition and native handoff

**Date:** 2026-11-15. **Branch:** `integration/shared-product`. **Starting revision:** `e411344`. **Commit:** Pending. **Plan:** [C04](../integration_plan/03_shared_foundation_reconciliation.md#int-base-c04--composition-and-native-handoff-seams).

| Interface | Handoff |
|---|---|
| `infrastructure/auth/runtime.ts` | `createAppRuntime(producer)` takes one `AppAuthProducer`. The API client and account controller use its same auth port. An omitted producer creates the current baseline SDK. Only the selected producer handles SDK refresh and lifecycle. AUTH will supply its producer in the root when ready. |
| `features/account/session-boundary.tsx` | The root can render public content with the shared runtime context outside the private query, account, native owner, and weekly providers. AUTH will decide route/guard ordering and may hold private providers detached during account recovery even when Supabase has a session. The current login fallback remains active for the existing root. |
| `features/account/signup-name-handoff.ts` | AUTH-C05 supplies a verified-account signup draft with a stable ID. Explicit review and the existing revision-checked `ProfilePatch` mutation stay in the profile owner. Clear by draft ID after a confirmed save or explicit discard. |
| `features/onboarding/progress-repository.ts` | ONB-C01 supplies installation-local, account-scoped storage and stale-operation fencing. The interface distinguishes missing, failed and incompatible reads. The record uses approved `SettingsPatch` activities and `PlanDraft`, revision receipts and permission deferral. Plan 02 owns conversion and persistence. |

### Native registry and payloads

The platform-resolved `infrastructure/native/product-ports` entry is the registry. Android binds the checked HooshUsage bridge with explicit methods and retains its JSON serialization for quest metadata. iOS and web currently resolve to the unavailable entry. `NativeOwnerBoundary` still binds only after matching the current account with `/v1/me`. Its handles are scoped to the current account generation, and cleanup does not remove installed rules.

| Method group | Scope |
|---|---|
| Owner and selection | `interventionOpen/Release/EndOwner/ClaimOwner`, `selectionBegin/Pick/Commit/Release/EndOwner/Read`. Preserve explicit claims and owner-scoped handles. |
| Quest | `questRead/Apply/Cancel` and access review use the existing quest request and receipt types. |
| Weekly | `scheduleRead/Preview/Apply` and `interventionCancel` are available together. Missing weekly support leaves Android quests and selection usable. |
| Optional reads and sync | `historyRead/Start/Stop`, `rewardsRead/Ack`, and `openUsageAccess` reflect actual methods. Unsupported actions stay unavailable. |
| Platform-specific representations | `decodeInterventionProtectionRead` requires Android overlay capability data. History native and HTTP decoders currently require `android_usage_events_v1`. Before adding iOS support, extend only the relevant contracts and decoders with actual supported representations and Android regressions. A permission bridge by itself cannot satisfy `ProductNativePort`. |

The iOS source and signing audit may start once this boundary is accepted. Native changes land after C06. No provider configuration or device permission changed during C04.

### Verification and next step

- All 554 mobile unit tests and 73 targeted component/native-adapter tests passed locally. The new tests cover supplied Auth without default SDK creation, public content without private context, and stale private scope rejection when recovery detaches it. Existing tests exercise account replacement, app lifecycle cleanup, verified native owner handling and Android quests with weekly support absent.
- Typecheck and production web export passed, including developer preview isolation and artwork integrity. Lint reported four existing warnings.
- C05 exercises the retained end-to-end components and normal account boundaries. The iOS audit may now inspect source and signing alongside this work. Live providers, packaged binary behavior and signed phones remain later acceptance gates.
