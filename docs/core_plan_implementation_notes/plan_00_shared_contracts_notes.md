# Plan 00 — Shared Contracts Implementation Notes

**Owner:** Ishmum. **Plan:** [00_shared_contracts.md](../core_plan/00_shared_contracts.md).
**Branch:** `task/docs/pm-answer-reconciliation`. **Parent:** `90cdc44`.
**Current part:** SC-01–04 documentation follow-up: PM responses reconciled.
**Updated:** 2026-11-09. Documentation only; runtime/contracts/schema unchanged.

## Resume here

The supplied Q02–Q22 responses are reconciled: four questions Answered, 17 Partial,
Q01 Unanswered. Read [ADR v1](../architecture/pm-decisions-2026-11-09.md) and the
[register v2](<../Context (AGENT)/OPEN_DECISIONS.yaml>) before implementing product
behavior. Explicit per-app/global-selection/account/tone choices override old
proposals; missing details remain gates. Next RN08-D03/RN-09f: define durable native
owner/group/revision and picker draft versus editor Save/Cancel, then wire the
existing Apps editor. Global versus per-quest scope is settled; active-occurrence
edits and account ownership/deletion are not. Auth/tokens stay user-deferred;
Anisha owns Auth/onboarding/root/iOS. Full parent status/counts remain unchanged.

Original Plan 00 implementation is `0b50900`; its original history is in the
[knowledge-base workflow](README.md) and Git. This file starts with this follow-up,
without fabricating past entries. Previous preview is `90cdc44`; evidence is not
rerun or reclassified by the PM responses. No app implementation starts here.

## SC-01–04 follow-up — Reconcile PM product answers

**Commit:** `docs: reconcile PM answers and update implementation gates`.
**Hash:** Pending; resolve by subject/Git and record in the next normal update.
**Date:** 2026-11-09. **Owner:** Ishmum. **Parent:** `90cdc44`.
**Status:** Documentation reconciliation complete within explicit/partial choices.
2026-11-09 is the recording date; individual respondent name/answer dates were not
supplied. No Anisha review, release approval or platform feasibility is implied.

### Decisions and reasons

Preserve the user-supplied appended responses verbatim, then put interpreted answers,
remaining questions and stable register references beside Q02–Q22. A response is
not automatically complete: Q10 answers repeating templates, not occurrence release;
Q04/Q08/Q14 disagree on the streak reset point. Q01 remains genuinely unanswered.
Do not turn the suggested pause control into a requirement, the ring remark into a
feature, or example founder totals into measured results. Keep feed price, forecast
formula and launch providers unresolved. Requested demographic collection does not
answer mandatory-versus-skip/minimum-age; preserve the existing UI until defined.

Version the register and add PD-18–26 only for topics not covered by PD-01–17.
Keep old IDs/topics/recommendations, labeling recommendations historical and adding
explicit accepted choices/remaining gates. There are 26 decision topics, not 26
new implementation parts. ADR distinguishes PM intent from engineering choices,
platform proof, schema implementation and verified outcomes. Update live PRD/TSD
policy and plan gates, but preserve dated implementation evidence and stable part
IDs. Mark TSD's incompatible coordinator example historical rather than pretending
it implements the new bypass policy. Native-only selections/elapsed timers still
need actual supported mechanisms and transactional ownership contracts.

Required accounts do not revoke the user's instruction to defer Auth/token wiring.
Sign-out credential/private-UI erasure is not deleting product data or stopping
nudges; account switch and deletion still require explicit native ownership/cleanup.
No shared type, HTTP schema, DB migration, native file, permission or provider/model
configuration changes. Existing Supabase/backend and Anisha-owned work are untouched.

### Every changed file and logical change

