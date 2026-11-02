# Implementation knowledge base

**Agreed by:** Ishmum, 2026-10-29. This workflow applies to both Ishmum and Anisha and to every plan started from now on.

## Purpose

Keep implementation knowledge in the repository so work can continue across chats,
AI agents, context-window limits and developer handoffs. A new agent must be able to
read this folder, inspect the corresponding plan and code, and understand how far
the work has progressed, what changed, why it changed and what should happen next.
Important decisions and evidence must not exist only in a chat or an agent's memory.

## How the documents fit together

| Location | What it records |
|---|---|
| [Context documents](<../Context (AGENT)/AGENT_START_HERE.md>) | Product goals, architecture, engineering ownership and unresolved PM questions. PRD/TSD/decision records remain the product/technical references. |
| [Core plans](../core_plan/README.md) | Intended work, dependencies, stable part IDs, commit-sized scope and acceptance criteria. Each plan's ledger is the summary of implementation status and actual commit/evidence references. |
| This folder | Detailed implementation history: every commit's changes, file/line locations, decisions, reasoning, checks, limitations and next step. It adds detail to the ledger rather than replacing it. |
| Git and current source | Actual committed changes and current behavior. Notes must agree with the code, branch and history; prose cannot prove behavior that was never implemented or tested. |

If these disagree, inspect the code/history, explain the discrepancy and correct the
affected documents. Do not silently turn a proposal, fixture, UI preview or unrun
acceptance check into completed functionality. A product assumption remains unresolved
until agreed and recorded in the [PM questions](<../Context (AGENT)/PM_QUESTIONS.md>)
and appropriate decision/product documents.

## Start a plan

1. Read the context entry point, execution index, shared contracts, relevant plan and
   its prerequisites. Check the actual branch, worktree and affected code.
2. Before implementing a newly started plan, create one notes file here named
   `plan_<number>_<plan_slug>_notes.md`. Continue using it throughout that plan;
   do not create separate files for every chat or every part.
3. Record the owner, plan link, current part, branch, starting commit, current status
   and the next concrete action. Preparation alone is not implementation completion.
4. Work through the plan's parts one commit-sized change at a time. Use the accepted
   interfaces and coordinate shared files with the other developer.

Plan 04's prepared record is
[plan_04_react_native_integration_notes.md](plan_04_react_native_integration_notes.md).
RN-01 implementation has **not** started. When Anisha starts Plan 02, she creates
`plan_02_auth_onboarding_notes.md`; when either developer starts Plan 01, use
`plan_01_supabase_foundation_notes.md` and label each entry's owner/part. Shared plans
still have one notes file and one named author per overlapping change. Create the
remaining records when those plans actually begin, not as invented implementation history.

## Record every commit

Give each commit its own heading containing the plan part ID and a clear purpose.
Include the commit message, date, author/owner, branch, scope and actual commit hash
when available. Cover corrective, test, configuration, dependency and documentation
commits as well as new feature code.

Under that heading, account for **every changed file and every logical change**:

- Repository-relative filename and exact line range, for example
  `apps/mobile/src/components/ui/field.tsx: lines 25–59`.
- One or two sentences explaining what changed, what behavior it enables/fixes and
  why the choice was made. Add more explanation when the decision warrants it.
- Separate entries for distinct changes in the same file. Include tests, package
  manifests, lockfiles, generated outputs, documentation, file moves and deletions.
- Relevant relationships: which interface is consumed, which part is unblocked,
  account/lifecycle implications, edge cases and any deviation from the plan.

Use line ranges from the referenced commit. For a deletion, give the old path and
range from its parent commit; for a move, give old and new paths and explain any
content edits. Historical line references may move later: preserve them with their
commit context rather than rewriting the history to match the latest file.

An entry travels with its code in the same commit. Before committing, use an honest
`Pending` hash/status. The commit's own hash cannot be embedded in its contents;
record it in the next normal notes update when available, and use the entry's
part/message plus Git history to resolve it in the meantime. Do not invent a hash
or create an endless chain of notes-only commits to record each other's hashes.
For the documentation setup below, the unique commit message is its Git reference.

Each entry also records:

- **Decisions and reasons:** meaningful tradeoffs, changed assumptions and rejected
  alternatives when they explain the final approach.
