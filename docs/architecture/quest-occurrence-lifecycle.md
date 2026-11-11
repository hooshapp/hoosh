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

## Implementation status

Server/compiler/schema/local DB acceptance implemented in D03a; native schedule
installation, shared UI and physical/signed platform acceptance are subsequent
commits under existing D03/D04. Hosted deployment must be recorded separately.
No server schedule response is evidence that Android/iOS installed it.
