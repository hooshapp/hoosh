# History — RN09-D02 / RN09C-D01–D02

The existing Figma summary/progress/reclaimed views now consume the real account
History API when mounted inside AccountDataProvider. An absent provider keeps the
honest unavailable presentation. History and Home share one account-scoped query;
source examples remain isolated from production routes.

`history-api.ts` strictly decodes aggregate/native envelopes and server arithmetic,
coverage, own identity, series metadata and date bounds. `use-history.ts` reads
native retained estimates, synchronizes existing quit receipts and uploads only a
matching series. Explicit Start/Restart uses the native disclosure and the reviewed
server revision; ordinary reads never initialize or replace a baseline. Stop clears
only local collection state, including offline, revoked-access and changed-selection
states. It cancels pending History reads before acknowledging the local stop.
Account/session-generation fencing, offline/error masking and foreground/manual
refresh reuse the existing data infrastructure. No authentication implementation,
protection activation or raw app identity upload is added.

`history-projection.ts` maps server-provided current/baseline/difference values to
the existing views. Every measurement carries date range, source, coverage and saved
time zone. Week is seven closed days; month explicitly means28days/four weeks.
Unknown data remains unavailable; real zero is valid. Increased usage stays signed;
zero baseline has no percentage. The detail validator checks supplied arithmetic;
it does not manufacture an outcome. Time-freed circles are absent for increased
usage. Turn-offs count actual synced explicit quit receipts by nudge type, including
cooldown-no-credit decisions, not generic app closes or permission absence.

The first seven consecutive reported days form a fixed baseline. Comparisons
require later complete non-overlapping periods with the same saved selection/zone.
Android event retention and foreground semantics limit accuracy; these are selected
app foreground estimates, not attention measurements or causal savings. Selection,
uninstall/device/zone mismatch requires explicit restart. No fallback uses the
Figma's51/10/80%/1.8years as account data. PD-12 forecast remains excluded.

Read [policy](../../../../../docs/architecture/history-measurement.md),
[acceptance](../../../../../docs/qa/history-measurement.md) and the latest Plan04
notes for exact native/storage/HTTP/UI evidence. Figma `27:153`, `10570:192` and
`10570:193` presentation and original SVG artwork remain the source. Signed/wider
Android acceptance, Anisha-owned iOS/Auth SDK and further user-deferred TalkBack
remain separate gates; this does not complete Plan04 or RN-11.
