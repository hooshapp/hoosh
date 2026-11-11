# Saved quest management — RN09B-D01

Date: 2026-11-11. Owner: Ishmum. Authorized slice: persistent create/read/edit/delete
using the existing quest list/editor, independently of deferred mobile Auth wiring.
This is a storage/API contract, not a completion, reward or occurrence policy.

## Meaning and boundaries

A saved definition contains a title (1–120 Unicode code points), activity (1–200),
start/end local HH:MM, explicit next-day flag, repeat none/daily/weekly, weekdays
(Monday=0) and an explicit IANA zone. Text is trimmed once with the existing Python
whitespace contract. Reject NUL/surrogates, coercions, unknown fields/zones, duplicate
or invalid days, equal/reversed/24-hour ranges. Weekly requires nonempty days;
none/daily require empty weekdays. These limits bound storage, not product quotas.

These are editable time preferences. None means no repeat preference; it does not
choose today's date. No occurrence date/end/completion state is synthesized. A
future activation contract must resolve one-off dates, recurrence edits and release
conditions before calling native installation. Every saved card says not active;
no credits, streak, Dino or usage value comes from CRUD. Global native app selection
is unchanged; no inventory or app identifiers enter the API. Delete does not cancel
an unrelated native installation.

## Wire and persistence

- GET `/v1/quests?limit=50&cursor=UUID`: own non-deleted definitions sorted by UUID,
  at most 100 per page, exclusive cursor and nullable next_cursor. No unbounded read.
  A cursor need not still exist, so deleting the last row does not break pagination.
- GET `/v1/quests/{quest_id}`: `{quest: row|null}`. Missing/deleted/another owner's
  row are indistinguishable. Reads never insert or treat database failure as empty.
- PUT `/v1/quests/{quest_id}`: `{expected_revision, definition}`. The client allocates
  one fresh UUID per new editor, retained while a save is uncertain. Revision zero
  creates only an absent own ID; a positive revision replaces the full definition
  only on an exact own live version. Success returns the committed canonical row.
  There is no automatic write retry; a lost response requires explicit GET/review.
- DELETE same path: `{expected_revision}` positive; returns `{quest_id}`. An atomic
  matching update wipes definition content and advances revision. Missing/deleted
  own IDs succeed without touching another owner. Conflicting live revision is 409.
- `QUEST_CONFLICT` includes only own current_revision (zero if missing). Refetch and
  explicitly review; never change a draft's revision and silently resend it.
- Existing 16 KiB streamed strict-JSON bound, duplicate-key rejection, safe error
  mapping, no-store/correlation and CORS extend to PUT/DELETE. Identity stays in the
  existing verified-token/session authority, never the body or URL owner field.

`public.user_quests` has composite owner/quest UUID primary key, JSON definition,
revision and server timestamps. NULL definition is a content-free tombstone. It
prevents a delayed old create from resurrecting a deleted ID and an ABA revision
reset from accepting an old edit. Do not reuse a deleted ID. Tombstones contain
only owner/id/revision/time metadata; managed-owner FK cascade removes both live
rows and tombstones. No retained title/activity after definition deletion.

The forward migration from 0002 enables/forces RLS, scopes SELECT/INSERT/UPDATE to
the existing transaction-local verified owner, strips ambient table/function grants,
keeps Data API roles excluded and grants no physical DELETE to runtime. Timestamp
trigger and strict JSON checks are frozen; migration verification pins actual PG17
constraint fingerprints and policies/ownership/ACLs. No managed Auth schema changes.
Existing profiles/settings remain intact. Test upgrades/downgrades only against the
labeled disposable database; hosted application is a separate recorded operation.

## Execution slices under existing IDs

| Slice | Scope | Acceptance |
|---|---|---|
| RN09B-D01a | Contract/model, forward migration, own CRUD routes/repository, generated types | Strict JSON/Auth isolation, actual RLS/CAS/pagination/deletion races and upgrade preservation |
| RN09B-D01b | Strict mobile decoder/API, scoped queries/editor/list/routes using existing UI | Dirty/uncertain/conflicting writes, disposal/account fences, no optimistic success or native calls |
| RN09B-D01c | Real mobile HTTP to local FastAPI/PostgreSQL and handoff records | Persist/reload/edit/delete, conflict/unknown response and isolated owners; no real-account/token claim |

These are commit boundaries within RN09B-D01, not new top-level plan counts.
RN09B-D02 real Auth/root/account acceptance, D03 activation/completion/rewards and
D04 signed-device/accessibility acceptance remain open. AI-generated suggestions
remain unavailable; no hardcoded example is exposed as a real recommendation.

## References

- [PostgreSQL 17 row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)
- [SQLAlchemy 2.0 PostgreSQL conflict handling](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#insert-on-conflict-upsert)
- [PM answers](<../Context (AGENT)/PM_QUESTIONS.md>) Q09–Q12; only the stated saved/
  editable/deletable definition behavior is consumed, not an invented completion policy.