- `docs/Context (AGENT)/PM_QUESTIONS.md`: line 5 and lines 44–405. Replace obsolete all-unanswered status; add dated interpreted entries/statuses, source links, accepted direction, remaining questions and register references for all 21 received responses. Preserve Q01 and Q01–Q22 IDs/question wording; label Q16's old omit recommendation superseded as product intent. Lines 408–496 add the source anchor/header and include the user's original Q02–Q22 appended text verbatim, including formatting; these are supplied PM words, not agent-authored answers.
- `docs/Context (AGENT)/OPEN_DECISIONS.yaml`: lines 1–239. Bump register to v2 with source/ADR/status definitions; preserve PD-01–17 IDs/topics/options and historical recommendations. Add explicit choices/remaining gates and PD-18–26 for global selection, inactive windows, quest templates, streak, devices, success metrics, midnight, permissions and generation. Six approved choices, 15 partial topics, four unresolved and one deferred topic; approval of a choice does not erase its downstream acceptance gates.
- `docs/architecture/pm-decisions-2026-11-09.md`: lines 1–96. New versioned ADR records source/authority/date, decision-by-decision intent versus remaining detail, superseded proposals and next existing RN08-D03/RN-09f work. Keeps ownership, Auth/token deferral, implementation boundaries, 46/21/25 counts and measured-versus-hypothetical distinctions explicit.
- `docs/Context (AGENT)/PRD.md`: lines 3–4, 12–18. Bump version/date and link decision authority. Lines 143, 156, 162–164, 169–172, 179 update onboarding/intervention/quest/History journeys for actual PM direction without guessing completion or formulas. Lines 190–192, 207, 209, 211, 221, 233, 236, 238–239, 298 update stable FRs/copy rules for required accounts, demographic gate, global/per-app selection, bypass, generic permission fallback, template persistence, reward intent, baseline and deferred device/calendar scope. FR-036 release priority remains TBD under Q01; model capability is not claimed. Line 343 and lines 364–385 replace stale release-sequence/proposed-default register wording with current choices and remaining gates; FR/NFR IDs remain intact.
- `docs/Context (AGENT)/TSD.md`: lines 3, 5, 13–19. Bump version/date and establish ADR precedence. Lines 248–255, 272–275, 305–310 mark the incompatible session-only bypass sketch historical and define the remaining scoped-exception contract, not a functioning coordinator. Lines 321, 323–324, 326, 330–336 change the schematic accounting scope to PER_APP and unapproved carryover/extra-duration/zone to null, explicitly retain elapsed-versus-usage timing gates. Lines 837–843, 871 distinguish requested generated quests from template fallback. Lines 883–889, 900–912 record intended reward amounts/health/streak limits and prerequisite baseline/evidence/forecast contracts. No actual JSON/API schema is changed.
- `docs/Context (AGENT)/AGENT_START_HERE.md`: lines 7–16. Put current decision authority and next-reading link before the older dated checkout baseline so a new agent does not reopen settled choices or infer Auth approval.
- `docs/architecture/identity-foundation.md`: lines 7–14, 97–104. Distinguish required accounts and product/native retention intent from credential/cache cleanup, update partial/settled/deferred gates, and preserve existing identity/lifecycle interfaces and ownership.
- `docs/core_plan/00_shared_contracts.md`: lines 9–15, 47, 49. Link the reconciliation and notes; distinguish requested demographic collection from unresolved Skip/eligibility, and per-app decision from remaining timer/reset rules. Original SC completion/wire contracts are unchanged.
- `docs/core_plan/01_supabase_foundation.md`: lines 9–15, 29. Update account/provider/eligibility/device dependencies and preserve Anisha's project/Auth ownership, completed SB-04/05 evidence and user deferrals. No hosted action occurs.
- `docs/core_plan/02_auth_onboarding.md`: lines 9–20, 31–32, 36, 65, 67, 69. Update account-required intent/delivery boundaries, sign-out/data distinction, demographic and personalization gates; preserve providers and actual Auth integration as separate work. Does not implement Anisha's flows or remove existing Skip/sign-out code.
- `docs/core_plan/03_backend_foundation.md`: lines 11–18, 30, 39. Refresh product dependencies/out-of-scope language without expanding API-01–12 profile/settings schemas or completing deferred real-account/native deletion acceptance.
- `docs/core_plan/04_react_native_integration.md`: lines 12–23, 192, 370. Surface global-selection next work, update native sign-out/deletion intent and required-account guard prerequisites. Lines 505, 519–522 label historical investigation and remove per-quest scope as a current blocker while preserving volatile/native-owner limits. Lines 803, 805, 807, 880, 886, 890 update quest, baseline, demographics/generation, account and deferred calendar/device gates; all RN part IDs/evidence/counts are preserved.
- `docs/core_plan/README.md`: lines 8–19. Add current PM decisions/ADR/register/notes and next independent durable-selection/editor sequence without replacing original implementation counts or pending Auth/iOS/release acceptance.
- `docs/core_plan_implementation_notes/README.md`: lines 40–45. Discover the new Plan 00 follow-up record and distinguish original foundation history from current documentation work.
- `docs/core_plan_implementation_notes/plan_04_react_native_integration_notes.md`: lines 7, 19–20, 3137, 3261–3275. Update current resume step, record preceding preview hash 90cdc44, and add this documentation handoff with a pointer to the complete Plan 00 ledger; preserve historical preview tests and limits.
- `docs/core_plan_implementation_notes/plan_00_shared_contracts_notes.md`: lines 1–120. Create this plan's current follow-up record with branch/parent/status, exact file/line ledger, interpretation choices, actual validation, remaining questions and resume step. Do not invent earlier SC commit entries or embed this commit's future hash.

