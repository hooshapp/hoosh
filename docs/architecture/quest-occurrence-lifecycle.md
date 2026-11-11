# Quest execution contract — RN09B-D03

Owner Ishmum, 2026-11-11. Supplements saved definition CRUD; does not turn Save
into activation. Product defaults are recorded in PM_QUESTIONS.md and remain
explicit engineering decisions where the PM has not supplied answers.

## Authority and user behavior

An explicit schedule command supplies a canonical first local date, expected
schedule revision and current definition revision. One-off means exactly that
date; daily/weekly repeat from it in the saved IANA zone. The first eligible start
must be in the future and within one year; no retrospective starts or rewards.
A version's definition and time boundaries are snapshots. Updates close the old
version to future starts; an already-started occurrence retains its old snapshot.
Stop cancels this quest’s active occurrences and suppresses future starts, without
changing another quest or weekly-plan reason. Save alone changes none of these.

DST gaps clamp to first valid instant, overlaps choose earliest start/latest end,
and zero-duration gaps produce no occurrence. Overnight belongs to its start day.
Device-zone changes do not move the saved zone. Server and native compilers must
agree on these boundaries. Native restrictions must continue without JS/network.

Upcoming, active and ended follow scheduled boundaries. End releases the native
reason but does not prove the activity was done. Within seven days after end the
user may explicitly confirm completion, earning +50 credits exactly once. This
is self-reported; no usage/time-saved/streak evidence is fabricated. Before end,
explicit cancellation earns zero and cannot be changed into completion later.
Unconfirmed outcomes become missed after the grace period. No automatic mutation
retry; uncertain writes require GET/review. PM-supplied native quit awards and
session-based streak meaning remain separate feature producers.

## API and persistence

- GET `/v1/quests/{id}/execution?first=YYYY-MM-DD&days=14`: own schedule revision,
  enabled flag, server observation, relevant immutable snapshots, dated occurrence
  states, per-quest confirmed count and credit total. Default starts seven days ago;
  days is 1–31 and first is within the last 31 to next 365 local dates. Historical
  aggregate credits remain available after older detail leaves this bounded window.
- PUT `/v1/quests/{id}/schedule`: expected_revision, quest_revision, first_date,
  enabled. Revision CAS and snapshot use the parent quest row lock, shared with
  deletion/outcomes. A definition saved concurrently cannot be silently installed.
- PUT `/v1/quests/{id}/occurrences/{schedule_revision}/{local_date}`: completed or
  cancelled. The server derives actual times from its schedule snapshot; the client
  cannot submit timestamps or credit amounts. Existing identical outcome is returned;
  an opposite outcome conflicts. Commit completes before HTTP success.

Two additive tables in migration 0004: quest_schedule_versions and
quest_occurrence_outcomes. The composite owner/quest/version/date outcome key
prevents duplicate credits, including concurrent requests and lost responses.
Owner UUID flows from normal verified identity only. Runtime has owner RLS plus
SELECT/INSERT/UPDATE for versions, SELECT/INSERT only for immutable outcomes; all
ambient/mobile privileges are stripped. Exact PG17 constraints/ACLs/policies/forced
RLS are verified. Auth-owner cascade follows existing quest FK chains.

Deleting a definition also closes/disables its schedules and erases every copied
title/activity. Non-content outcome/credit metadata remains until owner cascade.
The device must explicitly confirm its own Stop before UI claims restrictions
stopped; server deletion cannot prove another device received it. Accounts are
single-device in this iteration; cross-device synchronization remains separate.

Recent enabled-version response work is capped at 128 to bound request work;
excessive new scheduling is rejected transactionally, never partially committed.
Disabled versions do not consume this bound, so Stop remains available. This is
an engineering resource bound, not a paid tier or a user-facing quest quota.

## Device installation and recovery

D03b promotes the tested native actor into Android main source. D03c connects
existing shared quest detail/edit controls; a schedule is first acknowledged by
the account API, then explicitly installed natively using a fresh request receipt.
If either response is uncertain, no write is replayed automatically. An explicit
read compares account version and persisted device receipt before further action.
Reading, signing in, reconnecting and screen remounting never resume stopped rules.

The first date is raw, explicitly chosen input, guarded when leaving the route.
Only a saved definition can be scheduled. Existing installed allowance policy owns
the reset zone; otherwise use complete saved session count/minutes with a clearly
shown saved/quest zone. Missing values link to Settings, not hidden test defaults.
Global selection is summarized by count/revision; app IDs stay native. Active app
snapshots remain unchanged; future installations use the latest saved selection.

Stop confirms local disabling first, then attempts the account update. An outage
can leave the account enabled but the device stopped; UI shows this distinction
and never auto-resumes it. Cancellation clears only that dated native reason before
recording the immutable zero-credit outcome. Definition deletion first confirms a
local Stop. The app does not offer deletion when a configured product runtime lacks
a verified device bridge; isolated old definition-only QA hosts remain unchanged.
Completion is account-confirmed, not native timer inference. This feature displays
per-quest earned credits; it does not implement spending, Dino health, session-quit
awards, streaks or usage-derived savings. Those retain their existing feature refs.

An explicit confirmed device-account claim stops previous local rules and archives
private history. Returning accounts restore stopped. Sign-out fences handles and
private UI without deleting installed rules. Cancellation retention removes only
expired/removed native occurrences and preserves future dates even outside the
preview horizon, so the bound is not a lifetime cancellation quota.

Home now projects actual installed native state, including scheduled versus active
interventions, instead of the older usage-only adapter's inactive message. It does
not claim installed rules match the latest account schedule; detail compares both.
Foreground polling is presentation only. Native rules/expiry continue independently.

## Implementation status

D02 session foundation `0bbf714`/`f447e68` is an integration handoff for Anisha's
review; her Auth/sign-in/onboarding/provider/iOS ownership is retained. Ishmum
reiterated this boundary; managed-account phone sign-in/SDK acceptance is left
pending for coordinated integration. No further Auth implementation is part of D03c.
D03a `999512a`, D03b `b5e314f`, and D03c shared lifecycle implementation have
independent automated/native checks. Development head0004 is applied and exact
schema/security checked, with original product digests unchanged. No Auth admin,
credential reset or account deletion. See the current [runbook](../qa/quest-lifecycle.md)
and Plan04 notes for actual checks and D04 gates. Anisha confirmed the iOS bridge/
build is not ready. Automated iOS-preset components are not actual iOS execution;
release-library compilation is not signed app/store acceptance. D02/D03/D04 parents
remain open for the stated joint/platform acceptance, not missing UI controls.
