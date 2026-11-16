# Integration implementation knowledge base

**Established:** 2026-11-15. **Purpose:** retain implementation context for Ishmum,
Anisha and AI agents across commits, chats, interruptions and context-window limits.
The [integration index](../integration_plan/README.md) defines intended work; this
folder will record what actually changed and why. No integration implementation
or acceptance is claimed by creating this folder.

Follow the existing
[core implementation knowledge-base rules](../core_plan_implementation_notes/README.md).
The requirements below apply to these five integration plans, including corrective,
test, config and documentation commits. Original core-plan notes remain historical;
link them rather than moving or duplicating their histories.

## Notes files and ownership

Create a plan's notes file **before implementing its first increment**. Keep one
file per plan, with a current resume checkpoint at the top and a heading per commit.

| Plan | Notes filename | Primary writer |
|---|---|---|
| 01 Auth | `plan_01_auth_app_integration_notes.md` | Anisha; Ishmum records his consumer changes |
| 02 Onboarding | `plan_02_onboarding_backend_protection_notes.md` | Implementing owner, with named UI/persistence reviewer |
| 03 Foundation | `plan_03_shared_foundation_reconciliation_notes.md` | Ishmum |
| 04 iOS | `plan_04_ios_native_integration_notes.md` | Anisha |
| 05 Verification | `plan_05_combined_app_verification_notes.md` | Executing platform/scenario owner |

Start or resume at the [foundation checkpoint](plan_03_shared_foundation_reconciliation_notes.md).
Create other notes files when their first increments begin. Planning decisions are
in the plan index.

## Start/resume checklist

1. Read current context entry point, integration index, relevant core contracts/
   product decisions, selected plan and this workflow.
2. Inspect current branch/worktree, both relevant source SHAs and any newer source
   changes. Account for unrelated local edits; don't reset or silently import them.
3. Read the selected notes checkpoint and relevant previous commit entries. Check
   actual source/Git rather than trusting an old "uncommitted" or "complete" label.
4. Identify one unfinished stable part ID and its required handoff. Coordinate
   ownership for root/layout/config/contract/native/migration files before edits.
5. Implement its substantial scope, record changes as you go and run meaningful
   checks. Keep discovered corrections within the owning part ID.
6. Before interruption, update checkpoint, plan ledger, evidence and next action.
   Include any active test server/device state and outstanding cleanup.

## Required resume checkpoint

Use a compact block containing:

- Plan link, current part ID, owner/reviewer, branch and starting/current commit.
- Integration-base and teammate-source SHAs actually consumed; provenance deltas.
- Implemented behavior, current passing/failing/pending evidence and next action.
- Real-account/platform/permission resources still needed; respect prior deferrals.
- Active device/build/server/test fixture state, changed settings and cleanup status.
- Interfaces handed off to another plan and any compatibility/policy decisions.

The checkpoint is current; earlier commit entries are historical and should not
be rewritten just because line numbers or behavior change later.

## Required per-commit entry

```md
## INT-<AREA>-C0N — Purpose of this commit

Date: YYYY-MM-DD
Owner / reviewer: Ishmum or Anisha / ...
Branch: ...
Commit message: ...
Commit: Pending (record actual hash in next normal update)
Source provenance: teammate SHA/path(s), base SHA, adopted/adapted behavior
Plan: ../integration_plan/<plan>.md#<part-anchor>

### Changes

| File and lines at this commit | Change and reason |
|---|---|
| apps/mobile/src/example.ts: lines 25–59 | Explain the logical change, its user effect and why it is needed. |

### Decisions and relationships

State authority, alternatives/tradeoffs when meaningful, contract consumed/produced,
other part unblocked and account/native/data implications.

### Validation

Commands actually run, versions/build/SHA, actual outcomes and evidence links.
Separate deterministic, hosted-account, native, physical and packaged-build checks.

### Remaining and handoff

Failures/unrun checks, reason/owner, compatible rollback, cleanup and exact next task.
```

Account for **every changed file and every logical change**, not just the main
feature: implementation, tests, manifests, lockfiles, native project files,
generated output, fixtures, scripts, docs, moves and deletions. Use repository-
relative paths and actual line ranges from the referenced commit. Distinct changes
in one file get distinct explanations. Describe a generated/lockfile range as a
group, including the generator/command and dependency reason; don't narrate every
generated line.

For deletions reference parent commit/path/range; for moves give old/new paths and
edits. Record source-author/commit provenance for ports. Notes ship in the same
commit as their code. The commit cannot contain its own final hash: leave `Pending`
and record it in the next normal update, never invent a hash or an endless chain
of notes-only commits.

## Evidence and completion discipline

- Use plan ledgers for summary status/commit links; notes contain detailed changes,
  reasoning and resume context. Update relevant existing core IDs with scoped
  evidence, not duplicate or renumber them.
- Label observations as current, source-inspected, recorded by teammate, mocked,
  local HTTP, hosted real account, simulator, physical device or packaged build.
  A planned scenario or external report cannot become a newly passed check.
- Store compact sanitized evidence under `docs/integration_notes/artifacts/` only
  when useful; no need to create empty artifact directories. Large screenshots/
  binaries/builds stay in suitable ignored local output with reproducible references.