- **Validation:** exact commands actually run, outcomes and what they cover. Separate
  automated tests, visual/browser checks, native builds and physical-device results.
- **Remaining/unverified work:** tests not run, failures, blockers and acceptance
  still pending. Include actual environment/build versions where relevant.
- **Handoff/next step:** what the other developer or a new agent can now consume,
  and the next concrete task. Update the plan's existing ledger consistently.

The Plan 04 notes contain a reusable entry template. Keep this folder free of
passwords, tokens, private signing material, personal test-account data and
secret-bearing callback URLs. Store configuration names and redacted evidence instead.

## Resume with a new chat or agent

1. Open [AGENT_START_HERE.md](<../Context (AGENT)/AGENT_START_HERE.md>) and
   [the execution index](../core_plan/README.md) to establish context and ownership.
2. Read this workflow, the selected plan/ledger and its implementation notes. Start
   with its resume checkpoint and then read the relevant commit entries.
3. Check `git status`, the current branch and commit history. Inspect the referenced
   source/line ranges at the relevant commit and the current implementation. Account
   for local uncommitted work and changes from the other developer.
4. Continue the next unfinished part within its prerequisites. Do not repeat completed
   setup or discard an earlier decision merely because the previous chat is unavailable.
5. Update notes and ledger as work proceeds; before stopping, leave a truthful checkpoint
   with current status, validation, blockers and next action.

Each developer documents their own changes and coordinates shared files. Ishmum
owns shared RN/Android/backend/product database work; Anisha owns Supabase Auth,
mobile Auth/onboarding and iOS. Both can build independently against the agreed
contracts and record joint integration acceptance when real wiring is exercised.

## Documentation setup commit — context relocation and knowledge-base workflow

**Commit message / Git reference:** `docs: relocate context and establish implementation knowledge base`.

**Date:** 2026-10-29. **Owner:** Ishmum. **Target branch:** `main`.

**Scope:** Publish the moved context files and this shared workflow before RN-01
implementation. Preserve the upstream legacy iOS import `fe8f262`; its presence is
now documented without claiming an audit, signed build or RN integration.

