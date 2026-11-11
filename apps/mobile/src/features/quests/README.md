# Quests — RN-09b presentation and saved management


## Current RN09B-D01 management consumer

`ConnectedQuestsScreen` reads actual owner-scoped saved definitions in bounded
cursor pages, places Accepted cards before suggestions and opens existing editors.
`ManagedQuestEditor`/`useQuestEditor` reuse the original fields/actions/navigation
and keep raw drafts, explicit revisioned save/delete, comparison after conflict or
uncertain response, offline state and generation disposal. Nothing saves while
unknown or automatically replays. New entries use one stable Expo UUID per editor.
`quests-api.ts` strictly validates own IDs, timestamps, definitions and revision
receipts; `quests-query.ts` cancels competing reads and protects newer cache state.

Main routes connect only when the existing AccountDataProvider supplies a real
scope; absent Auth/root remains the honest unavailable preview. The existing
private profile-development host adds Open live Quests for later approved token
acceptance; this is not an Auth SDK implementation. No token needed for the
isolated automated HTTP/PostgreSQL suite. Saving definitions never installs native
quests, creates occurrences, awards credits or generates recommendations. Deleted
IDs have content-free revision tombstones; create a new entry to replace one.

See the [contract](../../../../../docs/architecture/quest-definition-management.md)
and current Plan 04 implementation notes. The presentation history below describes
its original independent boundary; the conditional consumers supersede its old
no-persistence statements only within the explicit existing account scope.

QuestsScreen/QuestCard implement the source `27:155` list and custom-quest action
using the shared Screen/Button, original artwork and warm recipes. A copied original
`icon pack/` pencil (`10498:94`, 14×14) and the existing exact check SVG (16×16 in a
20×20 slot) keep source bounds. Existing navigation/OS status bars remain owned by
Router/OS. No earlier asset is rewired. Reading badge/secondary copy use the RN-10
accessible palette; targets grow/wrap and stay at least 44 px.

The real route supplies unavailableQuests, with a supported blank custom-editor entry and no live quest mutation. Suggestions and saved
records are separate typed display collections, each with ready/loading/error/
unavailable; ready empty suggestions get their own empty state. No fixture fallback,
inferred interest, app catalog or optimistic acceptance exists. Saved records only
appear from the separately supplied collection. An empty saved collection is hidden
in the source suggestion view, not converted from accepted UI intent.

Callbacks receive suggestion IDs; missing handlers disable their buttons. The
owning controller holds busy through the whole operation, catches errors, handles
uncertain writes and owns serialization/idempotency. onCreate/onPersonalize are
entry intents only; the screen contains no editor schema, recurrence calculation,
native enforcement or persistence. Retry is an explicit read-error handler only.
Restriction notices require approved actual capability/install semantics. None is
rendered in the unavailable route; example notices are visibly simulated.

Run `npm run mobile:ui`, section “Quests — presentation-only Figma example”, for nine
isolated states. All controls change only a notice; no quest/credits/apps change.
The readonly Figma session is `26dd22ea-c87c-4b6c-a571-5e74d6eff5e8`. The plan/notes
record browser, native JS compilation and test evidence separately from live/device
acceptance. Keep future private producers within RN-04's keyed account subtree.

Pending **RN09B-D01–D04**: approved quest/editor/recurrence API and persistence;
actual Auth/account-scoped reads/mutations/error recovery; PM/native restriction,
completion and reward rules; signed-device/accessibility validation. These do not
prevent this independent presentation, but its callbacks are not integration proof.

## RN-09e editor UI

`QuestEditor` implements personalize/custom frames `10487:126`/`10577:427`, with an
optional edit/cancel intent. `QuestDraft` is raw wall-clock form state, not an API
or recurrence/timezone/enforcement schema. Start/end support 24-hour entry; duration
changes only the local end time. Overnight requires explicit next-day confirmation;
zero/invalid ranges and empty weekly days block save. No Date/DST scheduler is added.
Drafts stay controlled; save/cancellation are delegated, never optimistically applied.
Unknown, saving, error, conflict and unconfirmed outcomes remain honest.

`/quest/new` opens an empty editable local draft, with persistence unavailable. Its
explicit Back action confirms dirty exit and public Router removal prevention also
covers hardware/browser navigation and unload. `/quest/[id]` is unavailable without
a real record; URL IDs never select fixtures. Future live editors must be keyed
by the RN-04 account/generation scope and replace local display shapes with an
approved producer adapter. Auth owner must cover new detail routes in real guards.

Original 12/13/14/16/17/18/20 px SVGs are copied from the user pack and recorded in
the manifest. Shared Field gains an inaccessible trailing-visual slot, preserving
labels/error semantics. `EditorPage`, `EditorActions`, `Choice`, `TimeControl` and
pure draft utilities are reusable by remaining preference/plan editors. Weekday
targets grow to 44 px, with responsive wrapping; palette and input outlines retain
the existing accessibility adaptations. Source status bar/home indicator stay OS-owned.

Run `mobile:ui` for clearly isolated local examples and state controls. Live quest
read/save/cancel, approved recurrence/apps/completion/reward policy, native rule
installation and signed-device validation remain RN09B-D01–D04.
