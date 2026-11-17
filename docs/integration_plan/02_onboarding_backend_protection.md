# Integration 02 — Onboarding into saved product data and native protection

**Leads:** Anisha (flow/UI), Ishmum (settings/profile/native Android). **Status:**
planned. **Prerequisites:** BASE complete; AUTH-C01–C04 for the real account/root.
Final profile handoff consumes AUTH-C05. iOS integration is a platform dependency,
not a reason to postpone the Android implementation.
**Notes:** `docs/integration_notes/plan_02_onboarding_backend_protection_notes.md`.

## Outcome and source reality

Retain the introduction, questionnaire and manual-plan screens, but connect their
actions to the approved profile/settings API and real native selection/install
protocols. Anisha's `QuestionDraft`/`SavedQuestionAnswers` and `ManualPlan` currently
store account-keyed local data. Its app strings are Figma choices, not installed
apps; its completion flag is not a server receipt or native installation.

Read teammate `features/onboarding/{draft,manual-plan,OnboardingQuestions,
ManualPlanScreen,PlanScreens}` plus the base `features/settings/settings-api.ts`,
`use-settings-editor.ts`, profile helpers, `features/plans/{weekly-schedule,
use-weekly-plan,account-weekly-plan}`, native selection transactions and current
product defaults. Do not copy older policy examples over later implemented choices.

## Concrete integration decisions

| Concern | Planned behavior |
|---|---|
| First-launch introduction | Installation-local seen flag; not account completion or proof of protection |
| Setup progress | Small versioned local record scoped to project + UUID + installation; credential-free |
| Cross-device setup | Backend settings restore product values; no cross-device onboarding-complete promise |
| Existing account/settings | Review/reuse existing values; never replace them with default onboarding answers |
| Permission declined or unavailable | Explain missing protection/measurement; allow generic app experience and later setup |
| No apps selected | Permit saving preferences; Apply disabled with a real selection action |
| Plan suggestion | Deterministic reviewed starter template, editable; no AI or usage-personalization claim |
| Initial starter values | Reuse reviewed manual defaults: Mon–Fri, 09:00–22:00, two 15-minute sessions per app, current explicit IANA zone; user reviews before Save/Apply |
| Unresolved age/gender policy | Do not make the branch's mandatory collection a launch default. Keep collection disabled/nonblocking pending PD-17; do not upload it or infer lifespan |
| Finish setup | Confirm saved product values or explicit deferral, then enter Home; native status stated separately |
| Activation | Separate explicit Review/Apply → native commit/readback; never triggered by saving or completion |

The starter is a proposed integration default, derived from the existing manual
plan rather than the Swift pilot's 30/10 policy. Record it as an engineering choice
in the decision log when implemented, not as a PM response. Existing user values
always take precedence. Any later approved starter replaces this one intentionally.

## Data mapping and persistence boundary

| Source | Canonical destination / validation |
|---|---|
| Signup name | Existing profile helper, `expected_revision`; AUTH-C05 owns adoption/review |
| Gym / Reading / Arts & Crafts / Walking / Music / Cooking | `selected_activity_ids`: `gym`, `reading`, `arts_and_crafts`, `walking`, `music`, `cooking` |
| Custom hobbies | One explicit `custom_text`, maximum 200 code points under existing API rules; multiple legacy custom values require user review, not silent truncation/joining |
| Days 0–6, Mon–Sun | Existing `PlanDraft.weekdays`; don't use JS Sunday-first `getDay()` indexing |
| Integer minutes-of-day | Validated zero-padded `HH:mm`; same-day manual source maps to `next_day: false` |
| Overnight editor values | Reuse main editor's explicit `next_day` validation; don't silently roll an end time forward |
| Sessions/day and minutes/session | `session_count` / `session_minutes`; native installation uses its actual supported bounds |
| Zone | Reviewed IANA `timezone_id`; never send a localized label or numeric offset as a zone |
| App labels/string choices | No backend identity mapping. Replace with actual owner-scoped native chooser; summaries only in JS |
| Permission observation | Display/history only; requery OS on return, startup and before Apply |
| Age/gender or pilot trigger/intention/tone data | No current product schema; do not add to profile/settings as arbitrary JSON |