### Verification

- Parse YAML with PyYAML: v2 valid; PD-01–26 unique, original 17 IDs/topics and
  every historical recommendation preserved. Status counts 6 approved / 15 partial /
  4 unresolved / 1 deferred; accepted/remaining fields are lists. No runtime code
  reads the prior recommendation field (repository search returned no consumers).
- Verify Q01–Q22 each appears exactly once; status counts 4 Answered / 17 Partial /
  1 Unanswered. Original source still contains responses 2–22 in order. The directly
  retained response suffix SHA256 is
  `744916a2b45c336ee496dde4200e47b878b29a05d522b3fdcb40fdac4776c6aa`.
- Validate new local Markdown links/fragments resolve and all prior plan part IDs
  remain. Audit staged scope as documentation only and each file covered by this
  ledger with line ranges inside its actual file. No PRD/plan implementation or
  source/test artifact was promoted to complete by a PM response.
- Ordinary `git diff --check` reports 23 formatting warnings confined to the
  verbatim PM source (trailing spaces/final blank line), deliberately retained.
  Check these locations explicitly; edited/generated prose has no such warnings.
  `git -c core.whitespace=-blank-at-eol,-blank-at-eof diff --check` passes without
  changing repository/global Git configuration. Preserve PM source rather than
  silently rewriting their supplied text to satisfy whitespace lint.
- This is documentation only: no package/build/API/database/device suites rerun;
  no new runtime tests are warranted. Native/full-suite results in prior Plan 04
  entries remain evidence of those commits only. No phone/cloud/provider operation,
  push, CI, merge or deployment performed in this follow-up.

### Remaining work and next step

Define the durable native global-selection contract before implementing saved
selection and existing Apps-editor wiring. Draft versus saved state, commit/discard,
owner/group/revision, failed/stale save and current-owner cleanup can be designed
and tested independently; production account binding waits for the Auth owner.
Global edits affecting active quest occurrences remain a clarification, not a
reason to reopen global-versus-per-quest selection. Preserve device-only identities.
Full TalkBack/remaining race/device acceptance and platform enforcement remain open.

Q01 release scope, session boundary/override/streak specifics, quest occurrence
completion, full reward/health rules, baseline/forecast definitions, provider/age
collection contracts and generation data/model/release decisions remain partial or
unanswered as recorded. No new feature plan or extra top-level part is created.
Commit locally after verification; leave publishing for an explicit request.
Unrelated untracked workspace and icon-pack directories stay excluded.