| File and lines in this documentation commit | Change and reason |
|---|---|
| `README.md`: lines 3 | Point the repository entry point at the relocated context/PM files and the new knowledge-base workflow so either developer can discover them. |
| `README.md`: lines 13 | Describe missing functionality specifically for the shared RN/FastAPI foundation; imported legacy iOS behavior is separate from completed integration. |
| `README.md`: lines 65 | Record legacy iOS source import fe8f262 and the remaining signing/build/audit requirements; preserve the instruction against destructive native regeneration. |
| `README.md`: lines 116 | Change the next iOS action from obtaining source to auditing the imported source. |
| `apps/mobile/src/infrastructure/native/README.md`: lines 10 | Update the unresolved-policy reference to the relocated PM question file; native enforcement boundaries are unchanged. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 1–132 | Move from `docs/AGENT_START_HERE.md` into the user's shared context folder. Content adjustments are listed separately below. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7 | Refresh the checkout date/source availability and repair the repository README link. Importing Swift source does not prove RN/native build acceptance. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 9–11 | Repair architecture/plan links and require per-plan/per-commit notes before implementation, including a resume checkpoint for replacement agents. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 35–36 | Update the agent prompt with the new context paths, workflow and plan notes; require inspection of actual imported native targets when relevant. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 53–55 | Make note creation, complete file/line change records, actual validation and synchronized ledger/checkpoint updates explicit task steps. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 116–118 | Correct the check guidance: migrations remain absent, but legacy native source now exists and still needs build/integration evidence. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 123–124 | Add the knowledge-base workflow to the artifact index so the persistent handoff process is discoverable. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 126 | Repair the relocated agent entry point's architecture decision link. |
| `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 130 | Repair the relocated agent entry point's core execution-index link. |
| `docs/Context (AGENT)/OPEN_DECISIONS.yaml`: lines 1–74 | Move from `docs/OPEN_DECISIONS.yaml` into the user's shared context folder. Content is unchanged. |
| `docs/Context (AGENT)/PM_QUESTIONS.md`: lines 1–279 | Move from `docs/PM_QUESTIONS.md` into the user's shared context folder. Content is unchanged. |
| `docs/Context (AGENT)/PRD.md`: lines 1–404 | Move from `docs/PRD.md` into the user's shared context folder. Content is unchanged. |
| `docs/Context (AGENT)/TSD.md`: lines 1–1182 | Move from `docs/TSD.md` into the user's shared context folder. Content adjustments are listed separately below. |
| `docs/TSD.md (parent fe8f262; removed)`: lines 89 | Remove the obsolete root-level agent-file entry from the illustrative repository tree. |
| `docs/Context (AGENT)/TSD.md`: lines 161–163 | Show the actual context, core-plan and implementation-notes folders in the repository layout. |
| `docs/Context (AGENT)/TSD.md`: lines 185 | Rebase the contracts-package link after moving the TSD one directory deeper. |
| `docs/Context (AGENT)/TSD.md`: lines 187–188 | Rebase the accepted-decision and Plan 00 links after moving the TSD. |
| `docs/Context (AGENT)/TSD.md`: lines 207 | Rebase the canonical native contract source link after moving the TSD. |
| `docs/Context (AGENT)/TSD.md`: lines 588 | Rebase the M1/M2 HTTP contract link after moving the TSD. |
| `docs/Context (AGENT)/TSD.md`: lines 663 | Rebase the authentication implementation-plan link after moving the TSD. |
| `docs/Context (AGENT)/TSD.md`: lines 721 | Rebase the database section's HTTP contract link after moving the TSD. |
| `docs/architecture/foundation-handoffs.md`: lines 6–7 | Require both developers to follow the shared notes workflow before implementing a new plan. |
| `docs/architecture/foundation-handoffs.md`: lines 87–89 | Distinguish the ledger's summary status/evidence from notes containing every commit's detailed changes, reasons and resume checkpoint. |
| `docs/architecture/identity-foundation.md`: lines 49–52 | Replace the outdated missing-source statement with the fe8f262 legacy import and retain the unaudited/unintegrated status. |
| `docs/core_plan/00_shared_contracts.md`: lines 28 | Distinguish absent shared RN adapters from the imported legacy Swift source; audit and bridge integration remain pending. |
| `docs/core_plan/00_shared_contracts.md`: lines 30 | Update the unresolved decision-register path to its new context-folder location. |
| `docs/core_plan/02_auth_onboarding.md`: lines 7 | Repair the Auth plan's PM question link for Anisha after context relocation. |
| `docs/core_plan/04_react_native_integration.md`: lines 8–10 | Repair the PM link and make the workflow/Plan 04 notes mandatory entry points without marking RN-01 implemented. |
| `docs/core_plan/04_react_native_integration.md`: lines 50 | Update the native-project observation for the legacy iOS import while retaining the outstanding audit/build/adapter requirements. |
| `docs/core_plan/README.md`: lines 6 | Repair the execution index's PM question link after context relocation. |
| `docs/core_plan/README.md`: lines 10 | Require reading/creating the selected plan's implementation notes before coding. |
| `docs/core_plan/README.md`: lines 56 | Update Anisha's native investigation action to audit the imported source. |
| `docs/core_plan/README.md`: lines 87 | Require complete per-commit change notes alongside the existing ledger, with actual validation and truthful remaining work. |
| `docs/core_plan/README.md`: lines 98 | Clarify that the remaining native gate is audit/signing/signed-build evidence, not simply possession of the imported source. |
| `docs/core_plan_implementation_notes/README.md`: lines 1–176 | Create the shared workflow: purpose, source-of-truth relationships, naming, per-commit file/line detail, reasoning, validation, cross-chat resume steps and this setup history. |
| `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 1–72 | Publish the prepared Plan 04 record with owner/branches, unstarted RN-01 status, current context links, recording rules and a reusable per-commit template. No application implementation is claimed. |

**Decisions:** Preserve the user's `docs/Context (AGENT)/` folder name, repair relative
links and make the knowledge base discoverable from the repository/context/plan
entry points. Publish Plan 04's preparation record without marking RN-01 started.

**Validation:** Local documentation links, stable plan IDs and change-reference line
ranges were checked; `git diff --cached --check` passed before committing. No runtime
tests or native builds were run for this documentation-only change.

**Next:** Pull the shared documentation on Anisha's checkout. Sync the prepared RN
area/task branches with `main`, then begin RN-01 when requested and maintain the
Plan 04 record for its implementation commits.
