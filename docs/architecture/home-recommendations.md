# Home recommendations — RN09-D03

Ishmum owns backend/shared React Native/Android. Anisha retains Auth/onboarding/iOS;
further TalkBack and signed/store acceptance remain separate. Original part IDs
are preserved. These revisable engineering defaults implement the existing TSD
template fallback; they do not relabel Q20 as delivered AI personalization.

## User experience and lifecycle

Home offers one friendly, optional activity suggestion. Reading is preferred late
in the saved time zone and walking during daytime if those interests were selected;
otherwise rotate among the saved supported activities by local date. Without
supported saved interests, offer a generic10minute offline break. Never infer free
time, attention, usage routines, health, demographics or intent. Custom activity
text and native app inventory are not inputs. No model/provider/network AI call is
required; a future generated-copy service still needs its own input/budget/evaluation
contract. Template source is described honestly in user-facing copy.

An offer lasts until the next15minute boundary. Its opaque UUID includes account,
time slot and settings revision; repeated reads of unchanged inputs are stable.
Saving new preferences or crossing the expiry boundary invalidates an unaccepted
offer. The server recomputes the current offer before accepting a new decision;
client wall clock affects presentation only. A stale offer cannot create a quest.

**Skip** records that choice and has no quest/protection/reward effect.
**Accept** atomically saves the decision and exactly one non-repeating quest, then
opens the existing quest editor. The notice states this before acceptance. The
user reviews/edits the proposed wall-clock time and explicitly chooses a first
date, schedule and native Apply under the existing quest lifecycle. No background
activation or credit follows from Accept. Incomplete permissions/selection/policy
use the existing setup/recovery controls; a server save never proves protection.

The saved default starts roughly two minutes ahead for review and lasts10–20minutes
depending on activity (music15). It uses the saved plan's IANA zone, otherwise UTC,
which is visible in quest review. Midnight rollover and fall-back ambiguity use the
existing occurrence resolver; review still requires an explicit first date and
future start. Proposals skip gap/fold intervals whose actual duration differs from
the template minutes; user-edited schedules retain the existing resolver semantics.
If review takes longer, edit the time before scheduling. Defaults
can be changed in the editor. It starts with `repeat=none` and no repeat weekdays;
only an explicit later edit may make it recurring. An accepted one-time definition
remains under Accepted until the user deletes it; it is never attached to the
profile or automatically made a permanent recurring plan.

Applying protection uses the existing current global native app selection and
quest reason/version snapshot. It remains offline-capable and independent of
Home/HTTP once installed. Stop/cancellation/reboot/permission behavior retains the
existing native contract. Recommendation code does not introduce another scheduler.
After the occurrence ends, the existing explicit self-reported completion flow
awards50credits exactly once. Skipping/accepting, merely opening an app, or a native
installation acknowledgment earns nothing. This is not attested task completion.

Either decision starts a24hour cooldown, measured by server time, to avoid repeated
prompts. Travel/settings edits do not bypass an existing cooldown. Users can still
create custom quests. A fresh offer becomes available after cooldown; there is no
notification or automatic action. These cadence/duration choices are defaults for
PM review, not new PM-supplied answers.

## Persistence, ownership and recovery

`GET /v1/recommendations/current` is nonmutating. It returns a strict version1 own
offer or a durable decision/cooldown. `PUT /v1/recommendations/decision` accepts only
offer UUID and accepted/skipped. Decision receipt and one-time quest creation
commit together; no client can supply reward/title/restriction claims.

One forced-RLS receipt row per account contains only offer/quest IDs, action and
decision/cooldown times. Same-offer/same-action replay returns the decision without
creating another quest, even after deletion. An opposite decision conflicts. Row
locking plus insert-on-conflict serializes simultaneous first decisions. A new
decision replaces the bounded receipt only after cooldown; stale old IDs then
conflict rather than resurrecting anything. Quest tombstones/outcome/reward receipts
retain their existing deletion/replay semantics. If the accepted quest was deleted,
the response has no review target. Account deletion cascades the receipt.

Alembic0007 adds only this table. Runtime grants SELECT/INSERT/UPDATE, with exact
owner policies/constraints verified; mobile/public roles have no direct CRUD.
Historical migrations and existing product data are preserved. No Auth administration
or hosted account deletion is part of this feature.

Home uses the existing account Query lifetime and generation fences. Offline/API
errors hide unverified advice/actions. Mutations are never automatically replayed;
uncertain results require verified GET recovery before another choice. Accepted
quest navigation occurs only after a current-account acknowledgment. Cold restart
reads the persisted decision. Refresh/focus/expiry reads cannot create a quest or
award credits. Model output, calendar integrations, demographic inference and
per-app usage-time personalization remain outside this deterministic feature.
