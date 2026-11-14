# Home recommendations — RN09-D03

`recommendations-api.ts` decodes the generated aggregate-only own offer/decision
contract, validates identity/version/source/expiry/duration/reward/state, and copies
only reviewed fields. Portable imports allow the same production client to run in
the isolated real TCP acceptance runner.

`use-recommendations.ts` uses the existing account Query scope, generation fences,
read retry and non-replaying mutation helper. A server acknowledgment updates the
shared receipt cache and invalidates saved quests. Current mounted Home alone may
show action feedback/navigate; stale-account or unmounted callbacks cannot open an
old quest. Offline/errors hide unverified advice. Expired offers cannot be chosen;
foreground/manual/30second reads refresh safely. Unconfirmed writes require readback
before another decision. Deleted accepted quests never produce a new save/navigation.

`recommendation-feedback.tsx` adds scoped cooldown/recovery text and explicit review
or retry controls to the existing Figma Home layout. Actual product/QA routes supply
real quest navigation. Accept is disabled in hosts without a review route; Skip is
independent. Original assets/card typography/control states are reused.

Accept saves one non-repeating quest and opens the existing editor. The user reviews
times, selects a first date, and explicitly schedules/applies native protection.
Neither the recommendation read nor Accept activates restrictions or earns credits.
Completion uses the existing self-report-after-end50once flow; no second scheduler,
completion definition, business outbox or credit ledger is introduced.

Read [policy](../../../../../docs/architecture/home-recommendations.md),
[acceptance](../../../../../docs/qa/home-recommendations.md) and the latest Plan04
notes. This is the TSD's activity-template fallback, not delivered AI generation,
usage-routine inference, managed Auth SDK or iOS/signed-store acceptance. Further
TalkBack remains user-deferred. Test fixtures are isolated from production routes.
