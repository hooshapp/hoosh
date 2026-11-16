# Plan 03 — Shared foundation reconciliation

**Checkpoint:** INT-BASE-C01 inventory and automated checks complete. **Next part:** INT-BASE-C02. **Owner / reviewer:** Ishmum / Anisha per the shared plan. Anisha requested starting the integration. **Branch:** `integration/shared-product`. **Commit:** Pending.

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

The source checkout remains on `landing-page` with its working edits. Baseline checks run in the integration worktree with its own dependencies. The [commit inventory](artifacts/base-c01-commit-inventory.txt) records the divergence (`<` is landing-page and `>` is the retained baseline).

| Check | Result |
|---|---|
| `npm ci` | Passed on Node 24.13.0 and npm 11.6.2. The repo pins Node 24.20.0 in `.nvmrc`. |
| `npm run typecheck`, `npm run lint` | Passed with four existing mobile lint warnings. |
| `npm run mobile:check-assets`, `npm run mobile:check-standalone`, `npm run mobile:export` | Passed. |
| `npm test` | 553 Vitest tests passed. 807 Jest tests passed and two were skipped. |
| `npm run api:lint`, `npm run api:test`, `npm run api:check-contracts` | Passed. The default API suite ran 682 tests and deselected 287. Generated contracts matched. |

Interactive startup, connected sign-in, live database checks and signed-device runs remain unverified in this checkout.

Start **INT-BASE-C02** by comparing manifests, lockfile and Expo/native config. Preserve the base Android application ID and protection settings, and run both branches' auth regressions against the proposed shared Supabase SDK before choosing a version. The retained base resolves Supabase 2.119.0 and React Native 0.88.1. Landing-page uses Supabase 2.118.0 and React Native 0.88.0.
