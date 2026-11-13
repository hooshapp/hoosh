# Home rewards — RN09-D01

Ishmum owns shared React Native, Android and backend work. This implements the
existing RN09-D01 under Plan04; it does not create another plan or renumber parts.
The 2026-11-13 defaults in PM_QUESTIONS are Ishmum-authorized engineering decisions,
not newly supplied PM answers. Anisha retains Auth/onboarding/iOS. Further
TalkBack work, managed-account journeys and signed/store acceptance stay separate.

## Product behavior

- Credits and points are one non-monetary unit. Home reads the account wallet;
  quest detail totals remain quest-specific historical completion totals.
- Dino starts at50. Before the first wallet activity, GET is a nonmutating default.
  The first earning/Feed transaction starts its server-clock health anchor.
  Each complete elapsed24hours costs5health, floored0. No job or mobile clock is
  needed. Clock rollback does not increase health. Feed preserves fractional-day
  decay carry rather than resetting the decay clock.
- Feed costs20credits and adds up to20health, capped100. Full health, insufficient
  funds or stale revision fails with409 and no charge. There are no optimistic
  wallet changes or automatic Feed retries. Artwork uses the original assets:
  0–24 needsCare,25–49 feelingLow,50–74 doingOkay,75–100 happy.
- Confirming an eligible ended quest awards50 once per account/quest/schedule
  revision/local date, atomically with its existing self-reported completion.
  Deleting a saved quest does not remove or re-award these account credits.
- Explicit successful Android Return home awards5 at the initial pause,20 after
  allowance expiry or30 at the halfway nudge. The same session/encounter earns
  once, with a60second account-wide cooldown. Presentation, Open anyway, Keep
  going, disabled protection and timer expiry alone award nothing. The nudge is
  once per session; Keep going preserves its original expiry. Return home at
  the nudge ends that app's session, retaining the consumed session count.
- Starting the final permitted per-app session exhausts that day and breaks the
  streak. A completed covered local day without exhaustion increments it.
  Missing coverage freezes the stored count and displays unavailable until new
  valid coverage; it is neither a fabricated successful day nor automatic reset.
  Seven dots require seven actual covered healthy day receipts, not days>=7.

## Account and transaction boundaries

Normal bearer verification, own-user transaction context and forced RLS cover all
three tables. The runtime can append/read ledger entries but cannot update/delete
them. Only the migration role owns schema. Auth deletion cascades own rows through
the existing managed-user foreign keys; no Auth administration is added here.

`GET /v1/rewards` returns the verified owner, revision, balance, health, artwork,
policy version, price, streak evidence and observed time. It does not initialize
rows or infer installation state. `PUT /v1/rewards/feed/{request_id}` accepts only
an expected wallet revision. The account wallet row serializes every earning,
batch and Feed command; a unique immutable receipt prevents duplicate spending.
A response-loss retry with the same ID/body returns the original charge result
and current wallet. Reusing the ID with another revision conflicts.

`GET /v1/rewards/feed/{request_id}` checks a receipt without spending. The UI holds
an uncertain request ID in its disposable account cache across Home remounts and
blocks another Feed until Check last Feed succeeds. If an older request is still
in flight after an absent receipt, revision comparison ensures only one of two
commands based on that revision can charge. Private scope/generation replacement
masks data and suppresses late cache/notification effects and native ACKs.

## Native evidence and bounded offline delivery

The native service handles protection, allowances, midpoint and Return home without
React or network. A separate business outbox commits atomically with those state
changes; draining or overflowing the existing diagnostic journal cannot erase it.
No package names, app labels, screen text, typed input or session app identity are
included in an upload. Explicit event fields are UUID, sequence, UTC timestamp,
saved-zone date, quit context or allowance/coverage booleans. The server validates
shape/timezone/time ordering, local dates and replay payloads, and prices awards.
These are client-reported native receipts, not tamper-proof device attestation.

The outbox retains at most256 events and at most30days before read, with a
cumulative discarded counter. Uploads carry up to32 events under the existing
16KiB JSON limit. The server serializes each account/installation cursor and uses
unique receipts plus sequence checks to handle committed-response loss. Missing
sequences require reported discards and make streak coverage unknown. The client
ACKs only its submitted prefix, after verified server acceptance and another
account check. Failed uploads/ACKs remain retryable on the next foreground/Home
refresh. At most8 batches are attempted per refresh. Up to64 installation streams
per account bound rotated cursor metadata; exhaustion reports sync unavailable,
not false success. Multi-device policy remains deferred.

Service minute checkpoints witness coverage even while the same process sleeps
or the screen is off, using matching wall/elapsed clocks and boot identity. A
service reconnect, process restart, clock discontinuity, owner archive or stopped
configuration marks coverage unknown. The first partial day is never credited.
Full-day protection requires a monitoring configuration and service continuity;
no screen-off duration or absent usage sample is turned into usage/savings data.
Streak timestamps use the applied policy's saved timezone; existing deliberate
policy-timezone migration guard remains. Business ledger receipts are retained
until account deletion for idempotency/history;30days applies to pending device
uploads, not automatic deletion of accounting records.

The version2 Android access disclosure explicitly names content-free reward and
coverage sync. Previous v1 acceptance does not silently approve this collection;
Android setup requires the updated review. Disabling access remains possible.
Unsupported native builds can use server quest credits/Feed while native reward
sync and streak coverage remain unavailable. No iOS implementation is simulated.

## Storage upgrade

Alembic0005 adds reward_wallets, reward_entries and reward_streams, with strict
migration/RLS/ACL/constraint audit coverage and no changes to historical migrations.
It backfills existing completed quest50 receipts/balances, preserves existing
profiles/settings/outcomes and has no quest foreign key that could erase earnings.
Native AtomicFile format4 accepts older formats1–3, preserving policies/allowances;
old records begin with an empty reward stream and unknown coverage. Owner archives
retain their own outbox, never another account's evidence, and never resume rules
on read/sign-in. Standard native erasure deletes the corresponding owner archive.
