# RN-09g shared plan editor UI

Source inline days `10601:6315`, hours `10601:6513`, sessions `10601:6690`.
`DaysEditor`, `HoursEditor` and `SessionsEditor` accept controlled raw local drafts
and callbacks. Settings composes them through the RN-09f inline slot. AUTH-12 may
reuse the same components with its controller; no onboarding files are changed.
These are not a new persisted plan/session schema or a scheduler.

Day presets and weekday toggles affect only supplied drafts. Hours support direct
24-hour entry, two drag/keyboard/assistive range handles and explicit overnight
confirmation; invalid/zero ranges cannot save. No timezone/DST/install inference.
The original 321×42 range SVG is retained unchanged at its exact source interval
09:00–22:00 when space permits. Dynamic values and narrower widths use an actual
controlled native View track/handles; a fixed source graphic must not misrepresent
new values. Original plus/minus assets retain 16 px bounds. Touch targets are 44 px.

Session min/max/step are supplied by the owner. Missing or invalid bounds disable
controls and saves; unknown values remain em dashes, not zero. The preview's limits
are examples only. The computed count×minutes caption is a planned local budget,
never observed usage, earned credits or installed rules. Steps clamp to supplied
bounds and require safe finite integer values. Saving/conflict/unconfirmed/error
states reuse EditorActions; no optimistic saved summary or activated protection.

Direct `/settings/days`, `/settings/hours` and `/settings/sessions` surfaces have
empty/unavailable local inputs, disabled persistence and guarded dirty exit.
Future controllers own validation, revisions, conflict/uncertain-write recovery,
account/generation scope and approved plan save/install reconciliation. Actual
native policy, source permissions, full-day/recurrence semantics and signed-device
acceptance remain deferred under RN09D-D02/D04 and earlier policy/native IDs.


## Explicit weekly activation consumer

`weekly-schedule.ts` / `weekly-schedule-setup.tsx` now translate the existing
PlanDraft values through Android's native calendar compiler. A verified caller
must supply an explicit owner, native port and optionally its saved PlanDraft;
there is no Auth/default identity or automatic activation. Initial native read can
restore installed settings; Refresh preserves edits, and Use installed settings
is an explicit replacement. Incomplete storage drafts stay editable/unapplied.

Preview performs no write. Apply/Update/Resume uses current native selection and
installation revisions, native CAS plus independent exact readback. Stop confirms
recurrence is disabled while retaining settings and allowance history. Errors
require explicit refresh/review; no blind replay or optimistic installed state.
Reader/write lifetimes fence unmounts and owner loss. Only the isolated native
host currently composes this consumer; main account/root integration stays deferred.

The native weekly definition repeats indefinitely without JS renewal. Weekday is
the start day; overnight ends next date; zones are explicit and travel-stable.
DST gaps clamp/skip, overlaps have one earliest-start/latest-end interval. See
[decisions](../../../../../docs/architecture/android-intervention-defaults.md)
and [runbook](../../../../../docs/qa/android-weekly-schedule.md). Native record v2
reads/migrates v1; do not downgrade old binaries over retained v2 state. Policy
zone changes still require explicit local test reset, preserving the previous gate.

## Shared Home and Settings journey

`weekly-plan-journey.tsx` reuses product screens and inline editors;
`use-weekly-plan.ts` owns one explicit-owner draft/read/intent lifecycle across
navigation. `weekly-plan-status.ts` derives display only from coherent native
`observedAt`/windows/state; `weekly-plan-card.tsx` presents it without invented
account or usage outcomes. Field staging, Preview and native Apply remain distinct.
Dirty navigation, foreground/owner disposal and uncertain writes retain explicit
guards. The dev host alone supplies a synthetic owner through **App journey**.
Production Auth/root and iOS are deferred. See the
[journey runbook](../../../../../docs/qa/android-home-settings-journey.md).