Reuse `/v1/profile` and `/v1/settings`. A settings PATCH can contain activities and
plan together under one expected revision; profile and native selection are
separate transactions. Null explicitly clears a section, omission preserves it.
Preserve raw custom input until server canonicalization; do not reuse a response
normalizer as a destructive request sanitizer.

## Commit ledger

| Part | Intended commit | State / prerequisite |
|---|---|---|
| INT-ONB-C01 | `feat(onboarding): add scoped resumable setup state` | Committed as `c01788e`. [C01 evidence](../integration_notes/plan_02_onboarding_backend_protection_notes.md) |
| INT-ONB-C02 | `feat(onboarding): map reviewed choices to product contracts` | Committed as `d241a81`. [C02 evidence](../integration_notes/plan_02_onboarding_backend_protection_notes.md#int-onb-c02--questionnaire-and-plan-review) |
| INT-ONB-C03 | `feat(onboarding): save preferences with revision recovery` | Committed as `9b98445`. Disposable database acceptance open. [C03 evidence](../integration_notes/plan_02_onboarding_backend_protection_notes.md#int-onb-c03--account-save-and-recovery) |
| INT-ONB-C04 | `feat(onboarding): connect real app selection and permission` | Committed as `bd32f74`. Physical Android check and iOS bridge open. [C04 evidence](../integration_notes/plan_02_onboarding_backend_protection_notes.md#int-onb-c04--device-permissions-and-app-selection) |
| INT-ONB-C05 | `feat(onboarding): reconcile explicit protection activation` | Fixture checks passed with the shared Android-compatible controller. [C05 evidence](../integration_notes/plan_02_onboarding_backend_protection_notes.md#int-onb-c05--explicit-apply-and-recovery) |
| INT-ONB-C06 | `test(onboarding): verify complete and interrupted setup` | Next; physical verification depends on the available native builds |

### INT-ONB-C01 — Scoped progress and root routing

1. Port introduction/onboarding leaf UI with provenance and use the consolidated
   Auth controller. Inject account/runtime operations; no second Auth provider or
   separate fetch client. Keep the base private app routes intact.
2. Add a small typed progress repository, proposed under `features/onboarding/`.
   Its versioned record contains last valid step, approved draft fields, reviewed
   profile/settings revision receipts and explicit setup/permission deferrals.
   Installation namespace is local; no token, app identity or demographic payload.
3. Distinguish `loading`, `not_started`, `draft`, `ready_to_finish`, `completed`,
   `read_failed` and `incompatible` at the presentation boundary. Storage failure
   must not become `false`/new setup and overwrite an existing draft. Serialize
   writes, fence old scope completions and expose retry/discard choices.
4. Router precedence: Auth pending/recovery first → account progress resolution →
   setup or private Home. Completed progress must match the current account; no
   null-screen hang, redirect loop or B inheriting A's last screen.
5. On fresh install/reinstall with existing server settings, load and review them;
   allow continuing to Home without writing defaults. A missing local marker says
   nothing about missing server data. Offline inability to check does not create
   new empty settings or authorize a native claim.
6. Audit legacy keys that include UUID but lack project/install provenance. Import
   only when that provenance can be established. Otherwise offer user-reviewed
   reentry; don't guess by email/UUID alone or erase legacy records automatically.

**Validation:** restart at every state, slow/failed/corrupt storage, schema version
ahead, A→B and same-UUID replacement, pending recovery during setup. **Exit:**
resumable routing without treating local progress as protection or server truth.

### INT-ONB-C02 — Reviewable conversion and consistent screens

1. Implement pure typed conversion functions for the mapping table and inverse
   review projection from existing settings. Use canonical activity IDs and exact
   generated HTTP types, not labels as database keys.
2. Reuse existing schedule validators and editor components where useful. Preserve
   empty/incomplete drafts as drafts; install requires complete days, coherent
   times, explicit zone and native-supported count/duration. Never infer all-day
   access from equal times or silently clamp stored user values.
3. Replace fixed Figma app checks with the native selection entry/count supplied
   in C04. Labels in an old draft are preferences requiring reselection, not proof
   that an installed app is selected. Web/missing bridge offers honest unavailable.
4. Make suggested and manual paths produce the same typed draft/review/save flow.
   Replace conflicting 10-minute preview/weekly-savings illustrations with the
   actual proposed values and neutral explanation. No fabricated saved-time metric.
5. Disable real demographic collection until approved field/eligibility/privacy
   policy exists; don't carry branch defaults like age 24 as a supplied answer.
   Keep the flow usable without those fields and retain future layout source.
6. Unsupported custom choices, oversize text, duplicate days, missing timezone or
   source values outside the target domain show reviewable errors. No dropping
   unrecognized fields silently and showing a successful migrated plan.

**Validation:** table-driven mapping at boundaries, custom Unicode/blank/null,
Mon/Sun indexing, 00:00/23:59, overnight/equal range, DST zone names, existing
settings preservation. **Exit:** both setup paths author the same real contract.

### INT-ONB-C03 — Save receipts, conflicts and interrupted multi-step work

1. Read latest profile/settings through the existing account scope. `settings:
   null` is missing data; network/401/503/invalid response is an error. Save only
   fields the user reviewed and changed; existing unrelated sections survive.
2. Use current expected revision and the shared `saveSettings` helper. Save
   activities and plan in one PATCH when both are reviewed together. Adopt only a
   validated same-owner receipt with expected revision +1 into the shared cache.
3. Use AUTH-C05 for profile review/save; don't implement another name mutation.
   Persist the last confirmed step after each separate transaction. If profile
   saves but settings fails, resume settings without replaying profile writes.
4. For 409, refetch and show Keep my edits/Use latest review. For response loss,
   block blind retry, reread authoritative settings, compare the submitted fields
   and ask for explicit resolution. Never mark a timeout as failure-to-commit or
   replay against a newly fetched revision automatically.
5. Local progress-write failure after a confirmed server save retains server truth.
   Show retry for recording setup progress; next launch can reconstruct from server
   values. No compensating deletion of a saved profile/settings row.
6. Offline saves remain local draft only, clearly labelled. Explicitly finishing
   with deferred setup is allowed; it does not imply synced preferences or activate
   restrictions. Do not create a background mutation queue or automatic later Apply.

**Validation:** real HTTP client against existing disposable DB, response-loss and
409 scenarios, field-preserving patch, two simultaneous same-account editors,
logout mid-save and process death between receipts. **Exit:** no duplicate/false
save; existing main Settings immediately sees the confirmed setup values.

### INT-ONB-C04 — Actual device selection and permission recovery

1. Reuse `NativeOwnerBoundary` and the existing native Apps editor/transaction.
   Require matching backend identity before creating account-bound native work;
   don't use synthetic owner IDs from the development host.
2. Begin → picker → staged draft → explicit Save → authoritative saved summary.
   Cancel/Back/background keeps prior saved choices. Release handles on exit/scope
   loss, including a begin completing after the screen unmounts.
3. Store only native summary references in setup state as advisory observations.
   Requery current saved selection/revision before review/Apply; equal app counts
   do not prove equal selection. Never upload package IDs or Apple token data.
4. Integrate platform permission/disclosure and foreground recheck. Android Usage
   Access and intervention Accessibility access are distinct; granting one never
   implies the other. Device-owner action is required for the actual grant.
5. Denied/revoked/unavailable/locked/storage error/removed app states have explicit
   recovery. Permission/selection may be deferred without pretending protection
   is active; generic recommendations stay usable while measured History is absent.
6. On iOS consume Plan 04's actual bridge; until ready, show unavailable rather than
   using the limited permission bridge as if it could save/apply selections.
   Category/domain selection must not be counted as supported individual apps.

**Validation:** existing native picker tests plus normal onboarding touch journey,
cancel/no-op/conflict/uncertain Save and permission-return paths. **Exit:** real
selection, no Figma app list used as enforcement input.

### INT-ONB-C05 — Explicit Apply, partial failure and completion

1. Reuse the existing one account-level weekly controller for preview/apply/status;
   don't mount another in onboarding. Supply the latest confirmed saved draft at
   tap time, not a stale render snapshot or the installed spec as a fallback.
2. Show review of current draft, native saved selection, authorization, supported
   policy and existing installed reasons. Require a separate explicit Apply action.
   If another owner is installed, use the existing confirmed claim flow; login or
   setup completion never performs a claim.
3. Apply against native expected revision and selection revision, then reconcile
   authoritative readback. Distinguish saved / installing / installed / needs
   permission / unsupported / unconfirmed. A success callback alone is insufficient.
4. An ambiguous native Apply is read/reconcile first; no blind retry, duplicate
   sessions, counter reset or server rollback. Keep running deadlines and unrelated
   quests. Selection edits follow the existing active-occurrence snapshot policy.
5. Completion records reviewed setup choices and confirmed/deferred persistence,
   not an evergreen protection badge. Home reads fresh actual status after routing.
   If settings saved but native Apply failed, show saved preferences + recovery;
   let the user finish without claiming activation.
6. Existing Stop works locally when authorized even if API connectivity/selection
   reread fails. Explain current retained rules on sign-out; no automatic disable
   from leaving onboarding, app reload, permission denial or a failed save.

**Validation:** Save→Apply immediate tap, backend unavailable after Save, selection
changed since review, partial native write, cold restart before completion, existing
quest overlap and account replacement during Apply. **Exit:** normal setup reaches
real Home with truthful saved/protected state and a reachable recovery path.

### INT-ONB-C06 — Finish and verify both setup paths

1. Test first-run signup → confirmation/sign-in → suggestion/manual review → profile/
   settings save → picker → permission → Apply → Home/Settings using normal routes.
2. Test explicit permission/setup deferral, no selected apps, denied/revoked access,
   offline draft, saved-but-not-installed plan and returning existing account.
3. Interrupt at draft write, profile receipt, settings receipt, selection Save,
   native Apply and completion-marker write. Reopen without duplicate mutations,
   overwriting settings, losing reviewed input or implicitly resuming protection.
4. Check compact layout, large text, keyboard reachability and ordinary back/focus
   behavior in imported screens. TalkBack remains deferred; don't regress semantics.
5. Run affected full mobile/API contract suites, normal-root tests and isolated
   product HTTP settings acceptance. No migration is expected for this plan; if a
   real schema need is found, justify it before adding fields and regenerate types.
6. Record actual accounts/platform/SHA evidence or pending resources. Handoff to
   VERIFY-C03/C04 and update relevant AUTH/RN/API entries without asserting iOS
   parity from Android results.

**Done:** both setup choices use approved real persistence, device selection and
explicit installation; all failure paths are recoverable. Device/user deferral
must be distinguishable from implementation absence and from passed acceptance.

## Rollback and bounded exclusions

Disable the affected setup action or revert coherent UI/converter changes without
deleting already saved settings, resetting selection revisions or stopping rules.
Older local progress must be readable or produce explicit review, never default
destructive writes. Keep data/schema and installed-state compatibility.

No demographic/lifespan backend, research enrollment, per-app cloud inventory,
generated plan model, cross-device setup sync or new enforcement semantics are
required to complete this integration scope. If those later become launch scope,
their existing product decisions must be resolved explicitly rather than hidden
inside onboarding wiring.
