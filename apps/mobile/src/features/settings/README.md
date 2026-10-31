# Settings presentation — RN-09d

Figma `27:157`, read-only session `26dd22ea-c87c-4b6c-a571-5e74d6eff5e8`.
The real tab composes `SettingsScreen` with `unavailableSettings`: neutral account,
Personalization and My Plan rows, honest unknown values, no fake account or actions.
Personal Info and Calendar Connections are optional, hidden until scope is supplied.
The source sample identity and values live only in `dev/ui/settings-specimen.tsx`.

One shared `Screen` owns header, account, rows, optional profile form, keyboard,
scrolling and measured tab/safe-area clearance. Flexible white rows preserve source
icons/typography/sections/session context; all new assets are unchanged original-pack
copies at their original 18/16/14 px roots. Existing account avatar remains 52 px.
`AccountHeader` now accepts explicit null identity, suppressing a stale supplied
name and any signed-in assertion. Existing verified-identity behavior is retained.
The plain Settings route no longer offers developer links to Auth/onboarding;
those existing routes remain independently accessible and their guard wiring is
still Anisha's responsibility. This UI change does not create authentication.

`SettingsModel` is display-only. Each value is ready/loading/error/unavailable;
a known empty value reads Not set, never substituted for unknown. Error/loading
feedback uses shared accessible status, preserving valid independent fields. Only
ready rows with an explicit owner callback become buttons/show a chevron. Missing
handlers are static rows with normal contrast, rather than nonfunctional controls.
Callbacks delegate entry intent only and never save a plan, start a picker, connect
a calendar, reconcile native installations or define allowance policy themselves.
The host must supply permitted values and a working supported editor before wiring
callbacks. Opaque iOS app selection stays in native authorized UI, not a server app
catalog. Ready calendar status alone cannot authorize a Connect flow.

`profileForm?: ProfileFormProps` reuses the RN-07 controlled component within this
scroll owner, only with a supplied identity. `onEditProfile` is an optional reviewed
functional adaptation, absent from the source and current live route. There is no
second display-name controller or HTTP DTO: host owns canonical baseline, raw draft,
validation, conflicts/unconfirmed results, guarded save and dirty navigation.
Key the whole screen by the real RN-04 account/generation scope when wiring it;
the form's user-id key is only an additional account replacement boundary. Unmount
on invalidation/sign-out; don't keep old props or drafts while changing identities.
An optional retry delegates failed settings reads to that owner. No Supabase/Auth
client or private API consumer is introduced in this feature.

Remaining: **RN09D-D01** RN07-D01–D07 real scoped profile/guard/save integration and
sign-out placement review; **RN09D-D02** shared approved onboarding/plan schema,
revisioned persistence, supported activities/native-selection editors and native
installation reconciliation; **RN09D-D03** optional demographic/calendar launch
scope and provider permissions/flows; **RN09D-D04** signed-device accessibility,
keyboard, native SVG and real-account lifecycle acceptance. No sign-out/deletion or
additional unapproved settings flows are invented here. Existing RN-05/06/07/08/10/11
gates remain open. Browser/JS export evidence is separate from device acceptance.
