# Plan 03 — Shared foundation reconciliation

**Checkpoint:** INT-BASE-C02 checks complete. **Next part:** INT-BASE-C03. **Owner / reviewer:** Ishmum / Anisha per the shared plan. Anisha requested starting the integration. **Branch:** `integration/shared-product`. **C01 commit:** `59e4da9`. **C02 commit:** Pending.

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
