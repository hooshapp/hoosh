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