- Include exact tested source/build identity. If code changes afterward, previous
  evidence is historical until the affected checks rerun. Record GitHub checks
  separately from local/device evidence and only after actually verifying them.
- Never put secrets, participant identity/answers, raw tokens/app selections or
  secret-bearing callback URLs in Markdown or public artifacts. Use account A/B/C
  labels and fixed error categories; keep necessary private fixtures ignored.
- TalkBack remains separately deferred. Preserve existing accessibility behavior;
  don't schedule it again by default or imply it was completed by ordinary testing.
- If real accounts/iOS/deletion remain unavailable/deferred, continue independent
  work and record the blocked rows. Don't mark mandatory platform acceptance done.

## Planning setup record — documentation only

Owner: Ishmum's engineering agent, at his request. Date: 2026-11-15.
Branch: `task/react-native/android-protection-lifecycle`.
Starting commit: `cee632c2c4c4230d6da240d6de574391bea0c996`.
Commit status: not committed by this documentation task.

Created the five integration plans/index and this workflow, and linked the new
execution path from the existing context/core index. Detailed file/range inventory
and documentation validation are recorded below after the drafting review. No
runtime, dependencies, database, native project, device settings or branch changed.

### Planning file inventory

Ranges below refer to this uncommitted documentation snapshot. Resolve them by
this setup record and Git history after its eventual documentation commit.

| File and lines | Change and reason |
|---|---|
| `docs/integration_plan/README.md`: lines 1–189 | Define pinned branch sources, five-plan scope, execution order, ownership, architecture baseline, evidence rules and original core-plan mappings for agents. Main shares the docs; implementation starts from the reviewed working app branch. |
| `docs/integration_plan/01_auth_app_integration.md`: lines 1–229 | Plan six Auth increments covering the single session authority, forms/callbacks, root/account/native composition, signup-name/session upgrades and verification. |
| `docs/integration_plan/02_onboarding_backend_protection.md`: lines 1–244 | Plan six increments for account-scoped resume, exact field mapping, revision-aware saves/recovery, actual selection/permission, explicit Apply and setup acceptance. |
| `docs/integration_plan/03_shared_foundation_reconciliation.md`: lines 1–198 | Plan six foundational increments for complete source inventory, dependency/config reconciliation, assets/primitives, composition seams, regression protection and handoff. |
| `docs/integration_plan/04_ios_native_integration.md`: lines 1–273 | Plan six iOS increments covering host/signing/feasibility, native storage/owners, selection/status, schedule/quest semantics, event/measurement boundaries and physical signed-app acceptance. |
| `docs/integration_plan/05_combined_app_verification.md`: lines 1–259 | Define V01–V24 journey/deferral matrix and six verification increments, including real A/B accounts, packaged builds, platform evidence and exact-head CI. |
| `docs/integration_notes/README.md`: lines 1–194 | Establish per-plan filenames, checkpoints, per-commit every-file/line notes, provenance/evidence rules, planning-only setup record and separate documentation-publication handoff. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7–15 | Link the integration plans/workflow from the shared agent entry point and identify BASE-C01 as the first task without changing existing completion/deferral status. |
| `docs/core_plan/README.md`: lines 3–8 | Make integration discoverable from core plans while preserving original task IDs and acceptance records. |

### Planning review and validation

- Inspected both branches' source/manifests/contracts and current decision/notes
  workflow. Rechecked live teammate head `01c7a170e4027af3f96af876cf686f739bd2be2d`;
  no Git refs were updated and no checkout/merge was performed.
- Identified dual session/root owners, local-only onboarding, pilot anonymous Auth
  and policy/schema differences, Android-specific status decoder and History source.
  Plans assign each conflict to an existing stable integration increment.
- Documentation checks: local Markdown link destinations, six unique matching
  commit headings/ledger rows in each of five plans, Markdown fences, trailing
  whitespace, and `git diff --check`. These check docs, not runtime functionality.
- No app tests/builds/device/Supabase mutations were needed for this docs-only task.
  Future implementation must record actual outcomes rather than reuse this as proof.
- Next action: review/implement INT-BASE-C01 when requested; create its plan notes
  before code. Nothing was committed, pushed, merged or deployed by this task.

## Documentation publication — plans shared on main

**Requested:** 2026-11-15, Ishmum explicitly asked to commit/push the plans to main
so Anisha can implement the connecting work. **Status at commit preparation:**
publication/checks pending; final results belong to Git/GitHub and the delivery
report. **Commit message:** `docs: publish shared product integration plans`.

Publish only these seven new integration documents and the two entry-point link
insertions. Preserve main's existing context/core index content; do not merge the
Android/backend implementation branch. An isolated main-based worktree carries
the documentation change while the original checkout stays on its working branch.
Untracked icon packs and workspace configuration are outside this publication.

The integration index now tells Anisha explicitly that main's shared documentation
does not include the newer application source. Begin implementation from the
reviewed Ishmum source branch and consume the pinned/rechecked teammate source.
No runtime, credentials, hosted database or native project changes are authorized
as part of this documentation publication. Validate main's documentation snapshot
and verify its exact pushed commit's GitHub workflow separately from prior app CI.
