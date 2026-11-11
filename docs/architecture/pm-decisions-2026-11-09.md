# PM product decisions — 2026-11-09 reconciliation

**Version:** 1. **Status:** Explicit choices accepted for planning; partial areas
remain gated. **Recorder:** Ishmum's engineering agent, at his instruction.
**Source:** [Q02–Q22 PM responses supplied by Ishmum](<../Context (AGENT)/PM_QUESTIONS.md#original-pm-responses>).
2026-11-09 is the recording date; response dates and individual respondent name
were not supplied. This is not evidence that Anisha separately reviewed changes.

## Authority and precedence

The PM responses override older **proposed** product defaults where explicit.
This ADR records the interpretation; the verbatim response log remains the source.
The [register](<../Context (AGENT)/OPEN_DECISIONS.yaml>) tracks approved/partial/
unresolved/deferred topics individually. No answer makes an OS capability,
measurement, released feature or new runtime contract exist. Historical notes and
mock/specimen values remain historical. M1/M2 identity/profile/settings contracts
and all existing plan IDs remain unchanged; no migration or runtime code is added.

## Settled choices and their limits

| Topic / source | Accepted direction | Still required before dependent behavior ships |
|---|---|---|
| PD-01; Q02 | Count × duration applies per app. Six ten-minute sessions for each of two apps allows 120 total minutes. | Timer overlap/reentry and mid-cycle selection changes are not implied by this arithmetic. |
| PD-02; Q03 | Open anyway starts a session; leaving the target app does not pause/end its elapsed timer; expiry intervenes. Switching apps does not transfer its session. | Reentry/concurrent timers, native wall-clock versus measured-usage timing, interruption handling. Pause was suggested, not committed. |
| PD-24; Q04 | Reset daily at 12:00am. | Time-zone basis, travel/DST/manual-clock changes, sessions crossing midnight. |
| PD-19; Q05 | Unrestricted outside configured active days/hours. | Explicit scheduling/quest overlap behavior and removal of expired reasons. |
| PD-02/03; Q06/07 | Intentional pause on selected-app openings during configured times; suggested ten-minute break is a session allowance. | Reopening while already allowed, redirection/time mapping; do not claim detection of subconscious intent. |
| PD-03/04; Q08 | Open anyway always permits a bypass in product intent, including overlapping quest restrictions. No absolute lock. | Bypass duration, app/reason scope, allowance-exhaustion/streak accounting and supported native mechanism. Preserve other reasons in state; do not clear the registry wholesale. |
| PD-18; Q09 | All quests use one global selection; no per-quest selector for current scope. | Durable native owner/group/revision and stage/commit/discard; global edits during an active occurrence and cleanup. |
| PD-20; Q10/11 | Saved quest templates repeat until changed/deleted; accepted quests move to an Accepted section and remain editable/deletable. | Occurrence state machine, completion/release/abandonment, recurrence edits, overlaps. Template retention is not a completion rule. |
| PD-06; Q12 | Intended awards: +5 opening-intervention quit, +20 session-end quit, +30 mid-session nudge quit, +50 temporary Home quest. Home quest applies to the global selection for its period. | Exact trigger/evidence and +50 timing, points/credits unit, repeat limits and offline/dedup/versioned ledger rules. −10 Feed remains unapproved. |
| PD-07/08; Q13 | Feeding increases health; not feeding decreases it over time. | Feed cost/increment, decay rate/cadence, bounds and offline/clock behavior. |
| PD-21; Q14 (also Q04/08) | Preserve streak through non-use, offline and travel; discourage exhausting allowances. | Resolve last session ending versus next bypass as reset trigger, per-app aggregation, day qualification/increment/time zone. No telemetry is not evidence of no use. |
| PD-11/23; Q15/22 | Selected-app usage, fixed starting baseline, equivalent week/month comparison, baseline minus current usage and turn-offs by intervention type. Missing data shows unavailable. | Baseline sampling/coverage and selection changes; negative savings, event definitions, platform feasibility and numerical success targets. Observed differences are not proof of causal savings. |
| PD-12; Q16 | PM wants an illustrative remaining-lifespan comparison and demographic inputs, superseding the preference to omit it. | Defensible source/population/formula/uncertainty and validation. Forecast remains disabled until defined; no illustrative result becomes measured lifetime saved. |
| PD-09; Q17 | Account required before use. Deletion should delete user information. Prefer no sign-out UI; if offered, sign-out preserves product data/nudges. | Sign-in providers and final UI choice; native ownership/other-account isolation, deletion/acknowledgment/offline protocol. Credentials/private UI caches must still clear on sign-out. |
| PD-25; Q18 | Without relevant permission, generic options; no measured History or usage-personalized suggestions. | Revocation/recovery behavior and per-capability mapping. Do not disable unrelated manual actions merely because usage measurement is absent. |
| PD-17; Q19 | PM wants age/gender collected for Q16/future R&D. | Minimum age, required versus skippable, validation, disclosure/consent and retention. No real collection schema is authorized by an unspecified field contract. |
| PD-16/26; Q20 | Friendly tone, no tone chooser initially; generated interest-based quests with suggested times using permitted usage patterns when available. | Model/provider/input aggregation/cost/evaluation and release sequence; cached/generic fallback. Ring tone sensing remains a future concept. |
| PD-13/22; Q21 | Calendars and multi-device sync not initially required. Future same-user allowance is shared across devices. | Future consistency/offline reconciliation design; no current cross-device enforcement claim. |

Q01 (release scope/ordering) remains unanswered. Example success totals in Q22
are hypothetical; do not publish them as customer traction or a measured outcome.

## Superseded proposals and compatible foundations

- PD-01's combined-app budget proposal is replaced by **per-app** accounting.
- Fixed bonus +10 minutes and a quest that can never be bypassed are superseded
  by configured session duration and always-available bypass intent. How to
  implement reason-scoped exceptions remains open; the old TSD example cannot
  be copied into a production allocator/coordinator.
- Reward amounts +5/+20/+30/+50 are now PM intent, not merely Figma examples.
  They are not a complete award policy; −10 Feed is still only a design example.
- Required accounts and friendly tone/no chooser are settled. Provider choice
  and age eligibility are not. Existing sign-out lifecycle producers remain useful
  even if the final product omits a sign-out button.
- Optional age/gender was a Figma/engineering baseline. PM requests collection;
  mandatory/skip behavior is still unresolved. Do not silently remove Skip or
  collect real fields before the remaining contract/privacy decisions.
- Forecast omission and future-only AI were engineering sequencing proposals.
  PM wants both experiences; formula/model/measurement and explicit release scope
  remain gates. Preserve generic/offline behavior and no LLM in enforcement.

## Subsequent implementation authority

On 2026-11-10 Ishmum explicitly authorized sensible defaults for the outstanding
RN-08 session/day/bypass/active-selection choices. The
[dated default record](android-intervention-defaults.md) and appended PM question
entries are the implementation authority; they are not new PM answers or evidence
of PM/Anisha review. Debug-native producer/check status is in Plan 04 notes.

## Next independent implementation under RN08-D03 / RN-09f

Global selection is no longer a product-scope blocker. Next define the native
selection contract, then integrate the existing Apps editor in commit-sized work:

1. Separate picker draft from the saved selection. Cancel/discard preserves saved
   state; explicit editor Save commits a revision. Specify failure/concurrent-save
   behavior, native durable storage and how drafts are released.
2. Make owner/group/revision explicit. Use a controlled owner boundary for tests;
   do not bind data to a global anonymous identity or invent another Auth store.
   Define startup/account transition/deletion responsibilities with the Auth/native
   owners before production account wiring. Future shared-device budgets are out.
3. Reuse RN-09f's existing native chooser/count entry. Test cold restart, cancel,
   failed save, stale revision and unavailable/removed apps. Preserve native-only
   identities; server/app UI summary is not an installed-rule acknowledgment.
4. Test TalkBack spoken traversal/return and remaining picker interruption/race
   cases. Preview evidence stays bounded to its actual Pixel/debug cases.

These are next steps, not implementation claimed by this ADR. Existing preview
is volatile/debug-only. Account ownership/deletion and native platform feasibility
still matter; Q09 does not settle those engineering contracts. Product enforcement
and quest/reward/insights domains remain outside the completed Plan 03 foundation.

## Ownership and deferrals

Ishmum: main/shared React Native, Android, backend/product database and shared
checks. Anisha: Supabase Auth/project setup, mobile Auth/onboarding/root and iOS.
User explicitly defers tokens and Auth integration; PM's required-account decision
does not revoke that development instruction or authorize hosted account deletion.
No new native capability, migration, API field, app release, provider/model purchase,
account administration or iOS implementation occurs in this documentation change.
Full parent plans remain open; 46 top-level / 21 implemented producers / 25 pending
counts are unchanged. Implementation work still needs its own notes and checks.
