# History measurement — RN09-D02 / RN09C-D01–D02

Ishmum owns backend/shared React Native/Android; Auth/onboarding/iOS remain Anisha's.
Existing part IDs remain. Further TalkBack work is user-deferred. This implements
selected-app estimates and fixed-baseline comparisons, not the gated PD-12 lifespan
forecast or proof that the app caused a usage reduction.

## Approved intent and engineering defaults

PM Q15 requires selected-app usage, a fixed starting baseline, equivalent periods,
turn-offs by nudge type and honest unavailable states. Remaining parameters chosen
for this implementation are recorded in PM_QUESTIONS as engineering defaults.

An explicit **Start History** native disclosure permits a bounded read of Android's
retained usage for the currently saved global selection and upload of aggregate
daily duration/date/count/coverage only. It does not change protection, permissions,
app selection or Auth. Usage access must already be allowed, or the user can open
its separate Settings page. Cancellation creates no measurement series. Restarting
requires the disclosure again and compare-and-swap against the reviewed server
revision; it replaces this account's baseline and summaries, never another account.
**Stop History collection** erases this owner's local collection state and stops
subsequent queries; existing server summaries remain until replacement/account
deletion. Native account erasure also removes the owner's local History file.

At start, try the preceding seven closed local days. If adequate retained data is
unavailable, collect prospectively until seven consecutive reported days exist.
The first such accepted run becomes fixed and does not roll forward. Current week
is the latest seven closed local days; month explicitly means28days/four weeks,
not an unequal calendar month. Neither window may overlap the baseline. Require
all7/28days and identical selection/zone/series before comparing. Retain up to56
recent daily summaries plus the fixed seven-day baseline aggregate in the backend.
Native cache is bounded to56days/32KiB per owner; pending stale/expired days are
unknown rather than fabricated. Long offline gaps can prevent baseline capture.

Normalize each reported daily duration by its real23/24/25hour midnight interval
to24hours before comparisons. Scale the fixed seven-day normalized baseline by4
for28days; use server-computed current/baseline/difference/percentage. Zero baseline
allows an hours difference but no percentage. Negative saved hours and reduction
mean **increased usage**; render them honestly, never clamp to positive savings or
render time-freed circles. Exact date ranges, source, coverage, saved-zone and
observed response time accompany the numbers. No measured zero follows from an
empty query, permission failure, retention loss, event cap or unknown boundary.

## Android measurement and limitations

[UsageStatsManager](https://developer.android.com/reference/android/app/usage/UsageStatsManager)
retains detailed events for only a few days, may return null while locked, and
may expand queryUsageStats requests to whole interval boundaries. We therefore do
not relabel aggregate system buckets as exact arbitrary date-range totals.

HistoryCollector uses queryEvents with a24hour lookback and a following boundary
witness, bounded25000raw events per daily query. It reconstructs the union of
selected resumed activities, clipped to the requested closed local day and
screen-interactive/unlocked intervals. Overlapping selected activities are counted
once. Only temporary package/class keys identify matching activity events; they
never persist or cross the bridge. Screen-off, keyguard, unmatched selected pause,
unknown initial state, unsorted/capped/empty/missing endpoints and runtime shutdown/
startup ambiguity produce conservative unknown/interrupted coverage. ACTIVITY_STOPPED
is not a second pause; type17/18 are keyguard, not foreground services19/20, verified
against the installed SDK constants.

The source is explicitly **Android selected-app foreground estimate**, policy1,
`android_usage_events_v1`. Reported means the reducer had retained boundary/state
witnesses, not cryptographically attested or guaranteed lossless OS telemetry.
Android/OEM bugs, event omission, repeated indistinguishable same-class activity
instances and overlay/resumed-activity semantics limit accuracy. These are not
usage totals for all installed apps, attention measurements, or causal savings.
The pure reducer and OS boundary are tested separately. No historical event stream
is synthesized when Android cannot provide it.

When an already enabled app protection service is running, it best-effort captures
closed-day summaries every30minutes to preserve data before OS expiry. History also
captures/refetches on foreground/manual checks. No new Accessibility access is
required solely for History and collection never enables protection automatically.
If the service/app is stopped or OS retention expires, those days remain missing.
A History failure is caught independently and cannot disable native protection.
Native service force-stop/reboot limitations remain those documented under RN-08.

Selection fingerprint and opaque random series ID are owner-private/no-backup.
Changing selected apps, uninstalling a chosen app, device or saved time zone does
not silently recompute/mix a fixed baseline. The UI asks for an explicit restart.
Raw package/class identities, selection fingerprints and events are excluded from
HTTP payloads and logs. Optional native methods preserve unsupported-build/iOS
unavailability rather than success stubs.

## Account protocol and consistency

`GET /v1/history` is nonmutating, verified own-account History with policy/source,
baseline dates/progress, week/month coverage, signed comparisons and nudge counts.
Absent measurement state returns nulls, not a zero-duration baseline. It can still
show actual synced quit-receipt counts without claiming complete device coverage.

`PUT /v1/history/series` accepts strict expected revision, UUID series, saved IANA
zone, selected count/start day/fixed source and up to56 ordered closed daily records.
Only reported days have a bounded nonnegative duration; unknown days require null.
The server validates local day length, past/closed range and source/shape. It locks
the existing owner row and uses insert-on-conflict for first creation. Same-series
uploads/retries merge safely without a new baseline. Reported evidence is immutable;
unknown may repair to reported. Selection/zone/start fields cannot mutate under an
existing series. A replacement uses explicit revision CAS; HISTORY_CONFLICT409
requires review, never automatic replacement of a newer series.

Alembic0006 adds one forced-RLS owner table through the existing administrator-only
history. Runtime grants are SELECT/INSERT/UPDATE only; mobile/public roles have no
CRUD. Existing profiles/settings/quests/rewards remain unchanged. Managed Auth
UUID deletion cascades own History; no Auth administration is part of this feature.

TanStack account scopes isolate cache, session generation, late work and mutations.
Home and History use the same query/projection and refresh window. Sync checks owner
and generation after native/API awaits; no prior account's native data is uploaded.
Pending setup responses are checked by read, not automatically replaced. UI errors,
offline state, unsupported adapters, revoked access and selection mismatch mask
current comparison claims. Query retries can deliver only matching-series evidence;
they do not initialize/reset a series or install protection.

Turn-offs come from existing immutable accepted native quit receipts, deduplicated
by installation/encounter and attributed by event time in the History saved zone.
Opening/session-end/mid-session counts include genuine cooldown-no-credit quits.
Generic app closes, timer expiry and shield presentation never count. Missing or
unsynced receipts are not proof of no activity; counts explicitly say synced receipts.
